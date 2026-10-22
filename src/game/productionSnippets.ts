import { Languages, Save, SlidersHorizontal, Trophy, Volume2 } from "lucide-react";
import type { Lesson } from "./moreSnippets";

export const PRODUCTION_LESSONS: Lesson[] = [
  {
    id: "audio-mixer",
    file: "src/juego/produccion/audio-mixer.ts",
    title: "Mezclar por canales, no sonido por sonido",
    icon: Volume2,
    code: `type Canal = "music" | "sfx" | "ui";

const mezcla = {
  master: 0.8,
  music: 0.55,
  sfx: 0.75,
  ui: 0.65,
  muted: false,
};

function volumenFinal(canal: Canal) {
  if (mezcla.muted) return 0;
  return mezcla.master * mezcla[canal];
}

function reproducir(sonido, canal: Canal) {
  sonido.gain.value = volumenFinal(canal);
  sonido.play();
}

// Bajar la música no cambia monedas, golpes ni botones:
mezcla.music = 0.2;`,
    bullets: [
      "El volumen final multiplica master por canal. Silenciar master apaga todo; mover music no toca los efectos ni la interfaz.",
      "Separar UI de SFX importa: alguien puede necesitar oír los botones claramente aunque reduzca explosiones y golpes.",
      "Guarda la configuración, no el volumen de cada archivo. Cualquier sonido nuevo entra automáticamente en el canal correcto.",
    ],
    tryIt: "Baja SFX a cero y pulsa Moneda; después pulsa Menú. El segundo sigue sonando porque vive en otro canal.",
    apps: ["AudioMixer de Unity", "Audio buses de Godot", "Opciones de cualquier juego comercial"],
  },
  {
    id: "save-slots",
    file: "src/juego/produccion/ranuras.ts",
    title: "Ranuras, versiones y migraciones",
    icon: Save,
    code: `const VERSION_ACTUAL = 2;

interface PartidaV2 {
  version: 2;
  slot: number;
  jugador: string;
  nivel: number;
  monedas: number;
  lugar: string;
  flags: Record<string, boolean>;
}

function guardar(p: PartidaV2) {
  localStorage.setItem("slot-" + p.slot, JSON.stringify(p));
}

function cargar(slot: number): PartidaV2 | null {
  const texto = localStorage.getItem("slot-" + slot);
  if (!texto) return null;
  return migrar(JSON.parse(texto));
}

function migrar(vieja): PartidaV2 {
  if (vieja.version === 1) return {
    version: 2,
    slot: vieja.slot,
    jugador: vieja.name,
    nivel: vieja.level,
    monedas: vieja.score,
    lugar: vieja.place ?? "Pradera",
    flags: { migradaDesdeV1: true },
  };
  return vieja;
}`,
    bullets: [
      "La versión viaja dentro del save. Cuando actualices el juego, migras datos antiguos en vez de pedir que borren la partida.",
      "Una ranura es una clave distinta en el mismo almacenamiento. El sistema no cambia al pasar de una a veinte.",
      "Exportar todas las ranuras a JSON aporta copias de seguridad, transferencia entre dispositivos y soporte técnico.",
    ],
    tryIt: "Crea dos ranuras, exporta el JSON, bórralas e impórtalo: las dos partidas regresan.",
    apps: ["Partidas de Zelda", "Perfiles de RPG", "Cloud Save"],
  },
  {
    id: "achievements",
    file: "src/juego/produccion/logros.ts",
    title: "Logros que escuchan eventos",
    icon: Trophy,
    code: `const logros = [
  { id: "oro", evento: "moneda", objetivo: 25, progreso: 0 },
  { id: "pisoton", evento: "enemigo_pisado", objetivo: 5, progreso: 0 },
];

function emitir(evento, cantidad = 1) {
  for (const logro of logros) {
    if (logro.desbloqueado || logro.evento !== evento) continue;

    logro.progreso = Math.min(logro.objetivo, logro.progreso + cantidad);
    if (logro.progreso >= logro.objetivo) {
      logro.desbloqueado = true;
      mostrarToast(logro);
      guardarLogros();
    }
  }
}

// El juego anuncia lo ocurrido. No conoce ningún logro concreto:
emitir("moneda");
emitir("enemigo_pisado");`,
    bullets: [
      "El código de la moneda no debe conocer «Bolsillos llenos». Solo emite coin_collected; logros decide qué significa.",
      "Math.min evita mostrar 31/25. Una vez desbloqueado, el logro ignora futuros eventos.",
      "El mismo bus alimenta sonido, tutoriales, analítica y misiones sin acoplarlos al origen del evento.",
    ],
    tryIt: "Emite monedas de cinco en cinco y observa cómo dos logros progresan de forma independiente.",
    apps: ["Steam Achievements", "Trofeos de PlayStation", "Misiones diarias"],
  },
  {
    id: "localization",
    file: "src/juego/produccion/localizacion.ts",
    title: "Traducir claves, variables y plurales",
    icon: Languages,
    code: `const textos = {
  es: {
    "menu.play": "Jugar",
    "hud.coins.one": "{n} moneda",
    "hud.coins.other": "{n} monedas",
    "welcome": "Bienvenido, {player}",
  },
  en: {
    "menu.play": "Play",
    "hud.coins.one": "{n} coin",
    "hud.coins.other": "{n} coins",
    "welcome": "Welcome, {player}",
  },
};

function t(id, vars = {}) {
  let clave = id;
  if (id === "hud.coins") clave += vars.n === 1 ? ".one" : ".other";
  let resultado = textos[idioma][clave] ?? textos.es[clave] ?? "[" + clave + "]";
  return resultado.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
}

t("welcome", { player: "CRONO" });
t("hud.coins", { n: 3 });`,
    bullets: [
      "El código pide menu.play, no escribe «Jugar». Así el idioma puede cambiar mientras el juego corre.",
      "Los plurales son reglas, no concatenaciones. «1 monedas» delata un sistema mal diseñado.",
      "Una clave ausente cae al español y luego muestra [clave]: mejor una pista visible que un vacío imposible de depurar.",
    ],
    tryIt: "Cambia entre español, inglés y portugués; prueba 1 y 8 monedas para observar el plural.",
    apps: ["Unity Localization", "Godot TranslationServer", "Juegos lanzados globalmente"],
  },
  {
    id: "accessibility",
    file: "src/juego/produccion/accesibilidad.ts",
    title: "Opciones que cambian reglas, no decoraciones",
    icon: SlidersHorizontal,
    code: `const acceso = {
  movimientoReducido: false,
  temblor: 1,            // 0..1
  flashes: true,
  subtitulos: true,
  escalaTexto: 1,
  modoColor: "normal",
};

function movimientoEfectivo() {
  if (acceso.movimientoReducido) return {
    particulas: 0.25,
    temblor: 0,
    transicion: 0.05,
  };
  return {
    particulas: 1,
    temblor: acceso.temblor,
    transicion: 0.35,
  };
}

function alImpactar() {
  const cfg = movimientoEfectivo();
  crearParticulas(30 * cfg.particulas);
  sacudir(7 * cfg.temblor);
  if (acceso.subtitulos) subtitulo("[IMPACTO]");
}`,
    bullets: [
      "Movimiento reducido conserva información: reduce partículas, anula temblor y acelera transiciones.",
      "Los subtítulos también describen sonidos importantes: [alarma], [pasos detrás] o [puerta abierta].",
      "El daltonismo no se resuelve solo con filtros. Forma, iconos y texto deben comunicar lo mismo que el color.",
    ],
    tryIt: "Activa movimiento reducido; luego cambia el modo de color y comprueba que los iconos siguen diferenciándose.",
    apps: ["Celeste Assist Mode", "The Last of Us Part II", "Xbox Accessibility Guidelines"],
  },
];