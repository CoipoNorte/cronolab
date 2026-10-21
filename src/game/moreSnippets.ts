/* ============================================================
   LECCIONES DE LOS NUEVOS EJEMPLOS + el puente a Unity.
   ============================================================ */

import type { LucideIcon } from "lucide-react";
import {
  Paintbrush,
  Stamp,
  Grid3x3,
  BrickWall,
  MessagesSquare,
  Keyboard,
  Swords,
  Repeat,
  Gamepad2,
  Layers,
  Footprints,
  Target,
  Hammer,
  Hourglass,
  ListOrdered,
  Map,
  ClipboardCheck,
  Save,
} from "lucide-react";

export interface Lesson {
  id: string;
  file: string;
  title: string;
  icon: LucideIcon;
  code: string;
  bullets: string[];
  tryIt?: string;
  apps: string[];
}

/* ---------- EDITOR DE SPRITES ---------- */
export const SPRITE_LESSONS: Lesson[] = [
  {
    id: "sprite-uses",
    file: "src/juego/usos-de-sprites.ts",
    title: "Un solo dato, mil usos",
    icon: Stamp,
    code: `// El MISMO mapa de píxeles sirve para todo: solo cambia
// la paleta y el contexto.

// un PERSONAJE jugable
dibujarSprite(ctx, HEROE, x, y, PALETA_HEROE);

// un NPC con la misma silueta pero otra paleta (skin gratis)
const PALETA_MALVADO = { ...PALETA_HEROE, T: "#d63a3a", H: "#23232f" };
dibujarSprite(ctx, HEROE, npcX, y, PALETA_MALVADO);

// un OBJETO del mundo
dibujarSprite(ctx, COFRE, 590, y, PALETA_COFRE);

// y el ESCENARIO también son sprites: un árbol dibujado
// 30 veces es un bosque, no 30 dibujos
for (const xArbol of bosque) dibujarSprite(ctx, ARBOL, xArbol, y, PALETA_ARBOL);`,
    bullets: [
      "Héroe, enemigo, cofre y árbol son el mismo formato de dato. Lo que los diferencia es el ROL que les das en la lógica (¿lo controla el jugador? ¿hace daño? ¿se abre?).",
      "Cambiar solo la paleta crea 'skins': así nacen el slime azul que es más fuerte, o los 40 soldados idénticos de la ciudad.",
      "El escenario se construye INSTANCIANDO: un árbol × 30 posiciones = un bosque. La memoria del juego solo guarda 30 coordenadas, no 30 dibujos.",
    ],
    tryIt: "Carga el preset Héroe, cámbiale la túnica a rosa… y cárgalo otra vez: notarás lo barato que es re-pintar un personaje.",
    apps: ["Chrono Trigger (soldados = mismo mapa, otra paleta)", "Pokémon (los shinies son literalmente otra paleta)"],
  },
  {
    id: "editor-loop",
    file: "src/juego/editor.ts",
    title: "El editor ES el juego",
    icon: Paintbrush,
    code: `// El editor de arriba no exporta imágenes:
// modifica EL MISMO array de strings que luego dibuja el juego.

function pintarCelda(fila: number, col: number, color: string) {
  const linea = sprite[fila];                 // "..GG.."
  sprite[fila] = linea.slice(0, col) + color + linea.slice(col + 1);
  //                                     ↑
  //        un string nuevo con UNA letra cambiada: eso es "pintar"
}

// y la vista previa lo usa tal cual, cada fotograma:
function vistaPrevia(tiempo: number) {
  const brinco = Math.abs(Math.sin(tiempo * 6)); // bob al caminar
  dibujarSprite(ctx, sprite, 60, 90 - brinco * 4, PALETA_EDITOR);
}`,
    bullets: [
      "Cuando un desarrollador dice 'herramientas', se refiere a cosas así: el mismo render del juego reutilizado para CREAR el contenido.",
      "Pintar es reescribir un carácter de un string. Dibujar es recorrer ese string. No hay magia intermedia: por eso el pixel art es genial para aprender.",
      "El botón 'copiar como código' te da tu dibujo en formato TypeScript listo para pegar en sprites.ts.",
    ],
    tryIt: "Pinta algo desde cero (¿una espada de 16×16?), dale a 'copiar como código' y descárgalo en el Centro de Descargas más abajo.",
    apps: ["El propio Mario Maker", "RPG Maker (lleva editores así desde 1992)"],
  },
];

/* ---------- PLATAFORMAS ---------- */
export const PLATFORM_LESSONS: Lesson[] = [
  {
    id: "tilemap",
    file: "src/juego/nivel.ts",
    title: "El nivel es un string",
    icon: Grid3x3,
    code: `// TILEMAP — el escenario de un plataformas es una tabla.
// Cada carácter = un bloque de 16×16 píxeles.

const NIVEL = [
  "........................",
  "........................",
  "..........oooo..........",   // monedas flotando
  ".........======.........",   // plataforma de ladrillos
  "........................",
  "....o................F..",   // F = la meta
  "######...################",  // suelo con un pozo
  "######...################",
];

// dibujar = doble bucle + un switch de "qué es cada letra"
for (let fila = 0; fila < NIVEL.length; fila++) {
  for (let col = 0; col < NIVEL[fila].length; col++) {
    const tile = NIVEL[fila][col];
    const x = col * 16, y = fila * 16;
    if (tile === "#") dibujarTierra(x, y);
    if (tile === "=") dibujarLadrillo(x, y);
    if (tile === "o") dibujarMoneda(x + 8, y + 8);
    if (tile === "F") dibujarBandera(x, y);
  }
}`,
    bullets: [
      "Diseñar niveles se convierte en escribir texto: mueves un '#' y mueves una pared. Así funcionan los editores de niveles de Mario Maker, solo que con interfaz bonita.",
      "El doble bucle (fila, columna) que dibuja el mapa es EL MISMO patrón del editor de sprites: recorrer una tabla y pintar. Aparece en todos lados.",
      "Los juegos reales usan exactamente esto, pero con números en vez de letras: JSON gigantes de tiles. El concepto es idéntico.",
    ],
    tryIt: "Cruza el pozo del nivel: técnicamente son dos caracteres '.' colocados en fila. Saltar vs programar: una letra puede matarte.",
    apps: ["Super Mario World", "Stardew Valley (la granja entera es un tilemap)"],
  },
  {
    id: "tile-collision",
    file: "src/juego/colision-tiles.ts",
    title: "Colisionar contra tiles",
    icon: BrickWall,
    code: `// ¿Cómo pisa el héroe un bloque? Preguntando al tilemap.
// Se resuelve en DOS pasos separados: X primero, Y después.

function esSolido(col: number, fila: number) {
  return NIVEL[fila]?.[col] === "#" || NIVEL[fila]?.[col] === "=";
}

// 1. MOVIMIENTO HORIZONTAL: si el borde entra en un bloque, lo expulsas
const borde = heroe.x + (vx > 0 ? +5 : -5);
if (esSolido(Math.floor(borde / 16), filaPies)) {
  heroe.x = Math.floor(borde / 16) * 16 - 6; // pega los pies a la pared
  vx = 0;
}

// 2. MOVIMIENTO VERTICAL: caer = aterrizar, subir = cabezazo
if (vy > 0 && esSolido(colPies, Math.floor((heroe.y + 1) / 16))) {
  heroe.y = Math.floor((heroe.y + 1) / 16) * 16;  // planta los pies ENCIMA
  vy = 0;
  enElSuelo = true;
}`,
    bullets: [
      "Separar X e Y es EL truco: si resolvieras ambas a la vez, el héroe se quedaría pegado a las paredes o atravesaría esquinas.",
      "'Expulsar' al personaje significa colocarlo justo en el borde del bloque y anular su velocidad en ese eje. Nada más sofisticado que eso.",
      "El signo '?' tras NIVEL[fila] evita errores si preguntas por tiles fuera del mapa (al caer al pozo, por ejemplo).",
    ],
    tryIt: "Camina contra una pared y salta bajo un ladrillo: el héroe nunca se superpone a un bloque. Esas dos líneas lo garantizan.",
    apps: ["Celeste (precisión de tiles al píxel)", "Spelunky (todo es una rejilla)"],
  },
];

/* ---------- EDITOR DE NIVELES ---------- */
export const LEVEL_EDITOR_LESSONS: Lesson[] = [
  {
    id: "level-editor",
    file: "src/juego/editor-de-niveles.ts",
    title: "Pinta el mundo, juégalo después",
    icon: Hammer,
    code: `// El editor de niveles es el HERMANO MAYOR del editor de sprites:
// mismo pincel, pero cada celda vale 16 píxeles de mundo.

const herramienta = "#"; // suelo, ladrillo, moneda, meta o borrador

function pintarTile(fila: number, col: number) {
  nivel[fila] = nivel[fila].slice(0, col) + herramienta + nivel[fila].slice(col + 1);
}

// AL PULSAR "JUGAR": el mismo array alimenta el motor. Sin exportar,
// sin compilar, sin salir del navegador:
botonJugar.onclick = () => {
  const juego = crearPlataformas(nivel); // ← TU nivel, en marcha
  arrancarBucle(juego);
};

// TRUCO PROFESIONAL: guarda tu obra en texto
localStorage.setItem("miNivel", JSON.stringify(nivel));
// …y compártela: un nivel cabe en un mensaje de chat.`,
    bullets: [
      "Editar y jugar usan EL MISMO motor: dibujar un '#' en el editor y colisionar contra él en el juego son dos caras del mismo string.",
      "Los primeros diseñadores de niveles trabajaban exactamente así: los mapas de Super Mario Bros. cabían en la memoria de un reloj Casio.",
      "Un tilemap es también UN FORMATO DE ARCHIVO: copiar el array en un mensaje de texto es literalmente exportar el nivel. Así nacieron los niveles compartidos por foros.",
    ],
    tryIt: "Dibuja un muro de suelo hasta el cielo, pulsa JUGAR e intenta superarlo. Luego agrega ladrillos-flotantes para hacerlo posible: acabas de iterar un nivel como un diseñador real.",
    apps: ["Super Mario Maker (esto, con presupuesto)", "Los mapas de Doom se diseñaban en rejillas parecidas"],
  },
];

/* ---------- DIÁLOGOS Y EVENTOS ---------- */
export const DIALOGUE_LESSONS: Lesson[] = [
  {
    id: "dialogue-state",
    file: "src/juego/dialogos.ts",
    title: "Máquina de estados mínima",
    icon: MessagesSquare,
    code: `// Todo NPC parlanchín del mundo funciona con una variable:
// ¿en qué "modo" estamos?

type Estado = "explorando" | "hablando";
let estado: Estado = "explorando";

function actualizar(dt: number) {
  if (estado === "explorando") {
    moverHeroe(dt);
    const cerca = npcs.find(n => Math.abs(n.x - heroe.x) < 22);
    if (cerca && pulso("E")) {
      dialogo = { lineas: cerca.lineas, pagina: 0 };
      estado = "hablando";       // ← el juego SE CONGELA aquí
    }
  } else {
    actualizarMaquinaDeEscribir(dt);
    if (pulso("E")) avanzarPagina();   // o cerrar si es la última
    if (!dialogo) estado = "explorando"; // devuelve el control
  }
}`,
    bullets: [
      "Una 'máquina de estados' suena a ingeniería espacial pero es un if: el mundo solo se mueve en modo explorar; en modo hablar, solo avanza el texto.",
      "¿Menús de pausa, inventarios, batallas por turnos, pantallas de game over? Todos son más estados de esta misma variable.",
      "Fíjate en el HUD: el chip cambia de 'explorando' a 'hablando' en tiempo real. Estás viendo la máquina de estados pensar.",
    ],
    tryIt: "Habla con la anciana y observa el HUD cambiar a 'hablando'. Intenta moverte: el héroe obedece al estado, no al teclado.",
    apps: ["Chrono Trigger (cada tienda y NPC)", "Undertale (cajas de texto con personalidad)"],
  },
  {
    id: "events",
    file: "src/juego/eventos.ts",
    title: "Eventos: zonas invisibles",
    icon: Keyboard,
    code: `// Un EVENTO AUTOMÁTICO es una caja invisible + un "ya pasó".
// Cinemáticas, trampas y jefes sorpresa usan este patrón.

const zonaEvento = { minX: 660, maxX: 716, disparado: false };

function comprobarEventos() {
  if (!zonaEvento.disparado && heroe.x > zonaEvento.minX && heroe.x < zonaEvento.maxX) {
    zonaEvento.disparado = true;      // importante: solo UNA vez
    empezarDialogo("??? (ZONA DE EVENTO)", [
      "¡EH! No pulsaste E y aun así estoy hablando.",
      "Así funcionan las trampas y las batallas sorpresa.",
    ]);
  }
}

// La máquina de escribir también es un evento, pero temporal:
dialogo.mostrados += dt * 45;                 // 45 letras por segundo
const texto = linea.slice(0, dialogo.mostrados);  // "recorta" el string

// pulsar E con texto incompleto → mostrar todo (¡perdona al impaciente!)
if (pulso("E") && dialogo.mostrados < linea.length)
  dialogo.mostrados = linea.length;`,
    bullets: [
      "La única diferencia entre UN NPC (manual) y un evento (automático) es quién llama a empezarDialogo(): tu tecla E o una coordenada.",
      "El booleano 'disparado' evita que el diálogo salte cada fotograma mientras estés dentro de la zona. Olvidarlo es un bug clásico de principiante.",
      "El efecto máquina de escribir es cortar un string un poco más cada fotograma. 'Slice' de texto + tiempo = drama cinematográfico barato.",
    ],
    tryIt: "Camina hasta el final de la pradera: hay pilares violetas. Entra sin pulsar nada y el evento te saluda solo.",
    apps: ["Zelda (cofres, puertas y jefes)", "Chrono Trigger (las escenas de trama son triggers)"],
  },
];

/* ---------- ARENA DE EVASIÓN ---------- */
export const ARENA_LESSONS: Lesson[] = [
  {
    id: "spawn",
    file: "src/juego/arena.ts",
    title: "Fábrica de enemigos",
    icon: Repeat,
    code: `// El "combate" es un ARRAY al que le nacen y le mueren cosas.

let slimes: Slime[] = [];
let temporizador = 1.5;

function actualizar(dt: number) {
  // 1. SPAWN: un temporizador que fabrica slimes
  temporizador -= dt;
  if (temporizador <= 0 && slimes.length < 6) {
    slimes.push(fabricarSlime());
    temporizador = Math.max(0.5, 1.5 - tiempoJugado * 0.02); // dificultad ↑
  }

  // 2. IA DE UNA SOLA NEURONA: saltar hacia el jugador
  for (const s of slimes) {
    if (s.enElSuelo && s.hayQueSaltar) {
      const direccion = Math.sign(heroe.x - s.x);  // ← hacia ti
      s.vx = direccion * s.velocidad;
      s.vy = -200;
    }
  }

  // 3. LIMPIEZA: quita los muertos de la lista
  slimes = slimes.filter(s => !s.eliminado);
}`,
    bullets: [
      "La dificultad progresiva es UNA multiplicación: el tiempo entre spawns baja con el tiempo jugado. Diseñar dificultad = afinar un número.",
      "Math.sign(heroe.x - slime.x) devuelve 1 o -1: es la 'IA' más barata que existe y ya produce persecución. Muchos jefes de 8 bits no son más listos que esto.",
      "filter() es el tanatorio del array: los objetos marcados como muertos salen. Alternativamente, reciclarlos con un 'pool' es la versión pro.",
    ],
    tryIt: "Sobrevive 30 segundos en la arena: el ritmo de aparición se acelera solo. Estás viendo la curva de dificultad actuar.",
    apps: ["Vampire Survivors (hordas infinitas así)", "Geometry Wars (spawn por oleadas)"],
  },
  {
    id: "combo",
    file: "src/juego/combo.ts",
    title: "El combo vive en el aire",
    icon: Swords,
    code: `// Diseñar el combo = decidir QUÉ lo incrementa y QUÉ lo rompe.
// Regla de Mario: encadenado en el aire, aterrizar = reset.

let combo = 0;

function alAplastar(slime: Slime) {
  combo++;
  puntos += combo;              // x1, x2, x3... cada pisotón vale más
  heroe.vy = -265;              // rebote: te devuelve el aire para encadenar
  texto("+ " + combo + "  x" + combo, slime.x, slime.y - 20);
}

function alAterrizar() {
  if (combo >= 2) texto("combo x" + combo + " guardado", heroe.x, suelo - 30);
  combo = 0;                    // el suelo perdona, pero cobra peaje
}

function alRecibirGolpe() {
  combo = 0;                    // dolerse también rompe la cadena
  corazones--;
}`,
    bullets: [
      "El sonido, la puntuación y el riesgo nacen de DOS líneas: combo++ al aplastar y combo=0 al tocar suelo. El resto es decoración.",
      "El rebote tras aplastar (vy negativa) es diseño puro: te premia con altura para buscar el siguiente enemigo. Mecánica y recompensa son lo mismo.",
      "¿El 'récord' persistente? localStorage: la base de datos más humilde del planeta. Guarda el mejor puntaje entre sesiones.",
    ],
    tryIt: "Encadena 4 pisotones sin tocar el suelo: el número que flota sobre tu héroe es la variable combo, en directo.",
    apps: ["Super Mario (pisotones encadenados = 1UP)", "Tony Hawk's Pro Skater (combos infinitos)"],
  },
];

/* ---------- AVENTURA CENITAL / QUESTS / GUARDADO ---------- */
export const TOPDOWN_LESSONS: Lesson[] = [
  {
    id: "topdown-move",
    file: "src/juego/movimiento-cenital.ts",
    title: "Moverse en cuatro direcciones",
    icon: Map,
    code: `// En un plataformas, Y pertenece a la gravedad.
// En un RPG cenital, X e Y obedecen al jugador.

let dx = (derecha ? 1 : 0) - (izquierda ? 1 : 0);
let dy = (abajo ? 1 : 0) - (arriba ? 1 : 0);

// ERROR clásico: una diagonal (1,1) mide 1.414, no 1.
// NORMALIZAR la convierte en un vector de longitud 1:
const longitud = Math.hypot(dx, dy);
if (longitud > 0) {
  dx /= longitud;
  dy /= longitud;
}

// Resolver cada eje por separado permite deslizarse por las paredes.
const siguienteX = heroe.x + dx * VELOCIDAD * dt;
if (!choca(siguienteX, heroe.y)) heroe.x = siguienteX;

const siguienteY = heroe.y + dy * VELOCIDAD * dt;
if (!choca(heroe.x, siguienteY)) heroe.y = siguienteY;`,
    bullets: [
      "Sin normalización, caminar en diagonal da una ventaja secreta del 41 %. Math.hypot calcula la longitud y dividir por ella deja todas las direcciones igual de rápidas.",
      "Resolver X e Y por separado vuelve a ser el truco maestro: al chocar diagonalmente contra un árbol, un eje se bloquea y el otro continúa. El personaje se desliza en vez de pegarse.",
      "La cámara usa exactamente el mismo lerp del juego lateral, pero ahora persigue dos coordenadas. Reutilizar una idea en otro contexto es arquitectura, no copiar.",
    ],
    tryIt: "Camina en diagonal alrededor del lago con W+D. La velocidad no aumenta y el héroe se desliza por la orilla en vez de quedarse clavado.",
    apps: ["Chrono Trigger (exploración 8 direcciones)", "Zelda: A Link to the Past"],
  },
  {
    id: "quest-state",
    file: "src/juego/misiones.ts",
    title: "Una misión es una variable con memoria",
    icon: ClipboardCheck,
    code: `type EstadoMision =
  | "sin_empezar"
  | "activa"
  | "regresar"
  | "llave"
  | "reliquia";

let mision: EstadoMision = "sin_empezar";
let cristales = 0;

function hablarConMira() {
  if (mision === "sin_empezar") {
    dialogo("Recoge tres cristales.");
    mision = "activa";
  } else if (mision === "activa") {
    dialogo("Llevas " + cristales + " de 3.");
  } else if (mision === "regresar") {
    inventario.push("llave del portal");
    mision = "llave";
  }
}

function recogerCristal() {
  cristales++;
  if (cristales === 3) mision = "regresar";
}`,
    bullets: [
      "La anciana no necesita inteligencia: necesita recordar en qué punto de la historia estás. El mismo NPC dice cosas distintas porque consulta una sola variable.",
      "Una misión es una máquina de estados como el diálogo y la batalla, pero dura horas o días. Por eso debe entrar en el archivo de guardado.",
      "El objetivo del HUD no está escrito aparte: es una función que TRADUCE el estado actual a texto. Los datos mandan; la interfaz interpreta.",
    ],
    tryIt: "Habla con MIRA antes, durante y después de recoger los tres cristales. Es el mismo sprite y la misma tecla E; solo cambió EstadoMision.",
    apps: ["The Witcher 3 (miles de estados de quest)", "Pokémon (medallas = llaves narrativas)"],
  },
  {
    id: "save-system",
    file: "src/juego/guardado.ts",
    title: "Guardar es convertir el mundo en texto",
    icon: Save,
    code: `interface Partida {
  escena: "pradera" | "ruinas";
  mision: EstadoMision;
  cristales: number[];
  tieneLlave: boolean;
  reliquia: boolean;
  x: number;
  y: number;
}

function guardar(partida: Partida) {
  // JSON.stringify convierte el objeto entero en un string.
  localStorage.setItem("mi-partida", JSON.stringify(partida));
}

function cargar(): Partida | null {
  const texto = localStorage.getItem("mi-partida");
  return texto ? JSON.parse(texto) : null; // reconstruye el objeto
}

// Guardamos después de CADA cambio importante, no cada fotograma:
recogerCristal();
guardar(estadoActual());`,
    bullets: [
      "Un archivo de guardado no contiene el mundo dibujado: guarda solo las decisiones irreversibles. Qué recogiste, qué puertas abriste, dónde estabas. Al cargar, el juego reconstruye el resto.",
      "JSON es texto con estructura y funciona en navegador, Unity, servidores y editores. Tu nivel exportado y tu partida guardada ya hablan el mismo idioma.",
      "Guardar cada fotograma desgasta disco y es innecesario. Los checkpoints naturales son eventos: recoger objeto, terminar diálogo, cambiar escena y completar misión.",
    ],
    tryIt: "Consigue un cristal, recarga la página y vuelve al juego: seguirá recogido. Pulsa R dentro del juego para borrar deliberadamente la partida.",
    apps: ["Stardew Valley (estado de toda la granja en un save)", "Hades (autoguardado después de cada sala)"],
  },
];

/* ---------- BATALLA ATB (combate por turnos) ---------- */
export const BATTLE_LESSONS: Lesson[] = [
  {
    id: "atb",
    file: "src/juego/atb.ts",
    title: "ATB: el tiempo rellena el menú",
    icon: Hourglass,
    code: `// ATB (Active Time Battle): nadie espera turnos por cortesía.
// Cada barra se llena SOLA con el tiempo real. Llena = tu turno.

let modo = "rellenando";

function actualizar(dt: number) {
  if (modo !== "rellenando") return;
  heroe.atb += heroe.velocidad * dt;   // 62/s: Crono es rápido
  jefe.atb  += jefe.velocidad  * dt;   // 40/s: el rey slime va pesado

  if (jefe.atb >= 100) empezarAtaqueDelJefe();
  else if (heroe.atb >= 100) modo = "menu";
}

// MODO ACTIVO (la firma de Chrono Trigger): el enemigo sigue
// cargando su turno MIENTRAS tú eliges en el menú:
if (modo === "menu") jefe.atb += jefe.velocidad * dt; // ¡decide rápido!

// al terminar tu acción, la barra vuelve a cero:
function terminarTurno() { heroe.atb = 0; modo = "rellenando"; }`,
    bullets: [
      ".ATB equilibra turnos y tensión: no es por turnos puro (hay prisa) ni acción pura (hay menú). Toda la magia está en dos números: velocidad de carga de cada bando.",
      "El 'modo Activo' castiga dudar; el 'modo Espera' congela al enemigo en los menús. Chrono Trigger te deja elegir: es una LÍNEA de código de diferencia.",
      "Estadísticas como 'velocidad' o 'prisa' en todos los JRPG son literalmente ese multiplicador de dt que ves ahí arriba.",
    ],
    tryIt: "No pulses nada en la batalla: la barra dorada del jefe seguirá llenándose y te pegará en medio del menú. Acabas de sentir el modo Activo.",
    apps: ["Chrono Trigger (elije Activo/Espera en su propio menú)", "Final Fantasy IV–IX (la dinastía ATB)"],
  },
  {
    id: "battle-menu",
    file: "src/juego/menu-combate.ts",
    title: "El menú = otra máquina de estados",
    icon: ListOrdered,
    code: `type Modo = "rellenando" | "menu" | "animando" | "fin";

// Navegar un menú = un índice + el operador módulo (%):
const OPCIONES = ["ATACAR", "CHISPA", "POCIÓN"];
if (pulso("←")) opcion = (opcion + OPCIONES.length - 1) % OPCIONES.length;
if (pulso("→")) opcion = (opcion + 1) % OPCIONES.length;
if (pulso("E")) ejecutar(OPCIONES[opcion]);

// ejecutar = fórmulas con cariño:
function atacar() {
  const critico = Math.random() < 0.15;          // 15% de crítico
  const dano = (8 + azar(0, 5)) * (critico ? 2 : 1);
  enemigo.hp -= dano;
  modo = "animando";   // el turno pasa a la "pantalla de animación"
}

// recursos limitados = decisiones, no botones:
function pocion() {
  if (stock <= 0) return mensaje("¡sin pociones!");
  heroe.hp = Math.min(heroe.hp + 14, heroe.maxHp); // curar sin pasarse
}`,
    bullets: [
      "Un menú de combate es idéntico a los diálogos que ya programaste: un índice que se mueve con las flechas y una acción al confirmar. Los JRPG reutilizan TODO.",
      "La fórmula de daño universal: base + azar + probabilidad de crítico ×2. Con esa receta se han construido 40 años de combates poéticos.",
      "Gestionar recursos (PM, pociones ×2) convierte un botón de 'ganar' en una decisión: ¿gasto 8 PM ahora o aguanto con ataques? Ésa es la estrategia.",
    ],
    tryIt: "Aguanta con pociones hasta la victoria: el juego al terminar te dice los turnos y PV restantes. El mismito final de un FF.",
    apps: ["Persona 5 (el menú ES el espectáculo)", "Pokémon (familia directa de esta fórmula)"],
  },
];

/* ---------- PUENTE A UNITY ---------- */
export const UNITY_LESSONS: Lesson[] = [
  {
    id: "unity-move",
    file: "Assets/Scripts/Movimiento2D.cs",
    title: "Movimiento y salto",
    icon: Gamepad2,
    code: `using UnityEngine;

public class Movimiento2D : MonoBehaviour
{
    public float velocidad = 6f;   // tu slider "velocidad de carrera"
    public float salto = 9f;       // tu slider "fuerza de salto"
    Rigidbody2D rb;                // Unity te da la gravedad ya hecha
    bool enElSuelo = true;

    void Start() => rb = GetComponent<Rigidbody2D>();

    void Update()   // ← nuestro requestAnimationFrame, una vez por frame
    {
        float dir = Input.GetAxisRaw("Horizontal");          // ← →
        rb.linearVelocity = new Vector2(dir * velocidad, rb.linearVelocity.y);

        if (Input.GetKeyDown(KeyCode.Space) && enElSuelo)
        {
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, salto);
            enElSuelo = false;
        }

        if (dir != 0)   // voltear = el "flip" de nuestro dibujarSprite
            transform.localScale = new Vector3(-Mathf.Sign(dir), 1, 1);
    }

    void OnCollisionEnter2D(Collision2D c)
    {
        if (c.gameObject.CompareTag("Suelo")) enElSuelo = true;
    }
}`,
    bullets: [
      "Update() se ejecuta una vez por fotograma: es literalmente nuestro bucle, pero Unity lo arranca por ti. Dentro, las mismas tres ideas: leer entrada, cambiar velocidad, comprobar suelo.",
      "Rigidbody2D sustituye a nuestra gravedad manual (vy += g·dt): Unity integra la física, tú solo empujas velocidades. Menos código, misma física.",
      "Input.GetAxisRaw('Horizontal') son nuestras flags input.left/input.right empaquetadas: Unity ya escucha flechas, WASD y mandos.",
    ],
    tryIt: "Descarga este script en el Centro de Descargas: va directo a tu primer proyecto de Unity sin retocar nada.",
    apps: ["Hollow Knight (hecho en Unity)", "Cuphead (hecho en Unity)"],
  },
  {
    id: "unity-parallax",
    file: "Assets/Scripts/Parallax.cs",
    title: "Parallax en 12 líneas",
    icon: Layers,
    code: `using UnityEngine;

public class Parallax : MonoBehaviour
{
    public Transform camara;
    [Range(0f, 1f)] public float factor = 0.3f; // ← tu slider de parallax
    Vector3 inicioPropio, inicioCamara;

    void Start()
    {
        inicioPropio = transform.position;
        inicioCamara = camara.position;
    }

    void LateUpdate()   // se ejecuta DESPUÉS de mover la cámara
    {
        float distancia = camara.position.x - inicioCamara.x;
        transform.position = new Vector3(
            inicioPropio.x + distancia * factor,   // ← la misma fórmula
            inicioPropio.y, inicioPropio.z);
    }
}`,
    bullets: [
      "La fórmula es IDÉNTICA a la web: desplazamiento = distancia de cámara × factor. Lo que era 'multiplicar camX por 0.3' ahora aparece en el Inspector como un slider público.",
      "LateUpdate() existe para que el fondo se mueva después de la cámara y no tiemble. Orden de ejecución: un detalle que importa en todo motor.",
      "El atributo [Range] convierte tu variable en un deslizador visual: Unity convierte tu 'panel de experimentos' en parte del editor.",
    ],
    apps: ["Ori and the Blind Forest (Unity)", "Shovel Knight Dig"],
  },
  {
    id: "unity-dialogue",
    file: "Assets/Scripts/DialogoNPC.cs",
    title: "Diálogos con triggers",
    icon: Footprints,
    code: `using UnityEngine;

public class DialogoNPC : MonoBehaviour
{
    public string[] lineas;      // tus "pages", editables en el Inspector
    public Sprite iconoCara;     // retrato opcional del NPC
    bool jugadorCerca;           // nuestra comprobación de "cerca"

    void Update()
    {
        if (jugadorCerca && Input.GetKeyDown(KeyCode.E))
            GestorDialogos.instancia.Mostrar(lineas, iconoCara);
    }

    // Unity ya trae las "zonas invisibles" hechas: un BoxCollider2D
    // marcado como "Is Trigger" llama a estas dos funciones solo:
    void OnTriggerEnter2D(Collider2D otro) => jugadorCerca = true;
    void OnTriggerExit2D(Collider2D otro)  => jugadorCerca = false;
}`,
    bullets: [
      "OnTriggerEnter2D es exactamente nuestra 'zona de evento': Unity la dibuja como una caja verde en el editor y llama a tu código cuando el jugador entra.",
      "La máquina de estados (explorando/hablando) viviría en GestorDialogos: misma variable enum, mismo patrón, solo escrito una vez para TODO el juego.",
      "El array público 'lineas' se edita sin tocar código: así trabajan guionistas y diseñadores sin abrir Visual Studio.",
    ],
    tryIt: "El if del Update es idéntico al de nuestro mini de diálogos. Lo copiaste del navegador a C# sin querer.",
    apps: ["Stardew Valley (diálogos con datos)", "Cualquier RPG de RPG Maker"],
  },
  {
    id: "unity-stomp",
    file: "Assets/Scripts/Pisoton.cs",
    title: "Combate por pisotón",
    icon: Target,
    code: `using UnityEngine;

public class Pisoton : MonoBehaviour
{
    void OnCollisionEnter2D(Collision2D c)
    {
        if (!c.gameObject.CompareTag("Enemigo")) return;

        // ¿caíamos encima? Unity nos da la NORMAL del contacto:
        // normal.y < -0.5 significa "lo toqué desde arriba"
        bool desdeArriba = c.GetContact(0).normal.y < -0.5f;

        if (desdeArriba)
        {
            Destroy(c.gameObject);         // slime aplastado
            var rb = GetComponent<Rigidbody2D>();
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, 6f);  // rebote
        }
        else
        {
            Vida.instancia.PerderCorazon(); // choque lateral = daño
        }
    }
}`,
    bullets: [
      "Nuestra comprobación 'vy > 40 y pies por encima' es manual; Unity te regala la normal del contacto, que dice la dirección exacta del choque. Mismo razonamiento, gratis.",
      "Destroy(gameObject) es el 'slimes = slimes.filter(muerto)' de Unity: saca al enemigo de la escena. Instantiate() sería el spawn.",
      "¿El combo? Una variable int en este script con las mismas dos reglas: ++ al pisar, = 0 al tocar el suelo. No cambia ni una coma.",
    ],
    apps: ["Shovel Knight (el pogo de la pala)", "Sonic (daño = perder anillos)"],
  },
  {
    id: "unity-quests",
    file: "Assets/Scripts/QuestManager.cs",
    title: "Misiones persistentes en Unity",
    icon: ClipboardCheck,
    code: `using UnityEngine;
using System;

public class QuestManager : MonoBehaviour
{
    public enum Estado { SinEmpezar, Activa, Regresar, Llave, Reliquia }
    public Estado estado = Estado.SinEmpezar;
    public int cristales = 0;
    public bool tieneLlave = false;
    public Transform jugador;
    public event Action OnMisionCambio; // el HUD escucha este evento

    public void Empezar()
    {
        if (estado != Estado.SinEmpezar) return;
        estado = Estado.Activa;
        Notificar();
    }

    public void RecogerCristal()
    {
        if (estado != Estado.Activa) return;
        cristales++;
        if (cristales >= 3) estado = Estado.Regresar;
        Notificar();
    }

    public void Entregar()
    {
        if (estado != Estado.Regresar) return;
        tieneLlave = true;
        estado = Estado.Llave;
        Notificar();
    }

    void Notificar()
    {
        OnMisionCambio?.Invoke();
        SaveSystem.Guardar(this);
    }
}`,
    bullets: [
      "El enum Estado es nuestra unión de strings, pero Unity la muestra como desplegable en el Inspector. Puedes saltar manualmente a una fase para probarla.",
      "El evento OnMisionCambio desacopla misión e interfaz: QuestManager no conoce el HUD; anuncia un cambio y quien esté escuchando se actualiza.",
      "Guardar vive al lado de los cambios importantes. Esta arquitectura evita olvidarte de persistir un cristal o una llave.",
    ],
    apps: ["Unity RPG Starter Kit", "Sistemas de quests con ScriptableObjects"],
  },
  {
    id: "unity-save",
    file: "Assets/Scripts/SaveSystem.cs",
    title: "SaveSystem con JSON",
    icon: Save,
    code: `using UnityEngine;
using System.IO;

public static class SaveSystem
{
    [System.Serializable]
    public class Datos
    {
        public int estadoMision;
        public int cristales;
        public bool tieneLlave;
        public float x, y;
    }

    static string Ruta => Path.Combine(Application.persistentDataPath, "partida.json");

    public static void Guardar(QuestManager q)
    {
        var p = q.jugador != null ? q.jugador.position : Vector3.zero;
        var datos = new Datos {
            estadoMision = (int)q.estado,
            cristales = q.cristales,
            tieneLlave = q.tieneLlave,
            x = p.x, y = p.y
        };
        File.WriteAllText(Ruta, JsonUtility.ToJson(datos, true));
    }

    public static Datos Cargar()
    {
        if (!File.Exists(Ruta)) return null;
        return JsonUtility.FromJson<Datos>(File.ReadAllText(Ruta));
    }
}`,
    bullets: [
      "JsonUtility.ToJson es el JSON.stringify de Unity; FromJson es JSON.parse. La idea es exactamente igual a la demo del navegador.",
      "Application.persistentDataPath elige una carpeta segura en Windows, macOS, Android o consola. Tu código no necesita saber dónde guarda cada sistema.",
      "[Serializable] autoriza a Unity a convertir esa clase en texto. Guarda datos simples, nunca GameObjects ni referencias de escena.",
    ],
    tryIt: "Descarga el pack Unity: QuestManager.cs y SaveSystem.cs ya viajan juntos en Assets/Scripts.",
    apps: ["Autoguardado multiplataforma", "Base para múltiples ranuras de partida"],
  },
];

/* ---------- DICCIONARIO WEB ↔ UNITY ---------- */
export const UNITY_MAP: { web: string; unity: string }[] = [
  { web: "requestAnimationFrame + dt", unity: "void Update() + Time.deltaTime" },
  { web: "fillRect / drawPixels", unity: "SpriteRenderer + Sprite Editor" },
  { web: "flags input.left / input.right", unity: 'Input.GetAxisRaw("Horizontal")' },
  { web: "vy += gravedad * dt manual", unity: "Rigidbody2D + gravityScale" },
  { web: "AABB con 4 comparaciones", unity: "BoxCollider2D + OnTriggerEnter2D" },
  { web: "camX × factor por capa", unity: "script Parallax en LateUpdate()" },
  { web: "nivel como array de strings", unity: "Tilemap + Tile Palette" },
  { web: "estado 'walk' | 'talk'", unity: "enum Estado + máquina de estados" },
  { web: "zona de evento invisible", unity: "Collider 'Is Trigger' + OnTriggerEnter2D" },
  { web: "tone() de WebAudio", unity: "AudioSource.Play() + AudioMixer" },
  { web: "localStorage + JSON", unity: "JsonUtility + persistentDataPath" },
  { web: "estado de misión (string)", unity: "enum Estado + QuestManager" },
];
