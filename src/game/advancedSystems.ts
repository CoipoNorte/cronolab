/* ============================================================
   SISTEMAS AVANZADOS — herramientas reutilizables y deterministas.

   1. Generación procedural por semilla con ruta garantizada.
   2. Acciones de entrada reasignables y conflictos detectables.
   3. Inventario con peso, recetas, compra y venta.
   4. Replays deterministas y telemetría de una sesión.

   Todo es TypeScript puro para que el navegador, Unity, Godot o
   una batería de tests puedan alimentar exactamente las mismas reglas.
   ============================================================ */

/* ---------------- PRNG y nivel procedural ---------------- */

export interface RandomSource {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: T[]): T;
}

export function hashSeed(text: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed: number | string): RandomSource {
  let state = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: T[]) => items[Math.floor(next() * items.length)],
  };
}

export type ProcTile = "." | "#" | "=" | "o" | "^" | "E" | "F" | "S";

export interface ProceduralConfig {
  width: number;
  height: number;
  difficulty: 1 | 2 | 3;
  seed: string;
}

export interface ProceduralLevel {
  seed: string;
  width: number;
  height: number;
  tiles: string[];
  surface: number[];
  metrics: {
    coins: number;
    enemies: number;
    spikes: number;
    platforms: number;
    maxStep: number;
    guaranteedPath: boolean;
  };
}

const setChar = (row: string, col: number, char: string) => row.slice(0, col) + char + row.slice(col + 1);

export function generateLevel(config: ProceduralConfig): ProceduralLevel {
  const width = Math.max(24, Math.min(120, Math.floor(config.width)));
  const height = Math.max(12, Math.min(28, Math.floor(config.height)));
  const rng = seededRandom(config.seed);
  const bottom = height - 3;
  const surface = Array.from({ length: width }, () => bottom);
  let maxStep = 0;

  // Paseo aleatorio limitado: cada columna cambia como máximo un tile.
  for (let x = 3; x < width - 4; x++) {
    const previous = surface[x - 1];
    const changeChance = 0.18 + config.difficulty * 0.07;
    let step = rng.next() < changeChance ? rng.pick([-1, 0, 1]) : 0;
    if (x % 9 === 0) step = rng.pick([-1, 0, 1]);
    surface[x] = Math.max(5, Math.min(bottom, previous + step));
    maxStep = Math.max(maxStep, Math.abs(surface[x] - previous));
  }
  surface[0] = surface[1] = surface[2] = bottom;
  surface[width - 1] = surface[width - 2] = surface[width - 3] = surface[width - 4] = bottom;

  let tiles = Array.from({ length: height }, () => ".".repeat(width));
  for (let x = 0; x < width; x++) {
    for (let y = surface[x]; y < height; y++) tiles[y] = setChar(tiles[y], x, "#");
  }
  tiles[bottom - 1] = setChar(tiles[bottom - 1], 1, "S");
  tiles[bottom - 1] = setChar(tiles[bottom - 1], width - 3, "F");

  let coins = 0, enemies = 0, spikes = 0, platforms = 0;
  for (let x = 5; x < width - 5; x += rng.int(3, 6)) {
    const y = surface[x] - 1;
    const roll = rng.next();
    if (roll < 0.5) {
      tiles[y] = setChar(tiles[y], x, "o"); coins++;
      if (rng.next() < 0.35 && x + 1 < width - 4) { tiles[Math.min(y, surface[x + 1] - 1)] = setChar(tiles[Math.min(y, surface[x + 1] - 1)], x + 1, "o"); coins++; }
    } else if (roll < 0.67 && config.difficulty >= 2) {
      tiles[y] = setChar(tiles[y], x, "^"); spikes++;
    } else if (roll < 0.8) {
      tiles[y] = setChar(tiles[y], x, "E"); enemies++;
    } else if (y > 4) {
      const length = rng.int(2, 4);
      const py = Math.max(3, y - rng.int(2, 4));
      for (let p = 0; p < length && x + p < width - 3; p++) tiles[py] = setChar(tiles[py], x + p, "=");
      platforms++;
      if (rng.next() < 0.8) { tiles[py - 1] = setChar(tiles[py - 1], x + Math.floor(length / 2), "o"); coins++; }
    }
  }

  return {
    seed: config.seed, width, height, tiles, surface,
    metrics: { coins, enemies, spikes, platforms, maxStep, guaranteedPath: maxStep <= 1 },
  };
}

export function validateGeneratedLevel(level: ProceduralLevel): string[] {
  const issues: string[] = [];
  if (level.tiles.length !== level.height) issues.push("La altura del tilemap no coincide");
  if (level.tiles.some((row) => row.length !== level.width)) issues.push("Hay filas con ancho incorrecto");
  if (!level.tiles.some((row) => row.includes("S"))) issues.push("Falta el punto inicial S");
  if (!level.tiles.some((row) => row.includes("F"))) issues.push("Falta la meta F");
  if (level.metrics.maxStep > 1) issues.push("Hay un desnivel mayor de un tile en la ruta base");
  return issues;
}

/* ---------------- acciones y reasignación ---------------- */

export type InputAction = "left" | "right" | "jump" | "interact" | "dash" | "pause";
export type BindingMap = Record<InputAction, string[]>;

export const DEFAULT_BINDINGS: BindingMap = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp"],
  interact: ["KeyE"],
  dash: ["ShiftLeft"],
  pause: ["Escape"],
};

export function cloneBindings(bindings: BindingMap = DEFAULT_BINDINGS): BindingMap {
  return Object.fromEntries(Object.entries(bindings).map(([key, value]) => [key, [...value]])) as BindingMap;
}

export function rebindAction(bindings: BindingMap, action: InputAction, code: string, slot = 0): BindingMap {
  const next = cloneBindings(bindings);
  const values = [...next[action]];
  values[slot] = code;
  next[action] = values.filter(Boolean);
  return next;
}

export function bindingConflicts(bindings: BindingMap): Record<string, InputAction[]> {
  const codes: Record<string, InputAction[]> = {};
  (Object.keys(bindings) as InputAction[]).forEach((action) => {
    for (const code of bindings[action]) (codes[code] ??= []).push(action);
  });
  return Object.fromEntries(Object.entries(codes).filter(([, actions]) => actions.length > 1));
}

export function actionsForCodes(bindings: BindingMap, pressed: Iterable<string>): Set<InputAction> {
  const down = new Set(pressed);
  const actions = new Set<InputAction>();
  (Object.keys(bindings) as InputAction[]).forEach((action) => {
    if (bindings[action].some((code) => down.has(code))) actions.add(action);
  });
  return actions;
}

export function serializeBindings(bindings: BindingMap): string { return JSON.stringify(bindings); }

export function parseBindings(text: string): BindingMap {
  const parsed = JSON.parse(text) as Partial<BindingMap>;
  const result = cloneBindings();
  (Object.keys(result) as InputAction[]).forEach((action) => {
    if (Array.isArray(parsed[action])) result[action] = parsed[action]!.filter((value): value is string => typeof value === "string").slice(0, 2);
  });
  return result;
}

/* ---------------- inventario, crafting y economía ---------------- */

export interface ItemDefinition {
  id: string;
  name: string;
  weight: number;
  buy: number;
  sell: number;
  category: "material" | "consumable" | "equipment" | "key";
}

export interface Recipe {
  id: string;
  name: string;
  inputs: Record<string, number>;
  output: { id: string; amount: number };
}

export interface InventoryState {
  items: Record<string, number>;
  coins: number;
  maxWeight: number;
  equipped: string | null;
}

export const ITEMS: Record<string, ItemDefinition> = {
  herb: { id: "herb", name: "Hierba lunar", weight: 0.2, buy: 4, sell: 2, category: "material" },
  crystal: { id: "crystal", name: "Cristal verde", weight: 0.6, buy: 12, sell: 7, category: "material" },
  cloth: { id: "cloth", name: "Tela resistente", weight: 0.4, buy: 8, sell: 4, category: "material" },
  potion: { id: "potion", name: "Poción", weight: 0.5, buy: 18, sell: 9, category: "consumable" },
  boots: { id: "boots", name: "Botas veloces", weight: 2, buy: 55, sell: 25, category: "equipment" },
  portal_key: { id: "portal_key", name: "Llave del portal", weight: 0, buy: 0, sell: 0, category: "key" },
};

export const RECIPES: Recipe[] = [
  { id: "potion", name: "Preparar poción", inputs: { herb: 3, crystal: 1 }, output: { id: "potion", amount: 1 } },
  { id: "boots", name: "Coser botas veloces", inputs: { cloth: 3, crystal: 2 }, output: { id: "boots", amount: 1 } },
  { id: "key", name: "Forjar llave del portal", inputs: { crystal: 5 }, output: { id: "portal_key", amount: 1 } },
];

export const DEFAULT_INVENTORY: InventoryState = {
  items: { herb: 5, crystal: 2, cloth: 2 },
  coins: 40,
  maxWeight: 10,
  equipped: null,
};

export function inventoryWeight(state: InventoryState): number {
  return Object.entries(state.items).reduce((sum, [id, amount]) => sum + (ITEMS[id]?.weight ?? 0) * amount, 0);
}

export function canAddItem(state: InventoryState, id: string, amount = 1): boolean {
  const item = ITEMS[id];
  return Boolean(item) && inventoryWeight(state) + item.weight * amount <= state.maxWeight + 0.0001;
}

export function addItem(state: InventoryState, id: string, amount = 1): InventoryState {
  if (amount <= 0 || !canAddItem(state, id, amount)) return state;
  return { ...state, items: { ...state.items, [id]: (state.items[id] ?? 0) + amount } };
}

export function removeItem(state: InventoryState, id: string, amount = 1): InventoryState {
  if ((state.items[id] ?? 0) < amount || amount <= 0) return state;
  const items = { ...state.items, [id]: state.items[id] - amount };
  if (items[id] <= 0) delete items[id];
  return { ...state, items, equipped: state.equipped === id && !items[id] ? null : state.equipped };
}

export function canCraft(state: InventoryState, recipe: Recipe): boolean {
  const hasInputs = Object.entries(recipe.inputs).every(([id, amount]) => (state.items[id] ?? 0) >= amount);
  if (!hasInputs) return false;
  let after = state;
  Object.entries(recipe.inputs).forEach(([id, amount]) => { after = removeItem(after, id, amount); });
  return canAddItem(after, recipe.output.id, recipe.output.amount);
}

export function craft(state: InventoryState, recipe: Recipe): InventoryState {
  if (!canCraft(state, recipe)) return state;
  let next = state;
  Object.entries(recipe.inputs).forEach(([id, amount]) => { next = removeItem(next, id, amount); });
  return addItem(next, recipe.output.id, recipe.output.amount);
}

export function buyItem(state: InventoryState, id: string, amount = 1): InventoryState {
  const item = ITEMS[id];
  const total = item?.buy * amount;
  if (!item || total <= 0 || state.coins < total || !canAddItem(state, id, amount)) return state;
  return { ...addItem(state, id, amount), coins: state.coins - total };
}

export function sellItem(state: InventoryState, id: string, amount = 1): InventoryState {
  const item = ITEMS[id];
  if (!item || item.sell <= 0 || (state.items[id] ?? 0) < amount) return state;
  const next = removeItem(state, id, amount);
  return { ...next, coins: next.coins + item.sell * amount };
}

export function equipItem(state: InventoryState, id: string): InventoryState {
  if (ITEMS[id]?.category !== "equipment" || (state.items[id] ?? 0) < 1) return state;
  return { ...state, equipped: state.equipped === id ? null : id };
}

/* ---------------- replay y telemetría ---------------- */

export interface ReplayInput { left: boolean; right: boolean; jump: boolean }
export interface ReplayFrame { frame: number; input: ReplayInput }
export interface ReplayData { version: 1; seed: string; fixedDelta: number; frames: ReplayFrame[] }

export interface ReplayActor {
  x: number; y: number; vx: number; vy: number; grounded: boolean; jumps: number;
}

export const createReplayActor = (): ReplayActor => ({ x: 20, y: 100, vx: 0, vy: 0, grounded: true, jumps: 0 });

export function simulateReplayFrame(actor: ReplayActor, input: ReplayInput, dt: number): ReplayActor {
  const next = { ...actor };
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  next.vx += (dir * 85 - next.vx) * Math.min(1, dt * 12);
  if (input.jump && next.grounded) { next.vy = -180; next.grounded = false; next.jumps++; }
  next.vy += 620 * dt;
  next.x += next.vx * dt;
  next.y += next.vy * dt;
  if (next.y >= 100) { next.y = 100; next.vy = 0; next.grounded = true; }
  next.x = Math.max(8, Math.min(470, next.x));
  return next;
}

export function encodeReplay(data: ReplayData): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

export function decodeReplay(encoded: string): ReplayData {
  const data = JSON.parse(decodeURIComponent(escape(atob(encoded)))) as ReplayData;
  if (data.version !== 1 || !Array.isArray(data.frames)) throw new Error("Replay no compatible");
  return data;
}

export interface TelemetryEvent { frame: number; type: "jump" | "coin" | "damage" | "death" | "finish"; x: number }
export interface TelemetrySummary {
  jumps: number; coins: number; damage: number; deaths: number; finishFrame: number | null; dangerZone: number | null;
}

export function summarizeTelemetry(events: TelemetryEvent[], worldWidth = 480, buckets = 12): TelemetrySummary {
  const danger = Array.from({ length: buckets }, () => 0);
  let jumps = 0, coins = 0, damage = 0, deaths = 0, finishFrame: number | null = null;
  for (const event of events) {
    if (event.type === "jump") jumps++;
    if (event.type === "coin") coins++;
    if (event.type === "damage") { damage++; danger[Math.min(buckets - 1, Math.floor(event.x / worldWidth * buckets))]++; }
    if (event.type === "death") { deaths++; danger[Math.min(buckets - 1, Math.floor(event.x / worldWidth * buckets))] += 3; }
    if (event.type === "finish") finishFrame = event.frame;
  }
  const peak = Math.max(...danger);
  return { jumps, coins, damage, deaths, finishFrame, dangerZone: peak > 0 ? danger.indexOf(peak) : null };
}