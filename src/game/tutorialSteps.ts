/* ============================================================
   LOS PASOS DEL PROYECTO GUIADO "CRONO JUMP".
   Cada paso: objetivo, código nuevo, explicación y checklist.
   ============================================================ */

import type { LucideIcon } from "lucide-react";
import {
  MonitorPlay,
  Footprints,
  ArrowUpFromLine,
  BrickWall,
  Coins,
  Flame,
  HeartCrack,
  Sparkles,
  Bug,
  Sparkle,
  FlagTriangleRight,
  PauseCircle,
  Layers3,
  Trophy,
} from "lucide-react";

export interface TutorialStep {
  n: number;
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  goal: string;
  code: string;
  bullets: string[];
  checklist: string[];
  controls: string[];
  tip?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    n: 1,
    id: "lienzo",
    icon: MonitorPlay,
    title: "El lienzo y el bucle",
    subtitle: "que la pantalla respire",
    goal: "Tener un canvas que se redibuje 60 veces por segundo con cielo, colinas y suelo. Sin esto no hay juego.",
    code: `// 1. Pedimos el lienzo y su "pincel" (contexto 2D)
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 480;   // resolución interna pequeña = pixel art nítido
canvas.height = 270;
ctx.imageSmoothingEnabled = false; // nada de píxeles borrosos

const SUELO_Y = 216;
let ultimo = performance.now();

function bucle(ahora) {
  // dt = segundos desde el fotograma anterior (tope por si hay lag)
  const dt = Math.min((ahora - ultimo) / 1000, 1 / 30);
  ultimo = ahora;

  actualizar(dt);   // 1) mover el mundo
  dibujar();        // 2) pintarlo

  requestAnimationFrame(bucle); // 3) repetir para siempre
}

function actualizar(dt) {
  // de momento no hay nada que mover... ¡paciencia!
}

function dibujar() {
  // cielo con degradado
  const cielo = ctx.createLinearGradient(0, 0, 0, 270);
  cielo.addColorStop(0, "#4f8fd6");
  cielo.addColorStop(1, "#dff6fb");
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, 480, 270);

  // suelo: tierra + una franja de hierba encima
  ctx.fillStyle = "#8a5a3b";
  ctx.fillRect(0, SUELO_Y + 6, 480, 270);
  ctx.fillStyle = "#4fae52";
  ctx.fillRect(0, SUELO_Y, 480, 6);
}

requestAnimationFrame(bucle); // ¡arranca!`,
    bullets: [
      "Un juego es un dibujo que se repinta sin parar. requestAnimationFrame le pide al navegador 'avísame antes del próximo fotograma'.",
      "dt (delta time) mide cuánto tardó el fotograma anterior. Todo movimiento se multiplicará por dt para ir igual de rápido en cualquier ordenador.",
      "Separar actualizar() y dibujar() desde el minuto uno es la mejor costumbre que puedes adquirir: lógica por un lado, pintura por otro.",
    ],
    checklist: [
      "Se ve cielo degradado, colinas y suelo con hierba",
      "El contador de FPS de la demo marca cerca de 60",
      "Todavía no hay personaje: es normal",
    ],
    controls: ["(aún no hay controles)"],
    tip: "Si tu canvas se ve borroso: resolución interna pequeña (480×270) + CSS grande + image-rendering: pixelated.",
  },
  {
    n: 2,
    id: "heroe",
    icon: Footprints,
    title: "El héroe y el movimiento",
    subtitle: "izquierda, derecha y cámara",
    goal: "Dibujar al personaje y moverlo con las flechas. La cámara lo sigue con suavidad por un nivel largo.",
    code: `const heroe = { x: 60, y: SUELO_Y, vx: 0, vy: 0, mira: 1 };
const teclas = {};
addEventListener("keydown", e => teclas[e.code] = true);
addEventListener("keyup",   e => teclas[e.code] = false);

let camX = 0;                 // desplazamiento de la cámara
const ANCHO_MUNDO = 1960;
const VELOCIDAD = 140;        // píxeles por segundo

function actualizar(dt) {
  // dirección: -1, 0 o 1
  const dir = (teclas.ArrowRight ? 1 : 0) - (teclas.ArrowLeft ? 1 : 0);

  // aceleración suave hacia la velocidad objetivo (se siente "con peso")
  heroe.vx += (dir * VELOCIDAD - heroe.vx) * Math.min(1, dt * 12);
  heroe.x  += heroe.vx * dt;
  if (dir !== 0) heroe.mira = dir;   // hacia dónde mira el sprite

  // no salirse del mundo
  heroe.x = Math.max(10, Math.min(ANCHO_MUNDO - 10, heroe.x));

  // CÁMARA: persigue al héroe sin saltos (interpolación)
  const objetivo = Math.max(0, Math.min(heroe.x - 480 * 0.42, ANCHO_MUNDO - 480));
  camX += (objetivo - camX) * (1 - Math.exp(-6 * dt));
}

// Al dibujar, todo lo del mundo se desplaza restando camX:
function dibujar() {
  pintarFondo(camX);
  dibujarSprite(ctx, heroe.x - camX, heroe.y, heroe.mira);
}`,
    bullets: [
      "No movemos la posición directamente: movemos la VELOCIDAD y ella mueve la posición. Así se consigue inercia en lugar de teletransporte.",
      "La cámara no sigue al héroe pegada: cada fotograma recorre una fracción de la distancia que le falta (lerp). Ese 'retraso' es lo que se siente profesional.",
      "Restar camX a todo lo que dibujas es LA regla del scroll: el mundo es enorme, la ventana es pequeña y se mueve.",
    ],
    checklist: [
      "El héroe camina con ← → (o A/D) y mira hacia donde va",
      "Las piernas se animan al correr",
      "La cámara se desplaza y el fondo hace parallax",
    ],
    controls: ["← → / A D moverse"],
    tip: "¿El personaje mira al revés? Dibuja el sprite espejado invirtiendo el índice de columna.",
  },
  {
    n: 3,
    id: "salto",
    icon: ArrowUpFromLine,
    title: "Gravedad y salto",
    subtitle: "el alma de un plataformas",
    goal: "Añadir gravedad, salto con ESPACIO y aterrizaje en el suelo. Tres líneas que cambian todo el género.",
    code: `const GRAVEDAD = 980;     // píxeles por segundo al cuadrado
const FUERZA_SALTO = 345;
let enElSuelo = true;
let bufferSalto = 0;      // pequeño truco de "perdón"

addEventListener("keydown", e => {
  if (e.code === "Space" && !e.repeat) bufferSalto = 0.12; // 120 ms
});

function actualizar(dt) {
  // ...movimiento horizontal del paso 2...

  // SALTO: la Y crece hacia abajo, así que subir es NEGATIVO
  if (bufferSalto > 0) bufferSalto -= dt;
  if (bufferSalto > 0 && enElSuelo) {
    heroe.vy = -FUERZA_SALTO;
    enElSuelo = false;
    bufferSalto = 0;
  }

  // GRAVEDAD: la velocidad vertical crece cada fotograma
  heroe.vy = Math.min(heroe.vy + GRAVEDAD * dt, 560); // 560 = velocidad límite
  heroe.y += heroe.vy * dt;

  // SUELO: si lo cruzamos, nos plantamos encima
  if (heroe.y >= SUELO_Y) {
    heroe.y = SUELO_Y;
    heroe.vy = 0;
    enElSuelo = true;
  }
}`,
    bullets: [
      "Saltar es poner la velocidad vertical en negativo de golpe. La gravedad, sumando cada fotograma, hace el resto de la curva. No hay ninguna animación de salto escrita a mano.",
      "El 'buffer de salto' guarda tu pulsación 0,12 s: si saltas un pelín antes de aterrizar, el juego te obedece igual. Los plataformas buenos están llenos de estas pequeñas mentiras piadosas.",
      "La velocidad límite (560) evita que una caída larga atraviese el suelo por ir demasiado rápido entre fotogramas.",
    ],
    checklist: [
      "ESPACIO hace saltar y el personaje cae solo",
      "No se puede saltar en el aire (todavía)",
      "Al caer, el sprite cambia a la pose de salto",
    ],
    controls: ["← → moverse", "ESPACIO saltar"],
    tip: "Prueba a cambiar GRAVEDAD a 500: tu juego se convierte en una aventura lunar.",
  },
  {
    n: 4,
    id: "obstaculos",
    icon: BrickWall,
    title: "Obstáculos del escenario",
    subtitle: "bloques, plataformas, pinchos y meta",
    goal: "Poblar el nivel con cajas sólidas sobre las que subir, pinchos que dañan y una bandera final.",
    code: `// El escenario es una LISTA DE CAJAS. Nada de magia.
const cajas = [
  { x: 300, y: SUELO_Y - 24, w: 30, h: 24, tipo: "bloque" },
  { x: 430, y: SUELO_Y - 48, w: 30, h: 48, tipo: "bloque" },
  { x: 520, y: SUELO_Y - 76, w: 64, h: 12, tipo: "bloque" }, // plataforma
  { x: 760, y: SUELO_Y - 12, w: 34, h: 12, tipo: "pincho" },
];

// ¿La caja del héroe toca esta caja? (AABB clásico)
function tocando(hx, hy, b) {
  return hx - 5 < b.x + b.w && hx + 5 > b.x &&
         hy - 18 < b.y + b.h && hy > b.y;
}

function actualizar(dt) {
  // 1) MOVER EN X y empujar hacia fuera si chocamos
  const nx = heroe.x + heroe.vx * dt;
  const chocaX = cajas.find(b => b.tipo === "bloque" && tocando(nx, heroe.y, b));
  if (chocaX) {
    heroe.x = heroe.vx > 0 ? chocaX.x - 5.01 : chocaX.x + chocaX.w + 5.01;
    heroe.vx = 0;
  } else heroe.x = nx;

  // 2) MOVER EN Y (siempre DESPUÉS, y por separado)
  const ny = heroe.y + heroe.vy * dt;
  const chocaY = cajas.find(b => b.tipo === "bloque" && tocando(heroe.x, ny, b));
  if (chocaY) {
    if (heroe.vy > 0) {            // caíamos: aterrizamos encima
      heroe.y = chocaY.y;
      enElSuelo = true;
    } else {                        // subíamos: cabezazo
      heroe.y = chocaY.y + chocaY.h + 18;
    }
    heroe.vy = 0;
  } else { heroe.y = ny; enElSuelo = false; }

  if (heroe.y >= SUELO_Y) { heroe.y = SUELO_Y; heroe.vy = 0; enElSuelo = true; }

  // 3) META
  if (heroe.x >= META_X) victoria = true;
}`,
    bullets: [
      "Resolver primero X y luego Y es EL secreto de los plataformas. Si lo haces a la vez, el personaje se engancha en las esquinas o atraviesa paredes.",
      "'Empujar hacia fuera' significa colocar al héroe justo en el borde del bloque y poner a cero su velocidad en ese eje. Dos líneas por eje.",
      "Los pinchos usan la misma función tocando(), pero en vez de bloquear, harán daño en el paso 7. Mismo dato, distinta consecuencia: eso es diseño.",
    ],
    checklist: [
      "Puedes subirte a los bloques y a las plataformas flotantes",
      "Al golpear un bloque por abajo, el salto se corta",
      "Al fondo del nivel hay una bandera roja",
    ],
    controls: ["← → moverse", "ESPACIO saltar"],
    tip: "Aún puedes caminar sobre los pinchos sin consecuencias: el daño llega en el paso 7.",
  },
  {
    n: 5,
    id: "monedas",
    icon: Coins,
    title: "Monedas y puntuación",
    subtitle: "la recompensa que da sentido al salto",
    goal: "Sembrar monedas por el nivel, recogerlas al tocarlas y llevar la cuenta de los puntos.",
    code: `const monedas = [
  { x: 200, y: SUELO_Y - 22, cogida: false, ph: 0 },
  { x: 445, y: SUELO_Y - 70, cogida: false, ph: 1 },
  // ...sembradas sobre bloques y plataformas
];
let puntos = 0;

function actualizar(dt) {
  for (const m of monedas) {
    if (m.cogida) continue;
    const my = m.y + Math.sin(t * 2.2 + m.ph) * 2;   // flotan un poquito

    // colisión sencilla por distancia (una moneda no necesita AABB)
    if (Math.abs(m.x - heroe.x) < 11 && my > heroe.y - 22 && my < heroe.y + 6) {
      m.cogida = true;         // deja de existir en el mundo
      puntos += 10;            // premio
      chispas(m.x, my, ["#ffd23f", "#ffffff"]);
      textoFlotante(m.x, my - 8, "+10");
      sonidoMoneda();
    }
  }
}

// La moneda "gira en 3D" cambiando solo su ANCHO (truco 2.5D):
function dibujarMoneda(m) {
  const giro = Math.abs(Math.sin(t * 2.8 + m.ph)); // 0 = de canto
  const anchos = [3, 5, 7, 8, 8, 8, 8, 7, 5, 3];
  anchos.forEach((w, fila) => {
    const ancho = Math.max(1, Math.round(w * giro));
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(m.x - ancho / 2 - camX, m.y + fila - 5, ancho, 1);
  });
}`,
    bullets: [
      "Recoger un objeto son tres pasos eternos: marcarlo como cogido, sumar la recompensa y dar feedback (chispas, número flotante, sonido).",
      "No todo necesita colisión AABB: para una moneda basta comparar distancias. Elegir la comprobación más barata que funcione también es programar.",
      "El giro de la moneda no es 3D: es el mismo dibujo con el ancho cambiando según un seno. Tu cerebro pone el volumen que falta.",
    ],
    checklist: [
      "Las monedas giran y flotan suavemente",
      "Al tocarlas suben los puntos del HUD y aparece '+10'",
      "Hay monedas premiando los saltos difíciles",
    ],
    controls: ["← → moverse", "ESPACIO saltar"],
    tip: "Coloca monedas donde quieras que el jugador vaya: son señales de tráfico disfrazadas de premio.",
  },
  {
    n: 6,
    id: "meteoritos",
    icon: Flame,
    title: "Proyectiles que caen",
    subtitle: "la mecánica estrella del juego",
    goal: "Lluvia de meteoritos verticales que aparecen cerca del jugador, avisan antes de caer y explotan contra el suelo.",
    code: `const meteoros = [];   // los que ya caen
const avisos  = [];    // marcas de peligro ANTES de caer
let relojSpawn = 1.6;

function actualizar(dt) {
  // 1) FÁBRICA: cada cierto tiempo, un aviso cerca del jugador
  relojSpawn -= dt;
  if (relojSpawn <= 0) {
    const x = heroe.x + (Math.random() * 300 - 120); // cerca, no encima
    avisos.push({ x, t: 0.85 });                     // 0,85 s para reaccionar
    // la dificultad sube sola: cada vez spawnean más rápido
    relojSpawn = Math.max(0.55, 1.7 - tiempoJugado * 0.012);
  }

  // 2) Cuando el aviso se agota, nace el meteorito arriba del todo
  for (const a of avisos) {
    a.t -= dt;
    if (a.t <= 0) meteoros.push({ x: a.x, y: -14, vy: 150 });
  }
  avisos = avisos.filter(a => a.t > 0);

  // 3) Caen acelerando (¡la misma gravedad del héroe!)
  for (const m of meteoros) {
    m.vy += 420 * dt;
    m.y  += m.vy * dt;

    if (m.y >= SUELO_Y) {        // impacto
      m.muerto = true;
      chispas(m.x, SUELO_Y, ["#ff7847", "#ffd23f"]);
      temblorDePantalla(3);
    }
  }
  meteoros = meteoros.filter(m => !m.muerto);
}`,
    bullets: [
      "El AVISO previo es lo que separa un juego justo de uno tramposo: 0,85 segundos de marca parpadeante bastan para que el jugador sienta que la culpa fue suya.",
      "Los meteoritos nacen cerca del héroe pero con desvío aleatorio: te persiguen sin ser imposibles. Un solo Math.random() bien colocado crea tensión constante.",
      "La curva de dificultad es una resta: el tiempo entre apariciones baja según los segundos jugados, con un mínimo para que nunca sea injusto del todo.",
    ],
    checklist: [
      "Aparecen marcas rojas parpadeantes en el suelo y un '!' arriba",
      "Tras el aviso cae un meteorito que explota al tocar el suelo",
      "Cuanto más tiempo pasa, más seguido caen",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "¡esquivar!"],
    tip: "Todavía no hacen daño: están ensayando. El golpe llega en el paso 7.",
  },
  {
    n: 7,
    id: "danio",
    icon: HeartCrack,
    title: "Daño, vidas e invulnerabilidad",
    subtitle: "que el peligro importe",
    goal: "Tres vidas, parpadeo tras el golpe y pantalla de GAME OVER. Ahora meteoritos y pinchos duelen de verdad.",
    code: `let vidas = 3;
let invulnerable = 0;    // segundos de gracia tras un golpe

function recibirGolpe() {
  if (invulnerable > 0) return;    // ya estamos heridos: ignorar
  vidas--;
  invulnerable = 1.4;              // 1,4 s para escapar del peligro
  heroe.vy = -170;                 // saltito de dolor
  temblorDePantalla(7);
  chispas(heroe.x, heroe.y - 10, ["#ff5d73", "#ffffff"]);
  sonidoGolpe();
  if (vidas <= 0) gameOver = true;
}

function actualizar(dt) {
  if (invulnerable > 0) invulnerable -= dt;

  // METEORITO contra héroe
  for (const m of meteoros) {
    if (Math.abs(m.x - heroe.x) < 10 &&
        m.y > heroe.y - 22 && m.y < heroe.y + 2) {
      m.muerto = true;
      recibirGolpe();
    }
  }

  // PINCHOS: misma función tocando() del paso 4
  for (const b of cajas) {
    if (b.tipo === "pincho" && tocando(heroe.x, heroe.y, b)) {
      heroe.vx = heroe.x < b.x ? -150 : 150;   // empujón hacia fuera
      recibirGolpe();
    }
  }
}

// Y al dibujar, el parpadeo de invulnerabilidad:
if (invulnerable <= 0 || Math.floor(t * 14) % 2 === 0) dibujarHeroe();`,
    bullets: [
      "La invulnerabilidad temporal es obligatoria: sin ella, un meteorito te quitaría las tres vidas en el mismo fotograma. Un simple temporizador arregla el juego entero.",
      "El parpadeo no es decoración: comunica al jugador que está a salvo unos instantes. Si el personaje parpadea, el jugador entiende las reglas sin leer nada.",
      "Reutilizamos tocando() del paso 4 para los pinchos. Escribir una buena función una vez y usarla en cinco sitios es la diferencia entre código y caos.",
    ],
    checklist: [
      "Los meteoritos y los pinchos restan una vida",
      "Tras el golpe el héroe parpadea y no puede volver a ser herido",
      "Al llegar a 0 vidas aparece GAME OVER (R para reiniciar)",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "R reiniciar"],
    tip: "Si el juego se siente cruel, sube la invulnerabilidad a 2 s. Afinar estos números ES diseño de juego.",
  },
  {
    n: 8,
    id: "pulido",
    icon: Sparkles,
    title: "Pulido final: jugo y victoria",
    subtitle: "partículas, temblor, sonido y final",
    goal: "Lo que convierte un prototipo en un juego: feedback por todas partes, pantalla de victoria y reinicio limpio.",
    code: `// 1. PARTÍCULAS: el condimento universal
function chispas(x, y, colores, n = 10) {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const vel = 20 + Math.random() * 50;
    particulas.push({
      x, y,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel - 30,
      vida: 0.5, color: colores[i % colores.length],
    });
  }
}

// 2. TEMBLOR DE PANTALLA: dos líneas, mucho impacto
function dibujar() {
  ctx.save();
  if (temblor > 0) ctx.translate((Math.random() - .5) * temblor,
                                 (Math.random() - .5) * temblor);
  // ...dibujar todo el juego...
  ctx.restore();
}

// 3. SONIDO 8-BIT sin archivos (WebAudio)
const audio = new AudioContext();
function bip(frecuencia, duracion, tipo = "square") {
  const osc = audio.createOscillator(), vol = audio.createGain();
  osc.type = tipo; osc.frequency.value = frecuencia;
  vol.gain.setValueAtTime(0.05, audio.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);
  osc.connect(vol).connect(audio.destination);
  osc.start(); osc.stop(audio.currentTime + duracion);
}

// 4. VICTORIA y REINICIO
if (heroe.x >= META_X) { victoria = true; fanfarria(); }

addEventListener("keydown", e => {
  if (e.code === "KeyR") reiniciar();   // vuelve a crear el estado inicial
});

function reiniciar() {
  heroe = { x: 60, y: SUELO_Y, vx: 0, vy: 0, mira: 1 };
  puntos = 0; vidas = 3; victoria = false; gameOver = false;
  monedas = crearMonedas();  // los datos se regeneran
  meteoros = []; avisos = []; particulas = [];
}`,
    bullets: [
      "El 'game feel' no está en los gráficos: está en el temblor de 7 píxeles, el número +10 que sube, el parpadeo y el bip. Son veinte líneas que valen por cien.",
      "Reiniciar bien significa volver a crear el estado inicial, no parchear variables sueltas. Si tu reinicio es una función que construye datos nuevos, nunca tendrás bugs fantasma.",
      "¡Y ya está! Bucle, entrada, física, colisiones, recompensas, enemigos, daño y final. Ese es el esqueleto completo de cualquier juego de acción 2D del mundo.",
    ],
    checklist: [
      "Todo tiene feedback: chispas, números, temblor y sonido",
      "Llegar a la bandera muestra ¡META! con los puntos",
      "R reinicia el nivel por completo",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "R reiniciar"],
    tip: "Este ya es un juego completo. Pero a un juego de verdad todavía le faltan seis sistemas: sigue al paso 9.",
  },
  {
    n: 9,
    id: "enemigos",
    icon: Bug,
    title: "Enemigos y combos",
    subtitle: "patrullar, pisar y encadenar",
    goal: "Slimes que patrullan entre dos puntos. Si los pisas rebotas y sumas combo; si los tocas de lado, duelen.",
    code: `// Un enemigo es un objeto con límites de patrulla.
const slimes = [
  { x: 520, vx: 32, min: 470, max: 600, muerto: 0 },
  { x: 980, vx: -30, min: 920, max: 1060, muerto: 0 },
];

let combo = 0, comboT = 0;

function actualizar(dt) {
  for (const s of slimes) {
    if (s.muerto > 0) { s.muerto -= dt; continue; }

    // 1. PATRULLA: rebota en los extremos invirtiendo la velocidad
    s.x += s.vx * dt;
    if (s.x < s.min) { s.x = s.min; s.vx = Math.abs(s.vx); }
    if (s.x > s.max) { s.x = s.max; s.vx = -Math.abs(s.vx); }

    // 2. ¿CHOCAMOS? la misma caja AABB de siempre
    const tocando = Math.abs(s.x - heroe.x) < 12 &&
                    heroe.y > SUELO_Y - 24;
    if (!tocando) continue;

    // 3. UN SOLO DATO decide si ganas o pierdes: la velocidad vertical
    if (heroe.vy > 55) {
      s.muerto = 3;             // reaparece en 3 segundos
      heroe.vy = -250;          // rebote: te devuelve al aire
      combo = Math.min(combo + 1, 8);
      comboT = 2;               // 2 s para encadenar el siguiente
      puntos += 50 * combo;     // x1, x2, x3...
    } else {
      heroe.vx = heroe.x < s.x ? -165 : 165;  // empujón
      recibirGolpe();
    }
  }
  if (comboT > 0 && (comboT -= dt) <= 0) combo = 0;
}`,
    bullets: [
      "La patrulla no necesita IA: dos límites y una multiplicación por -1. Ese 'rebote' es el movimiento enemigo más usado de la historia.",
      "Igual que con los meteoritos, es heroe.vy quien decide si el choque es victoria o daño. Un dato, dos reglas opuestas.",
      "El combo con temporizador premia la agresividad: encadenar enemigos vale mucho más que ir uno a uno. Así se diseña un incentivo.",
    ],
    checklist: [
      "Hay slimes verdes patrullando entre dos puntos",
      "Al caer sobre uno rebotas y aparece +50, +100, +150…",
      "Al tocarlos de lado pierdes una vida y sales empujado",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "R reiniciar"],
    tip: "Sube combo pisando dos slimes sin tocar el suelo: el HUD muestra el multiplicador en vivo.",
  },
  {
    n: 10,
    id: "powerups",
    icon: Sparkle,
    title: "Power-ups temporales",
    subtitle: "escudo e imán con cuenta atrás",
    goal: "Dos objetos que cambian las reglas durante unos segundos: el escudo absorbe un golpe y el imán atrae las monedas.",
    code: `let escudoT = 0, imanT = 0;

function recoger(power) {
  if (power.tipo === "escudo") escudoT = 8;   // 8 segundos
  else imanT = 7;
  power.cogido = true;
  power.respawn = 9;      // vuelve a aparecer: nada se pierde para siempre
}

function actualizar(dt) {
  if (escudoT > 0) escudoT -= dt;
  if (imanT > 0) imanT -= dt;

  // EFECTO 1 — el imán curva la trayectoria de las monedas hacia ti
  if (imanT > 0) {
    for (const m of monedas) {
      const dx = heroe.x - m.x, dy = heroe.y - 10 - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 90) {              // solo las cercanas
        m.x += (dx / dist) * 150 * dt;   // vector normalizado × velocidad
        m.y += (dy / dist) * 150 * dt;
      }
    }
  }
}

// EFECTO 2 — el escudo intercepta el daño ANTES de restar vida
function recibirGolpe() {
  if (escudoT > 0) {
    escudoT = 0;              // se consume
    invulnerable = 1;
    chispas("#5ce1e6");
    return;                   // ← la vida nunca se toca
  }
  vidas--;
}`,
    bullets: [
      "Un power-up no es un objeto especial: es una variable de tiempo que otras funciones consultan. Todo el 'poder' vive en ese número.",
      "Fíjate dónde se coloca el escudo: al principio de recibirGolpe(). Interceptar el daño antes de restar vida evita duplicar lógica por todo el código.",
      "Normalizar el vector (dx/dist, dy/dist) hace que el imán atraiga igual de rápido desde cualquier ángulo. Sin eso, las diagonales irían más rápido.",
    ],
    checklist: [
      "Hay un escudo azul y un imán rosa repartidos por el nivel",
      "Con escudo activo ves un aro y aguantas un golpe sin perder vida",
      "Con imán activo las monedas vuelan hacia ti",
      "El aro parpadea en el último segundo y el HUD muestra la cuenta atrás",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "R reiniciar"],
    tip: "Coge el escudo y métete a propósito en un pincho: verás cómo absorbe el golpe en vez de restarte vida.",
  },
  {
    n: 11,
    id: "checkpoints",
    icon: FlagTriangleRight,
    title: "Checkpoints y reaparición",
    subtitle: "perder sin frustrarse",
    goal: "Banderas que se activan al pasar y guardan el punto de reaparición. Perder ya no significa empezar de cero.",
    code: `const checkpoints = [
  { x: 640, activo: false },
  { x: 1240, activo: false },
];
let puntoDeReaparicion = 60;   // el inicio del nivel

function actualizar(dt) {
  // 1. ACTIVAR: basta con pasar por delante
  for (const cp of checkpoints) {
    if (cp.activo || heroe.x < cp.x) continue;
    cp.activo = true;
    puntoDeReaparicion = cp.x;    // ← el estado que importa
    chispas(cp.x, "#ffd23f");
    texto("¡CHECKPOINT!");
  }
}

// 2. USAR: al morir volvemos al último punto, no al principio
function recibirGolpe() {
  vidas--;
  if (vidas <= 0) return gameOver();

  heroe.x = puntoDeReaparicion;
  heroe.y = SUELO_Y - 30;      // un poco en el aire: entrada suave
  heroe.vx = 0; heroe.vy = 0;
  invulnerable = 1.6;          // margen para orientarse
}`,
    bullets: [
      "Un checkpoint es UNA variable: puntoDeReaparicion. La bandera dorada es solo la forma de comunicar al jugador que ese número cambió.",
      "Reaparecer con invulnerabilidad extra (1,6 s) evita el bucle cruel de morir una y otra vez en el mismo sitio sin poder reaccionar.",
      "Elegir dónde poner checkpoints ES diseño de dificultad: muy juntos y el juego aburre; muy lejos y el jugador abandona.",
    ],
    checklist: [
      "Hay postes grises que se vuelven dorados al pasar",
      "Si pierdes una vida reapareces en el último poste activado",
      "Aparece el texto '¡CHECKPOINT!' al activarlos",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "R reiniciar"],
    tip: "Activa el segundo checkpoint y déjate golpear: volverás allí mismo, no al principio del nivel.",
  },
  {
    n: 12,
    id: "pausa",
    icon: PauseCircle,
    title: "Menú de pausa",
    subtitle: "congelar el mundo con una variable",
    goal: "Pulsar E congela el juego y abre un menú navegable. El bucle sigue dibujando, pero deja de actualizar.",
    code: `let pausado = false, opcion = 0, latch = false;
const OPCIONES = ["CONTINUAR", "REINICIAR"];

function actualizar(dt) {
  // 'latch' evita que mantener la tecla abra y cierre el menú 60 veces/s
  if (pulsando("E") && !latch) { pausado = !pausado; opcion = 0; }
  latch = pulsando("E");

  if (pausado) {
    if (pulsando("←")) opcion = 0;
    if (pulsando("→")) opcion = 1;
    if (pulsoSalto) {
      if (opcion === 1) return reiniciar();
      pausado = false;
    }
    return;        // ← AQUÍ se congela el mundo entero
  }

  // ...toda la lógica del juego, que ya no se ejecuta en pausa
}

function dibujar() {
  dibujarJuego();           // seguimos pintando: la escena queda congelada
  if (pausado) dibujarMenuDePausa();  // encima
}`,
    bullets: [
      "La pausa es un 'return' temprano en update(). No hay que detener el bucle ni el navegador: simplemente dejas de mover cosas.",
      "Seguir dibujando en pausa es importante: el jugador ve la escena congelada detrás del menú y entiende que no perdió nada.",
      "El 'latch' (recordar si la tecla ya estaba pulsada) convierte una tecla mantenida en un único evento. Es el patrón que usarás en todos los menús.",
    ],
    checklist: [
      "Pulsar E abre un menú oscuro con dos opciones",
      "El mundo se queda completamente congelado detrás",
      "← → eligen opción y ESPACIO confirma",
    ],
    controls: ["← → moverse / elegir", "ESPACIO saltar / confirmar", "E pausar", "R reiniciar"],
    tip: "Pausa justo cuando un meteorito esté cayendo: verás la escena detenida al milímetro.",
  },
  {
    n: 13,
    id: "niveles",
    icon: Layers3,
    title: "Varios niveles y progresión",
    subtitle: "la bandera ya no es el final",
    goal: "Llegar a la meta carga el siguiente nivel conservando la puntuación. Tres niveles encadenados y un final real.",
    code: `let nivel = 1, transicion = 0;
const TOTAL_NIVELES = 3;

// Reiniciar el MUNDO sin reiniciar la PARTIDA: esa es la clave
function cargarNivel(conservarPuntos) {
  heroe = { x: 60, y: SUELO_Y, vx: 0, vy: 0 };
  cajas = crearCajas();
  monedas = crearMonedas();
  slimes = crearSlimes();
  meteoros = []; avisos = [];
  if (!conservarPuntos) puntos = 0;   // ...pero los puntos sobreviven
}

function actualizar(dt) {
  if (transicion > 0) {
    transicion -= dt;
    if (transicion <= 0) { nivel++; cargarNivel(true); }
    return;                 // pausa dramática entre niveles
  }

  if (heroe.x >= META_X) {
    if (nivel < TOTAL_NIVELES) {
      transicion = 1.4;     // 1,4 s de celebración
      puntos += 200;        // bonus por terminar
    } else {
      victoria = true;      // ¡el juego entero está completo!
    }
  }
}`,
    bullets: [
      "Separar 'reiniciar el mundo' de 'reiniciar la partida' es lo que permite encadenar niveles: unos datos se regeneran y otros (puntos, vidas) persisten.",
      "La transición de 1,4 segundos no es decorativa: da tiempo a leer el mensaje y evita que el jugador se sienta teletransportado.",
      "Con esta estructura añadir el nivel 4 es cambiar un número. Así crecen los juegos reales: el contenido se multiplica, el código no.",
    ],
    checklist: [
      "Al llegar a la bandera aparece 'NIVEL 1 COMPLETO' y arranca el 2",
      "La puntuación NO se reinicia entre niveles (+200 de bonus)",
      "El HUD muestra el nivel actual (1/3, 2/3, 3/3)",
      "Solo al terminar el nivel 3 aparece ¡META!",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "E pausar", "R reiniciar"],
    tip: "Fíjate en que los slimes y monedas vuelven a aparecer: el mundo se reconstruye, tu progreso no.",
  },
  {
    n: 14,
    id: "persistencia",
    icon: Trophy,
    title: "Récord guardado y cierre",
    subtitle: "que tu partida deje huella",
    goal: "Guardar la mejor puntuación en el navegador para que siga ahí mañana. El último sistema que convierte un prototipo en juego.",
    code: `const CLAVE = "mi-juego-record";

// localStorage es la base de datos más simple que existe:
// guarda texto y sobrevive al cerrar el navegador.
function cargarRecord() {
  try { return Number(localStorage.getItem(CLAVE)) || 0; }
  catch { return 0; }      // modo incógnito o permisos denegados
}

function guardarRecord(valor) {
  try { localStorage.setItem(CLAVE, String(valor)); }
  catch { /* no pasa nada: el juego sigue funcionando */ }
}

let record = cargarRecord();

function alGanar() {
  victoria = true;
  if (puntos > record) {
    record = puntos;
    guardarRecord(record);       // ← solo escribimos cuando hay mejora
    texto("¡NUEVO RÉCORD!");
  }
}

// ¿Quieres guardar la partida entera? El mismo patrón con un objeto:
// localStorage.setItem("partida", JSON.stringify({ nivel, puntos, vidas }));`,
    bullets: [
      "Envolver localStorage en try/catch no es paranoia: en modo incógnito o con cookies bloqueadas lanza error y tumbaría tu juego entero.",
      "Guardar solo cuando hay mejora evita escrituras innecesarias. El disco es lento comparado con la memoria: escribe poco y en momentos clave.",
      "Con JSON.stringify ese mismo mecanismo guarda la partida completa: nivel, puntos, vidas, objetos y posición. Es exactamente lo que hace el RPG de esta web.",
    ],
    checklist: [
      "El HUD muestra un récord que empieza en 0",
      "Al terminar, si superas la marca aparece '¡NUEVO RÉCORD!'",
      "Recarga la página: el récord sigue ahí",
    ],
    controls: ["← → moverse", "ESPACIO saltar", "E pausar", "R reiniciar"],
    tip: "Termina una partida, recarga el navegador y vuelve: tu récord te estará esperando. Eso es persistencia.",
  },
];
