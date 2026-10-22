import { Dices, Gamepad2, PackageOpen, Video } from "lucide-react";
import type { Lesson } from "./moreSnippets";

export const ADVANCED_LESSONS: Lesson[] = [
  {
    id: "seeded-generation",
    file: "src/juego/avanzado/generacion-procedural.ts",
    title: "Aleatorio reproducible por semilla",
    icon: Dices,
    code: `function crearAleatorio(semilla: number) {
  let estado = semilla;
  return () => {
    estado += 0x6d2b79f5;
    let t = estado;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const azar = crearAleatorio(hash("MI-NIVEL-42"));

// paseo aleatorio LIMITADO: nunca cambia más de un tile
for (let x = 1; x < ancho; x++) {
  const paso = elegir([-1, 0, 1], azar);
  superficie[x] = clamp(superficie[x - 1] + paso, 5, suelo);
}

// La misma semilla genera exactamente el mismo nivel.
// Un bug procedural puede reproducirse y compartirse.
console.log(generar("MI-NIVEL-42") === generar("MI-NIVEL-42"));`,
    bullets: [
      "Math.random cambia cada vez y vuelve imposibles los bugs reproducibles. Un PRNG por semilla genera siempre la misma secuencia.",
      "Procedural no significa caótico: primero se construye una ruta garantizada; después se decora con monedas, enemigos y plataformas.",
      "La semilla es una dirección compacta del nivel: puedes compartir mundos enteros escribiendo una palabra.",
    ],
    tryIt: "Escribe una semilla, exporta el nivel, cambia a otra y vuelve a la primera: el mapa será idéntico.",
    apps: ["Minecraft", "Spelunky", "Roguelikes diarios"],
  },
  {
    id: "input-actions",
    file: "src/juego/avanzado/input-actions.ts",
    title: "Acciones, no teclas",
    icon: Gamepad2,
    code: `type Accion = "left" | "right" | "jump" | "dash" | "pause";

const controles: Record<Accion, string[]> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp"],
  dash: ["ShiftLeft"],
  pause: ["Escape"],
};

function estaPulsada(accion: Accion, teclas: Set<string>) {
  return controles[accion].some(codigo => teclas.has(codigo));
}

// El jugador reasigna SALTO a KeyJ. La física no cambia:
controles.jump[0] = "KeyJ";
if (estaPulsada("jump", teclas)) heroe.saltar();

// Detectar conflictos antes de guardar:
const usos = new Map<string, Accion[]>();
for (const accion in controles)
  for (const codigo of controles[accion])
    usos.set(codigo, [...(usos.get(codigo) ?? []), accion]);`,
    bullets: [
      "La física pregunta por jump, nunca por Space. Así teclado, mando, pantalla táctil y accesibilidad alimentan la misma acción.",
      "Un código puede estar asignado a dos acciones; detectarlo antes de guardar evita que saltar abra el menú o pause el juego.",
      "Guardar el mapa como JSON permite perfiles por jugador y sincronización en la nube.",
    ],
    tryIt: "Pulsa «reasignar salto», toca J y prueba el visualizador. Después asigna J al dash para provocar un conflicto visible.",
    apps: ["Input System de Unity", "InputMap de Godot", "Soporte para mandos"],
  },
  {
    id: "crafting-economy",
    file: "src/juego/avanzado/crafting.ts",
    title: "Inventario, peso y recetas",
    icon: PackageOpen,
    code: `const recetaPocion = {
  inputs: { hierba: 3, cristal: 1 },
  output: { id: "pocion", cantidad: 1 },
};

function puedeFabricar(inv, receta) {
  return Object.entries(receta.inputs)
    .every(([id, cantidad]) => (inv.items[id] ?? 0) >= cantidad);
}

function fabricar(inv, receta) {
  if (!puedeFabricar(inv, receta)) return inv;

  // Trabajamos sobre copias: deshacer y guardar son mucho más seguros.
  let siguiente = { ...inv, items: { ...inv.items } };
  for (const [id, cantidad] of Object.entries(receta.inputs))
    siguiente.items[id] -= cantidad;

  siguiente.items[receta.output.id] =
    (siguiente.items[receta.output.id] ?? 0) + receta.output.cantidad;
  return siguiente;
}

function comprar(inv, item) {
  if (inv.monedas < item.precio || peso(inv) + item.peso > inv.maxPeso) return inv;
  return añadir({ ...inv, monedas: inv.monedas - item.precio }, item.id);
}`,
    bullets: [
      "Crafting, tiendas y loot comparten el mismo núcleo: consultar cantidades, validar restricciones y devolver un inventario nuevo.",
      "El peso máximo convierte recoger todo en una decisión. Los objetos clave pesan cero para que nunca bloqueen la historia.",
      "Funciones inmutables facilitan guardar, deshacer y probar; el estado anterior sigue existiendo si la operación falla.",
    ],
    tryIt: "Fabrica una poción, vende materiales y compra botas. Intenta superar el peso máximo para ver cómo la operación se rechaza.",
    apps: ["Minecraft", "Resident Evil", "Sistemas de tiendas RPG"],
  },
  {
    id: "replay-telemetry",
    file: "src/juego/avanzado/replay.ts",
    title: "Replay determinista y telemetría",
    icon: Video,
    code: `interface FrameGrabado {
  frame: number;
  input: { left: boolean; right: boolean; jump: boolean };
}

const replay: FrameGrabado[] = [];

function grabar(frame, input) {
  replay.push({ frame, input: { ...input } });
}

function reproducir(frame) {
  const grabado = replay[frame]?.input ?? inputVacio;
  actualizar(1 / 60, grabado); // dt FIJO: mismo input, mismo resultado
}

// Telemetría: hechos del juego, no vídeo ni datos personales.
function evento(tipo, x) {
  telemetria.push({ frame, tipo, x });
}

evento("damage", heroe.x);
evento("death", heroe.x);

// Agrupa muertes por zonas: el pico revela dónde se atasca la gente.
const zona = Math.floor(x / anchoMundo * 12);
mapaDeCalor[zona]++;`,
    bullets: [
      "Un replay guarda entradas, no imágenes. Con dt fijo y simulación determinista, unos pocos kilobytes reconstruyen minutos de juego.",
      "El fantasma permite competir contra tu mejor intento y también reproduce bugs exactamente como ocurrieron.",
      "La telemetría de diseño cuenta saltos, daño y zonas de muerte. No necesita nombres, correos ni información personal.",
    ],
    tryIt: "Graba unos segundos moviéndote y saltando; reproduce el fantasma y compara sus coordenadas con las tuyas.",
    apps: ["Ghosts de Mario Kart", "Replays de juegos de lucha", "Heatmaps de playtesting"],
  },
];