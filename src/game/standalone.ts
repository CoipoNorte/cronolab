/* ============================================================
   GENERADOR DEL JUEGO COMPLETO EN UN SOLO ARCHIVO .HTML
   Lo que se descarga desde el tutorial: JavaScript puro, sin
   librerías, sin build. Se abre con doble clic y funciona
   incluso sin internet.
   ============================================================ */

export function buildStandaloneGame(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CRONO JUMP — mi primer juego</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #0b0e1a; color: #e9ecff; gap: 14px;
    font-family: ui-monospace, "Courier New", monospace; padding: 18px;
  }
  h1 { font-size: 15px; letter-spacing: 2px; margin: 0; color: #ffd23f; }
  canvas {
    width: min(960px, 96vw); image-rendering: pixelated;
    border: 3px solid #262c52; border-radius: 10px; background: #8fcdf0;
    box-shadow: 0 18px 60px -22px rgba(124,107,255,.7);
  }
  .ayuda { font-size: 12px; color: #8b93c9; text-align: center; line-height: 1.7; }
  kbd {
    background: #161b38; border: 1px solid #2c3364; border-bottom-width: 3px;
    border-radius: 5px; padding: 2px 7px; color: #cdd3ff; font-size: 11px;
  }
  .tactil { display: none; gap: 10px; }
  @media (hover: none) { .tactil { display: flex; } }
  .tactil button {
    width: 72px; height: 54px; font-size: 20px; border-radius: 12px;
    background: #161b38; color: #e9ecff; border: 2px solid #2c3364;
  }
  .tactil button:active { background: #7c6bff; }
</style>
</head>
<body>
  <h1>CRONO JUMP</h1>
  <canvas id="pantalla" width="480" height="270"></canvas>
  <div class="ayuda">
    <kbd>←</kbd> <kbd>→</kbd> moverse &nbsp;·&nbsp; <kbd>espacio</kbd> saltar &nbsp;·&nbsp; <kbd>E</kbd> pausa &nbsp;·&nbsp; <kbd>R</kbd> reiniciar<br />
    3 niveles · monedas · pisa slimes para hacer combo · escudo e imán · checkpoints · récord guardado
  </div>
  <div class="tactil">
    <button id="bIzq">◀</button><button id="bSalto">▲</button><button id="bDer">▶</button>
  </div>

<script>
/* =======================================================
   CRONO JUMP — juego completo en JavaScript puro.
   Hecho paso a paso en el tutorial de CronoLab.
   ======================================================= */

const canvas = document.getElementById("pantalla");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const ANCHO = 480, ALTO = 270, SUELO_Y = 216;
const ANCHO_MUNDO = 1960, META_X = ANCHO_MUNDO - 90;
const GRAVEDAD = 980, FUERZA_SALTO = 345, VELOCIDAD = 140;

/* ---------- SPRITE DEL HÉROE: datos, no imágenes ---------- */
const TORSO = [
  "......HHHH......","....HHHHHHHH....","..HH.HHHHHH.HH..","..HHHHSSSSHHHH..",
  "..HHSSSSSSSSHH..","..HSSWSSSSWSSH..","....SSSSSSSS....","...STTTTTTTTS...",
  "..STTTTTTTTTTS..","..STTTTBBTTTTS..",
];
const PIERNAS = {
  idle: ["....PPPPPPPP....","....PPPPPPPP....","....PPP..PPP....","....PPP..PPP....",
         "....PP....PP....","....PP....PP....","...OOO....OOO...","...OOOO..OOOO..."],
  a:    ["....PPPPPPPP....","...PPPPPPPPP....","..PPPP...PPPP...","..PPP.....PPPP..",
         ".PPP.......PPP..",".PP.........PP..","OOOO........OOO.","OOOO........OOO."],
  b:    ["....PPPPPPPP....","....PPPPPPPPP...","...PPPP...PPPP..","..PPPP.....PPP..",
         "..PPP.......PPP.","..PP.........PP.",".OOO........OOOO",".OOO........OOOO"],
  aire: ["....PPPPPPPP....","...PPPPPPPPPP...","..PPPP....PPPP..","..OOO......OOO..",
         "..OOOO....OOOO..","................","................","................"],
};
const PALETA = { H:"#ff7847", S:"#ffcf9e", W:"#ffffff", T:"#1fae9e", B:"#7a4a2b", P:"#3d4a7a", O:"#5a3b2a" };

function dibujarSprite(mapa, x, y, espejo) {
  const ancho = mapa[0].length;
  for (let f = 0; f < mapa.length; f++) {
    for (let c = 0; c < mapa[f].length; c++) {
      const letra = mapa[f][c];
      if (letra === ".") continue;
      ctx.fillStyle = PALETA[letra];
      ctx.fillRect(x + (espejo ? ancho - 1 - c : c), y + f, 1, 1);
    }
  }
}

/* ---------- ESTADO ---------- */
let heroe, camX, t, puntos, vidas, invulnerable, temblor, victoria, gameOver;
let cajas, monedas, meteoros, avisos, particulas, relojSpawn, bufferSalto, enElSuelo;
let slimes, poderes, checkpoints, escudoT, imanT, reaparicion, combo, comboT;
let pausado, pausaSel, pausaLatch, nivel, transicion, record, nivelT;
const CLAVE_RECORD = "crono-jump-record";

function crearCajas() {
  const lista = [];
  [[300,1],[330,1],[430,2],[620,1],[650,2],[680,1],[900,1],[1080,2],[1110,1],[1320,1],[1350,2],[1540,1],[1700,2]]
    .forEach(([x, alto]) => lista.push({ x, y: SUELO_Y - 24*alto, w: 30, h: 24*alto, tipo: "bloque" }));
  [520, 980, 1450].forEach(x => lista.push({ x, y: SUELO_Y - 76, w: 64, h: 12, tipo: "bloque" }));
  [760, 1200, 1620].forEach(x => lista.push({ x, y: SUELO_Y - 12, w: 34, h: 12, tipo: "pincho" }));
  return lista;
}
function crearMonedas() {
  const lista = [];
  const add = (x, y) => lista.push({ x, y, cogida: false, ph: lista.length });
  [200,230,380,860,1260,1290,1860].forEach(x => add(x, SUELO_Y - 22));
  [430,650,1080,1350,1700].forEach(x => { add(x+15, SUELO_Y-70); add(x-15, SUELO_Y-56); add(x+45, SUELO_Y-56); });
  [520,980,1450].forEach(x => { add(x+12, SUELO_Y-96); add(x+36, SUELO_Y-96); });
  return lista;
}
function crearSlimes() {
  return [
    { x: 520, vx: 32, min: 470, max: 600, muerto: 0, anim: 0 },
    { x: 980, vx: -30, min: 920, max: 1060, muerto: 0, anim: 1 },
    { x: 1450, vx: 34, min: 1400, max: 1530, muerto: 0, anim: 2 },
  ];
}
function crearPoderes() {
  return [
    { x: 560, y: SUELO_Y - 96, tipo: "escudo", cogido: false, respawn: 0 },
    { x: 1120, y: SUELO_Y - 24, tipo: "iman", cogido: false, respawn: 0 },
    { x: 1620, y: SUELO_Y - 96, tipo: "escudo", cogido: false, respawn: 0 },
  ];
}
function crearCheckpoints() {
  return [{ x: 640, activo: false }, { x: 1240, activo: false }];
}
function cargarRecord() {
  try { return Number(localStorage.getItem(CLAVE_RECORD)) || 0; } catch (e) { return 0; }
}
function guardarRecord(v) {
  try { localStorage.setItem(CLAVE_RECORD, String(v)); } catch (e) {}
}

/* Reinicia el MUNDO sin reiniciar la PARTIDA: así se encadenan niveles */
function cargarNivel(conservarPuntos) {
  heroe = { x: 60, y: SUELO_Y, vx: 0, vy: 0, mira: 1, animT: 0 };
  camX = 0; invulnerable = 0; temblor = 0; victoria = false;
  enElSuelo = true; bufferSalto = 0; relojSpawn = 1.6;
  cajas = crearCajas(); monedas = crearMonedas();
  slimes = crearSlimes(); poderes = crearPoderes(); checkpoints = crearCheckpoints();
  meteoros = []; avisos = [];
  escudoT = 0; imanT = 0; reaparicion = 60; combo = 0; comboT = 0;
  nivelT = 0;                        // la dificultad arranca de cero en cada nivel
  if (!conservarPuntos) puntos = 0;
}

function reiniciar() {
  t = 0; puntos = 0; vidas = 3; gameOver = false;
  pausado = false; pausaSel = 0; pausaLatch = false;
  nivel = 1; transicion = 0; particulas = [];
  record = cargarRecord();
  cargarNivel(false);
}
reiniciar();

/* ---------- ENTRADA ---------- */
const teclas = {};
addEventListener("keydown", e => {
  if (["ArrowLeft","ArrowRight","ArrowUp","Space"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyR") return reiniciar();
  if (e.code === "KeyE" && !e.repeat) { pausado = !pausado; pausaSel = 0; audioOn(); return; }
  if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !e.repeat) { bufferSalto = 0.12; audioOn(); }
  teclas[e.code] = true;
});
addEventListener("keyup", e => teclas[e.code] = false);
const liga = (id, fn) => {
  const b = document.getElementById(id);
  if (!b) return;
  b.addEventListener("pointerdown", e => { e.preventDefault(); audioOn(); fn(true); });
  b.addEventListener("pointerup", () => fn(false));
  b.addEventListener("pointerleave", () => fn(false));
};
liga("bIzq", v => teclas.ArrowLeft = v);
liga("bDer", v => teclas.ArrowRight = v);
liga("bSalto", v => { if (v) bufferSalto = 0.12; });

/* ---------- SONIDO 8-BIT ---------- */
let audio = null;
function audioOn() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
}
function bip(frec, dur, tipo, vol, hasta, retardo) {
  if (!audio) return;
  const t0 = audio.currentTime + (retardo || 0);
  const osc = audio.createOscillator(), g = audio.createGain();
  osc.type = tipo || "square";
  osc.frequency.setValueAtTime(frec, t0);
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, t0 + dur);
  g.gain.setValueAtTime(vol || 0.05, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(audio.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}
const sonidoSalto   = () => bip(280, 0.14, "square", 0.05, 620);
const sonidoMoneda  = () => { bip(880, 0.07); bip(1320, 0.14, "square", 0.05, null, 0.07); };
const sonidoGolpe   = () => bip(200, 0.28, "sawtooth", 0.06, 60);
const sonidoImpacto = () => bip(120, 0.18, "triangle", 0.05, 50);
const fanfarria     = () => [523, 659, 784, 1047].forEach((f, i) => bip(f, 0.14, "square", 0.05, null, i * 0.09));

/* ---------- EFECTOS ---------- */
function chispas(x, y, colores, n, fuerza) {
  n = n || 10; fuerza = fuerza || 70;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2, vel = (0.3 + Math.random() * 0.7) * fuerza;
    particulas.push({ x, y, vx: Math.cos(ang)*vel, vy: Math.sin(ang)*vel - fuerza*0.4,
      vida: 0.45 + Math.random()*0.4, max: 0.85, color: colores[i % colores.length], texto: null });
  }
}
function textoFlotante(x, y, texto, color) {
  particulas.push({ x, y, vx: 0, vy: -26, vida: 1, max: 1, color, texto });
}
const azar = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------- COLISIÓN ---------- */
function tocando(hx, hy, b) {
  return hx - 5 < b.x + b.w && hx + 5 > b.x && hy - 18 < b.y + b.h && hy > b.y;
}
function recibirGolpe() {
  if (invulnerable > 0 || gameOver || victoria) return;
  /* el escudo absorbe el golpe ANTES de restar vida */
  if (escudoT > 0) {
    escudoT = 0; invulnerable = 1;
    chispas(heroe.x, heroe.y - 10, ["#5ce1e6", "#ffffff"], 16, 90);
    textoFlotante(heroe.x, heroe.y - 28, "¡ESCUDO!", "#5ce1e6");
    sonidoImpacto();
    return;
  }
  vidas--; invulnerable = 1.4; temblor = 7; combo = 0;
  heroe.vy = -170; enElSuelo = false;
  chispas(heroe.x, heroe.y - 10, ["#ff5d73", "#ffffff"], 12, 80);
  sonidoGolpe();
  if (vidas <= 0) { gameOver = true; return; }
  /* reaparecer en el último checkpoint */
  heroe.x = reaparicion; heroe.y = SUELO_Y - 30;
  heroe.vx = 0; heroe.vy = 0; invulnerable = 1.6;
  textoFlotante(reaparicion, SUELO_Y - 50, "checkpoint", "#ffd23f");
}

/* ---------- ACTUALIZAR ---------- */
function actualizar(dt) {
  /* MENÚ DE PAUSA: un return temprano congela el mundo entero */
  if (pausado) {
    if (teclas.ArrowLeft) pausaSel = 0;
    if (teclas.ArrowRight) pausaSel = 1;
    if (bufferSalto > 0) {
      bufferSalto = 0;
      if (pausaSel === 1) return reiniciar();
      pausado = false;
    }
    return;
  }
  t += dt;
  nivelT += dt;
  if (temblor > 0) temblor = Math.max(0, temblor - dt * 14);
  if (invulnerable > 0) invulnerable -= dt;
  if (escudoT > 0) escudoT -= dt;
  if (imanT > 0) imanT -= dt;
  if (comboT > 0 && (comboT -= dt) <= 0) combo = 0;
  if (transicion > 0) {
    transicion -= dt;
    if (transicion <= 0) {
      nivel++;
      if (vidas < 3) vidas++;        // un respiro antes del siguiente nivel
      cargarNivel(true);
    }
  }
  for (const p of particulas) {
    if (!p.texto) p.vy += 300 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt;
  }
  particulas = particulas.filter(p => p.vida > 0);
  if (gameOver || victoria) return;

  /* movimiento */
  const dir = (teclas.ArrowRight || teclas.KeyD ? 1 : 0) - (teclas.ArrowLeft || teclas.KeyA ? 1 : 0);
  heroe.vx += (dir * VELOCIDAD - heroe.vx) * Math.min(1, dt * 12);
  if (dir !== 0) heroe.mira = dir;
  heroe.animT += dt * (Math.abs(heroe.vx) > 14 ? Math.abs(heroe.vx)/22 + 4 : 2.5);

  /* salto */
  if (bufferSalto > 0) bufferSalto -= dt;
  if (bufferSalto > 0 && enElSuelo) {
    heroe.vy = -FUERZA_SALTO; enElSuelo = false; bufferSalto = 0;
    sonidoSalto(); chispas(heroe.x, heroe.y, ["#d9c6a5"], 5, 36);
  }
  heroe.vy = Math.min(heroe.vy + GRAVEDAD * dt, 560);

  /* eje X */
  const nx = heroe.x + heroe.vx * dt;
  const chocaX = cajas.find(b => b.tipo === "bloque" && tocando(nx, heroe.y, b));
  if (chocaX) { heroe.x = heroe.vx > 0 ? chocaX.x - 5.01 : chocaX.x + chocaX.w + 5.01; heroe.vx = 0; }
  else heroe.x = nx;

  /* eje Y */
  const ny = heroe.y + heroe.vy * dt;
  const chocaY = cajas.find(b => b.tipo === "bloque" && tocando(heroe.x, ny, b));
  if (chocaY) {
    if (heroe.vy > 0) { heroe.y = chocaY.y; enElSuelo = true; }
    else heroe.y = chocaY.y + chocaY.h + 18;
    heroe.vy = 0;
  } else { heroe.y = ny; enElSuelo = false; }
  if (heroe.y >= SUELO_Y) { heroe.y = SUELO_Y; heroe.vy = 0; enElSuelo = true; }
  heroe.x = Math.max(10, Math.min(ANCHO_MUNDO - 10, heroe.x));

  /* pinchos */
  for (const b of cajas) {
    if (b.tipo === "pincho" && tocando(heroe.x, heroe.y, b)) {
      heroe.vx = heroe.x < b.x + b.w/2 ? -150 : 150;
      recibirGolpe();
    }
  }

  /* monedas */
  for (const m of monedas) {
    if (m.cogida) continue;
    let my = m.y + Math.sin(t * 2.2 + m.ph) * 2;
    if (imanT > 0) {                      // el imán curva su trayectoria
      const dx = heroe.x - m.x, dy = (heroe.y - 10) - my, d = Math.hypot(dx, dy);
      if (d < 90) { m.x += (dx / d) * 150 * dt; m.y += (dy / d) * 150 * dt; my = m.y; }
    }
    if (Math.abs(m.x - heroe.x) < 11 && my > heroe.y - 22 && my < heroe.y + 6) {
      m.cogida = true; puntos += 10;
      chispas(m.x, my, ["#ffd23f", "#fff3a3", "#ffffff"], 8, 60);
      textoFlotante(m.x, my - 8, "+10", "#ffd23f");
      sonidoMoneda();
    }
  }

  /* meteoritos */
  relojSpawn -= dt;
  if (relojSpawn <= 0) {
    const x = Math.max(30, Math.min(ANCHO_MUNDO - 30, heroe.x + (Math.random()*300 - 120)));
    avisos.push({ x, t: 0.85 });
    relojSpawn = Math.max(0.7, 1.7 - nivelT * 0.012);
  }
  for (const a of avisos) { a.t -= dt; if (a.t <= 0) meteoros.push({ x: a.x, y: -14, vy: 150 }); }
  avisos = avisos.filter(a => a.t > 0);
  for (const m of meteoros) {
    m.vy += 420 * dt; m.y += m.vy * dt;
    if (Math.abs(m.x - heroe.x) < 10 && m.y > heroe.y - 22 && m.y < heroe.y + 2) { m.muerto = true; recibirGolpe(); }
    if (!m.muerto && m.y >= SUELO_Y) {
      m.muerto = true;
      chispas(m.x, SUELO_Y - 2, ["#ff7847", "#ffd23f", "#8a5a3b"], 10, 70);
      temblor = Math.max(temblor, 3);
      sonidoImpacto();
    }
  }
  meteoros = meteoros.filter(m => !m.muerto);

  /* enemigos: patrulla + pisotón con combo */
  for (const s2 of slimes) {
    if (s2.muerto > 0) { s2.muerto -= dt; continue; }
    s2.x += s2.vx * dt; s2.anim += dt;
    if (s2.x < s2.min) { s2.x = s2.min; s2.vx = Math.abs(s2.vx); }
    if (s2.x > s2.max) { s2.x = s2.max; s2.vx = -Math.abs(s2.vx); }
    const tocando = Math.abs(s2.x - heroe.x) < 12 && heroe.y > SUELO_Y - 24 && heroe.y - 18 < SUELO_Y;
    if (!tocando) continue;
    if (heroe.vy > 55 && heroe.y < SUELO_Y - 6) {
      s2.muerto = 3; heroe.vy = -250; enElSuelo = false;
      combo = Math.min(combo + 1, 8); comboT = 2;
      const premio = 50 * combo;
      puntos += premio;
      chispas(s2.x, SUELO_Y - 8, ["#58c94f", "#bff5b0"], 14, 85);
      textoFlotante(s2.x, SUELO_Y - 26, "+" + premio + (combo > 1 ? " x" + combo : ""), "#4ade80");
      sonidoImpacto();
    } else {
      heroe.vx = heroe.x < s2.x ? -165 : 165;
      recibirGolpe();
    }
  }

  /* power-ups con temporizador y reaparición */
  for (const p of poderes) {
    if (p.cogido) { p.respawn -= dt; if (p.respawn <= 0) p.cogido = false; continue; }
    const py = p.y + Math.sin(t * 3 + p.x) * 2;
    if (Math.abs(p.x - heroe.x) < 13 && py > heroe.y - 26 && py < heroe.y + 8) {
      p.cogido = true; p.respawn = 9;
      if (p.tipo === "escudo") { escudoT = 8; textoFlotante(p.x, py - 10, "ESCUDO 8s", "#5ce1e6"); }
      else { imanT = 7; textoFlotante(p.x, py - 10, "IMAN 7s", "#ff7ad9"); }
      chispas(p.x, py, p.tipo === "escudo" ? ["#5ce1e6", "#ffffff"] : ["#ff7ad9", "#ffffff"], 14, 70);
      sonidoMoneda();
    }
  }

  /* checkpoints */
  for (const cp of checkpoints) {
    if (cp.activo || heroe.x < cp.x) continue;
    cp.activo = true; reaparicion = cp.x;
    chispas(cp.x, SUELO_Y - 30, ["#ffd23f", "#ffffff"], 18, 80);
    textoFlotante(cp.x, SUELO_Y - 56, "CHECKPOINT", "#ffd23f");
    sonidoMoneda();
  }

  /* meta: siguiente nivel o final del juego */
  if (heroe.x >= META_X && transicion <= 0) {
    if (nivel < 3) {
      transicion = 1.4; puntos += 200;
      chispas(META_X, SUELO_Y - 40, ["#ffd23f", "#4ade80", "#7c6bff"], 46, 130);
      textoFlotante(META_X, SUELO_Y - 70, "NIVEL " + nivel + " COMPLETO", "#4ade80");
      fanfarria();
    } else {
      victoria = true;
      if (puntos > record) { record = puntos; guardarRecord(record); }
      chispas(META_X, SUELO_Y - 40, ["#ffd23f", "#4ade80", "#7c6bff"], 46, 130);
      fanfarria();
    }
  }

  /* cámara */
  const objetivo = Math.max(0, Math.min(heroe.x - ANCHO * 0.42, ANCHO_MUNDO - ANCHO));
  camX += (objetivo - camX) * (1 - Math.exp(-6 * dt));
}

/* ---------- DIBUJAR ---------- */
function dibujar() {
  ctx.save();
  if (temblor > 0) ctx.translate((Math.random()-.5)*temblor, (Math.random()-.5)*temblor);

  const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
  cielo.addColorStop(0, "#4f8fd6"); cielo.addColorStop(.6, "#8fcdf0"); cielo.addColorStop(1, "#dff6fb");
  ctx.fillStyle = cielo; ctx.fillRect(-10, -10, ANCHO+20, ALTO+20);

  for (let i = -1; i < 14; i++) {
    const cx = i*170 - (camX*0.25 % 170) + azar(i*7)*60, cy = 20 + azar(i*3)*48;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fillRect(cx, cy, 34, 7); ctx.fillRect(cx+8, cy-5, 18, 5);
  }
  for (let i = -1; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#5da863" : "#4c9455";
    ctx.beginPath(); ctx.arc(i*150 - (camX*0.5 % 150), SUELO_Y+12, 62, Math.PI, 0); ctx.fill();
  }
  ctx.fillStyle = "#8a5a3b"; ctx.fillRect(-10, SUELO_Y+6, ANCHO+20, ALTO);
  ctx.fillStyle = "#4fae52"; ctx.fillRect(-10, SUELO_Y, ANCHO+20, 6);
  ctx.fillStyle = "#7ed37a"; ctx.fillRect(-10, SUELO_Y, ANCHO+20, 1);
  for (let wx = Math.floor(camX/16)*16; wx < camX + ANCHO + 16; wx += 16) {
    const dx = wx - camX, h = azar(wx/16);
    ctx.fillStyle = "#6f4429"; ctx.fillRect(dx + 3 + Math.floor(h*8), SUELO_Y + 11 + Math.floor(h*9), 2, 2);
    if (h < .2) { ctx.fillStyle = "#3e9c47"; ctx.fillRect(dx+5, SUELO_Y-3, 1, 3); ctx.fillRect(dx+8, SUELO_Y-4, 1, 4); }
  }

  for (const b of cajas) {
    const bx = b.x - camX;
    if (bx < -80 || bx > ANCHO + 80) continue;
    if (b.tipo === "bloque") {
      ctx.fillStyle = "#a55d3f"; ctx.fillRect(bx, b.y, b.w, b.h);
      ctx.fillStyle = "#7c3f2a";
      for (let yy = b.y + 7; yy < b.y + b.h; yy += 8) ctx.fillRect(bx, yy, b.w, 2);
      ctx.fillStyle = "#c97d55"; ctx.fillRect(bx, b.y, b.w, 2);
    } else {
      ctx.fillStyle = "#8f9aa8";
      for (let i = 0; i < b.w; i += 8) {
        ctx.beginPath(); ctx.moveTo(bx+i, b.y+b.h); ctx.lineTo(bx+i+4, b.y); ctx.lineTo(bx+i+8, b.y+b.h); ctx.fill();
      }
    }
  }

  const fx = META_X - camX;
  if (fx > -40 && fx < ANCHO + 40) {
    ctx.fillStyle = "#7a4a2b"; ctx.fillRect(fx, SUELO_Y-52, 3, 52);
    const wv = Math.round(Math.sin(t*5)*2);
    ctx.fillStyle = victoria ? "#4ade80" : "#ff5470";
    ctx.fillRect(fx+3, SUELO_Y-51, 15, 5); ctx.fillRect(fx+3, SUELO_Y-46+wv*.5, 11, 5); ctx.fillRect(fx+3, SUELO_Y-41+wv, 7, 5);
    ctx.fillStyle = "#ffd23f"; ctx.fillRect(fx-1, SUELO_Y-55, 5, 4);
  }

  for (const m of monedas) {
    if (m.cogida) continue;
    const cx = m.x - camX;
    if (cx < -20 || cx > ANCHO + 20) continue;
    const cy = m.y + Math.sin(t*2.2 + m.ph)*2, giro = Math.abs(Math.sin(t*2.8 + m.ph));
    [3,5,7,8,8,8,8,7,5,3].forEach((w, f) => {
      const ancho = Math.max(1, Math.round(w*giro));
      ctx.fillStyle = "#ffd23f"; ctx.fillRect(cx - ancho/2, cy + f - 5, ancho, 1);
    });
  }

  for (const a of avisos) {
    const ax = a.x - camX;
    if (ax < -20 || ax > ANCHO + 20) continue;
    const parpadeo = Math.floor(a.t * 12) % 2 === 0;
    ctx.fillStyle = parpadeo ? "#ff5d73" : "#ffd23f";
    ctx.globalAlpha = .55; ctx.fillRect(ax-9, SUELO_Y-3, 18, 3); ctx.globalAlpha = 1;
    ctx.font = "8px monospace"; ctx.textAlign = "center";
    ctx.fillText("!", ax, 22); ctx.fillRect(ax-1, 26, 2, 8);
  }
  for (const m of meteoros) {
    const mx = m.x - camX;
    if (mx < -20 || mx > ANCHO + 20) continue;
    ctx.fillStyle = "rgba(255,120,71,.35)"; ctx.fillRect(mx-2, m.y-16, 4, 14);
    ctx.fillStyle = "#ffd23f"; ctx.fillRect(mx-4, m.y-4, 8, 8);
    ctx.fillStyle = "#ff7847"; ctx.fillRect(mx-3, m.y-3, 6, 6);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(mx-1, m.y-2, 2, 2);
  }

  /* checkpoints */
  for (const cp of checkpoints) {
    const cx = cp.x - camX;
    if (cx < -30 || cx > ANCHO + 30) continue;
    ctx.fillStyle = "#6d7683"; ctx.fillRect(cx, SUELO_Y - 34, 2, 34);
    const wv = cp.activo ? Math.round(Math.sin(t * 6) * 1.5) : 0;
    ctx.fillStyle = cp.activo ? "#ffd23f" : "#51486d";
    ctx.fillRect(cx + 2, SUELO_Y - 33 + wv, 11, 8);
  }

  /* slimes */
  for (const s2 of slimes) {
    const sx2 = s2.x - camX;
    if (sx2 < -30 || sx2 > ANCHO + 30) continue;
    if (s2.muerto > 0) {
      ctx.globalAlpha = Math.max(0, s2.muerto / 3);
      ctx.fillStyle = "#3f9e3c"; ctx.fillRect(sx2 - 8, SUELO_Y - 3, 16, 3);
      ctx.globalAlpha = 1; continue;
    }
    ctx.fillStyle = "rgba(20,50,20,.22)"; ctx.fillRect(sx2 - 7, SUELO_Y + 2, 14, 2);
    const bob = Math.sin(s2.anim * 7) > 0 ? 0 : 1;
    ctx.fillStyle = "#58c94f";
    ctx.fillRect(sx2 - 7, SUELO_Y - 10 + bob, 14, 10 - bob);
    ctx.fillRect(sx2 - 5, SUELO_Y - 12 + bob, 10, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sx2 - 4, SUELO_Y - 8 + bob, 3, 3); ctx.fillRect(sx2 + 1, SUELO_Y - 8 + bob, 3, 3);
    ctx.fillStyle = "#1d2b23";
    ctx.fillRect(sx2 - 3 + (s2.vx > 0 ? 1 : 0), SUELO_Y - 7 + bob, 1, 1);
    ctx.fillRect(sx2 + 2 + (s2.vx > 0 ? 1 : 0), SUELO_Y - 7 + bob, 1, 1);
  }

  /* power-ups */
  for (const p of poderes) {
    if (p.cogido) continue;
    const px = p.x - camX;
    if (px < -20 || px > ANCHO + 20) continue;
    const py = p.y + Math.sin(t * 3 + p.x) * 2;
    ctx.fillStyle = p.tipo === "escudo" ? "rgba(92,225,230,.22)" : "rgba(255,122,217,.22)";
    ctx.fillRect(px - 10, py - 10, 20, 20);
    if (p.tipo === "escudo") {
      ctx.fillStyle = "#5ce1e6";
      ctx.fillRect(px - 6, py - 7, 12, 10); ctx.fillRect(px - 4, py + 3, 8, 4);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(px - 2, py - 4, 4, 4);
    } else {
      ctx.fillStyle = "#ff7ad9";
      ctx.fillRect(px - 7, py - 7, 5, 11); ctx.fillRect(px + 2, py - 7, 5, 11);
      ctx.fillRect(px - 7, py - 7, 14, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px - 7, py + 2, 5, 3); ctx.fillRect(px + 2, py + 2, 5, 3);
    }
  }

  const hx = Math.round(heroe.x - camX), hy = Math.round(heroe.y);
  ctx.fillStyle = "rgba(20,50,20,.26)"; ctx.fillRect(hx-7, SUELO_Y+2, 14, 2);
  /* auras de los power-ups activos */
  if (escudoT > 0 && (escudoT > 1.5 || Math.floor(t * 12) % 2 === 0)) {
    ctx.strokeStyle = "#5ce1e6"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(hx, hy - 9, 15, 0, Math.PI * 2); ctx.stroke();
  }
  if (imanT > 0) {
    ctx.globalAlpha = .35; ctx.strokeStyle = "#ff7ad9";
    ctx.beginPath(); ctx.arc(hx, hy - 9, 26 + Math.sin(t * 8) * 3, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (invulnerable <= 0 || Math.floor(t*14) % 2 === 0) {
    let piernas = PIERNAS.idle;
    if (!enElSuelo) piernas = PIERNAS.aire;
    else if (Math.abs(heroe.vx) > 14) piernas = Math.floor(heroe.animT*6) % 2 === 0 ? PIERNAS.a : PIERNAS.b;
    dibujarSprite(TORSO.concat(piernas), hx - 8, hy - 18, heroe.mira < 0);
  }

  for (const p of particulas) {
    ctx.globalAlpha = Math.max(0, p.vida / p.max);
    ctx.fillStyle = p.color;
    if (p.texto) { ctx.font = "8px monospace"; ctx.textAlign = "center"; ctx.fillText(p.texto, p.x - camX, p.y); }
    else ctx.fillRect(p.x - camX, p.y, 2, 2);
    ctx.globalAlpha = 1;
  }

  /* HUD */
  ctx.fillStyle = "rgba(11,14,26,.72)"; ctx.fillRect(6, 6, 214, 20);
  ctx.fillStyle = "#ffd23f"; ctx.font = "9px monospace"; ctx.textAlign = "left";
  ctx.fillText("PUNTOS " + puntos, 13, 20);
  ctx.fillStyle = "#ff5d73";
  for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < vidas ? 1 : .22; ctx.fillRect(100 + i*16, 12, 10, 8); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#7c6bff"; ctx.fillText("NIV " + nivel + "/3", 156, 20);
  ctx.fillStyle = "rgba(11,14,26,.72)"; ctx.fillRect(ANCHO - 108, 6, 102, 20);
  ctx.fillStyle = "#4ade80"; ctx.fillText("RECORD " + record, ANCHO - 101, 20);
  if (combo > 1) {
    ctx.fillStyle = "#ffd23f"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ctx.fillText("x" + combo, hx, hy - 28 + Math.sin(t * 8) * 2);
  }
  if (escudoT > 0 || imanT > 0) {
    const activo = escudoT > 0 ? escudoT : imanT;
    const dur = escudoT > 0 ? 8 : 7;
    ctx.fillStyle = "rgba(11,14,26,.72)"; ctx.fillRect(6, 30, 92, 12);
    ctx.fillStyle = escudoT > 0 ? "#5ce1e6" : "#ff7ad9";
    ctx.fillRect(9, 33, 86 * (activo / dur), 6);
  }

  if (transicion > 0) {
    ctx.fillStyle = "rgba(7,9,18,.55)"; ctx.fillRect(0, ALTO/2 - 26, ANCHO, 52);
    ctx.textAlign = "center";
    ctx.fillStyle = "#4ade80"; ctx.font = "13px monospace";
    ctx.fillText("NIVEL " + nivel + " COMPLETO", ANCHO/2, ALTO/2 - 2);
    ctx.fillStyle = "#e9ecff"; ctx.font = "9px monospace";
    ctx.fillText("preparando nivel " + (nivel + 1) + "...", ANCHO/2, ALTO/2 + 18);
  }

  if (pausado) {
    ctx.fillStyle = "rgba(7,9,18,.78)"; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.strokeStyle = "#7c6bff"; ctx.lineWidth = 2;
    ctx.strokeRect(ANCHO/2 - 92, ALTO/2 - 52, 184, 104);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd23f"; ctx.font = "13px monospace";
    ctx.fillText("PAUSA", ANCHO/2, ALTO/2 - 26);
    ["CONTINUAR", "REINICIAR"].forEach(function (op, i) {
      ctx.fillStyle = pausaSel === i ? "#ffd23f" : "#8b93c9";
      ctx.font = "10px monospace";
      ctx.fillText((pausaSel === i ? "> " : "  ") + op, ANCHO/2, ALTO/2 + 2 + i * 18);
    });
    ctx.fillStyle = "#8b93c9"; ctx.font = "8px monospace";
    ctx.fillText("flechas elegir · espacio confirmar · E cerrar", ANCHO/2, ALTO/2 + 44);
  }

  if (gameOver || victoria) {
    ctx.fillStyle = "rgba(7,9,18,.62)"; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.textAlign = "center";
    ctx.fillStyle = victoria ? "#4ade80" : "#ff5d73";
    ctx.font = "16px monospace";
    ctx.fillText(victoria ? "¡META!" : "GAME OVER", ANCHO/2, ALTO/2 - 18);
    ctx.fillStyle = "#ffd23f"; ctx.font = "10px monospace";
    ctx.fillText("puntos: " + puntos, ANCHO/2, ALTO/2 + 6);
    ctx.fillStyle = (victoria && puntos >= record && puntos > 0) ? "#4ade80" : "#8b93c9";
    ctx.fillText((victoria && puntos >= record && puntos > 0) ? "¡NUEVO RECORD! " + record : "record: " + record, ANCHO/2, ALTO/2 + 24);
    ctx.fillStyle = "#e9ecff";
    ctx.fillText("pulsa R para reintentar", ANCHO/2, ALTO/2 + 44);
  }

  ctx.restore();
}

/* ---------- EL BUCLE ---------- */
let ultimo = performance.now();
function bucle(ahora) {
  const dt = Math.min((ahora - ultimo) / 1000, 1/30);
  ultimo = ahora;
  actualizar(dt);
  dibujar();
  requestAnimationFrame(bucle);
}
requestAnimationFrame(bucle);
</script>
</body>
</html>
`;
}
