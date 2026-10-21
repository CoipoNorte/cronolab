/* ============================================================
   MOTOR DEL JUEGO — aquí vive toda la lógica.
   Es JavaScript/TypeScript normalito: números, vectores y ifs.
   ============================================================ */

import {
  drawPixels,
  heroSprite,
  HERO_PALETTE,
  HERO_W,
  HERO_H,
  SLIME_A,
  SLIME_B,
  SLIME_PALETTE,
  SLIME_W,
  SLIME_H,
} from "./sprites";
import type { PixelMap } from "./sprites";

/* ------------ constantes del mundo ------------ */
export const VIEW_W = 480;      // resolución INTERNA (luego la escalamos con CSS)
export const VIEW_H = 270;
export const WORLD_W = 2200;    // ancho total del nivel
export const GROUND_Y = 216;    // altura del suelo

/* ------------ parámetros que puedes tocar ------------ */
export interface Params {
  speed: number;      // velocidad de carrera (píxeles / segundo)
  gravity: number;    // gravedad (píxeles / segundo²)
  jump: number;       // fuerza de salto (velocidad inicial hacia arriba)
  parallax: number;   // multiplicador global del efecto parallax
  smoothCam: boolean; // cámara suave (lerp) o pegada al héroe
  sound: boolean;
}

export const DEFAULT_PARAMS: Params = {
  speed: 130,
  gravity: 950,
  jump: 340,
  parallax: 1,
  smoothCam: true,
  sound: true,
};

/* ------------ tipos de entidades ------------ */
export interface Hero {
  x: number; y: number;     // posición (los pies del héroe)
  vx: number; vy: number;   // velocidad
  face: 1 | -1;             // hacia dónde mira
  onGround: boolean;
  animT: number;            // reloj de la animación
  moving: boolean;
}

export interface Coin { x: number; y: number; taken: boolean; ph: number }
export interface Slime { x: number; vx: number; min: number; max: number; ph: number; deadT: number }
export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; size: number; text?: string;
}

export interface Game {
  t: number;
  camX: number;
  score: number;
  hearts: number;
  won: boolean;
  deadT: number;
  invulnT: number;
  jumpBuf: number;          // "buffer" de salto: perdona pulsaciones un pelín antes de aterrizar
  hero: Hero;
  input: { left: boolean; right: boolean; jump: boolean };
  coins: Coin[];
  slimes: Slime[];
  parts: Particle[];
}

export const FLAG_X = WORLD_W - 90; // la meta

/* ------------ creación del mundo ------------ */
export function createGame(): Game {
  const coins: Coin[] = [];
  for (let i = 0; i < 12; i++) {
    const baseX = 180 + i * 150;
    const mode = i % 3;
    if (mode === 0) coins.push({ x: baseX, y: GROUND_Y - 16, taken: false, ph: i });
    if (mode === 1) {
      coins.push({ x: baseX - 18, y: GROUND_Y - 20, taken: false, ph: i });
      coins.push({ x: baseX, y: GROUND_Y - 44, taken: false, ph: i + 1 });
      coins.push({ x: baseX + 18, y: GROUND_Y - 20, taken: false, ph: i + 2 });
    }
    if (mode === 2) coins.push({ x: baseX, y: GROUND_Y - 68, taken: false, ph: i });
  }
  const slimes: Slime[] = [
    { x: 420, vx: 22, min: 380, max: 560, ph: 0, deadT: 0 },
    { x: 950, vx: -26, min: 900, max: 1150, ph: 2, deadT: 0 },
    { x: 1420, vx: 30, min: 1380, max: 1640, ph: 4, deadT: 0 },
    { x: 1880, vx: -24, min: 1820, max: 2050, ph: 1, deadT: 0 },
  ];
  return {
    t: 0,
    camX: 0,
    score: 0,
    hearts: 3,
    won: false,
    deadT: 0,
    invulnT: 0,
    jumpBuf: 0,
    hero: { x: 64, y: GROUND_Y, vx: 0, vy: 0, face: 1, onGround: true, animT: 0, moving: false },
    input: { left: false, right: false, jump: false },
    coins,
    slimes,
    parts: [],
  };
}

export function resetGame(g: Game) {
  const fresh = createGame();
  g.t = 0; g.camX = fresh.camX; g.score = 0; g.hearts = 3; g.won = false;
  g.deadT = 0; g.invulnT = 0; g.jumpBuf = 0;
  g.hero = fresh.hero; g.coins = fresh.coins; g.slimes = fresh.slimes; g.parts = [];
}

/* ------------ utilidades ------------ */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** hash determinista: mismo índice → mismo "aleatorio", para decorar sin arrays */
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function spawnBurst(g: Game, x: number, y: number, colors: string[], n: number, pow = 70) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (0.3 + Math.random() * 0.7) * pow;
    g.parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - pow * 0.45,
      life: 0.5 + Math.random() * 0.4,
      max: 0.9,
      color: colors[i % colors.length],
      size: 1 + Math.floor(Math.random() * 2),
    });
  }
}

function spawnText(g: Game, x: number, y: number, text: string, color: string) {
  g.parts.push({ x, y, vx: 0, vy: -26, life: 1, max: 1, color, size: 0, text });
}

/* ============================================================
   UPDATE — la física y las reglas. Se llama ~60 veces/segundo.
   dt = segundos que pasaron desde el último fotograma.
   ============================================================ */
export function update(g: Game, dt: number, p: Params) {
  g.t += dt;
  const h = g.hero;

  /* ---- temporizadores ---- */
  if (g.invulnT > 0) g.invulnT -= dt;
  if (g.jumpBuf > 0) g.jumpBuf -= dt;
  if (g.input.jump) { g.jumpBuf = 0.12; g.input.jump = false; }

  /* ---- muerte y reaparición ---- */
  if (g.deadT > 0) {
    g.deadT -= dt;
    if (g.deadT <= 0) {
      h.x = 64; h.y = GROUND_Y; h.vx = 0; h.vy = 0;
      g.hearts = 3;
      g.invulnT = 1.5;
    }
  } else {
    /* ---- movimiento horizontal ---- */
    const dir = (g.input.right ? 1 : 0) - (g.input.left ? 1 : 0);
    const target = dir * p.speed;
    // aceleración suave: nos acercamos a la velocidad objetivo poco a poco
    h.vx += (target - h.vx) * Math.min(1, dt * 12);
    if (dir !== 0) h.face = dir as 1 | -1;
    h.moving = Math.abs(h.vx) > 14;

    /* ---- salto ---- */
    if (g.jumpBuf > 0 && h.onGround) {
      h.vy = -p.jump;            // impulso hacia arriba (la y crece hacia abajo)
      h.onGround = false;
      g.jumpBuf = 0;
      spawnBurst(g, h.x, h.y, ["#d9c6a5", "#b59a76"], 6, 40);
      sfx.jump();
    }

    /* ---- gravedad + suelo ---- */
    h.vy += p.gravity * dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    if (h.y >= GROUND_Y) {
      if (!h.onGround && h.vy > 260) spawnBurst(g, h.x, GROUND_Y, ["#d9c6a5", "#b59a76"], 5, 34);
      h.y = GROUND_Y;
      h.vy = 0;
      h.onGround = true;
    }
    h.x = clamp(h.x, 10, WORLD_W - 10);
    h.animT += dt * (h.moving ? Math.abs(h.vx) / 22 + 4 : 2.5);

    /* ---- monedas: colisión por distancia ---- */
    for (const c of g.coins) {
      if (c.taken) continue;
      const cy = c.y + Math.sin(g.t * 2.2 + c.ph) * 2;
      if (Math.abs(c.x - h.x) < 10 && cy > h.y - 20 && cy < h.y + 4) {
        c.taken = true;
        g.score++;
        spawnBurst(g, c.x, cy, ["#ffd23f", "#fff3a3", "#ffffff"], 8, 60);
        spawnText(g, c.x, cy - 8, "+1", "#ffd23f");
        sfx.coin();
      }
    }

    /* ---- slimes: patrulla + colisión ---- */
    for (const s of g.slimes) {
      if (s.deadT > 0) {
        s.deadT -= dt;
        if (s.deadT <= 0) s.x = s.min; // reaparece
        continue;
      }
      s.x += s.vx * dt;
      if (s.x < s.min) { s.x = s.min; s.vx *= -1; }
      if (s.x > s.max) { s.x = s.max; s.vx *= -1; }
      s.ph += dt;

      // ¿se tocan? cajas AABB: héroe (10x18) vs slime (18x10)
      const overlapX = Math.abs(s.x - h.x) < 12;
      const overlapY = h.y > GROUND_Y - 60 && h.y - HERO_H < GROUND_Y - 2 && h.y > GROUND_Y - 14;
      if (overlapX && overlapY) {
        const stomping = h.vy > 60 && h.y < GROUND_Y - 6;
        if (stomping) {
          s.deadT = 2.4;
          h.vy = -p.jump * 0.55; // rebote al aplastarlo
          g.score += 2;
          spawnBurst(g, s.x, GROUND_Y - 5, ["#58c94f", "#3f9e3c", "#bff5b0"], 12, 80);
          spawnText(g, s.x, GROUND_Y - 18, "+2", "#4ade80");
          sfx.stomp();
        } else if (g.invulnT <= 0) {
          g.hearts--;
          g.invulnT = 1.2;
          const away = h.x < s.x ? -1 : 1;
          h.vx = 190 * away;
          h.vy = -170;
          h.onGround = false;
          spawnBurst(g, h.x, h.y - 10, ["#ff5d73", "#ffffff"], 10, 80);
          sfx.hurt();
          if (g.hearts <= 0) { g.deadT = 1.6; sfx.hurt(); }
        }
      }
    }

    /* ---- meta ---- */
    if (!g.won && h.x >= FLAG_X) {
      g.won = true;
      spawnBurst(g, FLAG_X, GROUND_Y - 40, ["#ffd23f", "#4ade80", "#7c6bff", "#ff5d73"], 46, 130);
      spawnText(g, FLAG_X - 20, GROUND_Y - 64, "¡META!", "#4ade80");
      sfx.win();
    }
  }

  /* ---- cámara: sigue al héroe con interpolación (lerp) ---- */
  const camTarget = clamp(h.x - VIEW_W * 0.42, 0, WORLD_W - VIEW_W);
  if (p.smoothCam) {
    const k = 1 - Math.exp(-6 * dt); // suavizado exponencial
    g.camX += (camTarget - g.camX) * k;
  } else {
    g.camX = camTarget;
  }

  /* ---- partículas ---- */
  for (const pt of g.parts) {
    if (!pt.text) pt.vy += 320 * dt * 0.6;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
  }
  g.parts = g.parts.filter((pt) => pt.life > 0);
}

/* ============================================================
   DRAW — pinta el mundo. Capas de atrás hacia delante.
   El truco del 2.5D: cada capa se desplaza x = índice - camX * factor
   Lejos = factor pequeño → se mueve lento. Cerca = factor 1.
   ============================================================ */

function drawSky(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, "#4f8fd6");
  grad.addColorStop(0.55, "#8fcdf0");
  grad.addColorStop(1, "#dff6fb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawSun(ctx: CanvasRenderingContext2D) {
  const rows = [6, 10, 12, 14, 14, 14, 14, 12, 10, 6];
  const cx = 66, cy = 40;
  rows.forEach((w, i) => {
    ctx.fillStyle = i > 1 && i < 8 ? "#fff3c4" : "#ffe98a";
    ctx.fillRect(cx - w / 2, cy + i * 2, w, 2);
  });
  ctx.fillStyle = "rgba(255,240,170,0.35)";
  ctx.fillRect(cx - 14, cy - 4, 28, 2);
  ctx.fillRect(cx - 14, cy + 20, 28, 2);
}

function drawCloudLayer(ctx: CanvasRenderingContext2D, camX: number, factor: number) {
  const spacing = 190;
  const off = camX * factor;
  const startI = Math.floor(off / spacing) - 1;
  for (let i = startI; ; i++) {
    const sx = i * spacing - off + hash(i * 3) * 70;
    if (sx > VIEW_W + 60) break;
    const cy = 16 + hash(i * 7) * 50;
    const s = 0.75 + hash(i * 11) * 0.7;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(sx, cy, 34 * s, 7 * s);
    ctx.fillRect(sx + 8 * s, cy - 5 * s, 18 * s, 5 * s);
    ctx.fillRect(sx + 22 * s, cy - 3 * s, 12 * s, 4 * s);
    ctx.fillStyle = "rgba(190,220,240,0.55)";
    ctx.fillRect(sx, cy + 6 * s, 34 * s, 2 * s);
  }
}

function drawMountainLayer(ctx: CanvasRenderingContext2D, camX: number, factor: number) {
  const spacing = 118;
  const off = camX * factor;
  const base = 196;
  const startI = Math.floor(off / spacing) - 2;
  for (let i = startI; ; i++) {
    const sx = i * spacing - off;
    if (sx > VIEW_W + 140) break;
    const hgt = 46 + hash(i * 5) * 62;
    const half = 62 + hash(i * 9) * 26;
    ctx.fillStyle = "#5b7fa6";
    ctx.beginPath();
    ctx.moveTo(sx - half, base);
    ctx.lineTo(sx, base - hgt);
    ctx.lineTo(sx + half, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#42608a";
    ctx.beginPath();
    ctx.moveTo(sx, base - hgt);
    ctx.lineTo(sx + half, base);
    ctx.lineTo(sx + half * 0.35, base);
    ctx.closePath();
    ctx.fill();
    if (hgt > 66) {
      ctx.fillStyle = "#eef6ff";
      ctx.beginPath();
      ctx.moveTo(sx, base - hgt);
      ctx.lineTo(sx - 10, base - hgt + 16);
      ctx.lineTo(sx - 3, base - hgt + 13);
      ctx.lineTo(sx + 5, base - hgt + 17);
      ctx.lineTo(sx + 11, base - hgt + 15);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawHillLayer(ctx: CanvasRenderingContext2D, camX: number, factor: number) {
  const spacing = 96;
  const off = camX * factor;
  const base = 208;
  const startI = Math.floor(off / spacing) - 2;
  for (let i = startI; ; i++) {
    const sx = i * spacing - off;
    if (sx > VIEW_W + 130) break;
    const r = 52 + hash(i * 4) * 46;
    ctx.fillStyle = hash(i * 6) > 0.5 ? "#5da863" : "#4c9455";
    ctx.beginPath();
    ctx.arc(sx, base + 10, r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(30,70,40,0.25)";
    for (let d = 0; d < 4; d++) {
      const hx = sx - r / 2 + hash(i * 13 + d) * r;
      ctx.fillRect(hx, base - r * 0.45 - hash(d + i) * 12, 3, 3);
    }
  }
}

function drawTreeLayer(ctx: CanvasRenderingContext2D, camX: number, factor: number) {
  const spacing = 84;
  const off = camX * factor;
  const baseY = GROUND_Y - 4;
  const startI = Math.floor(off / spacing) - 1;
  for (let i = startI; ; i++) {
    const sx = i * spacing - off + hash(i * 17) * 30;
    if (sx > VIEW_W + 40) break;
    const h = hash(i * 23);
    if (h < 0.28) continue; // huecos para que no sea un muro
    if (h > 0.72) {
      // pino
      const th = 30 + hash(i) * 14;
      ctx.fillStyle = "#6b4226";
      ctx.fillRect(sx - 2, baseY - 8, 4, 8);
      ctx.fillStyle = "#2e7d43";
      for (let t = 0; t < 3; t++) {
        const w = 20 - t * 6;
        const ty = baseY - 8 - t * (th / 3.4);
        ctx.beginPath();
        ctx.moveTo(sx - w / 2, ty);
        ctx.lineTo(sx, ty - th / 2.4);
        ctx.lineTo(sx + w / 2, ty);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#45a05a";
      ctx.fillRect(sx - 1, baseY - th - 6, 3, 3);
    } else {
      // árbol redondo
      const sc = 0.8 + hash(i * 31) * 0.5;
      ctx.fillStyle = "#6b4226";
      ctx.fillRect(sx - 2 * sc, baseY - 12 * sc, 4 * sc, 12 * sc);
      ctx.fillStyle = "#2e7d43";
      const rows = [10, 16, 18, 16, 10];
      rows.forEach((w, r) =>
        ctx.fillRect(sx - (w * sc) / 2, baseY - 12 * sc - (rows.length - r) * 4 * sc, w * sc, 4 * sc),
      );
      ctx.fillStyle = "#45a05a";
      ctx.fillRect(sx - 6 * sc, baseY - 12 * sc - 18 * sc, 4 * sc, 3 * sc);
      ctx.fillRect(sx + 1 * sc, baseY - 12 * sc - 22 * sc, 4 * sc, 3 * sc);
    }
  }
}

function drawGround(ctx: CanvasRenderingContext2D, camX: number) {
  ctx.fillStyle = "#8a5a3b";
  ctx.fillRect(0, GROUND_Y + 6, VIEW_W, VIEW_H - GROUND_Y - 6);
  ctx.fillStyle = "#4fae52";
  ctx.fillRect(0, GROUND_Y, VIEW_W, 6);
  ctx.fillStyle = "#7ed37a";
  ctx.fillRect(0, GROUND_Y, VIEW_W, 1);
  ctx.fillStyle = "#3c8a41";
  ctx.fillRect(0, GROUND_Y + 5, VIEW_W, 1);

  const start = Math.floor(camX / 16) * 16;
  for (let wx = start; wx < camX + VIEW_W + 16; wx += 16) {
    const sx = wx - camX;
    const hh = hash(wx / 16);
    ctx.fillStyle = "#6f4429";
    ctx.fillRect(sx + 2 + Math.floor(hh * 8), GROUND_Y + 9 + Math.floor(hh * 9), 2, 2);
    ctx.fillStyle = "#9c6a45";
    ctx.fillRect(sx + 10 - Math.floor(hh * 5), GROUND_Y + 16 + Math.floor(hh * 14), 2, 2);
    if (hh < 0.22) {
      ctx.fillStyle = "#3e9c47";
      ctx.fillRect(sx + 4, GROUND_Y - 3, 1, 3);
      ctx.fillRect(sx + 6, GROUND_Y - 4, 1, 4);
      ctx.fillRect(sx + 8, GROUND_Y - 3, 1, 3);
    } else if (hh > 0.92) {
      ctx.fillStyle = "#3e9c47";
      ctx.fillRect(sx + 7, GROUND_Y - 4, 1, 4);
      ctx.fillStyle = hh > 0.96 ? "#ff7ad9" : "#ffd23f";
      ctx.fillRect(sx + 6, GROUND_Y - 7, 3, 3);
    } else if (hh > 0.86) {
      ctx.fillStyle = "#8f9aa8";
      ctx.fillRect(sx + 5, GROUND_Y - 3, 5, 3);
      ctx.fillStyle = "#6d7683";
      ctx.fillRect(sx + 5, GROUND_Y - 1, 5, 1);
    }
  }
}

/** La moneda que "gira": una ilusión de 3D cambiando solo el ancho (2.5D barato) */
function drawCoin(ctx: CanvasRenderingContext2D, t: number, c: Coin) {
  const cx = c.x;
  const cy = c.y + Math.sin(t * 2.2 + c.ph) * 2;
  const widths = [3, 5, 7, 8, 8, 8, 8, 7, 5, 3];
  const spin = Math.abs(Math.sin(t * 2.8 + c.ph)); // 0 → de canto, 1 → de cara
  widths.forEach((w, r) => {
    const ww = Math.max(1, Math.round(w * spin));
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(cx - ww / 2, cy + r - 5, ww, 1);
    if (spin > 0.55 && r >= 2 && r <= 4) {
      ctx.fillStyle = "#fff3a3";
      ctx.fillRect(cx - ww / 2, cy + r - 5, 1, 1);
    }
  });
  if (spin > 0.8) {
    ctx.fillStyle = "#c88a1d";
    ctx.fillRect(cx - 1, cy - 2, 2, 6);
  }
}

function drawForeground(ctx: CanvasRenderingContext2D, camX: number, factor: number) {
  const spacing = 46;
  const off = camX * factor;
  const startI = Math.floor(off / spacing) - 1;
  for (let i = startI; ; i++) {
    const sx = i * spacing - off;
    if (sx > VIEW_W + 20) break;
    const hh = hash(i * 41);
    if (hh > 0.45) continue;
    const blades = 2 + Math.floor(hh * 6);
    ctx.fillStyle = "#2c7038";
    for (let b = 0; b < blades; b++) {
      const bx = sx + b * 3;
      ctx.fillRect(bx, VIEW_H - 4 - Math.floor(hh * 4 + b), 2, VIEW_H);
      ctx.fillRect(bx, VIEW_H - 8 - b, 2, 4 + b);
    }
  }
}

function drawFlag(ctx: CanvasRenderingContext2D, camX: number, t: number, won: boolean) {
  const sx = FLAG_X - camX;
  if (sx < -30 || sx > VIEW_W + 30) return;
  ctx.fillStyle = "#7a4a2b";
  ctx.fillRect(sx, GROUND_Y - 46, 3, 46);
  ctx.fillStyle = "#ffd23f";
  ctx.fillRect(sx - 1, GROUND_Y - 49, 5, 4);
  const wave = Math.round(Math.sin(t * 5) * 2);
  ctx.fillStyle = won ? "#4ade80" : "#ff5470";
  ctx.fillRect(sx + 3, GROUND_Y - 45, 14, 4);
  ctx.fillRect(sx + 3, GROUND_Y - 41 + wave * 0.5, 10, 4);
  ctx.fillRect(sx + 3, GROUND_Y - 37 + wave, 6, 4);
}

export function draw(g: Game, ctx: CanvasRenderingContext2D, p: Params) {
  const cam = g.camX;
  const px = p.parallax;

  drawSky(ctx);
  drawSun(ctx);
  drawCloudLayer(ctx, cam, 0.06 * px);
  drawMountainLayer(ctx, cam, 0.16 * px);
  drawHillLayer(ctx, cam, 0.34 * px);
  drawTreeLayer(ctx, cam, 0.55 * px);
  drawGround(ctx, cam);
  drawFlag(ctx, cam, g.t, g.won);

  /* ---- monedas ---- */
  for (const c of g.coins) {
    if (c.taken) continue;
    const sx = c.x - cam;
    if (sx < -20 || sx > VIEW_W + 20) continue;
    ctx.fillStyle = "rgba(20,50,20,0.18)";
    ctx.fillRect(sx - 3, GROUND_Y + 2, 6, 2);
    ctx.save();
    ctx.translate(-cam, 0);
    drawCoin(ctx, g.t, c);
    ctx.restore();
  }

  /* ---- slimes ---- */
  for (const s of g.slimes) {
    if (s.deadT > 0) continue;
    const sx = s.x - cam;
    if (sx < -30 || sx > VIEW_W + 30) continue;
    ctx.fillStyle = "rgba(20,50,20,0.22)";
    ctx.fillRect(sx - 7, GROUND_Y + 2, 14, 2);
    const map: PixelMap = Math.sin(s.ph * 6) > 0 ? SLIME_A : SLIME_B;
    drawPixels(ctx, map, Math.round(sx - SLIME_W / 2), GROUND_Y - SLIME_H, SLIME_PALETTE, s.vx > 0);
  }

  /* ---- héroe ---- */
  const h = g.hero;
  if (g.deadT <= 0) {
    const sx = Math.round(h.x - cam);
    const sy = Math.round(h.y);
    const stretch = 1 - Math.min(1, Math.abs(h.vy) / 1400) * 0.5;
    ctx.fillStyle = "rgba(20,50,20,0.28)";
    ctx.fillRect(sx - 7 * stretch, GROUND_Y + 2, 14 * stretch, 2);
    // parpadeo de invencibilidad
    if (g.invulnT <= 0 || Math.floor(g.t * 14) % 2 === 0) {
      let state: "idle" | "runA" | "runB" | "jump" = "idle";
      if (!h.onGround) state = "jump";
      else if (h.moving) state = Math.floor(h.animT * 6) % 2 === 0 ? "runA" : "runB";
      drawPixels(ctx, heroSprite(state), sx - HERO_W / 2, sy - HERO_H, HERO_PALETTE, h.face < 0);
    }
  }

  /* ---- partículas ---- */
  for (const pt of g.parts) {
    const sx = pt.x - cam;
    const alpha = Math.max(0, pt.life / pt.max);
    if (pt.text) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText(pt.text, sx, pt.y);
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.fillRect(sx, pt.y, pt.size, pt.size);
      ctx.globalAlpha = 1;
    }
  }

  drawForeground(ctx, cam, 1.18 * px);

  /* ---- overlay de muerte ---- */
  if (g.deadT > 0) {
    ctx.fillStyle = "rgba(7,9,18,0.55)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#ff5d73";
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("¡AUCH!", VIEW_W / 2, VIEW_H / 2 - 8);
    ctx.fillStyle = "#e9ecff";
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText("reapareciendo...", VIEW_W / 2, VIEW_H / 2 + 14);
  }

  if (g.won && g.deadT <= 0) {
    ctx.fillStyle = "rgba(7,9,18,0.28)";
    ctx.fillRect(0, 0, VIEW_W, 26);
    ctx.fillStyle = "#4ade80";
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("¡NIVEL SUPERADO! pulsa R para reiniciar", VIEW_W / 2, 16);
  }
}

/* ============================================================
   SONIDO 8-BIT — puro WebAudio, sin archivos de audio.
   Un oscilador + una envolvente = un "bip" retro.
   ============================================================ */

let actx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) { muted = m; }

export function ensureAudio() {
  try {
    if (!actx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      actx = new AC();
    }
    if (actx.state === "suspended") void actx.resume();
  } catch {
    /* navegador sin audio: no pasa nada */
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.055, slideTo?: number, delay = 0) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(actx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  jump: () => tone(280, 0.14, "square", 0.05, 620),
  coin: () => { tone(880, 0.07, "square", 0.05); tone(1320, 0.16, "square", 0.05, undefined, 0.07); },
  hurt: () => tone(200, 0.28, "sawtooth", 0.06, 60),
  stomp: () => tone(240, 0.12, "triangle", 0.08, 90),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "square", 0.05, undefined, i * 0.09)),
};
