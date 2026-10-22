/* ============================================================
   LECCIONES DE SISTEMAS DE PRODUCCIÓN:
   narrativa basada en datos y herramientas de depuración.
   ============================================================ */

import { Braces, GitBranch, ListChecks, Bug, Pause, Radio } from "lucide-react";
import type { Lesson } from "./moreSnippets";

export const NARRATIVE_LESSONS: Lesson[] = [
  {
    id: "dialogue-graph",
    file: "src/juego/narrativa/grafo.ts",
    title: "El diálogo es un grafo, no una escalera",
    icon: GitBranch,
    code: `interface NodoDialogo {
  id: string;
  quien: string;
  texto: string;
  elecciones: Eleccion[];
}

interface Eleccion {
  texto: string;
  destino: string | null; // null = termina la conversación
}

const nodos: NodoDialogo[] = [
  {
    id: "inicio",
    quien: "MIRA",
    texto: "¿Me ayudarás?",
    elecciones: [
      { texto: "Sí.", destino: "mision" },
      { texto: "¿Qué gano?", destino: "recompensa" },
      { texto: "No.", destino: "rechazo" },
    ],
  },
];

let nodoActual = "inicio";

function elegir(opcion: Eleccion) {
  nodoActual = opcion.destino; // saltar por el grafo, no por una lista
}`,
    bullets: [
      "Una lista solo permite avanzar; un grafo permite bifurcar, volver atrás, crear atajos y llegar a finales diferentes.",
      "Los IDs son más estables que los índices. Puedes reordenar el archivo sin romper ningún destino mientras 'mision' siga llamándose 'mision'.",
      "Separar contenido y motor permite que una persona escriba historias en JSON mientras otra programa el combate.",
    ],
    tryIt: "En el taller, cambia el destino de «Cuenta conmigo» a rechazo. La historia cambia sin modificar una sola línea del motor.",
    apps: ["Disco Elysium", "Baldur's Gate 3", "Ink / Yarn Spinner"],
  },
  {
    id: "conditions-effects",
    file: "src/juego/narrativa/condiciones.ts",
    title: "Condiciones y efectos: la memoria de la historia",
    icon: Braces,
    code: `interface Condicion {
  variable: string;
  operador: ">=" | "==" | "!=";
  valor: number | string | boolean;
}

interface Efecto {
  variable: string;
  operacion: "set" | "add" | "toggle";
  valor: number | string | boolean;
}

function disponible(c: Condicion, vars) {
  if (c.operador === ">=") return vars[c.variable] >= c.valor;
  if (c.operador === "==") return vars[c.variable] === c.valor;
  return vars[c.variable] !== c.valor;
}

function aplicar(e: Efecto, vars) {
  if (e.operacion === "set") vars[e.variable] = e.valor;
  if (e.operacion === "add") vars[e.variable] += e.valor;
  if (e.operacion === "toggle") vars[e.variable] = !vars[e.variable];
}

// Una opción puede pedir cristales y, al elegirse, entregar una llave.
const opcion = {
  condicion: { variable: "cristales", operador: ">=", valor: 3 },
  efectos: [{ variable: "tieneLlave", operacion: "set", valor: true }],
};`,
    bullets: [
      "La condición mira el pasado: ¿qué consiguió o decidió el jugador? El efecto escribe el futuro: ¿qué cambia después de responder?",
      "Reputación, romances, puertas, precios, finales y misiones son variables comunes interpretadas por sistemas distintos.",
      "Un conjunto pequeño de operaciones genéricas evita escribir una función especial para cada línea de diálogo.",
    ],
    tryIt: "Pon cristales = 3 en las variables de prueba: la respuesta bloqueada se habilita inmediatamente.",
    apps: ["Mass Effect (Paragon/Renegade)", "Fallout (checks de habilidad)", "The Witcher"],
  },
  {
    id: "graph-validation",
    file: "src/juego/narrativa/validar.ts",
    title: "Validar antes de que el jugador se pierda",
    icon: ListChecks,
    code: `function validar(proyecto) {
  const problemas = [];
  const ids = new Set(proyecto.nodos.map(n => n.id));

  // 1. destinos que no existen
  for (const nodo of proyecto.nodos) {
    for (const opcion of nodo.elecciones) {
      if (opcion.destino && !ids.has(opcion.destino))
        problemas.push("Destino roto: " + opcion.destino);
    }
  }

  // 2. nodos inalcanzables: recorrido DFS desde el inicio
  const vistos = new Set();
  function visitar(id) {
    if (vistos.has(id)) return;
    vistos.add(id);
    const nodo = proyecto.nodos.find(n => n.id === id);
    nodo?.elecciones.forEach(o => o.destino && visitar(o.destino));
  }
  visitar(proyecto.inicio);

  proyecto.nodos
    .filter(n => !vistos.has(n.id))
    .forEach(n => problemas.push("Inalcanzable: " + n.id));

  return problemas;
}`,
    bullets: [
      "Un diálogo puede tener cientos de nodos. Probar manualmente todas las rutas es imposible; un validador encuentra enlaces rotos en milisegundos.",
      "DFS (búsqueda en profundidad) recorre todos los destinos posibles desde el inicio. Lo que nunca visita está desconectado de la historia.",
      "Las herramientas no son un extra: cuanto más contenido tiene un juego, más importante es detectar errores automáticamente.",
    ],
    tryIt: "Añade un nodo nuevo y no lo conectes. El panel de validación lo marcará como inalcanzable.",
    apps: ["Editores de quests", "Compiladores narrativos", "Tests de contenido"],
  },
];

export const DEBUG_LESSONS: Lesson[] = [
  {
    id: "debug-render",
    file: "src/juego/debug/dibujar-debug.ts",
    title: "El render de debug es otra capa",
    icon: Bug,
    code: `function dibujarJuego(ctx) {
  dibujarFondo(ctx);
  dibujarEntidades(ctx);
  dibujarInterfaz(ctx);
}

function dibujarDebug(ctx, opciones) {
  if (opciones.cuadricula) dibujarCuadricula(ctx, 16);
  if (opciones.hitboxes) entidades.forEach(e => contorno(e.collider));
  if (opciones.vectores) entidades.forEach(e => flecha(e.pos, e.velocidad));
  if (opciones.ids) entidades.forEach(e => texto(e.id, e.pos));
  if (opciones.sensores) sensores.forEach(s => areaTransparente(s));
}

function dibujar(ctx) {
  dibujarJuego(ctx);        // lo que ve el jugador
  if (DEBUG) dibujarDebug(ctx, opciones); // lo que necesita el programador
}`,
    bullets: [
      "La información de debug no modifica el mundo: solo visualiza datos que ya existen. Por eso apagar hitboxes nunca cambia la colisión.",
      "Mantenerla en una capa separada permite excluirla de la versión final sin tocar el render jugable.",
      "Una caja visible revela en segundos por qué recibes daño 'sin tocar' al enemigo o por qué una moneda no se recoge.",
    ],
    tryIt: "Apaga hitboxes mientras corres: el juego sigue idéntico; solo perdiste la explicación visual.",
    apps: ["Gizmos de Unity", "Visible Collision Shapes de Godot", "DevTools de motores propios"],
  },
  {
    id: "frame-step",
    file: "src/juego/debug/tiempo.ts",
    title: "Pausa, cámara lenta y avance por frame",
    icon: Pause,
    code: `let pausado = false;
let escalaTiempo = 1;

function bucle(ahora) {
  const dtReal = (ahora - anterior) / 1000;

  if (!pausado)
    actualizar(dtReal * escalaTiempo); // 0.25 = cámara lenta; 2 = rápido

  dibujar(); // dibujar continúa incluso en pausa
  requestAnimationFrame(bucle);
}

function avanzarUnFrame() {
  if (!pausado) return;
  actualizar(1 / 60);       // exactamente 16,67 milisegundos
  dibujar();
}`,
    bullets: [
      "La cámara lenta no necesita cambiar cada velocidad: multiplica dt una sola vez y todo el mundo desacelera en proporción.",
      "En pausa seguimos dibujando para poder activar capas, mover el inspector y observar el estado congelado.",
      "Avanzar un frame permite ver el instante exacto en que una caja empieza a solaparse o grounded cambia de false a true.",
    ],
    tryIt: "Salta, pausa en el aire y usa «1 frame» hasta aterrizar. Observa velocity.y y grounded cambiar paso a paso.",
    apps: ["Frame Debugger de Unity", "Emuladores", "Replays deterministas"],
  },
  {
    id: "event-breakpoints",
    file: "src/juego/debug/eventos.ts",
    title: "Registro de eventos y breakpoints",
    icon: Radio,
    code: `const eventos = [];
let secuencia = 0;

function emitir(tipo, mensaje) {
  eventos.push({
    seq: ++secuencia,
    frame: frameActual,
    tipo,
    mensaje,
  });
  if (eventos.length > 100) eventos.shift(); // buffer circular simple
}

function recibirDaño(origen) {
  vida--;
  emitir("damage", "daño de " + origen);

  if (debug.pausaAlRecibirDaño)
    pausado = true; // breakpoint condicionado a un evento del juego
}

emitir("collision", "player toca block_A");
emitir("trigger", "coin_trigger: +10 puntos");`,
    bullets: [
      "Un log útil registra el frame y la categoría, no solo frases. Así puedes reconstruir el orden exacto: input, colisión, daño y respawn.",
      "Un breakpoint de juego pausa por una condición del mundo, no por una línea de JavaScript. Te entrega la escena en el momento del fallo.",
      "Los eventos también sirven para analítica, logros, sonido y tutoriales. Un buen sistema de eventos conecta sistemas sin acoplarlos.",
    ],
    tryIt: "Activa el breakpoint de daño y espera una bala. El mundo se congelará exactamente después de registrar el impacto.",
    apps: ["Consola de desarrollador", "Telemetría", "Sistemas de logros"],
  },
];