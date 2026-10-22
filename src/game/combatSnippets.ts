import { Activity, Flame, Gauge, Gift, Swords } from "lucide-react";
import type { Lesson } from "./moreSnippets";

export const COMBAT_LESSONS: Lesson[] = [
  {
    id: "damage-formula",
    file: "src/juego/combate/dano.ts",
    title: "Una fórmula que se puede explicar",
    icon: Swords,
    code: `function calcularDaño(atacante, defensor, poder, elemento, roll) {
  // 1. ataque base + crecimiento suave por nivel
  const escalaNivel = 1 + (atacante.nivel - 1) * 0.035;
  const bruto = atacante.ataque * poder * escalaNivel;

  // 2. defensa con rendimientos decrecientes: nunca anula el golpe
  const factorDefensa = 100 / (100 + defensor.defensa * 4.2);

  // 3. debilidad/resistencia: 0.75 resiste, 1.75 es débil
  const elemental = defensor.resistencias[elemento] ?? 1;

  // 4. crítico y variación controlada ±10%
  const critico = roll < atacante.probabilidadCritico;
  const variacion = 0.9 + roll * 0.2;

  return Math.max(1, Math.round(
    bruto * factorDefensa * elemental *
    (critico ? atacante.multiplicadorCritico : 1) * variacion
  ));
}`,
    bullets: [
      "Cada etapa tiene una responsabilidad: nivel, defensa, elemento, crítico y variación. Puedes mostrar el desglose al diseñador.",
      "La defensa usa una curva en vez de una resta. Con ataque - defensa, un enemigo blindado puede recibir cero daño y bloquear el combate.",
      "La variación es pequeña y controlada: suficiente para evitar resultados idénticos sin convertir la estrategia en una lotería.",
    ],
    tryIt: "Sube defensa a 80: el daño cae, pero nunca llega a cero. Cambia a Rayo para explotar la debilidad del Rey Slime.",
    apps: ["JRPG por turnos", "Action RPG", "Balance de habilidades"],
  },
  {
    id: "status-effects",
    file: "src/juego/combate/estados.ts",
    title: "Estados como instancias apilables",
    icon: Flame,
    code: `interface Estado {
  tipo: "veneno" | "quemadura" | "regen" | "escudo" | "lento";
  turnos: number;
  potencia: number;
  acumulaciones: number;
}

function aplicar(lista, nuevo) {
  const existente = lista.find(e => e.tipo === nuevo.tipo);
  if (!existente) return [...lista, nuevo];

  // refresca duración, conserva la potencia mayor y apila hasta 5
  existente.turnos = Math.max(existente.turnos, nuevo.turnos);
  existente.potencia = Math.max(existente.potencia, nuevo.potencia);
  existente.acumulaciones = Math.min(5, existente.acumulaciones + 1);
}

function tick(estado, objetivo) {
  const cantidad = estado.potencia * estado.acumulaciones;
  if (estado.tipo === "veneno") objetivo.hp -= cantidad;
  if (estado.tipo === "regen") objetivo.hp += cantidad;
  estado.turnos--;
}`,
    bullets: [
      "Una instancia guarda duración, potencia, acumulaciones y origen. El mismo tipo puede comportarse distinto según quién lo aplicó.",
      "Apilar no debe crecer sin límite. Un máximo de cinco mantiene visible la progresión y evita números imposibles.",
      "El escudo es especial: intercepta daño inmediato y consume su capacidad, mientras veneno y regeneración actúan al final del turno.",
    ],
    tryIt: "Aplica veneno tres veces y avanza turnos: el daño crece por acumulaciones. Añade escudo y golpea para consumirlo.",
    apps: ["Pokémon", "Slay the Spire", "Final Fantasy"],
  },
  {
    id: "boss-phases",
    file: "src/juego/combate/fases-jefe.ts",
    title: "Fases dirigidas por porcentaje de vida",
    icon: Activity,
    code: `const fases = [
  { nombre: "Paciente", umbral: 1.00, ataque: 1.0, velocidad: 1.0 },
  { nombre: "Corona rota", umbral: 0.65, ataque: 1.25, velocidad: 1.18 },
  { nombre: "Último latido", umbral: 0.30, ataque: 1.55, velocidad: 1.42 },
];

function faseActual(hp, hpMax) {
  const ratio = hp / hpMax;
  // ordenar de menor a mayor encuentra la fase más urgente que aplica
  return [...fases]
    .sort((a, b) => a.umbral - b.umbral)
    .find(fase => ratio <= fase.umbral);
}

function turnoJefe(jefe) {
  const fase = faseActual(jefe.hp, jefe.hpMax);
  jefe.ataqueActual = jefe.ataqueBase * fase.ataque;
  return elegir(fase.patron); // cada fase también cambia ataques
}`,
    bullets: [
      "El umbral está expresado como porcentaje, así el mismo diseño funciona si duplicas la vida del jefe para modo difícil.",
      "Una fase debe cambiar comportamiento, no solo números: nuevos patrones, ritmo y señales visuales mantienen la pelea legible.",
      "La transición es un evento: puede detener el tiempo, reproducir diálogo, limpiar estados o mover la cámara.",
    ],
    tryIt: "Arrastra la vida del jefe por debajo de 65% y 30%: cambian color, patrón, ataque y velocidad.",
    apps: ["Bosses de Zelda", "Hollow Knight", "Final Fantasy XIV"],
  },
  {
    id: "balance-simulation",
    file: "src/juego/combate/simulador.ts",
    title: "Medir antes de declarar que es justo",
    icon: Gauge,
    code: `function simularMil(config) {
  const resultados = [];

  for (let i = 0; i < 1000; i++) {
    // semilla distinta, pero reproducible, para cada combate
    resultados.push(simularCombate(config, config.semilla + ":" + i));
  }

  const victorias = resultados.filter(r => r.ganador === "heroe").length;
  const winRate = victorias / resultados.length;

  return {
    winRate,
    rondasMedias: promedio(resultados.map(r => r.rondas)),
    vidaMedia: promedio(resultados.map(r => r.hpHeroe)),
    dificultad: winRate >= .85 ? "trivial"
               : winRate >= .50 ? "justa"
               : winRate >= .25 ? "difícil" : "brutal",
  };
}`,
    bullets: [
      "Una victoria aislada no demuestra balance. Mil simulaciones revelan la probabilidad real y los extremos.",
      "La semilla conserva los resultados mientras ajustas la interfaz; cambiar una estadística produce una comparación justa.",
      "La simulación no sustituye playtesting humano: encuentra números rotos antes de gastar tiempo de personas.",
    ],
    tryIt: "Busca un win rate entre 50% y 75% ajustando defensa, pociones y poder del enemigo.",
    apps: ["Balance automatizado", "Diseño de dificultad", "Tests Monte Carlo"],
  },
  {
    id: "weighted-loot",
    file: "src/juego/combate/botin.ts",
    title: "Pesos que siempre suman 100%",
    icon: Gift,
    code: `function probabilidades(tabla) {
  const total = tabla.reduce((suma, item) => suma + item.peso, 0);
  return tabla.map(item => ({
    ...item,
    probabilidad: item.peso / total,
  }));
}

function tirar(tabla, azar) {
  const total = tabla.reduce((suma, item) => suma + item.peso, 0);
  let roll = azar() * total;

  for (const item of tabla) {
    roll -= item.peso;
    if (roll <= 0) return {
      id: item.id,
      cantidad: entero(item.min, item.max, azar),
    };
  }
}

// 52, 25, 14, 7 y 2 son pesos; no tienen que sumar 100.
// Normalizar los convierte automáticamente en porcentajes.
`,
    bullets: [
      "Los pesos son más cómodos que porcentajes: puedes cambiar un valor sin recalcular manualmente toda la tabla.",
      "Simular 10.000 tiradas compara frecuencia teórica y observada, detectando errores en el algoritmo o tablas mal configuradas.",
      "Cantidad y rareza son decisiones separadas: un drop raro puede dar una unidad, mientras monedas comunes dan entre 3 y 12.",
    ],
    tryIt: "Sube el peso de la Corona slime y ejecuta 10.000 tiradas. La barra observada debe acercarse a la probabilidad teórica.",
    apps: ["Loot de RPG", "Roguelikes", "Tablas de recompensas"],
  },
];