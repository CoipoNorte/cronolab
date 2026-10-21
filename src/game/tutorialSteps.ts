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
    tip: "Ahora descarga el juego completo en un archivo .html y ábrelo: funciona sin internet y sin instalar nada.",
  },
];
