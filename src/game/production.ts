/* ============================================================
   SISTEMAS DE PRODUCCIÓN — piezas que aparecen cuando un juego
   deja de ser prototipo y empieza a cuidar a sus jugadores.

   Todo este archivo es TypeScript puro. La interfaz React solo
   llama a estas funciones; localStorage, botones y canvas viven
   fuera para poder probar cada regla por separado.
   ============================================================ */

export type AudioChannel = "master" | "music" | "sfx" | "ui";

export interface MixerState {
  master: number;
  music: number;
  sfx: number;
  ui: number;
  muted: boolean;
}

export const DEFAULT_MIXER: MixerState = {
  master: 0.8,
  music: 0.55,
  sfx: 0.75,
  ui: 0.65,
  muted: false,
};

export function channelGain(mixer: MixerState, channel: Exclude<AudioChannel, "master">): number {
  if (mixer.muted) return 0;
  return Math.max(0, Math.min(1, mixer.master * mixer[channel]));
}

export interface ToneSpec {
  frequency: number;
  duration: number;
  type: OscillatorType;
  endFrequency?: number;
  delay?: number;
  channel: "sfx" | "ui" | "music";
}

export const SOUND_LIBRARY: Record<string, ToneSpec[]> = {
  salto: [{ frequency: 280, endFrequency: 620, duration: 0.14, type: "square", channel: "sfx" }],
  moneda: [
    { frequency: 880, duration: 0.07, type: "square", channel: "sfx" },
    { frequency: 1320, duration: 0.15, delay: 0.07, type: "square", channel: "sfx" },
  ],
  golpe: [{ frequency: 200, endFrequency: 60, duration: 0.28, type: "sawtooth", channel: "sfx" }],
  menu: [{ frequency: 660, endFrequency: 720, duration: 0.055, type: "square", channel: "ui" }],
  poder: [
    { frequency: 392, duration: 0.1, type: "triangle", channel: "sfx" },
    { frequency: 523, duration: 0.1, delay: 0.08, type: "triangle", channel: "sfx" },
    { frequency: 659, duration: 0.18, delay: 0.16, type: "triangle", channel: "sfx" },
  ],
  victoria: [523, 659, 784, 1047].map((frequency, i) => ({
    frequency, duration: 0.14, delay: i * 0.09, type: "square" as OscillatorType, channel: "music" as const,
  })),
};

/* ---------------- guardado por ranuras ---------------- */

export const SAVE_VERSION = 2;

export interface GameSave {
  version: number;
  slot: number;
  player: string;
  level: number;
  coins: number;
  hearts: number;
  location: string;
  playSeconds: number;
  updatedAt: string;
  flags: Record<string, boolean>;
}

export interface LegacySaveV1 {
  version: 1;
  slot: number;
  name: string;
  level: number;
  score: number;
  place?: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const slotKey = (slot: number) => `cronolab-save-slot-${slot}`;

export function makeSave(slot: number, patch: Partial<GameSave> = {}): GameSave {
  return {
    version: SAVE_VERSION,
    slot,
    player: "CRONO",
    level: 1,
    coins: 0,
    hearts: 3,
    location: "Pradera del Bucle",
    playSeconds: 0,
    updatedAt: new Date().toISOString(),
    flags: {},
    ...patch,
  };
}

export function migrateSave(input: unknown): GameSave {
  if (!input || typeof input !== "object") throw new Error("La partida no contiene un objeto válido");
  const raw = input as Partial<GameSave & LegacySaveV1>;
  if (raw.version === 1) {
    return makeSave(Number(raw.slot ?? 1), {
      player: String(raw.name ?? "CRONO"),
      level: Number(raw.level ?? 1),
      coins: Number(raw.score ?? 0),
      location: String(raw.place ?? "Pradera del Bucle"),
      flags: { migradaDesdeV1: true },
    });
  }
  if (raw.version !== SAVE_VERSION) throw new Error(`Versión de partida no compatible: ${String(raw.version)}`);
  return makeSave(Number(raw.slot ?? 1), raw as Partial<GameSave>);
}

export function saveSlot(storage: StorageLike, save: GameSave): void {
  const clean = makeSave(save.slot, { ...save, updatedAt: new Date().toISOString() });
  storage.setItem(slotKey(save.slot), JSON.stringify(clean));
}

export function loadSlot(storage: StorageLike, slot: number): GameSave | null {
  const text = storage.getItem(slotKey(slot));
  if (!text) return null;
  return migrateSave(JSON.parse(text));
}

export function deleteSlot(storage: StorageLike, slot: number): void {
  storage.removeItem(slotKey(slot));
}

export function listSlots(storage: StorageLike, count = 3): Array<GameSave | null> {
  return Array.from({ length: count }, (_, i) => loadSlot(storage, i + 1));
}

export function exportSaves(storage: StorageLike, count = 3): string {
  return JSON.stringify({ format: "cronolab-saves", version: SAVE_VERSION, slots: listSlots(storage, count) }, null, 2);
}

export function importSaves(storage: StorageLike, text: string): number {
  const parsed = JSON.parse(text) as { slots?: unknown[] };
  if (!Array.isArray(parsed.slots)) throw new Error("El archivo no contiene una lista de ranuras");
  let imported = 0;
  parsed.slots.forEach((raw, index) => {
    if (!raw) return;
    const save = migrateSave(raw);
    saveSlot(storage, { ...save, slot: index + 1 });
    imported++;
  });
  return imported;
}

/* ---------------- eventos y logros ---------------- */

export type GameEvent =
  | { type: "coin_collected"; amount?: number }
  | { type: "enemy_stomped"; amount?: number }
  | { type: "level_completed"; level: number }
  | { type: "damage_taken"; amount?: number }
  | { type: "powerup_collected"; kind: string };

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  event: GameEvent["type"];
  target: number;
  hidden?: boolean;
}

export interface AchievementProgress extends AchievementDefinition {
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "primer_oro", title: "Primer brillo", description: "Recoge tu primera moneda", event: "coin_collected", target: 1 },
  { id: "coleccionista", title: "Bolsillos llenos", description: "Recoge 25 monedas", event: "coin_collected", target: 25 },
  { id: "pisoton", title: "Desde arriba", description: "Aplasta 5 enemigos", event: "enemy_stomped", target: 5 },
  { id: "viajero", title: "El viaje comienza", description: "Completa 3 niveles", event: "level_completed", target: 3 },
  { id: "invencible", title: "Sin rasguños", description: "Completa un nivel sin recibir daño", event: "level_completed", target: 1, hidden: true },
  { id: "energia", title: "Más poder", description: "Recoge 3 power-ups", event: "powerup_collected", target: 3 },
];

export function createAchievementState(): AchievementProgress[] {
  return ACHIEVEMENTS.map((item) => ({ ...item, progress: 0, unlocked: false }));
}

export interface AchievementUpdate {
  state: AchievementProgress[];
  unlocked: AchievementProgress[];
}

export function processAchievementEvent(
  state: AchievementProgress[],
  event: GameEvent,
  context: { damageThisLevel?: number } = {},
): AchievementUpdate {
  const unlockedNow: AchievementProgress[] = [];
  const next = state.map((item) => {
    if (item.unlocked || item.event !== event.type) return item;
    if (item.id === "invencible" && (context.damageThisLevel ?? 0) > 0) return item;
    const amount = "amount" in event ? Number(event.amount ?? 1) : 1;
    const progress = Math.min(item.target, item.progress + amount);
    const unlocked = progress >= item.target;
    const updated: AchievementProgress = {
      ...item,
      progress,
      unlocked,
      unlockedAt: unlocked ? new Date().toISOString() : undefined,
    };
    if (unlocked) unlockedNow.push(updated);
    return updated;
  });
  return { state: next, unlocked: unlockedNow };
}

/* ---------------- localización ---------------- */

export type Locale = "es" | "en" | "pt";

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  es: {
    "menu.play": "Jugar",
    "menu.options": "Opciones",
    "menu.exit": "Salir",
    "hud.coins": "{count, plural, one {# moneda} other {# monedas}}",
    "hud.hearts": "{count, plural, one {# corazón} other {# corazones}}",
    "quest.crystals": "Cristales: {current}/{total}",
    "dialogue.welcome": "Bienvenido, {player}. El portal te esperaba.",
    "status.saved": "Partida guardada",
  },
  en: {
    "menu.play": "Play",
    "menu.options": "Options",
    "menu.exit": "Quit",
    "hud.coins": "{count, plural, one {# coin} other {# coins}}",
    "hud.hearts": "{count, plural, one {# heart} other {# hearts}}",
    "quest.crystals": "Crystals: {current}/{total}",
    "dialogue.welcome": "Welcome, {player}. The portal was waiting for you.",
    "status.saved": "Game saved",
  },
  pt: {
    "menu.play": "Jogar",
    "menu.options": "Opções",
    "menu.exit": "Sair",
    "hud.coins": "{count, plural, one {# moeda} other {# moedas}}",
    "hud.hearts": "{count, plural, one {# coração} other {# corações}}",
    "quest.crystals": "Cristais: {current}/{total}",
    "dialogue.welcome": "Bem-vindo, {player}. O portal esperava por você.",
    "status.saved": "Jogo salvo",
  },
};

/** Parser mínimo de plurales estilo ICU: suficiente para enseñar el patrón. */
function resolvePlural(text: string, params: Record<string, ValueLike>): string {
  const plural = /\{(\w+),\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\}/g;
  return text.replace(plural, (_match, key: string, one: string, other: string) => {
    const count = Number(params[key] ?? 0);
    return (count === 1 ? one : other).split("#").join(String(count));
  });
}

type ValueLike = string | number | boolean;

export function translate(locale: Locale, key: string, params: Record<string, ValueLike> = {}): string {
  const table = TRANSLATIONS[locale] ?? TRANSLATIONS.es;
  const fallback = TRANSLATIONS.es[key];
  let text = table[key] ?? fallback ?? `[${key}]`;
  text = resolvePlural(text, params);
  return text.replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? `{${name}}`));
}

export function missingTranslationKeys(locale: Locale): string[] {
  const base = Object.keys(TRANSLATIONS.es);
  return base.filter((key) => !(key in TRANSLATIONS[locale]));
}

/* ---------------- accesibilidad ---------------- */

export type ColorMode = "normal" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  textScale: number;
  colorMode: ColorMode;
  shake: number;
  flashes: boolean;
  subtitles: boolean;
  holdToRun: boolean;
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  textScale: 1,
  colorMode: "normal",
  shake: 1,
  flashes: true,
  subtitles: true,
  holdToRun: true,
};

export const COLOR_FILTERS: Record<ColorMode, string> = {
  normal: "none",
  deuteranopia: "url(#deuteranopia)",
  protanopia: "url(#protanopia)",
  tritanopia: "url(#tritanopia)",
  monochrome: "grayscale(1)",
};

export function sanitizeAccessibility(input: Partial<AccessibilitySettings>): AccessibilitySettings {
  const colorModes: ColorMode[] = ["normal", "deuteranopia", "protanopia", "tritanopia", "monochrome"];
  return {
    ...DEFAULT_ACCESSIBILITY,
    ...input,
    textScale: Math.max(0.8, Math.min(1.6, Number(input.textScale ?? 1))),
    shake: Math.max(0, Math.min(1, Number(input.shake ?? 1))),
    colorMode: colorModes.includes(input.colorMode as ColorMode) ? input.colorMode as ColorMode : "normal",
  };
}

export function effectiveMotion(settings: AccessibilitySettings): { particleMultiplier: number; shakeMultiplier: number; transitionSeconds: number } {
  if (settings.reducedMotion) return { particleMultiplier: 0.25, shakeMultiplier: 0, transitionSeconds: 0.05 };
  return { particleMultiplier: 1, shakeMultiplier: settings.shake, transitionSeconds: 0.35 };
}