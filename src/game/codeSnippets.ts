/* ============================================================
   LOS FRAGMENTOS QUE SE MUESTRAN EN LA WEB.
   Son versiones simplificadas del motor real que está corriendo
   el juego, con comentarios pensados para quien NUNCA programó.
   ============================================================ */

import type { LucideIcon } from "lucide-react";
import {
  RefreshCw,
  MoveVertical,
  Grid2x2,
  Layers,
  Boxes,
  Music4,
} from "lucide-react";

export interface Snippet {
  id: string;
  file: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  code: string;
  plain: string[];
  tryIt: string;
  apps: string[];
}

export const SNIPPETS: Snippet[] = [
  {
    id: "loop",
    file: "src/juego/bucle.ts",
    title: "El bucle del juego",
    subtitle: "el corazón que late 60 veces por segundo",
    icon: RefreshCw,
    code: `// EL BUCLE PRINCIPAL — sin esto no hay juego, hay una foto.
// requestAnimationFrame = "navigador, llámame antes del próximo fotograma"

let ultimoInstante = performance.now();

function bucleDelJuego(ahora: number) {
  // delta time: cuántos SEGUNDOS pasaron desde el fotograma anterior
  const dt = Math.min((ahora - ultimoInstante) / 1000, 1 / 30);
  ultimoInstante = ahora;

  actualizar(dt);          // 1. mueve todo un pasito
  dibujar(ctx);            // 2. pinta el resultado

  requestAnimationFrame(bucleDelJuego); // 3. y otra vez, y otra vez...
}

requestAnimationFrame(bucleDelJuego);   // arranca la primera vuelta`,
    plain: [
      "Un videojuego es una película que se dibuja a mano 60 veces por segundo. En cada fotograma: primero movemos las cosas (actualizar), luego las pintamos (dibujar).",
      "dt (delta time) es el tiempo real que tardó el último fotograma. Multiplicamos los movimientos por dt para que el héroe corra igual de rápido en un PC potente que en uno lento.",
      "requestAnimationFrame es del navegador: te llama justo cuando toca dibujar otra vez. No necesitas instalar nada para usarlo.",
    ],
    tryIt: "Mira el contador FPS de la esquina de la pantalla del juego: eso es cuántas vueltas da este bucle por segundo.",
    apps: ["Celeste (60 fps clavados)", "Vampire Survivors (miles de actualizaciones por frame)"],
  },
  {
    id: "physics",
    file: "src/juego/fisicas.ts",
    title: "Físicas: correr y saltar",
    subtitle: "gravedad, velocidad y un buen salto",
    icon: MoveVertical,
    code: `// FÍSICAS — tres líneas de matemáticas = sensación de juego.

function actualizar(e: Estado, dt: number) {
  // 1. CAMINAR: izquierda/derecha fija la velocidad objetivo
  const dir = (tecla.derecha ? 1 : 0) - (tecla.izquierda ? 1 : 0);
  heroe.vx = dir * VELOCIDAD; // píxeles por segundo

  // 2. SALTAR: solo si toca el suelo, impulso hacia ARRIBA
  //    (en pantalla, la Y crece hacia abajo: arriba = negativo)
  if (tecla.salto && heroe.enElSuelo) {
    heroe.vy = -FUERZA_SALTO;
    heroe.enElSuelo = false;
  }

  // 3. GRAVEDAD: la velocidad vertical crece cada fotograma
  heroe.vy += GRAVEDAD * dt;

  // 4. INTEGRAR: posición nueva = posición + velocidad × tiempo
  heroe.x += heroe.vx * dt;
  heroe.y += heroe.vy * dt;

  // 5. SUELO: si caemos por debajo, nos plantamos en él
  if (heroe.y >= SUELO_Y) {
    heroe.y = SUELO_Y;
    heroe.vy = 0;
    heroe.enElSuelo = true;
  }
}`,
    plain: [
      "La posición nunca se mueve 'de golpe': movemos la velocidad, y la velocidad mueve la posición. Esa separación es el truco de TODA la física de videojuegos.",
      "Saltar es simplemente poner la velocidad vertical en un número negativo grande. La gravedad se encarga de bajarte de vuelta.",
      "El suelo es una línea invisible (SUELO_Y). Si el héroe la cruza, lo devolvemos justo a la línea. Así de humilde es la 'física' de un plataformas.",
    ],
    tryIt: "Mueve el slider GRAVEDAD a 500 y salta: flotarás como en la Luna. Pon la FUERZA DE SALTO a 500 y serás un cohete.",
    apps: ["Super Meat Boy (gravedad brutal = dificultad)", "Celeste (el 'coyote time' es física mimada)"],
  },
  {
    id: "sprite",
    file: "src/juego/sprites.ts",
    title: "Sprites dibujados con datos",
    subtitle: "tu personaje es un array de letras",
    icon: Grid2x2,
    code: `// SPRITES — un dibujo es solo una tabla de letras y colores.
// Cada letra = un píxel de un color. El punto = transparente.

const HEROE_ANDA_A = [
  "....PPPPPPPP....",
  "...PPPPPPPPP....",
  "..PPPP...PPPP...",   // una pierna adelante
  "..PPP.....PPPP..",
  ".PPP.......PPP..",
  "OOOO........OOO.",   // O = color bota
];

const PALETA = {
  P: "#3d4a7a",   // pantalón
  O: "#5a3b2a",   // botas
  S: "#ffcf9e",   // piel
  H: "#ff7847",   // pelo
};

function dibujarSprite(ctx, mapa, x, y) {
  for (let fila = 0; fila < mapa.length; fila++) {
    for (let col = 0; col < mapa[fila].length; col++) {
      const letra = mapa[fila][col];
      if (letra === ".") continue;          // hueco transparente
      ctx.fillStyle = PALETA[letra];        // letra → color
      ctx.fillRect(x + col, y + fila, 1, 1); // 1 píxel
    }
  }
}

// ANIMAR = alternar mapas: piernaA, piernaB, piernaA, piernaB...
const fotograma = Math.floor(tiempo * 6) % 2;
dibujarSprite(ctx, fotograma ? ANDA_A : ANDA_B, x, y);`,
    plain: [
      "Así se hacían los juegos de la SNES: el arte eran datos. Cambia una letra por otra en el array y cambias un píxel del personaje.",
      "La animación de caminar no es un vídeo: son 2 dibujos casi iguales alternados muy rápido. Tiempo * 6 redondeado da 0,1,0,1… y con eso elegimos qué dibujo toca.",
      "fillRect(x, y, 1, 1) pinta un cuadrado de 1×1: un píxel. El héroe entero son unos 150 fillRect por fotograma.",
    ],
    tryIt: "Pasa por la sección EL EDITOR: puedes repintar este mismo sprite con el ratón y verlo caminar en vivo.",
    apps: ["Chrono Trigger (cada NPC es un mapa así)", "Final Fantasy VI (sprites de 16×24)"],
  },
  {
    id: "parallax",
    file: "src/juego/parallax.ts",
    title: "Parallax: la ilusión 2.5D",
    subtitle: "profundidad falsa con 4 capas y una multiplicación",
    icon: Layers,
    code: `// PARALLAX — el cerebro asume que lo lejano se mueve más
// lento. Lo imitamos moviendo cada capa una FRACCIÓN de la cámara.

function dibujarFondo(camX: number) {
  dibujarNubes(camX * 0.06);     // casi quietas = muy lejos
  dibujarMontanas(camX * 0.16);  // lentas = lejos
  dibujarColinas(camX * 0.34);   // velocidad media
  dibujarArboles(camX * 0.55);   // más rápidos = más cerca
  dibujarSuelo(camX * 1.0);      // se mueve exacto con la cámara
  dibujarHiervaFrontal(camX * 1.18); // ¡más rápido = DELANTE!
}

// Y la cámara sigue al héroe suavemente (lerp = interpolar):
function actualizarCamara(dt: number) {
  const objetivo = heroe.x - PANTALLA_W * 0.42; // héroe algo a la izquierda
  const k = 1 - Math.exp(-6 * dt);              // suavizado exponencial
  camara.x += (objetivo - camara.x) * k;        // acércate un 10% cada frame
}

// EXTRA 2.5D: la moneda "gira en 3D" solo cambiando su ancho:
const giro = Math.abs(Math.sin(tiempo * 2.8)); // 0 = de canto
const ancho = Math.round(8 * giro);            // …y vuelve a ser redonda`,
    plain: [
      "No hay ningún 3D real: todo es 2D plano. Lo único 3D es la sensación, y viene de una multiplicación distinta por capa. Por eso se llama 2.5D.",
      "La hierba del primer plano se mueve MÁS rápido que el héroe (factor 1.18), así tu cerebro la coloca delante de él. Es el mismo truco que mira por la ventanilla del coche.",
      "La cámara con lerp nunca salta: cada fotograma recorre un porcentaje de la distancia que le falta. Resultado: movimiento mantecoso.",
    ],
    tryIt: "Arrastra el slider PARALLAX a 0: todas las capas se pegan y la magia desaparece. Súbelo a 2 y el mundo se vuelve casi psicodélico.",
    apps: ["Castlevania: Symphony of the Night", "Sonic the Hedgehog (los fondos de Green Hill)"],
  },
  {
    id: "collisions",
    file: "src/juego/colisiones.ts",
    title: "Colisiones: tocar cosas",
    subtitle: "monedas, enemigos y la meta",
    icon: Boxes,
    code: `// COLISIONES — la pregunta favorita de los videojuegos:
// "¿están estos dos rectángulos tocándose?"

function seTocan(a: Caja, b: Caja) {
  // AABB (Axis-Aligned Bounding Box): 4 comparaciones y listo
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
         Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

for (const moneda of monedas) {
  if (moneda.cogida) continue;
  if (seTocan(heroe, moneda)) {
    moneda.cogida = true;   // deja de existir en el mundo
    puntos += 1;            // premiar al jugador
    soltarChispas(moneda);  // juicy juicy
  }
}

// El slime diferencia 2 tipos de choque:
if (seTocan(heroe, slime)) {
  const cayendoEncima = heroe.vy > 60; // velocidad hacia abajo
  if (cayendoEncima) {
    slime.aplastado();       // tú ganas
    heroe.vy = -200;         // y rebota
  } else {
    heroe.perderCorazon();   // el slime gana
    heroe.invencible(1.2);   // 1.2s de parpadeo para escapar
  }
}

// La meta es la misma idea con una línea: if (heroe.x >= META_X)`,
    plain: [
      "Detectar choques no es magia: son dos cajas invisibles comprobando si se solapan. Monedas, golpes, puertas y metas usan exactamente la misma idea.",
      "Con UN dato (velocidad vertical) el juego distingue entre aplastar al enemigo (caías sobre él) y recibir daño (chocaste de lado).",
      "La invencibilidad temporal tras un golpe es solo un temporizador: mientras sea mayor que 0, ignoramos las colisiones de daño.",
    ],
    tryIt: "Salta encima de un slime (te da +2 y rebota) y luego choque con otro de lado (pierdes un corazón). Misma función, dos resultados.",
    apps: ["Super Mario Bros. 3 (pisotón vs. daño)", "Sonic (pierdes los anillos, no la vida)"],
  },
  {
    id: "sound",
    file: "src/juego/sonido.ts",
    title: "Sonido 8-bit sin archivos",
    subtitle: "un oscilador y poco más",
    icon: Music4,
    code: `// SONIDO — los "beeps" se sintetizan en vivo con WebAudio.
// Cero archivos .mp3: solo frecuencias y duraciones.

const audio = new AudioContext();

function bip(frecuencia: number, duracion: number) {
  const osc = audio.createOscillator(); // genera la onda
  const vol = audio.createGain();       // volumen
  osc.type = "square";                  // onda cuadrada = sonido retro
  osc.frequency.value = frecuencia;     // 880 Hz = nota LA aguda

  // envolvente: volumen que cae a 0 para que no suene infinito
  vol.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duracion);

  osc.connect(vol).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duracion);
}

// Efectos del juego = frecuencias elegidas a oído:
const sonidoMoneda = () => { bip(880, 0.07); bip(1320, 0.12); };
const sonidoSalto  = () => bipConBarrido(280, 620, 0.14); // sube de tono
const sonidoGolpe  = () => bipConBarrido(200, 60, 0.28);  // baja = duele
const sonidoVictoria = () =>
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => bip(f, 0.14), i * 90));`,
    plain: [
      "La onda cuadrada (square) es EL sonido de las consolas de los 80/90. Cambia el tipo a sawtooth o triangle y el juego cambia de época.",
      "Un barrido de frecuencia ascendente suena a salto o power-up; descendente, a error o daño. Tu cerebro ya conoce ese idioma.",
      "La fanfarria de victoria son 4 notas con setTimeout escalonado: un mini-arpreggio de 9 líneas.",
    ],
    tryIt: "Juega con el sonido activado y escucha cómo cada evento tiene su bip. Luego siléncialo: notarás cuánto feedback aporta.",
    apps: ["Shovel Knight (todo el audio es chiptune)", "Undertale (beeps con emociones)"],
  },
];
