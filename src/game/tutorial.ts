/* ============================================================
   PROYECTO GUIADO — "CRONO JUMP": un clon de Mario con
   meteoritos que caen del cielo.

   Este motor es ESPECIAL: acepta un número de PASO y activa
   solo las funciones programadas hasta ese punto del tutorial.
   Paso 1 = lienzo vacío. Paso 8 = juego completo.
   ============================================================ */

import type { Hud, Mini, MiniInput } from "./minis";
import {
  drawPixels, heroSprite, HERO_PALETTE, HERO_W, HERO_H,
  SLIME_A, SLIME_B, SLIME_W, SLIME_H, SLIME_PALETTE,
} from "./sprites";
import { sfx } from "./engine";

export const VW = 480;
export const VH = 270;
export const GY = 216;          // altura del suelo
export const WORLD = 1960;      // ancho total del nivel
export const FLAG_X = WORLD - 90;

type Ctx = CanvasRenderingContext2D;

/* ---------- qué está activo en cada paso ---------- */
export interface Features {
  hero: boolean;
  jump: boolean;
  obstacles: boolean;
  coins: boolean;
  meteors: boolean;
  damage: boolean;
  polish: boolean;
  enemies: boolean;
  powerups: boolean;
  checkpoints: boolean;
  pause: boolean;
  levels: boolean;
  persistence: boolean;
}

export function featuresForStep(step: number): Features {
  return {
    hero: step >= 2,
    jump: step >= 3,
    obstacles: step >= 4,
    coins: step >= 5,
    meteors: step >= 6,
    damage: step >= 7,
    polish: step >= 8,
    enemies: step >= 9,
    powerups: step >= 10,
    checkpoints: step >= 11,
    pause: step >= 12,
    levels: step >= 13,
    persistence: step >= 14,
  };
}

export const TOTAL_STEPS = 14;
const BEST_KEY = "cronolab-cronojump-record";

/* ---------- tipos del mundo ---------- */
interface Box { x: number; y: number; w: number; h: number; kind: "bloque" | "pincho" }
interface Coin { x: number; y: number; taken: boolean; ph: number }
interface Meteor { x: number; y: number; vy: number }
interface Warning { x: number; t: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; text?: string }
interface Walker { x: number; y: number; vx: number; min: number; max: number; dead: number; anim: number }
interface PowerUp { x: number; y: number; kind: "escudo" | "iman"; taken: boolean; respawn: number }
interface Checkpoint { x: number; active: boolean }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------- EL NIVEL (datos, no código) ---------- */
function buildBoxes(): Box[] {
  const b: Box[] = [];
  // bloques de ladrillo para saltar
  const blocks: [number, number][] = [
    [300, 1], [330, 1], [430, 2], [620, 1], [650, 2], [680, 1],
    [900, 1], [1080, 2], [1110, 1], [1320, 1], [1350, 2], [1540, 1], [1700, 2],
  ];
  for (const [x, alto] of blocks) b.push({ x, y: GY - 24 * alto, w: 30, h: 24 * alto, kind: "bloque" });
  // plataformas flotantes (para monedas altas)
  for (const x of [520, 980, 1450]) b.push({ x, y: GY - 76, w: 64, h: 12, kind: "bloque" });
  // pinchos en el suelo
  for (const x of [760, 1200, 1620]) b.push({ x, y: GY - 12, w: 34, h: 12, kind: "pincho" });
  return b;
}

function buildCoins(): Coin[] {
  const c: Coin[] = [];
  const add = (x: number, y: number) => c.push({ x, y, taken: false, ph: c.length });
  // monedas sobre el suelo
  for (const x of [200, 230, 380, 860, 1260, 1290, 1860]) add(x, GY - 22);
  // arcos de monedas sobre los bloques
  for (const x of [430, 650, 1080, 1350, 1700]) { add(x + 15, GY - 70); add(x - 15, GY - 56); add(x + 45, GY - 56); }
  // monedas sobre las plataformas flotantes
  for (const x of [520, 980, 1450]) { add(x + 12, GY - 96); add(x + 36, GY - 96); }
  return c;
}

function buildWalkers(): Walker[] {
  return [
    { x: 520, y: GY, vx: 32, min: 470, max: 600, dead: 0, anim: 0 },
    { x: 980, y: GY, vx: -30, min: 920, max: 1060, dead: 0, anim: 1 },
    { x: 1450, y: GY, vx: 34, min: 1400, max: 1530, dead: 0, anim: 2 },
  ];
}

function buildPowerUps(): PowerUp[] {
  return [
    { x: 560, y: GY - 96, kind: "escudo", taken: false, respawn: 0 },
    { x: 1120, y: GY - 24, kind: "iman", taken: false, respawn: 0 },
    { x: 1620, y: GY - 96, kind: "escudo", taken: false, respawn: 0 },
  ];
}

function buildCheckpoints(): Checkpoint[] {
  return [{ x: 640, active: false }, { x: 1240, active: false }];
}

function loadBest(): number {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}

function saveBest(value: number) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* sin almacenamiento */ }
}

export function createTutorialGame(step: number): Mini {
  const F = featuresForStep(step);

  /* ---------- estado ---------- */
  let hero = { x: 60, y: GY, vx: 0, vy: 0, face: 1 as 1 | -1, onGround: true, animT: 0, moving: false };
  let camX = 0, t = 0, score = 0, lives = 3, invT = 0, shake = 0;
  let won = false, over = false;
  let boxes = buildBoxes();
  let coins = buildCoins();
  let meteors: Meteor[] = [];
  let warns: Warning[] = [];
  let parts: Part[] = [];
  let spawnT = 1.6;
  let jumpBuf = 0;

  /* sistemas de los pasos 9-14 */
  let walkers = buildWalkers();
  let powerups = buildPowerUps();
  let checkpoints = buildCheckpoints();
  let shieldT = 0, magnetT = 0;
  let spawnX = 60;
  let paused = false, pauseLatch = false, pauseSel = 0;
  let level = 1, levelClear = 0, levelT = 0;
  let best = F.persistence ? loadBest() : 0;
  let combo = 0, comboT = 0;

  const startLevel = (keepScore: boolean) => {
    hero = { x: 60, y: GY, vx: 0, vy: 0, face: 1, onGround: true, animT: 0, moving: false };
    camX = 0; invT = 0; shake = 0; won = false;
    boxes = buildBoxes(); coins = buildCoins();
    meteors = []; warns = []; spawnT = 1.6; jumpBuf = 0;
    walkers = buildWalkers(); powerups = buildPowerUps(); checkpoints = buildCheckpoints();
    shieldT = 0; magnetT = 0; spawnX = 60; combo = 0; comboT = 0;
    levelT = 0;                      // la dificultad arranca de cero en cada nivel
    if (!keepScore) score = 0;
  };

  const reset = () => {
    t = 0; score = 0; lives = 3; over = false;
    paused = false; pauseSel = 0; level = 1; levelClear = 0;
    parts = [];
    startLevel(false);
  };

  const burst = (x: number, y: number, colors: string[], n: number, pow = 70) => {
    if (!F.polish) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.3 + Math.random() * 0.7) * pow;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - pow * 0.4, life: 0.4 + Math.random() * 0.4, max: 0.8, color: colors[i % colors.length], size: 1 + Math.floor(Math.random() * 2) });
    }
  };
  const floatText = (x: number, y: number, text: string, color: string) => {
    if (!F.polish) return;
    parts.push({ x, y, vx: 0, vy: -26, life: 1, max: 1, color, size: 0, text });
  };

  const hurt = () => {
    if (invT > 0 || !F.damage) return;
    /* PASO 10: el escudo absorbe un golpe en vez de restar vida */
    if (F.powerups && shieldT > 0) {
      shieldT = 0;
      invT = 1;
      burst(hero.x, hero.y - 10, ["#5ce1e6", "#ffffff"], 16, 90);
      floatText(hero.x, hero.y - 28, "¡ESCUDO!", "#5ce1e6");
      sfx.stomp();
      return;
    }
    lives--;
    invT = 1.4;
    shake = 7;
    combo = 0;
    hero.vy = -170;
    hero.onGround = false;
    burst(hero.x, hero.y - 10, ["#ff5d73", "#ffffff"], 12, 80);
    sfx.hurt();
    if (lives <= 0) { over = true; sfx.hurt(); return; }
    /* PASO 11: reaparecer en el último checkpoint en vez de perder todo */
    if (F.checkpoints) {
      hero.x = spawnX; hero.y = GY - 30; hero.vx = 0; hero.vy = 0;
      invT = 1.6;
      floatText(spawnX, GY - 50, "checkpoint", "#ffd23f");
    }
  };

  /* ---------- colisión AABB contra la lista de cajas ---------- */
  const solidsAt = (hx: number, hy: number) => {
    // caja del héroe: 10 de ancho, 18 de alto, con los pies en hy
    const l = hx - 5, r = hx + 5, top = hy - HERO_H, bot = hy;
    return boxes.filter((b) => b.kind === "bloque" && l < b.x + b.w && r > b.x && top < b.y + b.h && bot > b.y);
  };

  return {
    update(dt: number, inp: MiniInput) {
      if (inp.reset) { reset(); return; }

      /* ---------- PASO 12: menú de pausa ---------- */
      if (F.pause) {
        if (inp.interact && !pauseLatch) {
          paused = !paused;
          pauseSel = 0;
          sfx.jump();
        }
        pauseLatch = inp.interact;
        if (paused) {
          // dentro del menú solo navegan las flechas: el mundo está congelado
          if (inp.left) pauseSel = 0;
          if (inp.right) pauseSel = 1;
          if (inp.jump) {
            if (pauseSel === 1) { reset(); return; }
            paused = false;
          }
          return;
        }
      }

      t += dt;
      levelT += dt;
      if (shake > 0) shake = Math.max(0, shake - dt * 14);
      if (invT > 0) invT -= dt;
      if (shieldT > 0) shieldT -= dt;
      if (magnetT > 0) magnetT -= dt;
      if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
      if (levelClear > 0) {
        levelClear -= dt;
        if (levelClear <= 0) {
          level++;
          if (lives < 3) lives++;    // un respiro antes del siguiente nivel
          startLevel(true);
        }
      }

      /* partículas (siempre que existan) */
      for (const p of parts) {
        if (!p.text) p.vy += 300 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      }
      parts = parts.filter((p) => p.life > 0);

      if (over || won) {
        camX += (clamp(hero.x - VW * 0.42, 0, WORLD - VW) - camX) * (1 - Math.exp(-6 * dt));
        return;
      }

      /* ---------- PASO 2: movimiento horizontal ---------- */
      if (F.hero) {
        const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        hero.vx += (dir * 140 - hero.vx) * Math.min(1, dt * 12);
        if (dir !== 0) hero.face = dir as 1 | -1;
        hero.moving = Math.abs(hero.vx) > 14;
        hero.animT += dt * (hero.moving ? Math.abs(hero.vx) / 22 + 4 : 2.5);

        /* ---------- PASO 3: gravedad y salto ---------- */
        if (F.jump) {
          if (inp.jump) jumpBuf = 0.12;
          if (jumpBuf > 0) jumpBuf -= dt;
          if (jumpBuf > 0 && hero.onGround) {
            hero.vy = -345;
            hero.onGround = false;
            jumpBuf = 0;
            sfx.jump();
            burst(hero.x, hero.y, ["#d9c6a5"], 5, 36);
          }
          hero.vy = Math.min(hero.vy + 980 * dt, 560);
        }

        /* mover X y resolver contra bloques */
        const nx = hero.x + hero.vx * dt;
        if (F.obstacles && solidsAt(nx, hero.y).length) {
          const b = solidsAt(nx, hero.y)[0];
          hero.x = hero.vx > 0 ? b.x - 5.01 : b.x + b.w + 5.01;
          hero.vx = 0;
        } else hero.x = nx;

        /* mover Y y resolver contra bloques + suelo */
        if (F.jump) {
          const ny = hero.y + hero.vy * dt;
          const hits = F.obstacles ? solidsAt(hero.x, ny) : [];
          if (hits.length) {
            const b = hits[0];
            if (hero.vy > 0) { hero.y = b.y; hero.vy = 0; hero.onGround = true; }
            else { hero.y = b.y + b.h + HERO_H; hero.vy = 0; }
          } else {
            hero.y = ny;
            hero.onGround = false;
          }
          if (hero.y >= GY) { hero.y = GY; hero.vy = 0; hero.onGround = true; }
        }
        hero.x = clamp(hero.x, 10, WORLD - 10);

        /* ---------- PASO 4: pinchos ---------- */
        if (F.obstacles && F.damage) {
          for (const b of boxes) {
            if (b.kind !== "pincho") continue;
            if (hero.x + 5 > b.x && hero.x - 5 < b.x + b.w && hero.y > b.y && hero.y - HERO_H < b.y + b.h) {
              const away = hero.x < b.x + b.w / 2 ? -1 : 1;
              hero.vx = 150 * away;
              hurt();
            }
          }
        }

        /* ---------- PASO 5: monedas ---------- */
        if (F.coins) {
          for (const c of coins) {
            if (c.taken) continue;
            let cy = c.y + Math.sin(t * 2.2 + c.ph) * 2;
            /* PASO 10: el imán atrae las monedas cercanas */
            if (F.powerups && magnetT > 0) {
              const dx = hero.x - c.x, dy = (hero.y - 10) - cy;
              const dist = Math.hypot(dx, dy);
              if (dist < 90) {
                c.x += (dx / dist) * 150 * dt;
                c.y += (dy / dist) * 150 * dt;
                cy = c.y;
              }
            }
            if (Math.abs(c.x - hero.x) < 11 && cy > hero.y - 22 && cy < hero.y + 6) {
              c.taken = true;
              score += 10;
              burst(c.x, cy, ["#ffd23f", "#fff3a3", "#ffffff"], 8, 60);
              floatText(c.x, cy - 8, "+10", "#ffd23f");
              sfx.coin();
            }
          }
        }

        /* ---------- PASO 9: enemigos que patrullan ---------- */
        if (F.enemies) {
          for (const w of walkers) {
            if (w.dead > 0) { w.dead -= dt; continue; }
            w.x += w.vx * dt;
            w.anim += dt;
            if (w.x < w.min) { w.x = w.min; w.vx = Math.abs(w.vx); }
            if (w.x > w.max) { w.x = w.max; w.vx = -Math.abs(w.vx); }

            const tocando = Math.abs(w.x - hero.x) < 12 && hero.y > GY - 24 && hero.y - HERO_H < GY;
            if (!tocando) continue;
            const pisando = hero.vy > 55 && hero.y < GY - 6;
            if (pisando) {
              /* pisotón: rebote + combo que multiplica los puntos */
              w.dead = 3;
              hero.vy = -250;
              hero.onGround = false;
              combo = Math.min(combo + 1, 8);
              comboT = 2;
              const premio = 50 * combo;
              score += premio;
              burst(w.x, GY - 8, ["#58c94f", "#bff5b0"], 14, 85);
              floatText(w.x, GY - 26, `+${premio}${combo > 1 ? ` x${combo}` : ""}`, "#4ade80");
              sfx.stomp();
            } else {
              const away = hero.x < w.x ? -1 : 1;
              hero.vx = 165 * away;
              hurt();
            }
          }
        }

        /* ---------- PASO 10: power-ups con temporizador ---------- */
        if (F.powerups) {
          for (const p of powerups) {
            if (p.taken) {
              p.respawn -= dt;
              if (p.respawn <= 0) p.taken = false;
              continue;
            }
            const py = p.y + Math.sin(t * 3 + p.x) * 2;
            if (Math.abs(p.x - hero.x) < 13 && py > hero.y - 26 && py < hero.y + 8) {
              p.taken = true;
              p.respawn = 9;
              if (p.kind === "escudo") { shieldT = 8; floatText(p.x, py - 10, "ESCUDO 8s", "#5ce1e6"); }
              else { magnetT = 7; floatText(p.x, py - 10, "IMÁN 7s", "#ff7ad9"); }
              burst(p.x, py, p.kind === "escudo" ? ["#5ce1e6", "#ffffff"] : ["#ff7ad9", "#ffffff"], 14, 70);
              sfx.coin();
            }
          }
        }

        /* ---------- PASO 11: checkpoints ---------- */
        if (F.checkpoints) {
          for (const cp of checkpoints) {
            if (cp.active || hero.x < cp.x) continue;
            cp.active = true;
            spawnX = cp.x;
            burst(cp.x, GY - 30, ["#ffd23f", "#ffffff"], 18, 80);
            floatText(cp.x, GY - 56, "¡CHECKPOINT!", "#ffd23f");
            sfx.coin();
          }
        }

        /* meta */
        if (hero.x >= FLAG_X && levelClear <= 0) {
          /* PASO 13: la bandera lleva al siguiente nivel en vez de terminar */
          if (F.levels && level < 3) {
            levelClear = 1.4;
            score += 200;
            burst(FLAG_X, GY - 40, ["#ffd23f", "#4ade80", "#7c6bff"], 46, 130);
            floatText(FLAG_X, GY - 70, `NIVEL ${level} COMPLETO`, "#4ade80");
            sfx.win();
          } else {
            won = true;
            /* PASO 14: guardar el récord entre sesiones */
            if (F.persistence && score > best) { best = score; saveBest(best); }
            burst(FLAG_X, GY - 40, ["#ffd23f", "#4ade80", "#7c6bff"], 46, 130);
            sfx.win();
          }
        }
      }

      /* ---------- PASO 6: meteoritos que caen ---------- */
      if (F.meteors) {
        spawnT -= dt;
        if (spawnT <= 0) {
          // aparecen cerca del jugador, con AVISO previo (telegrafiado)
          const wx = clamp(hero.x + (Math.random() * 300 - 120), 30, WORLD - 30);
          warns.push({ x: wx, t: 0.85 });
          spawnT = Math.max(0.7, 1.7 - levelT * 0.012);
        }
        for (const w of warns) w.t -= dt;
        for (const w of warns) {
          if (w.t <= 0) meteors.push({ x: w.x, y: -14, vy: 150 });
        }
        warns = warns.filter((w) => w.t > 0);

        for (const m of meteors) {
          m.vy += 420 * dt;
          m.y += m.vy * dt;
          /* choque con el héroe */
          if (F.damage && Math.abs(m.x - hero.x) < 10 && m.y > hero.y - HERO_H - 4 && m.y < hero.y + 2) {
            m.y = 9999;
            hurt();
          }
          /* impacto en el suelo */
          if (m.y >= GY && m.y < 9000) {
            m.y = 9999;
            burst(m.x, GY - 2, ["#ff7847", "#ffd23f", "#8a5a3b"], 10, 70);
            if (F.polish) shake = Math.max(shake, 3);
          }
        }
        meteors = meteors.filter((m) => m.y < 9000);
      }

      /* ---------- PASO 7: caída fuera de cámara / vidas ---------- */
      if (F.damage && lives <= 0) over = true;

      /* cámara con lerp */
      camX += (clamp(hero.x - VW * 0.42, 0, WORLD - VW) - camX) * (1 - Math.exp(-6 * dt));
    },

    draw(ctx: Ctx) {
      const sx = F.polish && shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = F.polish && shake > 0 ? (Math.random() - 0.5) * shake : 0;
      ctx.save();
      ctx.translate(sx, sy);

      /* ---------- PASO 1: cielo + decorado ---------- */
      const grad = ctx.createLinearGradient(0, 0, 0, VH);
      grad.addColorStop(0, "#4f8fd6");
      grad.addColorStop(0.6, "#8fcdf0");
      grad.addColorStop(1, "#dff6fb");
      ctx.fillStyle = grad;
      ctx.fillRect(-10, -10, VW + 20, VH + 20);

      // nubes (parallax lento)
      const cloudOff = camX * 0.25;
      for (let i = -1; i < 14; i++) {
        const cx = i * 170 - (cloudOff % 170) + hash(i * 7) * 60;
        const cy = 20 + hash(i * 3) * 48;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(cx, cy, 34, 7);
        ctx.fillRect(cx + 8, cy - 5, 18, 5);
        ctx.fillStyle = "rgba(190,220,240,0.5)";
        ctx.fillRect(cx, cy + 6, 34, 2);
      }
      // colinas (parallax medio)
      const hillOff = camX * 0.5;
      for (let i = -1; i < 16; i++) {
        const hx = i * 150 - (hillOff % 150);
        ctx.fillStyle = i % 2 === 0 ? "#5da863" : "#4c9455";
        ctx.beginPath();
        ctx.arc(hx, GY + 12, 62, Math.PI, 0);
        ctx.fill();
      }

      /* suelo */
      ctx.fillStyle = "#8a5a3b";
      ctx.fillRect(-10, GY + 6, VW + 20, VH - GY);
      ctx.fillStyle = "#4fae52";
      ctx.fillRect(-10, GY, VW + 20, 6);
      ctx.fillStyle = "#7ed37a";
      ctx.fillRect(-10, GY, VW + 20, 1);
      const start = Math.floor(camX / 16) * 16;
      for (let wx = start; wx < camX + VW + 16; wx += 16) {
        const dx = wx - camX;
        const hh = hash(wx / 16);
        ctx.fillStyle = "#6f4429";
        ctx.fillRect(dx + 3 + Math.floor(hh * 8), GY + 11 + Math.floor(hh * 9), 2, 2);
        if (hh < 0.2) {
          ctx.fillStyle = "#3e9c47";
          ctx.fillRect(dx + 5, GY - 3, 1, 3);
          ctx.fillRect(dx + 8, GY - 4, 1, 4);
        }
      }

      /* ---------- PASO 4: obstáculos ---------- */
      if (F.obstacles) {
        for (const b of boxes) {
          const bx = b.x - camX;
          if (bx < -80 || bx > VW + 80) continue;
          if (b.kind === "bloque") {
            ctx.fillStyle = "#a55d3f";
            ctx.fillRect(bx, b.y, b.w, b.h);
            ctx.fillStyle = "#7c3f2a";
            for (let yy = b.y + 7; yy < b.y + b.h; yy += 8) ctx.fillRect(bx, yy, b.w, 2);
            ctx.fillStyle = "#c97d55";
            ctx.fillRect(bx, b.y, b.w, 2);
          } else {
            ctx.fillStyle = "#8f9aa8";
            for (let i = 0; i < b.w; i += 8) {
              ctx.beginPath();
              ctx.moveTo(bx + i, b.y + b.h);
              ctx.lineTo(bx + i + 4, b.y);
              ctx.lineTo(bx + i + 8, b.y + b.h);
              ctx.fill();
            }
            ctx.fillStyle = "#6d7683";
            ctx.fillRect(bx, b.y + b.h - 2, b.w, 2);
          }
        }
        /* bandera de meta */
        const fx = FLAG_X - camX;
        if (fx > -40 && fx < VW + 40) {
          ctx.fillStyle = "#7a4a2b";
          ctx.fillRect(fx, GY - 52, 3, 52);
          ctx.fillStyle = won ? "#4ade80" : "#ff5470";
          const wv = Math.round(Math.sin(t * 5) * 2);
          ctx.fillRect(fx + 3, GY - 51, 15, 5);
          ctx.fillRect(fx + 3, GY - 46 + wv * 0.5, 11, 5);
          ctx.fillRect(fx + 3, GY - 41 + wv, 7, 5);
          ctx.fillStyle = "#ffd23f";
          ctx.fillRect(fx - 1, GY - 55, 5, 4);
        }
      }

      /* ---------- PASO 5: monedas ---------- */
      if (F.coins) {
        for (const c of coins) {
          if (c.taken) continue;
          const cx = c.x - camX;
          if (cx < -20 || cx > VW + 20) continue;
          const cy = c.y + Math.sin(t * 2.2 + c.ph) * 2;
          const spin = Math.abs(Math.sin(t * 2.8 + c.ph));
          const widths = [3, 5, 7, 8, 8, 8, 8, 7, 5, 3];
          widths.forEach((w, r) => {
            const ww = Math.max(1, Math.round(w * spin));
            ctx.fillStyle = "#ffd23f";
            ctx.fillRect(cx - ww / 2, cy + r - 5, ww, 1);
          });
          if (spin > 0.8) { ctx.fillStyle = "#c88a1d"; ctx.fillRect(cx - 1, cy - 2, 2, 6); }
        }
      }

      /* ---------- PASO 6: avisos y meteoritos ---------- */
      if (F.meteors) {
        for (const w of warns) {
          const wx = w.x - camX;
          if (wx < -20 || wx > VW + 20) continue;
          const blink = Math.floor(w.t * 12) % 2 === 0;
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = blink ? "#ff5d73" : "#ffd23f";
          ctx.fillRect(wx - 9, GY - 3, 18, 3);
          ctx.globalAlpha = 1;
          ctx.fillStyle = blink ? "#ff5d73" : "#ffd23f";
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.textAlign = "center";
          ctx.fillText("!", wx, 22);
          ctx.fillRect(wx - 1, 26, 2, 8);
        }
        for (const m of meteors) {
          const mx = m.x - camX;
          if (mx < -20 || mx > VW + 20) continue;
          // estela
          ctx.fillStyle = "rgba(255,120,71,0.35)";
          ctx.fillRect(mx - 2, m.y - 16, 4, 14);
          ctx.fillStyle = "#ffd23f";
          ctx.fillRect(mx - 4, m.y - 4, 8, 8);
          ctx.fillStyle = "#ff7847";
          ctx.fillRect(mx - 3, m.y - 3, 6, 6);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(mx - 1, m.y - 2, 2, 2);
        }
      }

      /* ---------- PASO 11: banderas de checkpoint ---------- */
      if (F.checkpoints) {
        for (const cp of checkpoints) {
          const cx = cp.x - camX;
          if (cx < -30 || cx > VW + 30) continue;
          ctx.fillStyle = "#6d7683";
          ctx.fillRect(cx, GY - 34, 2, 34);
          ctx.fillStyle = cp.active ? "#ffd23f" : "#51486d";
          const wv = cp.active ? Math.round(Math.sin(t * 6) * 1.5) : 0;
          ctx.fillRect(cx + 2, GY - 33 + wv, 11, 8);
          if (cp.active) { ctx.fillStyle = "#fff3a3"; ctx.fillRect(cx + 4, GY - 31 + wv, 3, 3); }
        }
      }

      /* ---------- PASO 9: enemigos ---------- */
      if (F.enemies) {
        for (const w of walkers) {
          const wx = w.x - camX;
          if (wx < -30 || wx > VW + 30) continue;
          if (w.dead > 0) {
            ctx.globalAlpha = Math.max(0, w.dead / 3);
            ctx.fillStyle = "#3f9e3c";
            ctx.fillRect(wx - 8, GY - 3, 16, 3);
            ctx.globalAlpha = 1;
            continue;
          }
          ctx.fillStyle = "rgba(20,50,20,0.22)";
          ctx.fillRect(wx - 7, GY + 2, 14, 2);
          drawPixels(ctx, Math.sin(w.anim * 7) > 0 ? SLIME_A : SLIME_B, Math.round(wx - SLIME_W / 2), GY - SLIME_H, SLIME_PALETTE, w.vx > 0);
        }
      }

      /* ---------- PASO 10: power-ups ---------- */
      if (F.powerups) {
        for (const p of powerups) {
          if (p.taken) continue;
          const px = p.x - camX;
          if (px < -20 || px > VW + 20) continue;
          const py = p.y + Math.sin(t * 3 + p.x) * 2;
          ctx.fillStyle = p.kind === "escudo" ? "rgba(92,225,230,.22)" : "rgba(255,122,217,.22)";
          ctx.fillRect(px - 10, py - 10, 20, 20);
          if (p.kind === "escudo") {
            ctx.fillStyle = "#5ce1e6";
            ctx.fillRect(px - 6, py - 7, 12, 10);
            ctx.fillRect(px - 4, py + 3, 8, 4);
            ctx.fillStyle = "#ffffff"; ctx.fillRect(px - 2, py - 4, 4, 4);
          } else {
            ctx.fillStyle = "#ff7ad9";
            ctx.fillRect(px - 7, py - 7, 5, 11);
            ctx.fillRect(px + 2, py - 7, 5, 11);
            ctx.fillRect(px - 7, py - 7, 14, 4);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(px - 7, py + 2, 5, 3); ctx.fillRect(px + 2, py + 2, 5, 3);
          }
        }
      }

      /* ---------- PASO 2: el héroe ---------- */
      if (F.hero) {
        const hx = Math.round(hero.x - camX);
        const hy = Math.round(hero.y);
        ctx.fillStyle = "rgba(20,50,20,0.26)";
        ctx.fillRect(hx - 7, GY + 2, 14, 2);
        /* aura del escudo activo, parpadeando al expirar */
        if (F.powerups && shieldT > 0 && (shieldT > 1.5 || Math.floor(t * 12) % 2 === 0)) {
          ctx.strokeStyle = "#5ce1e6";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(hx, hy - 9, 15, 0, Math.PI * 2); ctx.stroke();
        }
        if (F.powerups && magnetT > 0) {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = "#ff7ad9";
          ctx.beginPath(); ctx.arc(hx, hy - 9, 26 + Math.sin(t * 8) * 3, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (!(F.damage && invT > 0 && Math.floor(t * 14) % 2 === 0)) {
          let st: "idle" | "runA" | "runB" | "jump" = "idle";
          if (F.jump && !hero.onGround) st = "jump";
          else if (hero.moving) st = Math.floor(hero.animT * 6) % 2 === 0 ? "runA" : "runB";
          drawPixels(ctx, heroSprite(st), hx - HERO_W / 2, hy - HERO_H, HERO_PALETTE, hero.face < 0);
        }
      }

      /* partículas */
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        if (p.text) {
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.textAlign = "center";
          ctx.fillText(p.text, p.x - camX, p.y);
        } else ctx.fillRect(p.x - camX, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
      }

      /* ---------- carteles del paso 1 ---------- */
      if (!F.hero) {
        ctx.fillStyle = "rgba(11,14,26,0.82)";
        ctx.fillRect(100, 108, VW - 200, 44);
        ctx.fillStyle = "#ffd23f";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText("PASO 1: EL LIENZO VIVE", VW / 2, 128);
        ctx.fillStyle = "#e9ecff";
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText("el bucle ya dibuja 60 veces/s", VW / 2, 144);
      }

      /* ---------- PASO 13: aviso de nivel superado ---------- */
      if (levelClear > 0) {
        ctx.fillStyle = "rgba(7,9,18,0.55)";
        ctx.fillRect(0, VH / 2 - 26, VW, 52);
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`NIVEL ${level} COMPLETO`, VW / 2, VH / 2 - 2);
        ctx.fillStyle = "#e9ecff";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`preparando nivel ${level + 1}…`, VW / 2, VH / 2 + 18);
      }

      /* ---------- PASO 12: menú de pausa ---------- */
      if (F.pause && paused) {
        ctx.fillStyle = "rgba(7,9,18,0.78)";
        ctx.fillRect(0, 0, VW, VH);
        ctx.strokeStyle = "#7c6bff";
        ctx.lineWidth = 2;
        ctx.strokeRect(VW / 2 - 92, VH / 2 - 52, 184, 104);
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffd23f";
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText("PAUSA", VW / 2, VH / 2 - 26);
        const opciones = ["CONTINUAR", "REINICIAR"];
        opciones.forEach((op, i) => {
          ctx.fillStyle = pauseSel === i ? "#ffd23f" : "#8b93c9";
          ctx.font = '9px "Press Start 2P", monospace';
          ctx.fillText((pauseSel === i ? "> " : "  ") + op, VW / 2, VH / 2 + 2 + i * 18);
        });
        ctx.fillStyle = "#8b93c9";
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText("← → elegir · espacio confirmar · E cerrar", VW / 2, VH / 2 + 44);
      }

      /* ---------- finales ---------- */
      if (won || over) {
        ctx.fillStyle = "rgba(7,9,18,0.6)";
        ctx.fillRect(0, 0, VW, VH);
        ctx.textAlign = "center";
        ctx.fillStyle = won ? "#4ade80" : "#ff5d73";
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(won ? "¡META!" : "GAME OVER", VW / 2, VH / 2 - 18);
        ctx.fillStyle = "#ffd23f";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`puntos: ${score}`, VW / 2, VH / 2 + 6);
        if (F.persistence) {
          ctx.fillStyle = score >= best && score > 0 ? "#4ade80" : "#8b93c9";
          ctx.fillText(score >= best && score > 0 ? `¡NUEVO RÉCORD! ${best}` : `récord: ${best}`, VW / 2, VH / 2 + 24);
        }
        ctx.fillStyle = "#e9ecff";
        ctx.fillText("pulsa R para reintentar", VW / 2, VH / 2 + (F.persistence ? 44 : 28));
      }

      ctx.restore();
    },

    hud(): Hud {
      const h: Hud = {};
      if (F.coins) h.puntos = score;
      if (F.damage) h.vidas = lives;
      if (F.meteors) h.meteoros = meteors.length + warns.length;
      if (F.enemies) h.combo = combo > 1 ? `x${combo}` : "—";
      if (F.powerups) h.poder = shieldT > 0 ? `escudo ${shieldT.toFixed(1)}s` : magnetT > 0 ? `imán ${magnetT.toFixed(1)}s` : "—";
      if (F.levels) h.nivel = `${level}/3`;
      if (F.persistence) h.récord = best;
      h.estado = over ? "game over" : won ? "¡victoria!" : paused ? "pausa" : F.hero ? "jugando" : "solo dibujo";
      return h;
    },
  };
}
