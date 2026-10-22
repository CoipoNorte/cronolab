/* Packs de combate reutilizables para Unity 6 y Godot 4. */
export interface CombatPackFile { path: string; content: string }

const README_UNITY = `# CronoLab Combat Pack · Unity 6

Copia Assets/CronoLabCombat dentro de Assets/.

- DamageCalculator.cs: daño, defensa, críticos y elementos
- StatusController.cs: veneno, quemadura, regeneración, escudo y lentitud
- BossPhases.cs: fases por porcentaje de vida
- WeightedLootTable.cs: botín ponderado y cantidades

Todos son independientes de la UI y pueden probarse desde EditMode tests.
`;

const U_DAMAGE = `using System;
using UnityEngine;

namespace CronoLab.Combat
{
    public enum Element { Physical, Fire, Ice, Lightning }
    [Serializable] public class Stats
    {
        public string name; public int maxHP = 100, attack = 20, defense = 10, speed = 10, level = 1;
        [Range(0,1)] public float critChance = .15f; public float critMultiplier = 1.6f;
        public float physical = 1, fire = 1, ice = 1, lightning = 1;
        public float Resistance(Element e) => e == Element.Fire ? fire : e == Element.Ice ? ice : e == Element.Lightning ? lightning : physical;
    }
    public struct DamageResult { public int final; public bool critical; public float elementMultiplier, raw, afterDefense; }
    public static class DamageCalculator
    {
        public static DamageResult Calculate(Stats a, Stats d, float power, Element element, float roll)
        {
            float raw = a.attack * power * (1 + Mathf.Max(0, a.level - 1) * .035f);
            float afterDefense = raw * (100f / (100f + Mathf.Max(0, d.defense) * 4.2f));
            float elemental = Mathf.Clamp(d.Resistance(element), .1f, 3f);
            bool critical = roll < a.critChance;
            float variance = .9f + Mathf.Clamp01(roll) * .2f;
            return new DamageResult { raw = raw, afterDefense = afterDefense, elementMultiplier = elemental, critical = critical, final = Mathf.Max(1, Mathf.RoundToInt(afterDefense * elemental * (critical ? a.critMultiplier : 1) * variance)) };
        }
    }
}
`;

const U_STATUS = `using System;
using System.Collections.Generic;
using UnityEngine;

namespace CronoLab.Combat
{
    public enum StatusType { Poison, Burn, Regen, Shield, Slow }
    [Serializable] public class Status { public StatusType type; public int turns = 3, stacks = 1; public float potency = 4; }
    public class StatusController : MonoBehaviour
    {
        public List<Status> active = new(); public int hp = 100, maxHP = 100;
        public void Apply(Status incoming)
        {
            var old = active.Find(x => x.type == incoming.type);
            if (old == null) active.Add(incoming);
            else { old.turns = Mathf.Max(old.turns, incoming.turns); old.potency = Mathf.Max(old.potency, incoming.potency); old.stacks = Mathf.Min(5, old.stacks + incoming.stacks); }
        }
        public void Tick()
        {
            for (int i = active.Count - 1; i >= 0; i--)
            {
                var s = active[i]; int amount = Mathf.Max(1, Mathf.RoundToInt(s.potency * s.stacks));
                if (s.type == StatusType.Poison) hp -= amount;
                if (s.type == StatusType.Burn) hp -= Mathf.RoundToInt(amount * 1.35f);
                if (s.type == StatusType.Regen) hp = Mathf.Min(maxHP, hp + amount);
                if (--s.turns <= 0) active.RemoveAt(i);
            }
        }
        public int Absorb(int damage)
        {
            var shield = active.Find(x => x.type == StatusType.Shield);
            if (shield == null) return damage;
            int capacity = Mathf.RoundToInt(shield.potency * shield.stacks), absorbed = Mathf.Min(capacity, damage);
            shield.potency = (capacity - absorbed) / (float)shield.stacks;
            if (capacity <= absorbed) active.Remove(shield);
            return damage - absorbed;
        }
    }
}
`;

const U_BOSS = `using System;
using UnityEngine;

namespace CronoLab.Combat
{
    [Serializable] public class BossPhase { public string id, title; [Range(0,1)] public float threshold = 1; public float attackMultiplier = 1, speedMultiplier = 1; public string[] pattern; }
    public class BossPhases : MonoBehaviour
    {
        public int hp = 180, maxHP = 180;
        public BossPhase[] phases = {
            new BossPhase { id="calm", title="Paciente", threshold=1, pattern=new[]{"Golpe","Salto"} },
            new BossPhase { id="angry", title="Corona rota", threshold=.65f, attackMultiplier=1.25f, speedMultiplier=1.18f, pattern=new[]{"Doble","Lluvia"} },
            new BossPhase { id="desperate", title="Ultimo latido", threshold=.3f, attackMultiplier=1.55f, speedMultiplier=1.42f, pattern=new[]{"Meteoros","Explosion"} }
        };
        public BossPhase Current()
        {
            float ratio = maxHP <= 0 ? 0 : hp / (float)maxHP; BossPhase result = phases[0];
            foreach (var phase in phases) if (ratio <= phase.threshold && phase.threshold <= result.threshold) result = phase;
            return result;
        }
    }
}
`;

const U_LOOT = `using System;
using System.Collections.Generic;
using UnityEngine;

namespace CronoLab.Combat
{
    [Serializable] public class LootEntry { public string id, title; public float weight = 1; public int min = 1, max = 1; }
    [CreateAssetMenu(menuName="CronoLab/Weighted Loot Table")]
    public class WeightedLootTable : ScriptableObject
    {
        public List<LootEntry> entries = new();
        public LootEntry Roll(System.Random random, out int amount)
        {
            float total = 0; foreach (var item in entries) total += Mathf.Max(0, item.weight);
            double roll = random.NextDouble() * total;
            foreach (var item in entries) { roll -= item.weight; if (roll <= 0) { amount = random.Next(item.min, item.max + 1); return item; } }
            amount = 0; return null;
        }
    }
}
`;

export function buildUnityCombatPack(): CombatPackFile[] {
  const root = "CronoLab-Unity-Combat-Pack";
  return [
    { path: `${root}/README.md`, content: README_UNITY },
    { path: `${root}/Assets/CronoLabCombat/DamageCalculator.cs`, content: U_DAMAGE },
    { path: `${root}/Assets/CronoLabCombat/StatusController.cs`, content: U_STATUS },
    { path: `${root}/Assets/CronoLabCombat/BossPhases.cs`, content: U_BOSS },
    { path: `${root}/Assets/CronoLabCombat/WeightedLootTable.cs`, content: U_LOOT },
  ];
}

const README_GODOT = `# CronoLab Combat Pack · Godot 4

Copia addons/cronolab_combat dentro del proyecto.

- damage_calculator.gd
- status_controller.gd
- boss_phases.gd
- weighted_loot.gd

Son clases independientes; añadelas como nodos o usalas de forma estatica.
`;

const G_DAMAGE = `class_name CronoDamageCalculator
extends RefCounted

enum Element { PHYSICAL, FIRE, ICE, LIGHTNING }

static func calculate(attacker: Dictionary, defender: Dictionary, power: float, element: int, roll: float) -> Dictionary:
    var raw: float = attacker.attack * power * (1.0 + max(0, attacker.level - 1) * .035)
    var after_defense := raw * (100.0 / (100.0 + max(0, defender.defense) * 4.2))
    var elemental: float = clamp(defender.resistances.get(element, 1.0), .1, 3.0)
    var critical: bool = roll < attacker.crit_chance
    var variance := .9 + clamp(roll, 0.0, 1.0) * .2
    return { "raw": raw, "after_defense": after_defense, "element": elemental, "critical": critical, "final": max(1, roundi(after_defense * elemental * (attacker.crit_multiplier if critical else 1.0) * variance)) }
`;

const G_STATUS = `class_name CronoStatusController
extends Node

var hp := 100
var max_hp := 100
var active: Array[Dictionary] = []

func apply(incoming: Dictionary) -> void:
    for status in active:
        if status.type == incoming.type:
            status.turns = maxi(status.turns, incoming.turns)
            status.potency = maxf(status.potency, incoming.potency)
            status.stacks = mini(5, status.stacks + incoming.get("stacks", 1))
            return
    active.append(incoming.duplicate(true))

func tick() -> void:
    for i in range(active.size() - 1, -1, -1):
        var status = active[i]
        var amount := maxi(1, roundi(status.potency * status.stacks))
        if status.type == "poison": hp -= amount
        if status.type == "burn": hp -= roundi(amount * 1.35)
        if status.type == "regen": hp = mini(max_hp, hp + amount)
        status.turns -= 1
        if status.turns <= 0: active.remove_at(i)
`;

const G_BOSS = `class_name CronoBossPhases
extends Node

var hp := 180
var max_hp := 180
var phases: Array[Dictionary] = [
    { "id":"calm", "threshold":1.0, "attack":1.0, "speed":1.0, "pattern":["Golpe","Salto"] },
    { "id":"angry", "threshold":.65, "attack":1.25, "speed":1.18, "pattern":["Doble","Lluvia"] },
    { "id":"desperate", "threshold":.3, "attack":1.55, "speed":1.42, "pattern":["Meteoros","Explosion"] }
]

func current() -> Dictionary:
    var ratio := 0.0 if max_hp <= 0 else hp / float(max_hp)
    var result := phases[0]
    for phase in phases:
        if ratio <= phase.threshold and phase.threshold <= result.threshold: result = phase
    return result
`;

const G_LOOT = `class_name CronoWeightedLoot
extends Resource

@export var entries: Array[Dictionary] = []

func probabilities() -> Array[Dictionary]:
    var total := 0.0
    for item in entries: total += maxf(0, item.get("weight", 0))
    return entries.map(func(item):
        var copy: Dictionary = item.duplicate(true)
        copy.probability = item.weight / total if total > 0 else 0
        return copy)

func roll(random: RandomNumberGenerator) -> Dictionary:
    var total := 0.0
    for item in entries: total += maxf(0, item.get("weight", 0))
    var value := random.randf() * total
    for item in entries:
        value -= item.weight
        if value <= 0:
            return { "id":item.id, "amount":random.randi_range(item.get("min",1), item.get("max",1)) }
    return {}
`;

export function buildGodotCombatPack(): CombatPackFile[] {
  const root = "CronoLab-Godot-Combat-Pack";
  return [
    { path: `${root}/README.md`, content: README_GODOT },
    { path: `${root}/addons/cronolab_combat/damage_calculator.gd`, content: G_DAMAGE },
    { path: `${root}/addons/cronolab_combat/status_controller.gd`, content: G_STATUS },
    { path: `${root}/addons/cronolab_combat/boss_phases.gd`, content: G_BOSS },
    { path: `${root}/addons/cronolab_combat/weighted_loot.gd`, content: G_LOOT },
  ];
}