/* ============================================================
   AVENTURA CENITAL — el esqueleto de un JRPG clásico.

   Incluye:
   - movimiento en 4 direcciones con diagonal normalizada
   - mapa grande con cámara y colisión por tiles
   - misión con 5 estados
   - inventario, recolección y puerta bloqueada
   - cambio de escena (pradera -> ruinas)
   - guardado automático con localStorage
   ============================================================ */

import type { Hud, Mini, MiniInput } from "./minis";
import {
  CHEST_OPEN,
  CHEST_PALETTE,
  ELDER_MAP,
  ELDER_PALETTE,
  HERO_H,
  HERO_PALETTE,
  HERO_W,
  drawPixels,
  heroSprite,
} from "./sprites";
import { sfx } from "./engine";

const VW = 480;
const VH = 270;
const TILE = 16;
const COLS = 54;
const ROWS = 30;
const SAVE_KEY = "cronolab-aventura-save-v1";

type Ctx = CanvasRenderingContext2D;
type Scene = "pradera" | "ruinas";
type Quest = "sin_empezar" | "activa" | "regresar" | "llave" | "reliquia";
type Mode = "roam" | "talk" | "transition" | "ending";

interface SaveData {
  scene: Scene;
  quest: Quest;
  crystals: number[];
  hasKey: boolean;
  relic: boolean;
  x: number;
  y: number;
}

interface Dialogue {
  name: string;
  pages: string[];
  page: number;
  shown: number;
  onEnd?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const CRYSTALS = [
  { x: 16, y: 8 },
  { x: 36, y: 21 },
  { x: 43, y: 13 },
];
const NPC = { x: 10, y: 16 };
const PORTAL = { x: 49, y: 8 };
const CHEST = { x: 43, y: 15 };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function blank(ch = ".") {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ch));
}

function buildPrairie(): string[][] {
  const m = blank(".");
  // marco natural
  for (let x = 0; x < COLS; x++) { m[0][x] = "#"; m[ROWS - 1][x] = "#"; }
  for (let y = 0; y < ROWS; y++) { m[y][0] = "#"; m[y][COLS - 1] = "#"; }

  // lago y puente: el agua bloquea, el puente (=) permite cruzar
  for (let y = 4; y <= 11; y++) {
    for (let x = 22; x <= 31; x++) m[y][x] = "~";
    m[y][26] = "=";
    m[y][27] = "=";
  }

  // sendero hacia el portal
  for (let x = 5; x <= 50; x++) { m[17][x] = ","; m[18][x] = ","; }
  for (let y = 8; y <= 18; y++) { m[y][48] = ","; m[y][49] = ","; }

  // arboledas deterministas, dejando libres los lugares importantes
  for (let y = 2; y < ROWS - 2; y++) {
    for (let x = 2; x < COLS - 2; x++) {
      const protectedSpot =
        (x < 14 && y > 12 && y < 21) ||
        (x > 45 && y > 5 && y < 20) ||
        CRYSTALS.some((c) => Math.abs(c.x - x) < 3 && Math.abs(c.y - y) < 3) ||
        m[y][x] !== ".";
      if (!protectedSpot && hash(x * 41 + y * 97) > 0.91) m[y][x] = "#";
    }
  }
  // pequeños macizos fáciles de reconocer en el mapa
  [[5, 5], [6, 5], [5, 6], [39, 5], [40, 5], [40, 6], [13, 24], [14, 24], [15, 24]].forEach(([x, y]) => { m[y][x] = "#"; });
  return m;
}

function buildRuins(): string[][] {
  const m = blank(":");
  for (let x = 0; x < COLS; x++) { m[0][x] = "#"; m[ROWS - 1][x] = "#"; }
  for (let y = 0; y < ROWS; y++) { m[y][0] = "#"; m[y][COLS - 1] = "#"; }
  // columnas y salas: la ruta central siempre queda abierta
  for (let x = 7; x < 48; x++) {
    if (x === 13 || x === 14 || x === 27 || x === 28 || x === 41 || x === 42) continue;
    m[7][x] = "#";
    m[22][x] = "#";
  }
  for (let y = 8; y < 22; y++) {
    if (y === 14 || y === 15) continue;
    m[y][18] = "#";
    m[y][35] = "#";
  }
  // fosos decorativos y antorchas
  for (let y = 10; y <= 12; y++) for (let x = 5; x <= 11; x++) m[y][x] = "~";
  [[4, 4], [16, 14], [20, 4], [33, 14], [37, 4], [49, 24]].forEach(([x, y]) => { m[y][x] = "!"; });
  return m;
}

const MAPS: Record<Scene, string[][]> = {
  pradera: buildPrairie(),
  ruinas: buildRuins(),
};

function wrap(text: string, width: number): string[] {
  const out = [""];
  for (const word of text.split(" ")) {
    const last = out.length - 1;
    if ((out[last] + " " + word).trim().length > width) out.push(word);
    else out[last] = (out[last] + " " + word).trim();
  }
  return out;
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<SaveData>;
    if ((v.scene !== "pradera" && v.scene !== "ruinas") || typeof v.quest !== "string") return null;
    return {
      scene: v.scene,
      quest: v.quest as Quest,
      crystals: Array.isArray(v.crystals) ? v.crystals.filter((n) => Number.isInteger(n)) : [],
      hasKey: Boolean(v.hasKey),
      relic: Boolean(v.relic),
      x: typeof v.x === "number" ? v.x : 7 * TILE,
      y: typeof v.y === "number" ? v.y : 19 * TILE,
    };
  } catch {
    return null;
  }
}

export function createTopDown(): Mini {
  let scene: Scene;
  let quest: Quest;
  let collected: number[];
  let hasKey: boolean;
  let relic: boolean;
  let x: number;
  let y: number;
  let vx = 0;
  let vy = 0;
  let camX = 0;
  let camY = 0;
  let face: 1 | -1 = 1;
  let animT = 0;
  let mode: Mode = "roam";
  let dialog: Dialogue | null = null;
  let transitionT = 0;
  let transitionTarget: Scene = "pradera";
  let t = 0;
  let toast = "";
  let toastT = 0;
  let saveFlash = 0;
  let particles: Particle[] = [];

  const fresh = () => {
    scene = "pradera";
    quest = "sin_empezar";
    collected = [];
    hasKey = false;
    relic = false;
    x = 7 * TILE;
    y = 19 * TILE;
    vx = 0; vy = 0; camX = 0; camY = 0; mode = "roam"; dialog = null;
    toast = "explora y habla con MIRA"; toastT = 3;
  };

  const saved = loadSave();
  if (saved) {
    scene = saved.scene;
    quest = saved.quest;
    collected = saved.crystals;
    hasKey = saved.hasKey;
    relic = saved.relic;
    x = saved.x;
    y = saved.y;
    toast = "partida recuperada";
    toastT = 2.5;
  } else fresh();

  const save = () => {
    const data: SaveData = { scene, quest, crystals: collected, hasKey, relic, x, y };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* almacenamiento bloqueado */ }
    saveFlash = 1.2;
  };

  const burst = (px: number, py: number, colors: string[], n = 16) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 25 + Math.random() * 65;
      particles.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 22, life: 0.5 + Math.random() * 0.6, color: colors[i % colors.length] });
    }
  };

  const startTalk = (name: string, pages: string[], onEnd?: () => void) => {
    dialog = { name, pages, page: 0, shown: 0, onEnd };
    mode = "talk";
    vx = 0; vy = 0;
  };

  const closeTalk = () => {
    const cb = dialog?.onEnd;
    dialog = null;
    mode = "roam";
    cb?.();
  };

  const talkToMira = () => {
    if (quest === "sin_empezar") {
      startTalk("MIRA · GUARDIANA", [
        "El portal de las ruinas se apagó. Tres CRISTALES VERDES quedaron dispersos por la pradera.",
        "Recógelos y vuelve conmigo. El HUD llevará la cuenta por ti; los héroes modernos tienen ventajas.",
      ], () => {
        quest = "activa";
        toast = "NUEVA MISIÓN · energía perdida";
        toastT = 3;
        save();
      });
    } else if (quest === "activa") {
      startTalk("MIRA · GUARDIANA", [
        `Llevas ${collected.length} de 3 cristales. Busca cerca del lago, al sur del bosque y junto al sendero oriental.`,
      ]);
    } else if (quest === "regresar") {
      startTalk("MIRA · GUARDIANA", [
        "¡Los tres cristales! Su luz todavía recuerda el camino hacia las ruinas.",
        "Toma la LLAVE DEL PORTAL. La puerta violeta está al noreste. Allí dentro duerme una reliquia.",
      ], () => {
        quest = "llave";
        hasKey = true;
        toast = "OBJETO CLAVE · llave del portal";
        toastT = 3;
        burst(NPC.x * TILE, NPC.y * TILE, ["#ffd23f", "#7c6bff", "#ffffff"], 26);
        sfx.win();
        save();
      });
    } else if (quest === "llave") {
      startTalk("MIRA · GUARDIANA", ["La puerta está al noreste. La llave brillará cuando te acerques. No hace falta equiparla: el inventario ya sabe hacer su trabajo."]);
    } else {
      startTalk("MIRA · GUARDIANA", ["Has devuelto la luz a las ruinas. Tu partida quedó guardada; hasta el tiempo necesita memoria."]);
    }
  };

  const isSolid = (px: number, py: number) => {
    const col = Math.floor(px / TILE);
    const row = Math.floor(py / TILE);
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
    const ch = MAPS[scene][row][col];
    return ch === "#" || ch === "~";
  };

  const collides = (px: number, py: number) =>
    isSolid(px - 5, py - 7) || isSolid(px + 5, py - 7) || isSolid(px - 5, py) || isSolid(px + 5, py);

  const nearTile = (a: { x: number; y: number }, dist = 28) => {
    const tx = a.x * TILE + TILE / 2;
    const ty = a.y * TILE + TILE;
    return Math.hypot(x - tx, y - ty) < dist;
  };

  const goTo = (target: Scene) => {
    transitionTarget = target;
    transitionT = 0;
    mode = "transition";
    sfx.jump();
  };

  const interact = () => {
    if (scene === "pradera") {
      if (nearTile(NPC)) { talkToMira(); return; }
      if (nearTile(PORTAL, 34)) {
        if (!hasKey) {
          startTalk("PORTAL SELLADO", ["Tres huecos esperan cristales verdes. Una llave de luz podría abrirlo."]);
        } else goTo("ruinas");
      }
    } else if (nearTile(CHEST, 36)) {
      if (!relic) {
        startTalk("COFRE ANCESTRAL", [
          "Encontraste el RELOJ DE ÁMBAR.",
          "No rebobina el tiempo. Solo te recuerda que aprendiste a programarlo.",
        ], () => {
          relic = true;
          quest = "reliquia";
          mode = "ending";
          toast = "MISIÓN COMPLETA · reloj de ámbar";
          toastT = 5;
          burst(CHEST.x * TILE, CHEST.y * TILE, ["#ffd23f", "#ff7ad9", "#5ce1e6", "#ffffff"], 55);
          sfx.win();
          save();
        });
      } else startTalk("COFRE ANCESTRAL", ["Vacío, pero con una resonancia narrativa excelente."]);
    }
  };

  const objective = () => {
    if (quest === "sin_empezar") return "habla con MIRA";
    if (quest === "activa") return `cristales ${collected.length}/3`;
    if (quest === "regresar") return "vuelve con MIRA";
    if (quest === "llave") return scene === "pradera" ? "abre el portal" : "busca la reliquia";
    return "misión completa";
  };

  return {
    update(dt: number, inp: MiniInput) {
      if (inp.reset) {
        try { localStorage.removeItem(SAVE_KEY); } catch { /* sin acceso */ }
        fresh();
        return;
      }
      t += dt;
      if (toastT > 0) toastT -= dt;
      if (saveFlash > 0) saveFlash -= dt;
      for (const p of particles) {
        p.vy += 150 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      particles = particles.filter((p) => p.life > 0);

      if (mode === "transition") {
        transitionT += dt;
        if (transitionT >= 0.48 && scene !== transitionTarget) {
          scene = transitionTarget;
          if (scene === "ruinas") { x = 5 * TILE; y = 15 * TILE; }
          else { x = 47 * TILE; y = 10 * TILE; }
          camX = clamp(x - VW / 2, 0, COLS * TILE - VW);
          camY = clamp(y - VH / 2, 0, ROWS * TILE - VH);
          save();
        }
        if (transitionT >= 0.96) mode = "roam";
        return;
      }

      if (mode === "talk") {
        const d = dialog;
        if (!d) { mode = "roam"; return; }
        const text = d.pages[d.page] ?? "";
        d.shown = Math.min(text.length, d.shown + dt * 46);
        if (inp.interact || inp.jump) {
          if (d.shown < text.length) d.shown = text.length;
          else if (d.page < d.pages.length - 1) { d.page++; d.shown = 0; sfx.jump(); }
          else closeTalk();
        }
        return;
      }

      if (mode === "ending") {
        // tras el pequeño momento de victoria devolvemos el control
        if (toastT <= 1.4) mode = "roam";
      }

      if (inp.interact || inp.jump) interact();
      if (mode !== "roam") return;

      let dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      let dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      // Normalizar evita que la diagonal sea sqrt(2) veces más rápida.
      const len = Math.hypot(dx, dy);
      if (len > 0) { dx /= len; dy /= len; }
      const speed = 92;
      vx += (dx * speed - vx) * Math.min(1, dt * 14);
      vy += (dy * speed - vy) * Math.min(1, dt * 14);
      if (dx !== 0) face = dx > 0 ? 1 : -1;
      const nx = x + vx * dt;
      if (!collides(nx, y)) x = nx; else vx = 0;
      const ny = y + vy * dt;
      if (!collides(x, ny)) y = ny; else vy = 0;
      animT += dt * (len > 0 ? 9 : 2);

      // Recoger cristales por proximidad mientras la misión está activa.
      if (scene === "pradera" && (quest === "activa" || quest === "regresar")) {
        CRYSTALS.forEach((c, i) => {
          if (!collected.includes(i) && Math.hypot(x - (c.x * TILE + 8), y - (c.y * TILE + 10)) < 15) {
            collected.push(i);
            burst(c.x * TILE + 8, c.y * TILE + 8, ["#4ade80", "#5ce1e6", "#ffffff"], 20);
            toast = `CRISTAL ${collected.length}/3`;
            toastT = 2.2;
            sfx.coin();
            if (collected.length >= 3) quest = "regresar";
            save();
          }
        });
      }

      camX += (clamp(x - VW / 2, 0, COLS * TILE - VW) - camX) * (1 - Math.exp(-7 * dt));
      camY += (clamp(y - VH / 2, 0, ROWS * TILE - VH) - camY) * (1 - Math.exp(-7 * dt));
    },

    draw(ctx: Ctx) {
      const map = MAPS[scene];
      const startCol = Math.max(0, Math.floor(camX / TILE));
      const endCol = Math.min(COLS - 1, Math.ceil((camX + VW) / TILE));
      const startRow = Math.max(0, Math.floor(camY / TILE));
      const endRow = Math.min(ROWS - 1, Math.ceil((camY + VH) / TILE));

      ctx.fillStyle = scene === "pradera" ? "#66af62" : "#24213c";
      ctx.fillRect(0, 0, VW, VH);

      // Capa de suelo y obstáculos del tilemap.
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const ch = map[row][col];
          const sx = Math.floor(col * TILE - camX);
          const sy = Math.floor(row * TILE - camY);
          if (scene === "pradera") {
            ctx.fillStyle = ch === "," ? "#c6a66a" : "#66af62";
            ctx.fillRect(sx, sy, TILE, TILE);
            if (ch === "." && hash(col * 19 + row * 37) > 0.78) {
              ctx.fillStyle = hash(col + row) > 0.5 ? "#438e4b" : "#ffd23f";
              ctx.fillRect(sx + 4 + Math.floor(hash(col) * 7), sy + 5 + Math.floor(hash(row) * 7), 2, 2);
            }
            if (ch === "~") {
              ctx.fillStyle = "#438fc4"; ctx.fillRect(sx, sy, TILE, TILE);
              ctx.fillStyle = "#72c9df";
              ctx.fillRect(sx + ((Math.floor(t * 10) + row * 3) % 9), sy + 5, 6, 1);
            } else if (ch === "=") {
              ctx.fillStyle = "#8a5a3b"; ctx.fillRect(sx, sy, TILE, TILE);
              ctx.fillStyle = "#b98252"; ctx.fillRect(sx, sy + 2, TILE, 2); ctx.fillRect(sx, sy + 11, TILE, 2);
            } else if (ch === "#") {
              ctx.fillStyle = "#6b4226"; ctx.fillRect(sx + 6, sy + 9, 5, 8);
              ctx.fillStyle = "#256334"; ctx.fillRect(sx + 2, sy + 1, 13, 10);
              ctx.fillStyle = "#3e9c47"; ctx.fillRect(sx + 4, sy, 8, 8);
            }
          } else {
            ctx.fillStyle = ch === "~" ? "#100d24" : "#34304d";
            ctx.fillRect(sx, sy, TILE, TILE);
            if (ch !== "~") {
              ctx.fillStyle = "rgba(255,255,255,0.05)";
              ctx.fillRect(sx, sy, TILE, 1); ctx.fillRect(sx, sy, 1, TILE);
            }
            if (ch === "#") {
              ctx.fillStyle = "#201d34"; ctx.fillRect(sx, sy, TILE, TILE);
              ctx.fillStyle = "#51486d"; ctx.fillRect(sx + 2, sy + 2, 12, 4);
              ctx.fillStyle = "#39324f"; ctx.fillRect(sx + 3, sy + 7, 10, 8);
            } else if (ch === "~") {
              ctx.fillStyle = "#7c6bff";
              if ((col + row + Math.floor(t * 3)) % 5 === 0) ctx.fillRect(sx + 7, sy + 7, 2, 2);
            } else if (ch === "!") {
              ctx.fillStyle = "#6b4226"; ctx.fillRect(sx + 7, sy + 7, 2, 9);
              const flick = Math.sin(t * 12 + col) * 2;
              ctx.fillStyle = "#ff7847"; ctx.fillRect(sx + 5, sy + 2 + flick, 6, 6);
              ctx.fillStyle = "#ffd23f"; ctx.fillRect(sx + 7, sy + 3 + flick, 2, 3);
            }
          }
        }
      }

      // Objetos de misión.
      if (scene === "pradera") {
        CRYSTALS.forEach((c, i) => {
          if (collected.includes(i)) return;
          const sx = c.x * TILE + 8 - camX;
          const sy = c.y * TILE + 8 - camY + Math.sin(t * 4 + i) * 2;
          ctx.fillStyle = "rgba(74,222,128,0.20)";
          ctx.fillRect(sx - 7, sy - 7, 14, 14);
          ctx.fillStyle = "#bff5b0"; ctx.fillRect(sx - 2, sy - 6, 4, 3);
          ctx.fillStyle = "#4ade80"; ctx.fillRect(sx - 4, sy - 3, 8, 7);
          ctx.fillStyle = "#248c51"; ctx.fillRect(sx - 2, sy + 4, 4, 3);
        });

        // portal/puerta violeta
        const px = PORTAL.x * TILE - camX;
        const py = PORTAL.y * TILE - camY;
        ctx.fillStyle = "#312654"; ctx.fillRect(px, py - 8, 24, 28);
        ctx.fillStyle = hasKey ? "#7c6bff" : "#51486d"; ctx.fillRect(px + 4, py - 4, 16, 24);
        ctx.fillStyle = hasKey ? `rgba(92,225,230,${0.45 + Math.sin(t * 5) * 0.2})` : "#211d31";
        ctx.fillRect(px + 7, py, 10, 20);
      } else {
        const cx = CHEST.x * TILE - camX;
        const cy = CHEST.y * TILE - camY;
        drawPixels(ctx, CHEST_OPEN, cx, cy, CHEST_PALETTE);
        if (!relic) {
          ctx.fillStyle = `rgba(255,210,63,${0.3 + Math.sin(t * 4) * 0.2})`;
          ctx.fillRect(cx - 6, cy - 12, 28, 30);
        }
      }

      // NPC y héroe.
      if (scene === "pradera") {
        const nx = NPC.x * TILE + 8 - camX;
        const ny = NPC.y * TILE + 14 - camY;
        drawPixels(ctx, ELDER_MAP, Math.round(nx - 7), Math.round(ny - 18), ELDER_PALETTE, false);
      }
      const moving = Math.hypot(vx, vy) > 8;
      const frame = moving ? (Math.floor(animT) % 2 === 0 ? "runA" : "runB") : "idle";
      const heroSX = Math.round(x - camX);
      const heroSY = Math.round(y - camY);
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(heroSX - 7, heroSY + 1, 14, 2);
      drawPixels(ctx, heroSprite(frame), heroSX - HERO_W / 2, heroSY - HERO_H, HERO_PALETTE, face < 0);

      // prompts de interacción
      if (mode === "roam") {
        const prompt =
          (scene === "pradera" && nearTile(NPC)) ||
          (scene === "pradera" && nearTile(PORTAL, 34)) ||
          (scene === "ruinas" && nearTile(CHEST, 36));
        if (prompt) {
          ctx.fillStyle = "#ffd23f"; ctx.fillRect(heroSX - 7, heroSY - 35 + Math.sin(t * 5) * 2, 15, 13);
          ctx.fillStyle = "#131313"; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = "center";
          ctx.fillText("E", heroSX + 0.5, heroSY - 25 + Math.sin(t * 5) * 2);
        }
      }

      for (const p of particles) {
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camX, p.y - camY, 2, 2);
      }
      ctx.globalAlpha = 1;

      // Objetivo y feedback de guardado dentro del propio juego.
      ctx.fillStyle = "rgba(11,14,26,0.78)"; ctx.fillRect(8, VH - 25, 238, 17);
      ctx.fillStyle = "#ffd23f"; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = "left";
      ctx.fillText("MISIÓN", 15, VH - 14);
      ctx.fillStyle = "#e9ecff"; ctx.fillText(objective(), 67, VH - 14);
      if (saveFlash > 0 && Math.floor(t * 8) % 2 === 0) {
        ctx.textAlign = "right"; ctx.fillStyle = "#4ade80"; ctx.fillText("GUARDADO ✓", VW - 12, VH - 14);
      }

      if (toastT > 0) {
        const alpha = Math.min(1, toastT * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(11,14,26,0.90)"; ctx.fillRect(75, 12, VW - 150, 23);
        ctx.strokeStyle = "#ffd23f"; ctx.strokeRect(75.5, 12.5, VW - 151, 22);
        ctx.fillStyle = "#ffd23f"; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = "center";
        ctx.fillText(toast, VW / 2, 27);
        ctx.globalAlpha = 1;
      }

      // diálogo
      if (dialog) {
        const bx = 10, by = VH - 88, bw = VW - 20, bh = 76;
        ctx.fillStyle = "rgba(11,14,26,0.96)"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
        ctx.fillStyle = "#7c6bff"; ctx.fillRect(bx + 10, by - 9, Math.min(220, dialog.name.length * 8 + 15), 16);
        ctx.fillStyle = "#ffffff"; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = "left";
        ctx.fillText(dialog.name, bx + 17, by + 3);
        const visible = dialog.pages[dialog.page].slice(0, Math.floor(dialog.shown));
        wrap(visible, 48).slice(0, 3).forEach((line, i) => ctx.fillText(line, bx + 16, by + 25 + i * 14));
        if (dialog.shown >= dialog.pages[dialog.page].length && Math.floor(t * 3) % 2 === 0) {
          ctx.textAlign = "right"; ctx.fillStyle = "#ffd23f"; ctx.fillText("E ▼", bx + bw - 12, by + bh - 9);
        }
      }

      if (mode === "transition") {
        const alpha = transitionT < 0.48 ? transitionT / 0.48 : 1 - (transitionT - 0.48) / 0.48;
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.fillStyle = "#070912"; ctx.fillRect(0, 0, VW, VH);
        ctx.globalAlpha = 1;
      }
    },

    hud(): Hud {
      return {
        zona: scene === "pradera" ? "Pradera Lumia" : "Ruinas del Reloj",
        cristales: `${collected.length}/3`,
        inventario: [hasKey ? "llave" : "", relic ? "reloj" : ""].filter(Boolean).join(" · ") || "vacío",
        misión: objective(),
      };
    },
  };
}