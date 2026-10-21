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
    <kbd>←</kbd> <kbd>→</kbd> moverse &nbsp;·&nbsp; <kbd>espacio</kbd> saltar &nbsp;·&nbsp; <kbd>R</kbd> reiniciar<br />
    recoge monedas, esquiva meteoritos y pinchos, llega a la bandera
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
function reiniciar() {
  heroe = { x: 60, y: SUELO_Y, vx: 0, vy: 0, mira: 1, animT: 0 };
  camX = 0; t = 0; puntos = 0; vidas = 3; invulnerable = 0; temblor = 0;
  victoria = false; gameOver = false; enElSuelo = true; bufferSalto = 0; relojSpawn = 1.6;
  cajas = crearCajas(); monedas = crearMonedas();
  meteoros = []; avisos = []; particulas = [];
}
reiniciar();

/* ---------- ENTRADA ---------- */
const teclas = {};
addEventListener("keydown", e => {
  if (["ArrowLeft","ArrowRight","ArrowUp","Space"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyR") return reiniciar();
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
  vidas--; invulnerable = 1.4; temblor = 7;
  heroe.vy = -170; enElSuelo = false;
  chispas(heroe.x, heroe.y - 10, ["#ff5d73", "#ffffff"], 12, 80);
  sonidoGolpe();
  if (vidas <= 0) gameOver = true;
}

/* ---------- ACTUALIZAR ---------- */
function actualizar(dt) {
  t += dt;
  if (temblor > 0) temblor = Math.max(0, temblor - dt * 14);
  if (invulnerable > 0) invulnerable -= dt;
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
    const my = m.y + Math.sin(t * 2.2 + m.ph) * 2;
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
    relojSpawn = Math.max(0.55, 1.7 - t * 0.012);
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

  /* meta */
  if (heroe.x >= META_X) {
    victoria = true;
    chispas(META_X, SUELO_Y - 40, ["#ffd23f", "#4ade80", "#7c6bff"], 46, 130);
    fanfarria();
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

  const hx = Math.round(heroe.x - camX), hy = Math.round(heroe.y);
  ctx.fillStyle = "rgba(20,50,20,.26)"; ctx.fillRect(hx-7, SUELO_Y+2, 14, 2);
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
  ctx.fillStyle = "rgba(11,14,26,.72)"; ctx.fillRect(6, 6, 150, 20);
  ctx.fillStyle = "#ffd23f"; ctx.font = "9px monospace"; ctx.textAlign = "left";
  ctx.fillText("PUNTOS " + puntos, 13, 20);
  ctx.fillStyle = "#ff5d73";
  for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < vidas ? 1 : .22; ctx.fillRect(100 + i*16, 12, 10, 8); }
  ctx.globalAlpha = 1;

  if (gameOver || victoria) {
    ctx.fillStyle = "rgba(7,9,18,.62)"; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.textAlign = "center";
    ctx.fillStyle = victoria ? "#4ade80" : "#ff5d73";
    ctx.font = "16px monospace";
    ctx.fillText(victoria ? "¡META!" : "GAME OVER", ANCHO/2, ALTO/2 - 10);
    ctx.fillStyle = "#ffd23f"; ctx.font = "10px monospace";
    ctx.fillText("puntos: " + puntos, ANCHO/2, ALTO/2 + 14);
    ctx.fillStyle = "#e9ecff";
    ctx.fillText("pulsa R para reintentar", ANCHO/2, ALTO/2 + 34);
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
