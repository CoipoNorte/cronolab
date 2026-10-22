/* ============================================================
   MUNDO DE DEPURACIÓN — una escena pequeña diseñada para revelar
   lo que el juego calcula pero el jugador normalmente no ve.

   El render normal y el render de debug están separados. En una
   build de producción puedes eliminar drawDebug() sin tocar una
   sola regla del juego.
   ============================================================ */

import type { MiniInput } from "./minis";
import {
  drawPixels,
  heroSprite,
  HERO_H,
  HERO_PALETTE,
  HERO_W,
  SLIME_A,
  SLIME_B,
  SLIME_H,
  SLIME_PALETTE,
  SLIME_W,
} from "./sprites";

export const DEBUG_W = 480;
export const DEBUG_H = 270;
const GROUND = 222;

type Ctx = CanvasRenderingContext2D;

export interface DebugOptions {
  grid: boolean;
  hitboxes: boolean;
  vectors: boolean;
  ids: boolean;
  sensors: boolean;
  contacts: boolean;
  pauseOnDamage: boolean;
}

export interface DebugEvent {
  seq: number;
  frame: number;
  type: "input" | "physics" | "collision" | "trigger" | "damage" | "spawn";
  message: string;
}

export interface DebugSnapshot {
  frame: number;
  hero: { x: number; y: number; vx: number; vy: number; grounded: boolean; hearts: number };
  enemy: { x: number; vx: number; state: string };
  projectileCount: number;
  entityCount: number;
  collisionChecks: number;
  contacts: number;
  lastBreakpoint: string;
  events: DebugEvent[];
}

interface Rect { id: string; x: number; y: number; w: number; h: number }
interface Projectile { id: string; x: number; y: number; vx: number; vy: number; alive: boolean }
interface Contact { x: number; y: number; nx: number; ny: number; life: number }

const PLATFORMS: Rect[] = [
  { id: "floor", x: 0, y: GROUND, w: DEBUG_W, h: DEBUG_H - GROUND },
  { id: "block_A", x: 138, y: GROUND - 35, w: 48, h: 35 },
  { id: "platform_B", x: 254, y: GROUND - 70, w: 82, h: 12 },
  { id: "wall_C", x: 416, y: GROUND - 54, w: 22, h: 54 },
];

const DEFAULT_OPTIONS: DebugOptions = {
  grid: true,
  hitboxes: true,
  vectors: true,
  ids: true,
  sensors: true,
  contacts: true,
  pauseOnDamage: false,
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function overlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function arrow(ctx: Ctx, x: number, y: number, vx: number, vy: number, color: string) {
  const scale = 0.16;
  const ex = x + vx * scale;
  const ey = y + vy * scale;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  const angle = Math.atan2(ey - y, ex - x);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - Math.cos(angle - 0.55) * 5, ey - Math.sin(angle - 0.55) * 5);
  ctx.lineTo(ex - Math.cos(angle + 0.55) * 5, ey - Math.sin(angle + 0.55) * 5);
  ctx.closePath(); ctx.fill();
}

export function createDebugWorld() {
  let frame = 0;
  let seq = 0;
  let checks = 0;
  let breakpoint = "";
  let projectileId = 0;
  let spawnT = 1.1;
  let invT = 0;
  let jumpHeld = false;
  let lastGrounded = true;
  let events: DebugEvent[] = [];
  let contacts: Contact[] = [];
  let projectiles: Projectile[] = [];
  let coin = { x: 292, y: GROUND - 88, taken: false, respawn: 0 };
  let hero = { x: 58, y: GROUND, vx: 0, vy: 0, face: 1 as 1 | -1, grounded: true, hearts: 3, anim: 0 };
  let enemy = { x: 345, y: GROUND, vx: -34, min: 330, max: 402, state: "patrol", anim: 0 };

  const emit = (type: DebugEvent["type"], message: string) => {
    events.push({ seq: ++seq, frame, type, message });
    if (events.length > 28) events = events.slice(-28);
  };

  const reset = () => {
    frame = 0; seq = 0; checks = 0; breakpoint = ""; projectileId = 0; spawnT = 1.1; invT = 0;
    jumpHeld = false; lastGrounded = true; events = []; contacts = []; projectiles = [];
    coin = { x: 292, y: GROUND - 88, taken: false, respawn: 0 };
    hero = { x: 58, y: GROUND, vx: 0, vy: 0, face: 1, grounded: true, hearts: 3, anim: 0 };
    enemy = { x: 345, y: GROUND, vx: -34, min: 330, max: 402, state: "patrol", anim: 0 };
    emit("physics", "mundo reiniciado");
  };

  const heroRect = (x = hero.x, y = hero.y): Rect => ({ id: "player", x: x - 5, y: y - HERO_H, w: 10, h: HERO_H });
  const enemyRect = (): Rect => ({ id: "slime_01", x: enemy.x - 7, y: enemy.y - SLIME_H, w: 14, h: SLIME_H });

  const addContact = (x: number, y: number, nx: number, ny: number) => {
    contacts.push({ x, y, nx, ny, life: 0.35 });
  };

  const damage = (source: string, options: DebugOptions): string | null => {
    if (invT > 0) return null;
    hero.hearts--;
    invT = 1.1;
    hero.vy = -165;
    hero.vx = hero.x < enemy.x ? -145 : 145;
    hero.grounded = false;
    emit("damage", `player recibe daño de ${source} · PV ${hero.hearts}/3`);
    breakpoint = options.pauseOnDamage ? `daño de ${source}` : "";
    if (hero.hearts <= 0) {
      hero.hearts = 3; hero.x = 58; hero.y = GROUND; hero.vx = 0; hero.vy = 0;
      emit("physics", "respawn en checkpoint");
    }
    return breakpoint || null;
  };

  const update = (dt: number, input: MiniInput, options: DebugOptions = DEFAULT_OPTIONS): string | null => {
    frame++;
    checks = 0;
    breakpoint = "";
    if (invT > 0) invT -= dt;
    for (const c of contacts) c.life -= dt;
    contacts = contacts.filter((c) => c.life > 0);

    /* ---------- entrada + física del jugador ---------- */
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const target = dir * 112;
    hero.vx += (target - hero.vx) * Math.min(1, dt * 14);
    if (dir !== 0) hero.face = dir as 1 | -1;
    if (input.jump && !jumpHeld && hero.grounded) {
      hero.vy = -300; hero.grounded = false;
      emit("input", "salto aceptado");
    }
    jumpHeld = input.jump;
    hero.vy = Math.min(hero.vy + 920 * dt, 500);
    hero.anim += dt * (Math.abs(hero.vx) > 12 ? 7 : 2);

    /* X y Y se resuelven separados. Cada consulta suma al contador. */
    const nx = hero.x + hero.vx * dt;
    const rectX = heroRect(nx, hero.y);
    let blockedX = false;
    for (const p of PLATFORMS) {
      checks++;
      if (p.id !== "floor" && overlap(rectX, p)) {
        hero.x = hero.vx > 0 ? p.x - 5.01 : p.x + p.w + 5.01;
        addContact(hero.x + (hero.vx > 0 ? 5 : -5), hero.y - 9, hero.vx > 0 ? -1 : 1, 0);
        emit("collision", `player toca ${p.id} en eje X`);
        hero.vx = 0; blockedX = true; break;
      }
    }
    if (!blockedX) hero.x = nx;

    const prevY = hero.y;
    const ny = hero.y + hero.vy * dt;
    const rectY = heroRect(hero.x, ny);
    hero.grounded = false;
    let blockedY = false;
    for (const p of PLATFORMS) {
      checks++;
      if (overlap(rectY, p)) {
        if (hero.vy >= 0 && prevY <= p.y + 1) {
          hero.y = p.y; hero.vy = 0; hero.grounded = true;
          addContact(hero.x, p.y, 0, -1);
        } else if (hero.vy < 0) {
          hero.y = p.y + p.h + HERO_H; hero.vy = 0;
          addContact(hero.x, p.y + p.h, 0, 1);
          emit("collision", `cabezazo contra ${p.id}`);
        }
        blockedY = true; break;
      }
    }
    if (!blockedY) hero.y = ny;
    hero.x = clamp(hero.x, 8, DEBUG_W - 8);
    if (!lastGrounded && hero.grounded) emit("physics", `aterriza en y=${hero.y.toFixed(0)}`);
    lastGrounded = hero.grounded;

    /* ---------- trigger de moneda ---------- */
    if (!coin.taken) {
      const sensor: Rect = { id: "coin_trigger", x: coin.x - 7, y: coin.y - 7, w: 14, h: 14 };
      checks++;
      if (overlap(heroRect(), sensor)) {
        coin.taken = true; coin.respawn = 3;
        emit("trigger", "coin_trigger: +10 puntos");
      }
    } else {
      coin.respawn -= dt;
      if (coin.respawn <= 0) { coin.taken = false; emit("spawn", "moneda reaparece"); }
    }

    /* ---------- slime con sensor de visión ---------- */
    enemy.anim += dt;
    const distance = Math.abs(hero.x - enemy.x);
    const sees = distance < 92;
    enemy.state = sees ? "chase" : "patrol";
    if (sees) {
      enemy.vx += (Math.sign(hero.x - enemy.x) * 48 - enemy.vx) * Math.min(1, dt * 4);
    } else {
      if (enemy.x < enemy.min) enemy.vx = Math.abs(enemy.vx);
      if (enemy.x > enemy.max) enemy.vx = -Math.abs(enemy.vx);
    }
    enemy.x += enemy.vx * dt;
    checks++;
    if (overlap(heroRect(), enemyRect())) {
      const stomp = hero.vy > 40 && hero.y < enemy.y - 4;
      if (stomp) {
        hero.vy = -190; hero.grounded = false;
        enemy.x = enemy.max; enemy.vx = -34;
        addContact(hero.x, hero.y, 0, -1);
        emit("collision", "pisotón: slime reposicionado");
      } else {
        const hit = damage("slime_01", options);
        if (hit) return hit;
      }
    }

    /* ---------- torreta: proyectiles reciclados ---------- */
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = 1.7;
      const p = projectiles.find((item) => !item.alive) ?? { id: `bullet_${++projectileId}`, x: 0, y: 0, vx: 0, vy: 0, alive: false };
      if (!projectiles.includes(p)) projectiles.push(p);
      // A la altura del torso: quedarse quieto también permite probar el breakpoint.
      p.x = 457; p.y = GROUND - 10; p.vx = -105; p.vy = 0; p.alive = true;
      emit("spawn", `${p.id} activado desde turret_01`);
    }
    for (const p of projectiles) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      if (p.x < -8) { p.alive = false; continue; }
      const box: Rect = { id: p.id, x: p.x - 3, y: p.y - 3, w: 6, h: 6 };
      checks++;
      if (overlap(heroRect(), box)) {
        p.alive = false;
        const hit = damage(p.id, options);
        if (hit) return hit;
      }
    }
    return null;
  };

  const drawWorld = (ctx: Ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, DEBUG_H);
    sky.addColorStop(0, "#344b7d"); sky.addColorStop(1, "#a8d9e8");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, DEBUG_W, DEBUG_H);
    ctx.fillStyle = "#4c9455";
    ctx.beginPath(); ctx.arc(75, GROUND + 10, 78, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(230, GROUND + 10, 105, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(415, GROUND + 10, 82, Math.PI, 0); ctx.fill();

    for (const p of PLATFORMS) {
      ctx.fillStyle = p.id === "floor" ? "#8a5a3b" : "#9f5b3c";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = p.id === "floor" ? "#4fae52" : "#c87952";
      ctx.fillRect(p.x, p.y, p.w, Math.min(4, p.h));
    }

    if (!coin.taken) {
      const spin = Math.abs(Math.sin(frame * 0.05));
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(coin.x - 4 * spin, coin.y - 7, Math.max(1, 8 * spin), 14);
      ctx.fillStyle = "#fff3a3"; ctx.fillRect(coin.x - 1, coin.y - 5, 2, 5);
    }

    // torreta
    ctx.fillStyle = "#34304d"; ctx.fillRect(448, GROUND - 38, 26, 28);
    ctx.fillStyle = "#ff5d73"; ctx.fillRect(444, GROUND - 15, 12, 7);
    ctx.fillStyle = "#1b1728"; ctx.fillRect(449, GROUND - 13, 6, 3);

    for (const p of projectiles) {
      if (!p.alive) continue;
      ctx.fillStyle = "rgba(255,93,115,.25)"; ctx.fillRect(p.x, p.y - 1, 12, 2);
      ctx.fillStyle = "#ff5d73"; ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }

    drawPixels(ctx, Math.sin(enemy.anim * 6) > 0 ? SLIME_A : SLIME_B, enemy.x - SLIME_W / 2, enemy.y - SLIME_H, SLIME_PALETTE, enemy.vx > 0);
    const st = !hero.grounded ? "jump" : Math.abs(hero.vx) > 12 ? (Math.floor(hero.anim * 6) % 2 === 0 ? "runA" : "runB") : "idle";
    if (invT <= 0 || Math.floor(frame / 4) % 2 === 0) {
      drawPixels(ctx, heroSprite(st), hero.x - HERO_W / 2, hero.y - HERO_H, HERO_PALETTE, hero.face < 0);
    }
  };

  const drawDebug = (ctx: Ctx, options: DebugOptions) => {
    ctx.save();
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = "left";

    if (options.grid) {
      ctx.strokeStyle = "rgba(92,225,230,.16)"; ctx.lineWidth = 1;
      for (let x = 0; x <= DEBUG_W; x += 16) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, DEBUG_H); ctx.stroke(); }
      for (let y = 0; y <= DEBUG_H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(DEBUG_W, y + 0.5); ctx.stroke(); }
    }

    if (options.hitboxes) {
      const boxes: { rect: Rect; color: string }[] = [
        ...PLATFORMS.map((rect) => ({ rect, color: "#5ce1e6" })),
        { rect: heroRect(), color: "#ffd23f" },
        { rect: enemyRect(), color: "#ff5d73" },
        ...projectiles.filter((p) => p.alive).map((p) => ({ rect: { id: p.id, x: p.x - 3, y: p.y - 3, w: 6, h: 6 }, color: "#ff7ad9" })),
      ];
      for (const { rect, color } of boxes) {
        ctx.strokeStyle = color; ctx.lineWidth = 1;
        ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h);
      }
    }

    if (options.sensors) {
      // pies, visión del enemigo y trigger de moneda
      ctx.strokeStyle = "#4ade80";
      ctx.strokeRect(hero.x - 6.5, hero.y - 1.5, 13, 3);
      ctx.fillStyle = "rgba(255,93,115,.13)";
      const left = enemy.x - 92;
      ctx.fillRect(left, enemy.y - 22, 184, 24);
      ctx.strokeStyle = "#ff5d73"; ctx.strokeRect(left + 0.5, enemy.y - 21.5, 184, 24);
      if (!coin.taken) {
        ctx.strokeStyle = "#ffd23f"; ctx.strokeRect(coin.x - 7.5, coin.y - 7.5, 15, 15);
      }
    }

    if (options.vectors) {
      arrow(ctx, hero.x, hero.y - 10, hero.vx, hero.vy, "#ffd23f");
      arrow(ctx, enemy.x, enemy.y - 6, enemy.vx, 0, "#ff5d73");
      projectiles.filter((p) => p.alive).forEach((p) => arrow(ctx, p.x, p.y, p.vx, p.vy, "#ff7ad9"));
      // gravedad como vector constante
      arrow(ctx, 28, 40, 0, 80, "#7c6bff");
      ctx.fillStyle = "#7c6bff"; ctx.fillText("g", 34, 50);
    }

    if (options.ids) {
      ctx.fillStyle = "#e9ecff";
      ctx.fillText("player", hero.x - 18, hero.y - 24);
      ctx.fillText(`slime_01 [${enemy.state}]`, enemy.x - 38, enemy.y - 17);
      ctx.fillText("turret_01", 422, GROUND - 42);
      PLATFORMS.filter((p) => p.id !== "floor").forEach((p) => ctx.fillText(p.id, p.x, p.y - 4));
      projectiles.filter((p) => p.alive).forEach((p) => ctx.fillText(p.id, p.x - 10, p.y - 7));
    }

    if (options.contacts) {
      for (const c of contacts) {
        ctx.globalAlpha = clamp(c.life * 4, 0, 1);
        ctx.strokeStyle = "#ffffff"; ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, Math.PI * 2); ctx.stroke();
        arrow(ctx, c.x, c.y, c.nx * 55, c.ny * 55, "#ffffff");
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  };

  const draw = (ctx: Ctx, options: DebugOptions = DEFAULT_OPTIONS) => {
    drawWorld(ctx);
    drawDebug(ctx, options);
    // HUD mínimo de la build jugable
    ctx.fillStyle = "rgba(7,9,18,.72)"; ctx.fillRect(7, 7, 76, 16);
    ctx.fillStyle = "#ff5d73";
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < hero.hearts ? 1 : 0.2; ctx.fillRect(13 + i * 14, 12, 9, 7); }
    ctx.globalAlpha = 1;
  };

  const snapshot = (): DebugSnapshot => ({
    frame,
    hero: { x: hero.x, y: hero.y, vx: hero.vx, vy: hero.vy, grounded: hero.grounded, hearts: hero.hearts },
    enemy: { x: enemy.x, vx: enemy.vx, state: enemy.state },
    projectileCount: projectiles.filter((p) => p.alive).length,
    entityCount: 2 + PLATFORMS.length + projectiles.filter((p) => p.alive).length + (coin.taken ? 0 : 1),
    collisionChecks: checks,
    contacts: contacts.length,
    lastBreakpoint: breakpoint,
    events: [...events],
  });

  return { update, draw, reset, snapshot };
}