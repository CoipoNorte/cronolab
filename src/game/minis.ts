/* ============================================================
   MINIS — tres juegos pequeños construidos con las MISMAS
   ideas del juego grande. Todos comparten esta interfaz:

     update(dt, input)  → mueve el mundo
     draw(ctx)          → pinta el mundo
     hud()              → datos para la interfaz React

   Ese contrato ES la arquitectura de casi cualquier motor.
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
  ELDER_MAP,
  ELDER_PALETTE,
  KNIGHT_MAP,
  KNIGHT_PALETTE,
  CHEST_CLOSED,
  CHEST_OPEN,
  CHEST_PALETTE,
  SIGN_MAP,
  SIGN_PALETTE,
} from "./sprites";
import { sfx } from "./engine";

export interface MiniInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  interact: boolean;
  reset: boolean;
}
export type Hud = Record<string, string | number | boolean>;
export interface Mini { update(dt: number, inp: MiniInput): void; draw(ctx: CanvasRenderingContext2D): void; hud(): Hud }

export const MW = 480;
export const MH = 270;
export const GY = 216;

type Ctx = CanvasRenderingContext2D;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------------- pintores compartidos ---------------- */

function paintSky(ctx: Ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, MH);
  grad.addColorStop(0, "#4f8fd6");
  grad.addColorStop(0.55, "#8fcdf0");
  grad.addColorStop(1, "#dff6fb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, MW, MH);
}

function paintNature(ctx: Ctx, camX: number) {
  // colinas (0.35) + árboles pixel (0.55): mini parallax
  let spacing = 96;
  let off = camX * 0.35;
  for (let i = Math.floor(off / spacing) - 2; ; i++) {
    const sx = i * spacing - off;
    if (sx > MW + 120) break;
    ctx.fillStyle = hash(i * 6) > 0.5 ? "#5da863" : "#4c9455";
    ctx.beginPath();
    ctx.arc(sx, 214, 54 + hash(i * 4) * 42, Math.PI, 0);
    ctx.fill();
  }
  spacing = 92;
  off = camX * 0.55;
  for (let i = Math.floor(off / spacing) - 1; ; i++) {
    const sx = i * spacing - off + hash(i * 17) * 26;
    if (sx > MW + 40) break;
    const h = hash(i * 23);
    if (h < 0.3) continue;
    const sc = 0.8 + h * 0.5;
    ctx.fillStyle = "#6b4226";
    ctx.fillRect(sx - 2 * sc, GY - 4 - 11 * sc, 4 * sc, 11 * sc);
    ctx.fillStyle = "#2e7d43";
    const rows = [10, 16, 18, 14];
    rows.forEach((w, r) => ctx.fillRect(sx - (w * sc) / 2, GY - 4 - 11 * sc - (rows.length - r) * 4 * sc, w * sc, 4 * sc));
    ctx.fillStyle = "#45a05a";
    ctx.fillRect(sx - 4 * sc, GY - 4 - 25 * sc, 3 * sc, 3 * sc);
  }
}

function paintGround(ctx: Ctx, camX: number) {
  ctx.fillStyle = "#8a5a3b";
  ctx.fillRect(0, GY + 6, MW, MH - GY - 6);
  ctx.fillStyle = "#4fae52";
  ctx.fillRect(0, GY, MW, 6);
  ctx.fillStyle = "#7ed37a";
  ctx.fillRect(0, GY, MW, 1);
  const start = Math.floor(camX / 16) * 16;
  for (let wx = start; wx < camX + MW + 16; wx += 16) {
    const sx = wx - camX;
    const hh = hash(wx / 16);
    ctx.fillStyle = "#6f4429";
    ctx.fillRect(sx + 2 + Math.floor(hh * 8), GY + 10 + Math.floor(hh * 10), 2, 2);
    if (hh < 0.18) {
      ctx.fillStyle = "#3e9c47";
      ctx.fillRect(sx + 5, GY - 4, 1, 4);
      ctx.fillRect(sx + 8, GY - 3, 1, 3);
    } else if (hh > 0.93) {
      ctx.fillStyle = "#3e9c47";
      ctx.fillRect(sx + 7, GY - 4, 1, 4);
      ctx.fillStyle = "#ff7ad9";
      ctx.fillRect(sx + 6, GY - 6, 3, 3);
    }
  }
}

/* ---------------- partículas ---------------- */
interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; text?: string }

function puff(parts: P[], x: number, y: number, colors: string[], n: number, pow = 70) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (0.3 + Math.random() * 0.7) * pow;
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - pow * 0.4, life: 0.5 + Math.random() * 0.35, max: 0.85, color: colors[i % colors.length], size: 1 + Math.floor(Math.random() * 2) });
  }
}
function floatText(parts: P[], x: number, y: number, text: string, color: string) {
  parts.push({ x, y, vx: 0, vy: -24, life: 1.1, max: 1.1, color, size: 0, text });
}
function stepParts(parts: P[], dt: number) {
  for (const p of parts) {
    if (!p.text) p.vy += 200 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
  }
  return parts.filter((p) => p.life > 0);
}
function drawParts(ctx: Ctx, parts: P[], camX: number) {
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
}

/* ---------------- héroe compartido ---------------- */
interface MiniHero { x: number; y: number; vx: number; vy: number; face: 1 | -1; onGround: boolean; animT: number; moving: boolean }

function drawHero(ctx: Ctx, h: MiniHero, camX: number) {
  const sx = Math.round(h.x - camX), sy = Math.round(h.y);
  const stretch = 1 - Math.min(1, Math.abs(h.vy) / 1400) * 0.5;
  ctx.fillStyle = "rgba(20,50,20,0.28)";
  ctx.fillRect(sx - 7 * stretch, GY + 2, 14 * stretch, 2);
  let state: "idle" | "runA" | "runB" | "jump" = "idle";
  if (!h.onGround) state = "jump";
  else if (h.moving) state = Math.floor(h.animT * 6) % 2 === 0 ? "runA" : "runB";
  drawPixels(ctx, heroSprite(state), sx - HERO_W / 2, sy - HERO_H, HERO_PALETTE, h.face < 0);
}

function stepHero(h: MiniHero, dt: number, inp: MiniInput, speed: number, jumpPow: number, gravity: number, buf: { t: number }): boolean {
  let jumped = false;
  if (inp.jump && buf.t <= 0) buf.t = 0.12;
  if (buf.t > 0) buf.t -= dt;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  h.vx += (dir * speed - h.vx) * Math.min(1, dt * 12);
  if (dir !== 0) h.face = dir as 1 | -1;
  h.moving = Math.abs(h.vx) > 14;
  if (buf.t > 0 && h.onGround) { h.vy = -jumpPow; h.onGround = false; buf.t = 0; jumped = true; }
  h.vy = Math.min(h.vy + gravity * dt, 520);
  h.x += h.vx * dt;
  h.animT += dt * (h.moving ? Math.abs(h.vx) / 22 + 4 : 2.5);
  return jumped;
}

/* ============================================================
   MINI 1 — PLATAFORMAS: el nivel es un array de strings.
   '#' bloque sólido · '=' ladrillo · 'o' moneda · 'F' meta
   ============================================================ */

const T = 16;
export const LEVEL = [
  "........................................................",
  "........................................................",
  "........................................................",
  "........................................................",
  "........................................................",
  "........................................................",
  ".............................===........................",
  ".........................ooo............................",
  ".........................===............................",
  "...................oo..........ooo......................",
  "..................====........=====.....................",
  ".......ooo.......oo.....................................",
  "....................................................F...",
  "########..###############################...############",
  "########..###############################...############",
  "########..###############################...############",
  "########..###############################...############",
];

const ALLOWED_TILES = new Set([".", "#", "=", "o", "F"]);
/** sanea un nivel externo (del editor): caracteres válidos y filas iguales */
function normalizeLevel(rows: string[]): string[] {
  const w = Math.max(24, ...rows.map((r) => r.length));
  return rows.map((r) =>
    Array.from({ length: w }, (_, i) => (r[i] && ALLOWED_TILES.has(r[i]) ? r[i] : ".")).join(""),
  );
}

export function createPlatformer(customLevel?: string[]): Mini {
  const lvl = normalizeLevel(customLevel ?? LEVEL);
  const COLS = lvl[0].length;
  const ROWS = lvl.length;
  let map: string[][];
  let h: MiniHero;
  let camX = 0, won = false, coins = 0, total = 0;
  let parts: P[] = [];
  const buf = { t: 0 };
  const flagCol = lvl.reduce((found, row) => (row.includes("F") ? row.indexOf("F") : found), -1);

  const reset = () => {
    map = lvl.map((r) => r.split(""));
    total = 0;
    map.forEach((row) => row.forEach((c) => { if (c === "o") total++; }));
    h = { x: 24, y: 40, vx: 0, vy: 0, face: 1, onGround: false, animT: 0, moving: false };
    camX = 0; won = false; coins = 0; parts = [];
  };
  reset();

  const solid = (c: number, r: number) => {
    if (c < 0 || c >= COLS) return false;
    if (r < 0 || r >= ROWS) return false;
    return map[r][c] === "#" || map[r][c] === "=";
  };

  return {
    update(dt, inp) {
      if (inp.reset) { reset(); return; }
      if (stepHero(h, dt, inp, 150, 360, 1000, buf)) sfx.jump();

      // mover en X y resolver contra tiles
      const nextX = h.x;
      const edge = nextX + (h.vx > 0 ? 5 : -5);
      const col = Math.floor(edge / T);
      const rTop = Math.floor((h.y - HERO_H + 2) / T);
      const rBot = Math.floor((h.y - 1) / T);
      if (h.vx !== 0 && (solid(col, rTop) || solid(col, rBot))) {
        h.x = h.vx > 0 ? col * T - 5.01 : (col + 1) * T + 5.01;
        h.vx = 0;
      }

      // mover en Y y resolver contra tiles
      let nextY = h.y + h.vy * dt;
      const cL = Math.floor((h.x - 4) / T), cR = Math.floor((h.x + 4) / T);
      if (h.vy >= 0) {
        const row = Math.floor(nextY / T);
        if (solid(cL, row) || solid(cR, row)) { nextY = row * T; h.vy = 0; h.onGround = true; }
        else h.onGround = false;
      } else {
        const row = Math.floor((nextY - HERO_H) / T);
        if (solid(cL, row) || solid(cR, row)) { nextY = (row + 1) * T + HERO_H; h.vy = 0; }
      }
      h.y = nextY;
      h.x = clamp(h.x, 6, COLS * T - 6);

      // moneda en el tile del centro
      const cMid = Math.floor(h.x / T), rMid = Math.floor((h.y - 9) / T);
      if (map[rMid] && map[rMid][cMid] === "o") {
        map[rMid][cMid] = ".";
        coins++;
        puff(parts, cMid * T + 8, rMid * T + 8, ["#ffd23f", "#fff3a3"], 7, 55);
        floatText(parts, cMid * T + 8, rMid * T - 4, "+1", "#ffd23f");
        sfx.coin();
      }

      // caída al vacío → reaparecer
      if (h.y > MH + 40) {
        h.x = 24; h.y = 40; h.vx = 0; h.vy = 0;
        floatText(parts, 90, 150, "¡cuidado!", "#ff5d73");
        sfx.hurt();
      }

      // meta
      if (flagCol >= 0 && !won && Math.floor(h.x / T) >= flagCol) {
        won = true;
        puff(parts, flagCol * T, GY - 40, ["#ffd23f", "#4ade80", "#7c6bff"], 40, 120);
        floatText(parts, flagCol * T - 10, GY - 60, "¡META!", "#4ade80");
        sfx.win();
      }

      const target = clamp(h.x - 190, 0, COLS * T - MW);
      camX += (target - camX) * (1 - Math.exp(-6 * dt));
      parts = stepParts(parts, dt);
    },

    draw(ctx) {
      paintSky(ctx);
      paintNature(ctx, camX);
      // tiles visibles
      const c0 = Math.max(0, Math.floor(camX / T));
      const c1 = Math.min(COLS - 1, Math.floor((camX + MW) / T) + 1);
      for (let r = 0; r < ROWS; r++) {
        for (let c = c0; c <= c1; c++) {
          const ch = map[r][c];
          const sx = c * T - Math.round(camX), sy = r * T;
          if (ch === "#") {
            ctx.fillStyle = "#8a5a3b";
            ctx.fillRect(sx, sy, T, T);
            const hh = hash(c * 31 + r * 7);
            ctx.fillStyle = "#6f4429";
            ctx.fillRect(sx + 2 + Math.floor(hh * 9), sy + 6 + Math.floor(hh * 7), 2, 2);
            ctx.fillStyle = "#9c6a45";
            ctx.fillRect(sx + 10 - Math.floor(hh * 5), sy + 3 + Math.floor(hh * 9), 2, 2);
            if (!solid(c, r - 1)) {
              ctx.fillStyle = "#4fae52";
              ctx.fillRect(sx, sy, T, 5);
              ctx.fillStyle = "#7ed37a";
              ctx.fillRect(sx, sy, T, 1);
            }
          } else if (ch === "=") {
            ctx.fillStyle = "#a55d3f";
            ctx.fillRect(sx, sy, T, T);
            ctx.fillStyle = "#7c3f2a";
            ctx.fillRect(sx, sy + 7, T, 2);
            ctx.fillRect(sx, sy + 15, T, 1);
            ctx.fillRect(sx + (r % 2 === 0 ? 7 : 3), sy, 1, 7);
            ctx.fillRect(sx + (r % 2 === 0 ? 3 : 10), sy + 8, 1, 8);
          } else if (ch === "o") {
            const t2 = performance.now() / 1000;
            const spin = Math.abs(Math.sin(t2 * 2.8 + c * 0.7));
            const widths = [2, 4, 6, 7, 7, 7, 7, 6, 4, 2];
            widths.forEach((w, rr) => {
              const ww = Math.max(1, Math.round(w * spin));
              ctx.fillStyle = "#ffd23f";
              ctx.fillRect(sx + 8 - ww / 2, sy + 3 + rr, ww, 1);
            });
          } else if (ch === "F") {
            ctx.fillStyle = "#7a4a2b";
            ctx.fillRect(sx + 7, sy - 30, 2, 46);
            const wave = Math.round(Math.sin(performance.now() / 200) * 2);
            ctx.fillStyle = won ? "#4ade80" : "#ff5470";
            ctx.fillRect(sx + 9, sy - 29, 12, 4);
            ctx.fillRect(sx + 9, sy - 25 + wave * 0.5, 8, 4);
            ctx.fillRect(sx + 9, sy - 21 + wave, 5, 4);
          }
        }
      }
      drawHero(ctx, h, camX);
      drawParts(ctx, parts, camX);
      if (won) {
        ctx.fillStyle = "rgba(7,9,18,0.35)";
        ctx.fillRect(0, 0, MW, 24);
        ctx.fillStyle = "#4ade80";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText("¡NIVEL COMPLETO!  R = reiniciar", MW / 2, 15);
      }
    },

    hud() {
      return { monedas: `${coins}/${total}`, meta: won ? "¡conseguida!" : "pendiente" };
    },
  };
}

/* ============================================================
   MINI 2 — DIÁLOGOS, NPCs y EVENTOS.
   Una máquina de estados mínima: "walk" | "talk".
   ============================================================ */

interface Talk {
  name: string;
  pages: string[];
  page: number;
  shown: number;
  choice?: { q: string; opts: [string, string]; yes: string[]; no: string[] };
  phase: "text" | "choice";
  choiceIdx: number;
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [""];
  for (const w of words) {
    const last = lines.length - 1;
    if ((lines[last] + " " + w).trim().length > maxChars) lines.push(w);
    else lines[last] = (lines[last] + " " + w).trim();
  }
  return lines;
}

const ZONE_MIN = 660, ZONE_MAX = 716;

export function createDialogue(): Mini {
  const WORLD = 780;
  let h: MiniHero;
  let camX = 0, t = 0, talk: Talk | null = null;
  let chestOpen = false, hasPluma = false, items: string[] = [], zoneFired = false;
  let royLine = 0;
  let parts: P[] = [];
  const buf = { t: 0 };

  const reset = () => {
    h = { x: 30, y: GY, vx: 0, vy: 0, face: 1, onGround: true, animT: 0, moving: false };
    camX = 0; talk = null; chestOpen = false; hasPluma = false; items = []; zoneFired = false; royLine = 0; parts = [];
  };
  reset();

  const startTalk = (name: string, pages: string[], choice?: Talk["choice"]) => {
    talk = { name, pages, page: 0, shown: 0, choice, phase: "text", choiceIdx: 0 };
    h.vx = 0; h.moving = false;
  };

  const ents = [
    { kind: "sign", x: 84, name: "CARTEL" },
    { kind: "elder", x: 210, name: "ANCIANA NOVA" },
    { kind: "knight", x: 430, name: "SOLDADO ROY" },
    { kind: "chest", x: 590, name: "COFRE" },
  ];

  const interactWith = (kind: string) => {
    if (kind === "sign") {
      startTalk("CARTEL", ['"PRADERA DEL BUCLE — 200 pasos". Alguien grabó esto con prisa.', "Debajo, con otra letra: «los slimes piden abrazos. NO les hagas caso»."]);
    } else if (kind === "elder") {
      if (!hasPluma) {
        startTalk(
          "ANCIANA NOVA",
          ["Ah, otro viajero de píxeles. Escucha: en este mundo TODO es un dato. Tú, yo, ese cofre de allá…", "Puedo darte algo que te hará más liviano que una pluma."],
          {
            q: "¿Aceptas la PLUMA ANCESTRAL?",
            opts: ["¡Obvio!", "Otro día"],
            yes: ["Sabia elección. *entrega 1 PLUMA ANCESTRAL*. Con ella podrás... bueno, presumir de inventario.", "PD: los mejores objetos de los JRPG no hacen nada. Es Tradición."],
            no: ["Vuelve cuando quieras, viajero. La pluma no tiene prisa."],
          },
        );
      } else {
        startTalk("ANCIANA NOVA", ["La pluma te queda bien. Brilla con luz de array recién instanciado."]);
      }
    } else if (kind === "knight") {
      const lines = [
        "Dicen que el héroe es solo un array de letras. Yo no me lo creo… pero me tiemblan los píxeles.",
        "El parallax de esta pradera es de primera calidad. Me lo enseñó un tutorial.",
        "Mi armadura pesa 14 píxeles de ancho. Lo sé porque me dibujaron a mano.",
      ];
      startTalk("SOLDADO ROY", [lines[royLine % lines.length]]);
      royLine++;
    } else if (kind === "chest") {
      if (!chestOpen) {
        chestOpen = true;
        items.push("ESPADA DE MADERA");
        puff(parts, 590, GY - 26, ["#ffd23f", "#fff3a3"], 14, 70);
        floatText(parts, 590, GY - 40, "+1 ESPADA", "#ffd23f");
        sfx.coin();
        startTalk("COFRE", ["¡CLAC! Encontraste: ESPADA DE MADERA.", "Ataque +1. Daño emocional +10. La primera espada de todo JRPG decente."]);
      } else {
        startTalk("COFRE", ["Está vacío. Ni siquiera migas. Los cofres no se rellenan solos, viajero."]);
      }
    }
  };

  return {
    update(dt, inp) {
      if (inp.reset) { reset(); return; }
      t += dt;
      h.y += h.vy * dt; // integración vertical (stepHero no la hace)
      if (talk) {
        // modo diálogo: la máquina de escribir + páginas + elecciones
        const pageText = talk.pages[talk.page] ?? "";
        talk.shown = Math.min(talk.shown + dt * 45, pageText.length);
        const finishedPage = talk.shown >= pageText.length;
        if (talk.phase === "choice") {
          if (inp.left) talk.choiceIdx = 0;
          if (inp.right) talk.choiceIdx = 1;
          if (inp.interact || inp.jump) {
            const c = talk.choice!;
            if (talk.choiceIdx === 0) {
              items.push("PLUMA ANCESTRAL");
              hasPluma = true;
              puff(parts, h.x, h.y - 20, ["#7c6bff", "#fff3a3"], 12, 60);
              floatText(parts, h.x, h.y - 34, "+1 PLUMA", "#7c6bff");
              sfx.coin();
              startTalk(talk.name, c.yes);
            } else startTalk(talk.name, c.no);
          }
        } else if (inp.interact || inp.jump) {
          if (!finishedPage) talk.shown = pageText.length;         // 1ª pulsación: completa
          else if (talk.choice && talk.page === talk.pages.length - 1) talk.phase = "choice";
          else if (talk.page < talk.pages.length - 1) { talk.page++; talk.shown = 0; }
          else talk = null;                                        // fin: vuelve el control
        }
        parts = stepParts(parts, dt);
        return;
      }

      // modo caminar
      if (stepHero(h, dt, inp, 140, 330, 950, buf)) sfx.jump();
      if (h.y >= GY) { h.y = GY; h.vy = 0; h.onGround = true; }
      h.x = clamp(h.x, 10, WORLD - 10);

      // zona de evento automática: sin pulsar nada
      if (!zoneFired && h.x > ZONE_MIN && h.x < ZONE_MAX) {
        zoneFired = true;
        startTalk("??? (ZONA DE EVENTO)", ["¡EH! No pulsaste E y aun así estoy hablando. Esto es un EVENTO AUTOMÁTICO.", "Así funcionan las cinemáticas, las trampas y los jefes sorpresa: una caja invisible que detecta tu x."]);
      }

      const near = ents.find((e) => Math.abs(e.x - h.x) < 22);
      if (near && inp.interact) interactWith(near.kind);

      const target = clamp(h.x - 200, 0, WORLD - MW);
      camX += (target - camX) * (1 - Math.exp(-6 * dt));
      parts = stepParts(parts, dt);
    },

    draw(ctx) {
      paintSky(ctx);
      paintNature(ctx, camX);
      paintGround(ctx, camX);
      const cam = camX;

      // zona de evento: pilares brillantes
      for (let i = 0; i < 5; i++) {
        const gx = ZONE_MIN + 8 + i * 11 - cam;
        const a = 0.25 + 0.2 * Math.sin(t * 3 + i);
        ctx.fillStyle = `rgba(124,107,255,${a})`;
        ctx.fillRect(gx, GY - 34 - 6 * Math.sin(t * 2 + i), 3, 34);
      }

      // entidades
      drawPixels(ctx, SIGN_MAP, Math.round(84 - 6 - cam), GY - 16, SIGN_PALETTE);
      const bobE = Math.sin(t * 2.2) * 1;
      drawPixels(ctx, ELDER_MAP, Math.round(210 - 7 - cam), GY - 18 + bobE, ELDER_PALETTE, true);
      const bobK = Math.sin(t * 2.6 + 2) * 1;
      drawPixels(ctx, KNIGHT_MAP, Math.round(430 - 7 - cam), GY - 18 + bobK, KNIGHT_PALETTE);
      drawPixels(ctx, chestOpen ? CHEST_OPEN : CHEST_CLOSED, Math.round(590 - 8 - cam), GY - 14, CHEST_PALETTE);

      drawHero(ctx, h, cam);

      // prompt "E" sobre el interactivo cercano
      if (!talk) {
        const near = ents.find((e) => Math.abs(e.x - h.x) < 22);
        if (near) {
          const px = Math.round(near.x - cam), py = GY - 42 + Math.sin(t * 4) * 2;
          ctx.fillStyle = "#ffd23f";
          ctx.fillRect(px - 6, py - 7, 13, 13);
          ctx.fillStyle = "#131313";
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.textAlign = "center";
          ctx.fillText("E", px + 0.5, py + 3);
        }
      }

      drawParts(ctx, parts, cam);

      // CAJA DE DIÁLOGO
      if (talk) {
        const tk = talk; // alias const: conserva el narrow dentro de los closures
        const bx = 10, by = MH - 84, bw = MW - 20, bh = 72;
        ctx.fillStyle = "rgba(11,14,26,0.94)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#7c6bff";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
        // etiqueta del nombre
        ctx.fillStyle = "#7c6bff";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = "left";
        const nw = tk.name.length * 8 + 14;
        ctx.fillRect(bx + 10, by - 9, nw, 16);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(tk.name, bx + 17, by + 3);

        if (tk.phase === "choice" && tk.choice) {
          const choice = tk.choice;
          const sel = tk.choiceIdx;
          ctx.fillStyle = "#e9ecff";
          ctx.fillText(wrap(choice.q, 46)[0] ?? "", bx + 16, by + 26);
          choice.opts.forEach((o, i) => {
            const oy = by + 42 + i * 14;
            ctx.fillStyle = sel === i ? "#ffd23f" : "#8b93c9";
            ctx.fillText((sel === i ? ">" : " ") + " " + o, bx + 24, oy);
          });
        } else {
          const pageText = talk.pages[talk.page] ?? "";
          const visible = pageText.slice(0, Math.floor(talk.shown));
          wrap(visible, 46).slice(0, 3).forEach((line, i) => {
            ctx.fillStyle = "#e9ecff";
            ctx.fillText(line, bx + 16, by + 24 + i * 13);
          });
          if (talk.shown >= pageText.length && Math.floor(t * 3) % 2 === 0) {
            ctx.fillStyle = "#ffd23f";
            ctx.textAlign = "right";
            ctx.fillText("E ▼", bx + bw - 10, by + bh - 8);
            ctx.textAlign = "left";
          }
        }
      }
    },

    hud() {
      return { inventario: items.length ? items.join(" · ") : "vacío", estado: talk ? "hablando" : "explorando" };
    },
  };
}

/* ============================================================
   MINI 3 — ARENA DE EVASIÓN: combate a lo Mario.
   Array de enemigos + aplastar + combo que se rompe al aterrizar.
   ============================================================ */

interface SlimeF extends MiniHero { hopT: number; dead: number }

export function createArena(): Mini {
  let h: MiniHero;
  let slimes: SlimeF[];
  let parts: P[] = [];
  let t = 0, spawnT = 1.2, score = 0, combo = 0, best = 0, hearts = 3, over = false, invulnT = 0;
  const buf = { t: 0 };

  const reset = () => {
    h = { x: MW / 2, y: GY, vx: 0, vy: 0, face: 1, onGround: true, animT: 0, moving: false };
    slimes = []; parts = []; t = 0; spawnT = 1; score = 0; combo = 0; best = localStorageSafe("get") ?? 0; hearts = 3; over = false; invulnT = 0;
  };

  const localStorageSafe = (mode: "get" | "set", v?: number): number | null => {
    try {
      if (mode === "get") { const s = localStorage.getItem("cronoarena-best"); return s ? Number(s) : 0; }
      localStorage.setItem("cronoarena-best", String(v));
      return null;
    } catch { return null; }
  };
  reset();

  const spawn = () => {
    const side = Math.random() < 0.5 ? -1 : 1;
    slimes.push({
      x: side < 0 ? 16 : MW - 16, y: GY,
      vx: -side * (26 + Math.min(46, t * 0.6)) * (0.8 + Math.random() * 0.4),
      vy: 0, face: side < 0 ? 1 : -1, onGround: true, animT: Math.random() * 2, moving: true,
      hopT: 0.5 + Math.random(), dead: 0,
    });
  };

  return {
    update(dt, inp) {
      if (inp.reset) { reset(); return; }
      if (over) { parts = stepParts(parts, dt); return; }
      t += dt;
      if (invulnT > 0) invulnT -= dt;

      if (stepHero(h, dt, inp, 170, 380, 1050, buf)) sfx.jump();
      h.y += h.vy * dt;
      if (h.y >= GY) {
        if (!h.onGround && combo >= 2) floatText(parts, h.x, GY - 30, `combo x${combo} guardado`, "#5ce1e6");
        if (!h.onGround) combo = 0; // ¡el suelo rompe la cadena!
        h.y = GY; h.vy = 0; h.onGround = true;
      }
      h.x = clamp(h.x, 12, MW - 12);

      // spawn: cada vez más rápido
      spawnT -= dt;
      if (spawnT <= 0 && slimes.filter((s) => !s.dead).length < 6) {
        spawn();
        spawnT = Math.max(0.5, 1.5 - t * 0.018);
      }

      for (const s of slimes) {
        if (s.dead > 0) { s.dead -= dt; continue; }
        s.hopT -= dt;
        s.animT += dt;
        s.vy = Math.min(s.vy + 950 * dt, 520);
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.y >= GY) {
          s.y = GY; s.vy = 0; s.onGround = true;
          // al aterrizar: reorientarse hacia el jugador y volver a saltar
          if (s.hopT <= 0) {
            s.vy = -(170 + Math.random() * 90);
            s.onGround = false;
            const dirTo = h.x > s.x ? 1 : -1;
            s.vx = dirTo * (26 + Math.min(46, t * 0.6)) * (0.8 + Math.random() * 0.4);
            s.hopT = 0.5 + Math.random() * 0.9;
          }
        }
        if (s.x < 10) { s.x = 10; s.vx *= -1; }
        if (s.x > MW - 10) { s.x = MW - 10; s.vx *= -1; }

        // choque con el jugador (AABB aproximada)
        if (Math.abs(s.x - h.x) < 12 && h.y > s.y - 14 && h.y - HERO_H < s.y + 2) {
          const stomping = h.vy > 40 && h.y < s.y - 4;
          if (stomping) {
            s.dead = 0.45;
            combo++;
            score += combo;
            best = Math.max(best, score);
            localStorageSafe("set", best);
            h.vy = -265;
            h.onGround = false;
            puff(parts, s.x, s.y - 5, ["#58c94f", "#bff5b0"], 10, 75);
            floatText(parts, s.x, s.y - 22, `+${combo}  x${combo}`, "#4ade80");
            sfx.stomp();
          } else if (invulnT <= 0) {
            hearts--;
            combo = 0;
            invulnT = 1.2;
            const away = h.x < s.x ? -1 : 1;
            h.vx = 200 * away; h.vy = -190; h.onGround = false;
            puff(parts, h.x, h.y - 10, ["#ff5d73", "#ffffff"], 10, 80);
            sfx.hurt();
            if (hearts <= 0) { over = true; }
          }
        }
      }
      slimes = slimes.filter((s) => s.dead > 0 || true);
      parts = stepParts(parts, dt);
    },

    draw(ctx) {
      paintSky(ctx);
      paintNature(ctx, 0);
      // arena: muros laterales decorativos
      ctx.fillStyle = "#8a5a3b";
      ctx.fillRect(0, GY + 6, MW, MH - GY - 6);
      ctx.fillStyle = "#4fae52";
      ctx.fillRect(0, GY, MW, 6);
      ctx.fillStyle = "#7ed37a";
      ctx.fillRect(0, GY, MW, 1);
      ctx.fillStyle = "#a55d3f";
      ctx.fillRect(0, GY - 60, 8, 60);
      ctx.fillRect(MW - 8, GY - 60, 8, 60);
      ctx.fillStyle = "#7c3f2a";
      for (let y = GY - 52; y < GY - 4; y += 10) { ctx.fillRect(0, y, 8, 2); ctx.fillRect(MW - 8, y, 8, 2); }

      for (const s of slimes) {
        const sx = Math.round(s.x);
        if (s.dead > 0) {
          // aplastado: un panqueque que desaparece
          ctx.globalAlpha = Math.max(0, s.dead / 0.45);
          ctx.fillStyle = "#58c94f";
          ctx.fillRect(sx - 8, GY - 3, 16, 4);
          ctx.globalAlpha = 1;
          continue;
        }
        ctx.fillStyle = "rgba(20,50,20,0.22)";
        ctx.fillRect(sx - 7, GY + 2, 14, 2);
        const map = Math.sin(s.animT * 6) > 0 ? SLIME_A : SLIME_B;
        drawPixels(ctx, map, sx - SLIME_W / 2, Math.round(s.y) - SLIME_H, SLIME_PALETTE, s.vx > 0);
      }

      if (invulnT <= 0 || Math.floor(t * 14) % 2 === 0) drawHero(ctx, h, 0);

      // combo volador junto al héroe
      if (combo >= 2) {
        ctx.fillStyle = "#ffd23f";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText(`x${combo}`, Math.round(h.x), Math.round(h.y) - 26 + Math.sin(t * 8) * 2);
      }

      drawParts(ctx, parts, 0);

      if (over) {
        ctx.fillStyle = "rgba(7,9,18,0.62)";
        ctx.fillRect(0, 0, MW, MH);
        ctx.fillStyle = "#ff5d73";
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText("FIN DEL COMBATE", MW / 2, MH / 2 - 16);
        ctx.fillStyle = "#ffd23f";
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText(`puntos: ${score}   récord: ${best}`, MW / 2, MH / 2 + 8);
        ctx.fillStyle = "#e9ecff";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText("pulsa R para otra ronda", MW / 2, MH / 2 + 30);
      }
    },

    hud() {
      return { puntos: score, combo: combo > 1 ? `x${combo}` : "—", corazones: hearts, récord: best, estado: over ? "fin" : "en combate" };
    },
  };
}
