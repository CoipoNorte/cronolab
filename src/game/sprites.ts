/* ============================================================
   SPRITES — los dibujos del juego son literalmente DATOS.
   Cada fila es un string y cada letra un color de la paleta.
   Un '.' es un píxel transparente. ¡Así se hacía en los 90!
   ============================================================ */

export type PixelMap = string[];

/** Dibuja un mapa de píxeles en el canvas. 1 letra = 1 píxel. */
export function drawPixels(
  ctx: CanvasRenderingContext2D,
  map: PixelMap,
  x: number,
  y: number,
  palette: Record<string, string>,
  flip = false,
) {
  const w = map[0].length;
  for (let row = 0; row < map.length; row++) {
    const line = map[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === ".") continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      // si flip=true dibujamos la columna espejada (para mirar a la izquierda)
      const px = flip ? w - 1 - col : col;
      ctx.fillRect(x + px, y + row, 1, 1);
    }
  }
}

/* ---------------- HÉROE (16 x 18) ---------------- */
/* Cuerpo compartido + piernas intercambiables = animación.   */

const HERO_TOP: PixelMap = [
  "......HHHH......",
  "....HHHHHHHH....",
  "..HH.HHHHHH.HH..",
  "..HHHHSSSSHHHH..",
  "..HHSSSSSSSSHH..",
  "..HSSWSSSSWSSH..",
  "....SSSSSSSS....",
  "...STTTTTTTTS...",
  "..STTTTTTTTTTS..",
  "..STTTTBBTTTTS..",
];

const LEGS_IDLE: PixelMap = [
  "....PPPPPPPP....",
  "....PPPPPPPP....",
  "....PPP..PPP....",
  "....PPP..PPP....",
  "....PP....PP....",
  "....PP....PP....",
  "...OOO....OOO...",
  "...OOOO..OOOO...",
];

const LEGS_RUN_A: PixelMap = [
  "....PPPPPPPP....",
  "...PPPPPPPPP....",
  "..PPPP...PPPP...",
  "..PPP.....PPPP..",
  ".PPP.......PPP..",
  ".PP.........PP..",
  "OOOO........OOO.",
  "OOOO........OOO.",
];

const LEGS_RUN_B: PixelMap = [
  "....PPPPPPPP....",
  "....PPPPPPPPP...",
  "...PPPP...PPPP..",
  "..PPPP.....PPP..",
  "..PPP.......PPP.",
  "..PP.........PP.",
  ".OOO........OOOO",
  ".OOO........OOOO",
];

const LEGS_JUMP: PixelMap = [
  "....PPPPPPPP....",
  "...PPPPPPPPPP...",
  "..PPPP....PPPP..",
  "..OOO......OOO..",
  "..OOOO....OOOO..",
  "................",
  "................",
  "................",
];

/** Devuelve el sprite completo del héroe según su estado de animación. */
export function heroSprite(state: "idle" | "runA" | "runB" | "jump"): PixelMap {
  const legs =
    state === "runA" ? LEGS_RUN_A :
    state === "runB" ? LEGS_RUN_B :
    state === "jump" ? LEGS_JUMP : LEGS_IDLE;
  return HERO_TOP.concat(legs);
}

export const HERO_PALETTE: Record<string, string> = {
  H: "#ff7847", // pelo naranja
  S: "#ffcf9e", // piel
  W: "#ffffff", // ojos
  T: "#1fae9e", // túnica
  B: "#7a4a2b", // cinturón
  P: "#3d4a7a", // pantalón
  O: "#5a3b2a", // botas
};

export const HERO_W = 16;
export const HERO_H = 18;

/* ---------------- SLIME / ENEMIGO (14 x 10) ---------------- */

export const SLIME_A: PixelMap = [
  ".....GGGG.....",
  "...GGGGGGGG...",
  "..GGGGGGGGGG..",
  ".GGWKGGGGWKG..",
  ".GGGGGGGGGGg..",
  "GGGGGGGGGGGGGG",
  "GGgGGGGGGGGGG.",
  "GgGGGGGGGGGGg.",
  ".gggggggggggg.",
  "..gggggggggg..",
];

export const SLIME_B: PixelMap = [
  "..............",
  "..............",
  "..GGGGGGGGGG..",
  ".GGGGGGGGGGGG.",
  "GGWKGGGGGGWKGG",
  "GGGGGGGGGGGGGG",
  "GGGgGGGGGGgGGG",
  "GGGGGGGGGGGGGG",
  ".gggggggggggg.",
  "..gggggggggg..",
];

export const SLIME_PALETTE: Record<string, string> = {
  G: "#58c94f",
  g: "#3f9e3c",
  W: "#ffffff",
  K: "#1d2b23",
};

export const SLIME_W = 14;
export const SLIME_H = 10;

/* ============================================================
   NPCs y OBJETOS — para la escena de diálogos y el editor.
   Misma técnica: filas de 14/16 caracteres + una paleta.
   ============================================================ */

/* ---------------- ANCIANA (14 x 18) ---------------- */
export const ELDER_MAP: PixelMap = [
  "....HHHHHH....",
  "...HHHHHHHH...",
  "..HHHHHHHHHH..",
  "..HHHSSSSHHH..",
  "..HHSWSSWSHH..",
  "...SSSNSSSS...",
  "....SSSSSS....",
  "..RRRRRRRRRR..",
  ".RRRRRRRRRRRR.",
  ".SRRRRBBRRRRS.",
  ".SRRRRRRRRRRS.",
  "..RRRRRRRRRR..",
  ".RRRRRRRRRRRR.",
  ".RRRRRRRRRRRR.",
  "..OOO....OOO..",
  ".OOOO....OOOO.",
  "..............",
  "..............",
];

export const ELDER_PALETTE: Record<string, string> = {
  H: "#7c6bff", // capucha violeta
  S: "#ffcf9e",
  W: "#ffffff",
  N: "#b06a4a", // boca
  R: "#8f7fff", // túnica
  B: "#ffd23f", // cinto
  O: "#3a2a20",
};

/* ---------------- SOLDADO (14 x 18) ---------------- */
export const KNIGHT_MAP: PixelMap = [
  ".....PPPP.....",
  "....PPPPPP....",
  "....MMMMMM....",
  "...MMMMMMMM...",
  "...MVVVVVVM...",
  "...MMMMMMMM...",
  "....MMMMMM....",
  "...AAAAAAAA...",
  "..AAAAAAAAAA..",
  "..SAAAAAAAAS..",
  "..SAABBBBAAS..",
  "..SAAAAAAAAS..",
  "...AAAAAAAA...",
  "...mmmmmmmm...",
  "....mmmmmm....",
  "...mmm..mmm...",
  "..OOO....OOO..",
  ".OOOO....OOOO.",
];

export const KNIGHT_PALETTE: Record<string, string> = {
  P: "#ff5470", // pluma del yelmo
  M: "#b9c8dc", // casco
  V: "#1d2436", // visera
  A: "#9fb7d8", // armadura
  m: "#6d84a4", // piernas
  S: "#ffcf9e",
  B: "#7a4a2b",
  O: "#3a2a20",
};

/* ---------------- COFRE (16 x 14): cerrado y abierto ---------------- */
export const CHEST_CLOSED: PixelMap = [
  "................",
  "..KKKKKKKKKKKK..",
  ".KCCCCCCCCCCCCK.",
  ".KCCKKCCCCKKCCK.",
  ".KYYYYYYYYYYYYK.",
  ".KYYYYKKKKYYYYK.",
  ".KCCCCCCCCCCCCK.",
  ".KcCCCCCCCCCCcK.",
  ".KcCCCCKKCCCCcK.",
  ".KcCCCCKKCCCCcK.",
  ".KCCCCCCCCCCCCK.",
  "..KKKKKKKKKKKK..",
  "................",
  "................",
];

export const CHEST_OPEN: PixelMap = [
  "..KKKKKKKKKKKK..",
  ".KCCCCCCCCCCCCK.",
  "..KKKKKKKKKKKK..",
  ".KXXXXXXXXXXXXK.",
  ".KXWWXXXXXXWWXK.",
  ".KXXXXXWWXXXXXK.",
  ".KCCCCCCCCCCCCK.",
  ".KcCCCCCCCCCCcK.",
  ".KcCCCCKKCCCCcK.",
  ".KcCCCCKKCCCCcK.",
  ".KCCCCCCCCCCCCK.",
  "..KKKKKKKKKKKK..",
  "................",
  "................",
];

export const CHEST_PALETTE: Record<string, string> = {
  K: "#3a2314", // contorno
  C: "#8a5a3b", // madera
  c: "#6f4429", // sombra
  Y: "#ffd23f", // herrajes
  X: "#241408", // interior oscuro
  W: "#fff3a3", // brillo del tesoro
};

/* ---------------- CARTEL (12 x 16) ---------------- */
export const SIGN_MAP: PixelMap = [
  "..KKKKKKKK..",
  ".KCCCCCCCCK.",
  ".KCDDDDDDCK.",
  ".KCCCCCCCCK.",
  ".KCDDDDDDCK.",
  ".KCCCCCCCCK.",
  "..KKKKKKKK..",
  ".....CC.....",
  ".....CC.....",
  ".....CC.....",
  ".....CC.....",
  ".....CC.....",
  "....CCCC....",
  "............",
  "............",
  "............",
];

export const SIGN_PALETTE: Record<string, string> = {
  K: "#3a2314",
  C: "#8a5a3b",
  D: "#3a2314", // "texto" grabado
};

/* ---------------- ÁRBOL (16 x 16) para el editor ---------------- */
export const TREE_MAP: PixelMap = [
  "......GGGG......",
  "....GGGGGGGG....",
  "...GGGGgGGGGG...",
  "..GGGGGGGGGGGG..",
  "..GGGgGGGGgGGG..",
  "..GGGGGGGGGGGG..",
  "...GGGGGGGGGG...",
  "....GGGGGGGG....",
  "......CCCC......",
  "......CCCC......",
  "......CCCC......",
  ".....CCCCCC.....",
  "..gggggggggggg..",
  "................",
  "................",
  "................",
];

export const TREE_PALETTE: Record<string, string> = {
  G: "#3e9c47",
  g: "#256334",
  C: "#6b4226",
};

/* ---------------- POCIÓN (16 x 16) para el editor ---------------- */
export const POTION_MAP: PixelMap = [
  "......CCCC......",
  "......CCCC......",
  ".....LLLLLL.....",
  ".....LWLLLL.....",
  "....LLLLLLLL....",
  "...LLMMMMMMLL...",
  "..LLMMMMMMMMLL..",
  "..LMMMMMMMMMML..",
  "..LMMWMMMMMMML..",
  "..LMMMMMMMMMML..",
  "..LLMMMMMMMMLL..",
  "...LLMMMMMMLL...",
  "....LLLLLLLL....",
  ".....LLLLLL.....",
  "..gggggggggggg..",
  "................",
];

export const POTION_PALETTE: Record<string, string> = {
  C: "#6b4226",
  L: "#cfe8ff",
  M: "#ff7ad9",
  W: "#ffffff",
  g: "#256334",
};
