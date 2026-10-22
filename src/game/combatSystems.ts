/* ============================================================
   COMBATE Y BALANCE — reglas puras y simulables.

   Un diseñador puede ejecutar 1.000 combates en milisegundos,
   ajustar números y volver a medir sin abrir el juego. La misma
   fórmula alimenta la demo, los tests y los packs de motores.
   ============================================================ */

import { seededRandom } from "./advancedSystems";

export type Element = "physical" | "fire" | "ice" | "lightning";
export type StatusType = "poison" | "burn" | "regen" | "shield" | "slow";

export interface FighterStats {
  name: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  critChance: number;
  critMultiplier: number;
  level: number;
  resistances: Record<Element, number>;
}

export interface DamageRequest {
  attacker: FighterStats;
  defender: FighterStats;
  power: number;
  element: Element;
  variance?: number;
  forceCrit?: boolean;
  roll?: number;
}

export interface DamageResult {
  raw: number;
  afterDefense: number;
  elementalMultiplier: number;
  critical: boolean;
  varianceMultiplier: number;
  final: number;
  effectiveness: "resisted" | "normal" | "weak";
}

export const DEFAULT_HERO: FighterStats = {
  name: "CRONO", maxHp: 120, attack: 24, defense: 12, speed: 14,
  critChance: 0.15, critMultiplier: 1.6, level: 5,
  resistances: { physical: 1, fire: 1, ice: 1, lightning: 1 },
};

export const DEFAULT_ENEMY: FighterStats = {
  name: "REY SLIME", maxHp: 180, attack: 19, defense: 10, speed: 9,
  critChance: 0.08, critMultiplier: 1.5, level: 5,
  resistances: { physical: 1, fire: 0.75, ice: 1.4, lightning: 1.75 },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function calculateDamage(request: DamageRequest): DamageResult {
  const variance = clamp(request.variance ?? 0.1, 0, 0.5);
  const roll = clamp(request.roll ?? 0.5, 0, 1);
  const levelScale = 1 + Math.max(0, request.attacker.level - 1) * 0.035;
  const raw = request.attacker.attack * request.power * levelScale;
  // Curva suave: la defensa nunca reduce a cero y tiene rendimientos decrecientes.
  const defenseFactor = 100 / (100 + Math.max(0, request.defender.defense) * 4.2);
  const afterDefense = raw * defenseFactor;
  const elementalMultiplier = clamp(request.defender.resistances[request.element] ?? 1, 0.1, 3);
  const critical = request.forceCrit ?? roll < request.attacker.critChance;
  const varianceMultiplier = 1 - variance + roll * variance * 2;
  const final = Math.max(1, Math.round(afterDefense * elementalMultiplier * (critical ? request.attacker.critMultiplier : 1) * varianceMultiplier));
  return {
    raw,
    afterDefense,
    elementalMultiplier,
    critical,
    varianceMultiplier,
    final,
    effectiveness: elementalMultiplier < 0.9 ? "resisted" : elementalMultiplier > 1.1 ? "weak" : "normal",
  };
}

/* ---------------- estados alterados ---------------- */

export interface StatusInstance {
  id: string;
  type: StatusType;
  remaining: number;
  potency: number;
  stacks: number;
  source: string;
}

export interface StatusTickResult {
  hp: number;
  statuses: StatusInstance[];
  damage: number;
  healing: number;
  shieldAbsorbed: number;
  speedMultiplier: number;
  messages: string[];
}

export function applyStatus(statuses: StatusInstance[], incoming: Omit<StatusInstance, "id">): StatusInstance[] {
  const existing = statuses.find((status) => status.type === incoming.type);
  if (!existing) return [...statuses, { ...incoming, id: `${incoming.type}-${statuses.length + 1}` }];
  return statuses.map((status) => status.id === existing.id ? {
    ...status,
    remaining: Math.max(status.remaining, incoming.remaining),
    potency: Math.max(status.potency, incoming.potency),
    stacks: Math.min(5, status.stacks + incoming.stacks),
  } : status);
}

export function tickStatuses(hp: number, maxHp: number, statuses: StatusInstance[]): StatusTickResult {
  let nextHp = hp, damage = 0, healing = 0, shieldAbsorbed = 0, speedMultiplier = 1;
  const messages: string[] = [];
  const next: StatusInstance[] = [];
  for (const status of statuses) {
    const amount = Math.max(1, Math.round(status.potency * status.stacks));
    if (status.type === "poison") { nextHp -= amount; damage += amount; messages.push(`Veneno -${amount}`); }
    if (status.type === "burn") { const burn = Math.round(amount * 1.35); nextHp -= burn; damage += burn; messages.push(`Quemadura -${burn}`); }
    if (status.type === "regen") { const heal = Math.min(maxHp - nextHp, amount); nextHp += heal; healing += heal; messages.push(`Regeneración +${heal}`); }
    if (status.type === "shield") { shieldAbsorbed += amount; messages.push(`Escudo ${amount}`); }
    if (status.type === "slow") { speedMultiplier *= Math.max(0.35, 1 - status.potency * 0.08 * status.stacks); messages.push(`Lentitud ×${speedMultiplier.toFixed(2)}`); }
    const remaining = status.remaining - 1;
    if (remaining > 0) next.push({ ...status, remaining });
    else messages.push(`${status.type} termina`);
  }
  return { hp: clamp(nextHp, 0, maxHp), statuses: next, damage, healing, shieldAbsorbed, speedMultiplier, messages };
}

export function absorbDamage(amount: number, statuses: StatusInstance[]): { damage: number; statuses: StatusInstance[]; absorbed: number } {
  const shield = statuses.find((status) => status.type === "shield");
  if (!shield) return { damage: amount, statuses, absorbed: 0 };
  const capacity = shield.potency * shield.stacks;
  const absorbed = Math.min(amount, capacity);
  const remainingCapacity = capacity - absorbed;
  const next = remainingCapacity <= 0
    ? statuses.filter((status) => status.id !== shield.id)
    : statuses.map((status) => status.id === shield.id ? { ...status, potency: remainingCapacity / status.stacks } : status);
  return { damage: amount - absorbed, statuses: next, absorbed };
}

/* ---------------- jefe por fases ---------------- */

export interface BossPhase {
  id: string;
  name: string;
  threshold: number;
  attackMultiplier: number;
  speedMultiplier: number;
  color: string;
  pattern: string[];
}

export const BOSS_PHASES: BossPhase[] = [
  { id: "calm", name: "Rey paciente", threshold: 1, attackMultiplier: 1, speedMultiplier: 1, color: "#7c6bff", pattern: ["Golpe", "Salto"] },
  { id: "angry", name: "Corona rota", threshold: 0.65, attackMultiplier: 1.25, speedMultiplier: 1.18, color: "#ff7847", pattern: ["Doble golpe", "Lluvia", "Salto"] },
  { id: "desperate", name: "Último latido", threshold: 0.3, attackMultiplier: 1.55, speedMultiplier: 1.42, color: "#ff5d73", pattern: ["Meteoros", "Triple salto", "Explosión"] },
];

export function bossPhase(hp: number, maxHp: number, phases = BOSS_PHASES): BossPhase {
  const ratio = maxHp <= 0 ? 0 : hp / maxHp;
  return [...phases].sort((a, b) => a.threshold - b.threshold).find((phase) => ratio <= phase.threshold) ?? phases[0];
}

export function scaleFighter(base: FighterStats, level: number): FighterStats {
  const lv = Math.max(1, Math.floor(level));
  const hpScale = 1 + (lv - 1) * 0.16 + Math.pow(lv - 1, 1.22) * 0.018;
  const statScale = 1 + (lv - 1) * 0.09;
  return {
    ...base,
    level: lv,
    maxHp: Math.round(base.maxHp * hpScale),
    attack: Math.round(base.attack * statScale),
    defense: Math.round(base.defense * (1 + (lv - 1) * 0.075)),
    speed: Math.round(base.speed * (1 + Math.min(0.45, (lv - 1) * 0.018))),
  };
}

/* ---------------- simulador de balance ---------------- */

export interface BattleSimulationConfig {
  hero: FighterStats;
  enemy: FighterStats;
  runs: number;
  seed: string;
  heroPower: number;
  enemyPower: number;
  heroElement: Element;
  maxRounds: number;
  potionAt: number;
  potionHeal: number;
  potions: number;
}

export interface BattleRun {
  winner: "hero" | "enemy" | "draw";
  rounds: number;
  heroHp: number;
  enemyHp: number;
  heroCrits: number;
  enemyCrits: number;
  potionUses: number;
}

export interface BalanceReport {
  runs: number;
  heroWins: number;
  enemyWins: number;
  draws: number;
  winRate: number;
  averageRounds: number;
  averageHeroHp: number;
  averageEnemyHp: number;
  averagePotionUses: number;
  difficulty: "trivial" | "fair" | "hard" | "brutal";
  histogram: number[];
  samples: BattleRun[];
}

export function simulateBattle(config: BattleSimulationConfig, runSeed: string): BattleRun {
  const rng = seededRandom(`${config.seed}:${runSeed}`);
  let heroHp = config.hero.maxHp, enemyHp = config.enemy.maxHp;
  let heroCrits = 0, enemyCrits = 0, potionUses = 0, potions = config.potions;
  let heroAtb = 0, enemyAtb = 0, rounds = 0;
  for (let ticks = 0; ticks < config.maxRounds * 30 && heroHp > 0 && enemyHp > 0; ticks++) {
    heroAtb += config.hero.speed;
    enemyAtb += config.enemy.speed;
    if (heroAtb >= 100) {
      heroAtb -= 100; rounds++;
      if (potions > 0 && heroHp / config.hero.maxHp <= config.potionAt) {
        heroHp = Math.min(config.hero.maxHp, heroHp + config.potionHeal); potions--; potionUses++;
      } else {
        const hit = calculateDamage({ attacker: config.hero, defender: config.enemy, power: config.heroPower, element: config.heroElement, roll: rng.next() });
        enemyHp -= hit.final; if (hit.critical) heroCrits++;
      }
    }
    if (enemyAtb >= 100 && enemyHp > 0) {
      enemyAtb -= 100;
      const phase = bossPhase(enemyHp, config.enemy.maxHp);
      const hit = calculateDamage({ attacker: { ...config.enemy, attack: config.enemy.attack * phase.attackMultiplier }, defender: config.hero, power: config.enemyPower, element: "physical", roll: rng.next() });
      heroHp -= hit.final; if (hit.critical) enemyCrits++;
    }
    if (rounds >= config.maxRounds) break;
  }
  return { winner: heroHp <= 0 ? "enemy" : enemyHp <= 0 ? "hero" : "draw", rounds, heroHp: Math.max(0, heroHp), enemyHp: Math.max(0, enemyHp), heroCrits, enemyCrits, potionUses };
}

export function runBalanceSimulation(config: BattleSimulationConfig): BalanceReport {
  const runs = Math.max(1, Math.min(10000, Math.floor(config.runs)));
  const results = Array.from({ length: runs }, (_, i) => simulateBattle(config, String(i)));
  const heroWins = results.filter((r) => r.winner === "hero").length;
  const enemyWins = results.filter((r) => r.winner === "enemy").length;
  const draws = runs - heroWins - enemyWins;
  const winRate = heroWins / runs;
  const histogram = Array.from({ length: 10 }, () => 0);
  results.forEach((result) => { const bin = Math.min(9, Math.floor(result.rounds / config.maxRounds * 10)); histogram[bin]++; });
  return {
    runs, heroWins, enemyWins, draws, winRate,
    averageRounds: results.reduce((sum, r) => sum + r.rounds, 0) / runs,
    averageHeroHp: results.reduce((sum, r) => sum + r.heroHp, 0) / runs,
    averageEnemyHp: results.reduce((sum, r) => sum + r.enemyHp, 0) / runs,
    averagePotionUses: results.reduce((sum, r) => sum + r.potionUses, 0) / runs,
    difficulty: winRate >= 0.85 ? "trivial" : winRate >= 0.5 ? "fair" : winRate >= 0.25 ? "hard" : "brutal",
    histogram,
    samples: results.slice(0, 20),
  };
}

/* ---------------- botín ponderado ---------------- */

export interface LootEntry { id: string; name: string; weight: number; min: number; max: number; rarity: "common" | "uncommon" | "rare" | "legendary" }
export interface LootDrop { id: string; name: string; amount: number; rarity: LootEntry["rarity"] }

export const DEFAULT_LOOT: LootEntry[] = [
  { id: "coins", name: "Monedas", weight: 52, min: 3, max: 12, rarity: "common" },
  { id: "herb", name: "Hierba lunar", weight: 25, min: 1, max: 3, rarity: "common" },
  { id: "potion", name: "Poción", weight: 14, min: 1, max: 1, rarity: "uncommon" },
  { id: "crystal", name: "Cristal verde", weight: 7, min: 1, max: 2, rarity: "rare" },
  { id: "crown", name: "Corona slime", weight: 2, min: 1, max: 1, rarity: "legendary" },
];

export function lootProbabilities(table: LootEntry[]): Array<LootEntry & { probability: number }> {
  const total = table.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  return table.map((item) => ({ ...item, probability: total > 0 ? Math.max(0, item.weight) / total : 0 }));
}

export function rollLoot(table: LootEntry[], random = Math.random): LootDrop | null {
  const positive = table.filter((item) => item.weight > 0);
  const total = positive.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return null;
  let roll = random() * total;
  for (const item of positive) {
    roll -= item.weight;
    if (roll <= 0) {
      const amount = Math.floor(random() * (item.max - item.min + 1)) + item.min;
      return { id: item.id, name: item.name, amount, rarity: item.rarity };
    }
  }
  return null;
}

export function simulateLoot(table: LootEntry[], rolls: number, seed = "loot"): Record<string, number> {
  const rng = seededRandom(seed);
  const counts: Record<string, number> = {};
  for (let i = 0; i < rolls; i++) {
    const drop = rollLoot(table, rng.next);
    if (drop) counts[drop.id] = (counts[drop.id] ?? 0) + 1;
  }
  return counts;
}