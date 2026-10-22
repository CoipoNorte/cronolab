/* ============================================================
   LABORATORIO DE MECÁNICAS — 13 micro-demos que se explican
   solas. Cada una se anima sin que toques nada y tiene un
   INTERRUPTOR para ver la misma escena CON y SIN la técnica.

   Esa comparación es el corazón del "game feel": casi ninguna
   de estas mecánicas se ve en una captura... solo se sienten.
   ============================================================ */

import type { LucideIcon } from "lucide-react";
import {
  Rabbit,
  ArrowUpNarrowWide,
  ChevronsUp,
  Timer,
  Wind,
  Zap,
  Camera,
  Vibrate,
  Eye,
  Waves,
  Recycle,
  Star,
  Spline,
} from "lucide-react";
import { drawPixels, heroSprite, HERO_PALETTE } from "./sprites";

export const DW = 240;   // ancho interno de cada demo
export const DH = 135;   // alto interno
export const DG = 108;   // altura del suelo

type Ctx = CanvasRenderingContext2D;

export type Cat = "salto" | "control" | "camara" | "enemigos" | "sistemas";

export interface DemoInst {
  update(dt: number, on: boolean): void;
  draw(ctx: Ctx, on: boolean): void;
  readout(on: boolean): string;
}

export interface MechDemo {
  id: string;
  cat: Cat;
  icon: LucideIcon;
  title: string;
  blurb: string;
  toggle: string;
  code: string;
  bullets: string[];
  apps: string[];
  create(): DemoInst;
}

export const CATS: { id: Cat; label: string }[] = [
  { id: "salto", label: "Salto" },
  { id: "control", label: "Control" },
  { id: "camara", label: "Cámara y jugo" },
  { id: "enemigos", label: "Enemigos" },
  { id: "sistemas", label: "Sistemas" },
];

/* ---------------- utilidades de dibujo ---------------- */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function sky(ctx: Ctx, top = "#28304f", bottom = "#141a30") {
  const g = ctx.createLinearGradient(0, 0, 0, DH);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, DW, DH);
}

function ground(ctx: Ctx, y = DG, x = 0, w = DW) {
  ctx.fillStyle = "#3b3252";
  ctx.fillRect(x, y, w, DH - y);
  ctx.fillStyle = "#4fae52";
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = "#7ed37a";
  ctx.fillRect(x, y, w, 1);
}

function guy(ctx: Ctx, x: number, y: number, onGround: boolean, moving: boolean, t: number, flip = false) {
  const st = !onGround ? "jump" : moving ? (Math.floor(t * 9) % 2 === 0 ? "runA" : "runB") : "idle";
  drawPixels(ctx, heroSprite(st), Math.round(x) - 8, Math.round(y) - 18, HERO_PALETTE, flip);
}

function label(ctx: Ctx, text: string, x: number, y: number, color = "#e9ecff", size = 6) {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function dashedLine(ctx: Ctx, x1: number, y: number, x2: number, color: string) {
  ctx.fillStyle = color;
  for (let x = x1; x < x2; x += 5) ctx.fillRect(x, y, 3, 1);
}

/* ============================================================
   1 · COYOTE TIME
   ============================================================ */
function makeCoyote(): DemoInst {
  const P = [{ x: 0, w: 118 }, { x: 160, w: 80 }];
  let x = 20, y = DG, vy = 0, onG = true, coyote = 0, pressed = false, t = 0;
  let intentos = 0, logrados = 0, flash = 0;
  const onPlat = (px: number) => P.some((p) => px >= p.x && px <= p.x + p.w);

  const reset = (win: boolean) => {
    if (win) logrados++;
    intentos++;
    x = 20; y = DG; vy = 0; onG = true; coyote = 0; pressed = false;
  };

  return {
    update(dt, on) {
      t += dt;
      if (flash > 0) flash -= dt;
      x += 85 * dt;

      const suelo = onPlat(x);
      if (onG && !suelo) { onG = false; coyote = 0; }     // acaba de salir del borde
      if (!onG) coyote += dt;

      // el bot pulsa SIEMPRE un pelín tarde (0,06 s después del borde)
      if (!pressed && !onG && coyote >= 0.06) {
        pressed = true;
        const ventana = on ? 0.12 : 0;                      // ← la mecánica
        if (coyote <= ventana) { vy = -160; flash = 0.25; }
      }

      vy += 560 * dt;
      y += vy * dt;

      if (vy > 0 && y >= DG && onPlat(x)) { y = DG; vy = 0; onG = true; }
      if (y > DH + 20) reset(false);
      if (x > 236) reset(true);
    },
    draw(ctx, on) {
      sky(ctx);
      for (const p of P) ground(ctx, DG, p.x, p.w);
      dashedLine(ctx, 118, DG - 1, 160, "rgba(255,93,115,.5)");

      // ventana de coyote visible sobre el héroe
      if (on && !onG && coyote < 0.12 && !pressed) {
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(x - 12, y - 30, 24 * (1 - coyote / 0.12), 2);
        label(ctx, "COYOTE", x - 20, y - 34, "#ffd23f", 5);
      }
      if (flash > 0) {
        ctx.globalAlpha = flash * 3;
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(x - 10, y - 24, 20, 20);
        ctx.globalAlpha = 1;
      }
      guy(ctx, x, y, onG, true, t);
      label(ctx, on ? "ventana 0.12s" : "sin ventana", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) =>
      on ? `salta 0.06s tarde y LLEGA · ${logrados}/${intentos}` : `salta 0.06s tarde y CAE · ${logrados}/${intentos}`,
  };
}

/* ============================================================
   2 · ALTURA DE SALTO VARIABLE
   ============================================================ */
function makeVarJump(): DemoInst {
  let y = DG, vy = 0, onG = true, t = 0, fase = 0, reloj = 0, hold = 0;
  let apexTap = 0, apexHold = 0, apex = DG;
  const x = 60;

  return {
    update(dt, on) {
      t += dt; reloj += dt;
      if (onG && reloj > 1.1) {
        reloj = 0;
        vy = -175; onG = false;
        hold = fase === 0 ? 0.05 : 0.42;                  // toque corto / mantener
        apex = DG;
      }
      if (!onG) {
        hold -= dt;
        // al soltar pronto, cortamos el impulso restante: eso es el salto variable
        if (on && hold <= 0 && vy < 0) vy *= 0.42;
        vy += 620 * dt;
        y += vy * dt;
        apex = Math.min(apex, y);
        if (y >= DG) {
          y = DG; vy = 0; onG = true;
          if (fase === 0) apexTap = DG - apex; else apexHold = DG - apex;
          fase = 1 - fase;
        }
      }
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      if (apexTap > 0) { dashedLine(ctx, 20, DG - apexTap, 220, "rgba(92,225,230,.45)"); label(ctx, `toque ${Math.round(apexTap)}px`, 150, DG - apexTap - 3, "#5ce1e6", 5); }
      if (apexHold > 0) { dashedLine(ctx, 20, DG - apexHold, 220, "rgba(255,210,63,.5)"); label(ctx, `mantener ${Math.round(apexHold)}px`, 150, DG - apexHold - 3, "#ffd23f", 5); }
      guy(ctx, x, y, onG, false, t);
      if (!onG && hold > 0) { ctx.fillStyle = "#ffd23f"; ctx.fillRect(x - 10, y - 30, 20, 2); }
      label(ctx, fase === 0 ? "ahora: TOQUE" : "ahora: MANTENER", 6, 14, "#e9ecff");
      label(ctx, on ? "altura variable ON" : "altura fija", 6, 126, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) =>
      on ? `tocar = ${Math.round(apexTap)}px · mantener = ${Math.round(apexHold)}px` : "los dos saltos miden igual: sin matices",
  };
}

/* ============================================================
   3 · DOBLE SALTO
   ============================================================ */
function makeDoubleJump(): DemoInst {
  const MUR = { x: 150, w: 16, h: 40 };
  let x = 18, y = DG, vy = 0, onG = true, saltos = 0, t = 0, usado2 = false;
  let exitos = 0, fallos = 0, bump = 0;

  const reset = (win: boolean) => {
    if (win) exitos++; else fallos++;
    x = 18; y = DG; vy = 0; onG = true; saltos = 0; usado2 = false; choco = false;
  };
  let choco = false;

  return {
    update(dt, on) {
      t += dt;
      if (bump > 0) bump -= dt;

      const prevY = y;                     // altura ANTES de mover: clave para saber si venía de arriba
      x += 70 * dt;

      const maxSaltos = on ? 2 : 1;
      if (onG && x > 96 && saltos === 0) { vy = -175; onG = false; saltos = 1; }
      // segundo impulso justo en el punto más alto
      if (!onG && !usado2 && saltos < maxSaltos && vy > -20) { vy = -175; saltos++; usado2 = true; }

      vy += 600 * dt;
      y += vy * dt;

      const techo = DG - MUR.h;
      const dentro = x + 6 > MUR.x && x - 6 < MUR.x + MUR.w;
      if (dentro) {
        if (vy >= 0 && prevY <= techo + 1 && y >= techo) {
          y = techo; vy = 0; onG = true;   // aterriza ENCIMA del muro
        } else if (y > techo) {
          x = MUR.x - 7; bump = 0.25; choco = true;   // choca de frente
        }
      }
      if (y >= DG) { y = DG; vy = 0; onG = true; }
      if (choco && onG && y >= DG) { reset(false); return; }
      if (x > 236) reset(true);
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      ctx.fillStyle = "#a55d3f";
      ctx.fillRect(MUR.x, DG - MUR.h, MUR.w, MUR.h);
      ctx.fillStyle = "#c97d55";
      ctx.fillRect(MUR.x, DG - MUR.h, MUR.w, 2);
      if (bump > 0) { ctx.fillStyle = "#ff5d73"; ctx.fillRect(MUR.x - 3, DG - 20, 2, 10); }
      guy(ctx, x, y, onG, true, t);
      // puntitos de saltos disponibles
      for (let i = 0; i < (on ? 2 : 1); i++) {
        ctx.fillStyle = i < (on ? 2 : 1) - saltos ? "#4ade80" : "#39324f";
        ctx.fillRect(x - 6 + i * 7, y - 28, 5, 5);
      }
      label(ctx, on ? "2 saltos" : "1 salto", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) => (on ? `supera el muro · ${exitos} logros` : `no alcanza: muro de 40px · ${fallos} fallos`),
  };
}

/* ============================================================
   4 · BUFFER DE SALTO
   ============================================================ */
function makeBuffer(): DemoInst {
  let y = DG, vy = 0, onG = true, buf = 0, t = 0, cadena = 0, mejor = 0, espera = 0, pulso = 0;
  const x = 70;

  return {
    update(dt, on) {
      t += dt;
      if (pulso > 0) pulso -= dt;
      if (buf > 0) buf -= dt;

      // el bot pulsa 0,09 s ANTES de tocar el suelo
      if (!onG && vy > 0) {
        const faltan = (DG - y) / Math.max(vy, 1);
        if (faltan < 0.09 && buf <= 0 && espera <= 0) { buf = on ? 0.12 : 0.001; pulso = 0.2; espera = 0.4; }
      }
      if (espera > 0) espera -= dt;

      if (onG) {
        if (buf > 0) { vy = -150; onG = false; buf = 0; cadena++; mejor = Math.max(mejor, cadena); }
        else { // la pulsación se perdió: hay que esperar al siguiente intento
          cadena = 0;
          if (espera <= 0) { vy = -150; onG = false; }
        }
      }
      vy += 620 * dt;
      y += vy * dt;
      if (y >= DG) { y = DG; vy = 0; onG = true; }
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      guy(ctx, x, y, onG, false, t);
      if (pulso > 0) { label(ctx, "PULSA", x + 14, y - 22, "#ffd23f", 5); }
      if (buf > 0 && on) {
        ctx.fillStyle = "#5ce1e6";
        ctx.fillRect(x - 12, y - 30, 24 * (buf / 0.12), 2);
      }
      ctx.fillStyle = "#39324f"; ctx.fillRect(150, 18, 70, 6);
      ctx.fillStyle = "#4ade80"; ctx.fillRect(150, 18, Math.min(70, cadena * 10), 6);
      label(ctx, "cadena", 150, 14, "#8b93c9", 5);
      label(ctx, on ? "buffer 0.12s" : "sin buffer", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) => (on ? `salta en cuanto aterriza · racha ${cadena} (mejor ${mejor})` : "la pulsación se pierde: el salto se traba"),
  };
}

/* ============================================================
   5 · ACELERACIÓN Y FRICCIÓN
   ============================================================ */
function makeAccel(): DemoInst {
  let x = 120, vx = 0, t = 0;
  const trail: number[] = [];
  return {
    update(dt, on) {
      t += dt;
      const objetivo = 120 + Math.sin(t * 1.3) * 80;
      const dir = Math.sign(objetivo - x);
      if (on) {
        vx += dir * 420 * dt;      // acelera
        vx *= Math.pow(0.0025, dt); // fricción (frena solo)
        vx = clamp(vx, -110, 110);
        x += vx * dt;
      } else {
        x = objetivo;               // respuesta instantánea
        vx = 0;
      }
      trail.push(x);
      if (trail.length > 48) trail.shift();
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      const objetivo = 120 + Math.sin(t * 1.3) * 80;
      // rastro
      trail.forEach((tx, i) => {
        ctx.globalAlpha = (i / trail.length) * 0.5;
        ctx.fillStyle = "#7c6bff";
        ctx.fillRect(tx - 1, DG - 4, 2, 2);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(objetivo - 1, 30, 2, 10);
      label(ctx, "objetivo", objetivo - 20, 26, "#ffd23f", 5);
      guy(ctx, x, DG, true, Math.abs(vx) > 12 || !on, t, (on ? vx : objetivo - x) < 0);
      // barra de velocidad
      ctx.fillStyle = "#39324f"; ctx.fillRect(150, 120, 70, 5);
      ctx.fillStyle = "#5ce1e6"; ctx.fillRect(185, 120, clamp(vx / 110, -1, 1) * 35, 5);
      label(ctx, on ? "con inercia" : "respuesta seca", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) =>
      on ? "arranca y frena con peso: se siente un cuerpo" : "se pega al objetivo: preciso pero robótico",
  };
}

/* ============================================================
   6 · DASH CON ENFRIAMIENTO
   ============================================================ */
function makeDash(): DemoInst {
  let x = 18, t = 0, cd = 0, dashT = 0, dist = 0, usos = 0;
  const ghosts: { x: number; a: number }[] = [];
  return {
    update(dt, on) {
      t += dt;
      if (cd > 0) cd -= dt;
      if (dashT > 0) {
        dashT -= dt;
        x += 320 * dt;
        ghosts.push({ x, a: 1 });
      } else {
        x += 55 * dt;
        if (on && cd <= 0 && x < 200) { dashT = 0.16; cd = 1.3; usos++; }
      }
      dist += 0;
      for (const g of ghosts) g.a -= dt * 2.6;
      while (ghosts.length && ghosts[0].a <= 0) ghosts.shift();
      if (x > 236) { x = 18; }
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      for (const g of ghosts) {
        ctx.globalAlpha = Math.max(0, g.a) * 0.5;
        ctx.fillStyle = "#5ce1e6";
        ctx.fillRect(g.x - 6, DG - 18, 12, 18);
      }
      ctx.globalAlpha = 1;
      guy(ctx, x, DG, dashT <= 0, true, t);
      // barra de enfriamiento
      ctx.fillStyle = "#39324f"; ctx.fillRect(150, 16, 70, 6);
      ctx.fillStyle = cd > 0 ? "#ff5d73" : "#4ade80";
      ctx.fillRect(150, 16, 70 * (cd > 0 ? 1 - cd / 1.3 : 1), 6);
      label(ctx, cd > 0 ? "recargando" : "dash listo", 150, 12, cd > 0 ? "#ff5d73" : "#4ade80", 5);
      label(ctx, on ? "dash ON" : "solo caminar", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) => (on ? `320 px/s durante 0.16s · ${usos} dashes` : "sin dash: el recorrido se hace eterno"),
  };
}

/* ============================================================
   7 · CÁMARA CON ZONA MUERTA
   ============================================================ */
function makeDeadzone(): DemoInst {
  let px = 300, vx = 60, cam = 220, t = 0, movCam = 0, medidor = 0;
  const ZONA = 34;
  return {
    update(dt, on) {
      t += dt;
      // el jugador zigzaguea: pasos cortos a izquierda y derecha
      vx = Math.sin(t * 1.1) * 95 + Math.sin(t * 3.3) * 25;
      px += vx * dt;
      px = clamp(px, 160, 480);
      const antes = cam;
      const centro = cam + DW / 2;
      if (on) {
        if (px > centro + ZONA) cam += (px - ZONA - DW / 2 - cam) * (1 - Math.exp(-6 * dt));
        else if (px < centro - ZONA) cam += (px + ZONA - DW / 2 - cam) * (1 - Math.exp(-6 * dt));
      } else {
        cam = px - DW / 2;                                 // pegada: tiembla con cada paso
      }
      medidor += (Math.abs(cam - antes) / Math.max(dt, 0.001) - medidor) * Math.min(1, dt * 3);
      movCam = medidor;
    },
    draw(ctx, on) {
      sky(ctx, "#223049", "#121a2c");
      // postes del mundo para percibir el desplazamiento
      for (let wx = Math.floor(cam / 40) * 40; wx < cam + DW + 40; wx += 40) {
        const sx = wx - cam;
        ctx.fillStyle = "#2f3b5c";
        ctx.fillRect(sx, 40, 3, DG - 40);
        ctx.fillStyle = "#3d4a71";
        ctx.fillRect(sx - 4, 38, 11, 3);
      }
      ground(ctx);
      if (on) {
        ctx.strokeStyle = "rgba(255,210,63,.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(DW / 2 - ZONA + 0.5, 30.5, ZONA * 2, DG - 34);
        label(ctx, "zona muerta", DW / 2 - ZONA, 26, "#ffd23f", 5);
      }
      guy(ctx, px - cam, DG, true, Math.abs(vx) > 14, t, vx < 0);
      label(ctx, on ? "con zona muerta" : "cámara pegada", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) =>
      on ? `la cámara casi no se mueve: ${Math.round(movCam)} px/s` : `la cámara copia cada paso: ${Math.round(movCam)} px/s`,
  };
}

/* ============================================================
   8 · HITSTOP Y TEMBLOR
   ============================================================ */
function makeJuice(): DemoInst {
  let y = 20, vy = 0, t = 0, shake = 0, freeze = 0, squash = 0, golpes = 0;
  const parts: { x: number; y: number; vx: number; vy: number; l: number }[] = [];
  return {
    update(dt, on) {
      t += dt;
      if (freeze > 0) { freeze -= dt; return; }            // ← hitstop: el mundo se detiene
      if (shake > 0) shake = Math.max(0, shake - dt * 16);
      if (squash > 0) squash = Math.max(0, squash - dt * 5);
      vy += 520 * dt;
      y += vy * dt;
      if (y >= DG - 8) {
        y = DG - 8; vy = -190; golpes++;
        if (on) {
          shake = 7; freeze = 0.07; squash = 1;
          for (let i = 0; i < 12; i++) {
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
            parts.push({ x: 120, y: DG, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, l: 0.5 });
          }
        }
      }
      for (const p of parts) { p.vy += 280 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; }
      while (parts.length && parts[0].l <= 0) parts.shift();
    },
    draw(ctx, on) {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      sky(ctx);
      ground(ctx);
      const sq = 1 + squash * 0.5, st = 1 - squash * 0.35;
      ctx.fillStyle = freeze > 0 ? "#ffffff" : "#ffd23f";
      ctx.fillRect(120 - 8 * sq, y - 8 * st, 16 * sq, 16 * st);
      for (const p of parts) {
        ctx.globalAlpha = clamp(p.l * 2, 0, 1);
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(p.x, p.y, 2, 2);
      }
      ctx.globalAlpha = 1;
      label(ctx, on ? "hitstop + temblor + chispas" : "impacto plano", 6, 14, on ? "#4ade80" : "#ff5d73");
      ctx.restore();
    },
    readout: (on) => (on ? `7px de temblor y 70ms de pausa · ${golpes} impactos` : `el mismo rebote sin jugo · ${golpes} impactos`),
  };
}

/* ============================================================
   9 · PATRULLA, VISIÓN Y PERSECUCIÓN
   ============================================================ */
function makePatrol(): DemoInst {
  type S = "patrulla" | "alerta" | "persigue" | "vuelve";
  let ex = 60, edir = 1, estado: S = "patrulla", alerta = 0, perdido = 0, t = 0;
  let px = 180, pdir = -1;
  const VIS = 64;

  return {
    update(dt, on) {
      t += dt;
      px += pdir * 48 * dt;
      if (px > 215) pdir = -1;
      if (px < 35) pdir = 1;

      const dist = Math.abs(px - ex);
      const delante = Math.sign(px - ex) === edir;
      const ve = on && delante && dist < VIS;

      if (estado === "patrulla") {
        ex += edir * 34 * dt;
        if (ex > 150) edir = -1;
        if (ex < 45) edir = 1;
        if (ve) { estado = "alerta"; alerta = 0.45; }
      } else if (estado === "alerta") {
        alerta -= dt;
        if (alerta <= 0) estado = ve ? "persigue" : "vuelve";
      } else if (estado === "persigue") {
        edir = px > ex ? 1 : -1;
        ex += edir * 62 * dt;
        if (!ve) { perdido += dt; if (perdido > 1.1) { estado = "vuelve"; perdido = 0; } } else perdido = 0;
      } else {
        const casa = 95;
        edir = casa > ex ? 1 : -1;
        ex += edir * 30 * dt;
        if (Math.abs(ex - casa) < 4) estado = "patrulla";
        if (ve) { estado = "alerta"; alerta = 0.3; }
      }
      if (!on && estado !== "patrulla") estado = "patrulla";
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      // cono de visión
      if (on) {
        const col = estado === "persigue" ? "rgba(255,93,115,.22)" : "rgba(92,225,230,.16)";
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(ex, DG - 10);
        ctx.lineTo(ex + edir * VIS, DG - 34);
        ctx.lineTo(ex + edir * VIS, DG);
        ctx.closePath();
        ctx.fill();
      }
      guy(ctx, px, DG, true, true, t, pdir < 0);
      // enemigo
      const col = estado === "persigue" ? "#ff5d73" : estado === "alerta" ? "#ffd23f" : "#58c94f";
      ctx.fillStyle = col;
      ctx.fillRect(ex - 7, DG - 12, 14, 12);
      ctx.fillStyle = "#1d2b23";
      ctx.fillRect(ex - 4 + (edir > 0 ? 4 : -2), DG - 9, 2, 2);
      if (estado === "alerta") label(ctx, "!", ex - 1, DG - 18, "#ffd23f", 7);
      label(ctx, on ? `estado: ${estado}` : "solo patrulla", 6, 14, on ? "#e9ecff" : "#ff5d73");
    },
    readout: (on) =>
      on ? "patrulla → alerta → persigue → vuelve" : "sin visión: el enemigo nunca te ve (y aburre)",
  };
}

/* ============================================================
   10 · VUELO SENOIDAL Y DISPARO TELEGRAFIADO
   ============================================================ */
function makeFlyer(): DemoInst {
  let t = 0, reloj = 1, px = 120, pdir = 1, golpes = 0, esquivas = 0;
  const avisos: { x: number; t: number }[] = [];
  const balas: { x: number; y: number; vy: number }[] = [];
  let peligro = 0;

  return {
    update(dt, on) {
      t += dt;
      const ex = 120 + Math.sin(t * 0.9) * 85;

      // el jugador solo puede esquivar si le avisan
      if (peligro > 0) peligro -= dt;
      px += pdir * (peligro > 0 ? 95 : 42) * dt;
      if (px > 215) pdir = -1;
      if (px < 25) pdir = 1;

      reloj -= dt;
      if (reloj <= 0) {
        reloj = 1.25;
        if (on) { avisos.push({ x: px, t: 0.5 }); peligro = 0.5; pdir = px > 120 ? -1 : 1; }
        else balas.push({ x: ex, y: 30, vy: 90 });
      }
      for (const a of avisos) {
        a.t -= dt;
        if (a.t <= 0) balas.push({ x: a.x, y: 30, vy: 90 });
      }
      while (avisos.length && avisos[0].t <= 0) avisos.shift();

      for (const b of balas) {
        b.vy += 210 * dt;
        b.y += b.vy * dt;
        if (b.y > DG - 14 && b.y < DG + 4 && Math.abs(b.x - px) < 9) { b.y = 9999; golpes++; }
        else if (b.y >= DG) { b.y = 9999; esquivas++; }
      }
      for (let i = balas.length - 1; i >= 0; i--) if (balas[i].y > 9000) balas.splice(i, 1);
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      const ex = 120 + Math.sin(t * 0.9) * 85;
      const ey = 26 + Math.sin(t * 2.4) * 8;
      // alas
      ctx.fillStyle = "#7c6bff";
      ctx.fillRect(ex - 9, ey - 3, 18, 8);
      ctx.fillStyle = "#a99bff";
      ctx.fillRect(ex - 13 - Math.sin(t * 14) * 2, ey - 1, 5, 3);
      ctx.fillRect(ex + 8 + Math.sin(t * 14) * 2, ey - 1, 5, 3);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ex - 4, ey, 2, 2); ctx.fillRect(ex + 2, ey, 2, 2);

      for (const a of avisos) {
        const parp = Math.floor(a.t * 12) % 2 === 0;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = parp ? "#ff5d73" : "#ffd23f";
        ctx.fillRect(a.x - 9, DG - 3, 18, 3);
        ctx.globalAlpha = 1;
        label(ctx, "!", a.x - 2, 48, parp ? "#ff5d73" : "#ffd23f", 6);
      }
      for (const b of balas) {
        ctx.fillStyle = "rgba(255,120,71,.35)"; ctx.fillRect(b.x - 1, b.y - 10, 3, 9);
        ctx.fillStyle = "#ffd23f"; ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
      }
      guy(ctx, px, DG, true, true, t, pdir < 0);
      label(ctx, on ? "con aviso previo" : "sin aviso", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) =>
      on ? `telegrafiado 0.5s · esquivadas ${esquivas} / golpes ${golpes}` : `injusto: golpes ${golpes} / esquivadas ${esquivas}`,
  };
}

/* ============================================================
   11 · OBJECT POOLING
   ============================================================ */
function makePool(): DemoInst {
  interface B { x: number; y: number; vx: number; vivo: boolean }
  const pool: B[] = [];
  let creados = 0, reutilizados = 0, reloj = 0, t = 0;
  const hist: number[] = [];

  const obtener = (on: boolean): B => {
    if (on) {
      const libre = pool.find((b) => !b.vivo);
      if (libre) { reutilizados++; return libre; }
    }
    const nueva: B = { x: 0, y: 0, vx: 0, vivo: false };
    pool.push(nueva);
    creados++;
    return nueva;
  };

  return {
    update(dt, on) {
      t += dt; reloj -= dt;
      if (reloj <= 0) {
        reloj = 0.14;
        const b = obtener(on);
        b.x = 18; b.y = 40 + ((creados + reutilizados) % 5) * 13; b.vx = 120 + ((creados * 37) % 60); b.vivo = true;
      }
      for (const b of pool) {
        if (!b.vivo) continue;
        b.x += b.vx * dt;
        if (b.x > DW + 6) b.vivo = false;                  // "muere": vuelve a la piscina
      }
      if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) {
        hist.push(creados);
        if (hist.length > 56) hist.shift();
      }
    },
    draw(ctx, on) {
      sky(ctx);
      ctx.fillStyle = "#1b2238";
      ctx.fillRect(0, DG, DW, DH - DG);
      for (const b of pool) {
        if (!b.vivo) continue;
        ctx.fillStyle = "rgba(92,225,230,.3)"; ctx.fillRect(b.x - 9, b.y + 1, 9, 2);
        ctx.fillStyle = "#5ce1e6"; ctx.fillRect(b.x, b.y, 5, 4);
      }
      // gráfica de objetos creados
      const max = Math.max(16, ...hist);
      hist.forEach((v, i) => {
        const h = (v / max) * 22;
        ctx.fillStyle = on ? "#4ade80" : "#ff5d73";
        ctx.fillRect(4 + i * 4, DH - 6 - h, 3, h);
      });
      label(ctx, on ? "reutiliza objetos" : "crea uno nuevo cada vez", 6, 14, on ? "#4ade80" : "#ff5d73");
      label(ctx, `creados ${creados}`, 150, 14, "#ffd23f", 5);
      label(ctx, `reusados ${reutilizados}`, 150, 24, "#5ce1e6", 5);
    },
    readout: (on) =>
      on ? `la piscina se estabiliza en ${pool.length} objetos` : `${creados} objetos creados y tirados: trabajo para el recolector`,
  };
}

/* ============================================================
   12 · POWER-UP CON TEMPORIZADOR
   ============================================================ */
function makePowerup(): DemoInst {
  let x = 18, t = 0, boost = 0, estrella = true, estX = 150, cogidas = 0, sorpresa = 0;
  const DUR = 2.6;
  return {
    update(dt, on) {
      t += dt;
      const vel = boost > 0 ? 125 : 55;
      x += vel * dt;
      if (boost > 0) {
        const antes = boost;
        boost -= dt;
        if (antes > 0 && boost <= 0 && !on) sorpresa = 0.6;  // se acaba de golpe
      }
      if (estrella && Math.abs(x - estX) < 10) { estrella = false; boost = DUR; cogidas++; }
      if (x > 236) { x = 18; estrella = true; estX = 120 + ((cogidas * 53) % 80); }
      if (sorpresa > 0) sorpresa -= dt;
    },
    draw(ctx, on) {
      sky(ctx);
      ground(ctx);
      if (estrella) {
        const b = Math.sin(t * 5) * 2;
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(estX - 2, DG - 24 + b, 4, 10);
        ctx.fillRect(estX - 5, DG - 21 + b, 10, 4);
        ctx.fillStyle = "#fff3a3";
        ctx.fillRect(estX - 1, DG - 23 + b, 2, 2);
      }
      const acabando = on && boost > 0 && boost < 1;
      if (boost > 0 && (!acabando || Math.floor(t * 12) % 2 === 0)) {
        ctx.fillStyle = "rgba(255,210,63,.25)";
        ctx.fillRect(x - 12, DG - 24, 24, 26);
      }
      guy(ctx, x, DG, true, true, t);
      if (boost > 0) {
        ctx.fillStyle = "#39324f"; ctx.fillRect(x - 14, DG - 30, 28, 3);
        ctx.fillStyle = acabando ? "#ff5d73" : "#ffd23f";
        ctx.fillRect(x - 14, DG - 30, 28 * (boost / DUR), 3);
      }
      if (sorpresa > 0) label(ctx, "¿eh? se acabó", x - 18, DG - 36, "#ff5d73", 5);
      label(ctx, on ? "avisa al expirar" : "expira sin avisar", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) =>
      on ? `×2 de velocidad · parpadea el último segundo` : `×2 de velocidad · desaparece sin previo aviso`,
  };
}

/* ============================================================
   13 · CURVAS DE ANIMACIÓN (EASING)
   ============================================================ */
function makeEasing(): DemoInst {
  let t = 0;
  const DUR = 1.1, PAUSA = 0.9;
  const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
  const easeOutBack = (p: number) => 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);
  return {
    update(dt) { t = (t + dt) % (DUR + PAUSA); },
    draw(ctx, on) {
      sky(ctx);
      const p = clamp(t / DUR, 0, 1);
      const filas: [string, number, string][] = [
        ["lineal", p, "#8b93c9"],
        ["easeOutCubic", on ? easeOutCubic(p) : p, "#5ce1e6"],
        ["easeOutBack", on ? easeOutBack(p) : p, "#ffd23f"],
      ];
      filas.forEach(([nombre, v, color], i) => {
        const y = 26 + i * 34;
        ctx.fillStyle = "#1b2238";
        ctx.fillRect(10, y - 4, DW - 20, 22);
        ctx.fillStyle = color;
        ctx.fillRect(10 + v * (DW - 66), y - 2, 46, 18);
        ctx.fillStyle = "#0d1126";
        label(ctx, nombre, 14 + v * (DW - 66), y + 10, "#0d1126", 5);
      });
      label(ctx, on ? "con curvas" : "todo lineal", 6, 14, on ? "#4ade80" : "#ff5d73");
    },
    readout: (on) =>
      on ? "la misma distancia, tres personalidades distintas" : "sin curvas, todo se mueve con la misma frialdad",
  };
}

/* ============================================================
   EL CATÁLOGO
   ============================================================ */
export const MECH_DEMOS: MechDemo[] = [
  {
    id: "coyote", cat: "salto", icon: Rabbit, title: "Coyote time",
    blurb: "Un margen invisible para saltar justo después de pisar el vacío. El jugador jura que llegó al borde… y tú le das la razón.",
    toggle: "ventana de 0.12s",
    code: `let coyote = 0;            // tiempo en el aire SIN haber saltado
const VENTANA = 0.12;      // 0,12 s de perdón (unos 7 fotogramas)

function actualizar(dt) {
  if (enElSuelo) coyote = 0;
  else coyote += dt;

  // el salto se permite si TOCAS el suelo... o si acabas de dejarlo
  if (pulsoSalto && (enElSuelo || coyote <= VENTANA)) {
    vy = -FUERZA_SALTO;
    enElSuelo = false;
    coyote = VENTANA + 1;   // consumido: no puedes saltar dos veces
  }
}`,
    bullets: [
      "Nadie pulsa el salto en el fotograma exacto del borde: todos llegamos un pelín tarde. El coyote time convierte ese error humano en un salto válido.",
      "El nombre viene del Coyote de los dibujos: corre por el aire unos instantes antes de caer. Aquí hacemos lo mismo, pero a tu favor.",
      "Es invisible en vídeo y enorme al jugar. Si tu plataformas se siente 'resbaladizo' o 'injusto', esta es la primera línea que debes añadir.",
    ],
    apps: ["Celeste (0.1s)", "Super Meat Boy", "Hollow Knight"],
    create: makeCoyote,
  },
  {
    id: "varjump", cat: "salto", icon: ArrowUpNarrowWide, title: "Altura de salto variable",
    blurb: "Un toque = saltito. Mantener = salto grande. El control analógico de los plataformas desde Mario Bros.",
    toggle: "cortar al soltar",
    code: `// Al pulsar: impulso completo
if (pulsoSalto && enElSuelo) vy = -FUERZA_SALTO;

// Al SOLTAR mientras aún subes: cortamos el impulso sobrante
if (solteSalto && vy < 0) vy *= 0.42;   // ← toda la mecánica

// (variante igual de usada: gravedad distinta al subir y al bajar)
const g = vy < 0 && manteniendoSalto ? GRAVEDAD * 0.6 : GRAVEDAD;
vy += g * dt;`,
    bullets: [
      "Una sola multiplicación convierte un botón digital en un control con matices: la altura depende de cuánto tiempo mantengas pulsado.",
      "Cortar la velocidad (vy *= 0.42) es más predecible que cambiar la gravedad; muchos juegos combinan ambas para afinar el tacto.",
      "Sin esto, todos tus saltos miden exactamente lo mismo y el jugador no puede ajustar su trayectoria: pierdes el 90% de la expresividad.",
    ],
    apps: ["Super Mario Bros.", "Celeste", "Ori and the Blind Forest"],
    create: makeVarJump,
  },
  {
    id: "double", cat: "salto", icon: ChevronsUp, title: "Doble salto",
    blurb: "Un contador de saltos disponibles que se recarga al tocar el suelo. Dos líneas que rediseñan todos tus niveles.",
    toggle: "segundo salto",
    code: `let saltosRestantes = 0;
const MAX_SALTOS = 2;        // 3 = triple salto; 99 = modo mosca

function actualizar(dt) {
  if (enElSuelo) saltosRestantes = MAX_SALTOS;  // recarga al aterrizar

  if (pulsoSalto && saltosRestantes > 0) {
    vy = -FUERZA_SALTO;       // el segundo salto REEMPLAZA la velocidad,
    saltosRestantes--;        // no la suma: así siempre sube igual
    enElSuelo = false;
    if (saltosRestantes === 0) chispasDeSaltoDoble();
  }
}`,
    bullets: [
      "Fíjate en que el segundo salto ASIGNA la velocidad (vy = -F) en vez de sumarla. Si sumaras, encadenar saltos te dispararía al infinito.",
      "Cambiar MAX_SALTOS de 1 a 2 altera el diseño de todos tus niveles: alturas, distancias y riesgos. Por eso suele ser una habilidad que se desbloquea.",
      "El mismo contador sirve para el salto en pared: al tocar una pared, recarga saltos y da impulso horizontal en sentido contrario.",
    ],
    apps: ["Hollow Knight (Monarch Wings)", "Rayman", "Mega Man X"],
    create: makeDoubleJump,
  },
  {
    id: "buffer", cat: "salto", icon: Timer, title: "Buffer de salto",
    blurb: "Si pulsas un poco antes de aterrizar, el juego recuerda tu intención y salta en cuanto toca el suelo.",
    toggle: "memoria de 0.12s",
    code: `let buffer = 0;              // cuánto dura la "intención" guardada

function alPulsarSalto() { buffer = 0.12; }   // no saltamos: lo apuntamos

function actualizar(dt) {
  if (buffer > 0) buffer -= dt;

  // en cuanto haya suelo disponible, gastamos la intención guardada
  if (buffer > 0 && enElSuelo) {
    vy = -FUERZA_SALTO;
    buffer = 0;
    enElSuelo = false;
  }
}`,
    bullets: [
      "Es el gemelo del coyote time: aquel perdona pulsar tarde, este perdona pulsar pronto. Juntos cubren los dos errores humanos posibles.",
      "Sin buffer, encadenar saltos obliga a una precisión de milisegundos y el personaje 'se traba' al aterrizar. Con él, el movimiento fluye.",
      "El mismo patrón vale para ataques y esquivas: guardar la última pulsación durante unos milisegundos hace que los combos se sientan responsivos.",
    ],
    apps: ["Celeste", "Dead Cells", "Hades"],
    create: makeBuffer,
  },
  {
    id: "accel", cat: "control", icon: Wind, title: "Aceleración y fricción",
    blurb: "¿Tu personaje es un cubo de hielo o una pared de ladrillo? Dos números deciden el carácter del movimiento.",
    toggle: "inercia",
    code: `const ACELERACION = 420;   // qué tan rápido coge velocidad
const FRICCION = 0.0025;   // cuánta conserva por segundo (menor = más seco)
const MAX = 110;

function actualizar(dt) {
  const dir = (derecha ? 1 : 0) - (izquierda ? 1 : 0);

  vx += dir * ACELERACION * dt;        // acelerar
  vx *= Math.pow(FRICCION, dt);        // frenar (independiente de los fps)
  vx = Math.max(-MAX, Math.min(MAX, vx));
  x += vx * dt;
}`,
    bullets: [
      "Asignar la velocidad directamente (vx = dir * MAX) da un control preciso de puzle. Acelerar da peso y personalidad. Ninguno es mejor: definen géneros distintos.",
      "Usar Math.pow(FRICCION, dt) en vez de multiplicar por un número fijo hace que el frenado sea idéntico a 30, 60 o 144 fps.",
      "Mario acelera y patina; Celeste casi no. Ajustar estos dos números es literalmente diseñar cómo se siente tu juego.",
    ],
    apps: ["Super Mario Bros. (patina)", "Celeste (seco y preciso)"],
    create: makeAccel,
  },
  {
    id: "dash", cat: "control", icon: Zap, title: "Dash con enfriamiento",
    blurb: "Un impulso breve, una estela y un contador que obliga a elegir el momento. El recurso limitado crea decisiones.",
    toggle: "dash disponible",
    code: `let dashT = 0, cooldown = 0;
const DUR = 0.16, VEL = 320, ESPERA = 1.3;

function actualizar(dt) {
  if (cooldown > 0) cooldown -= dt;

  if (pulsoDash && cooldown <= 0) {
    dashT = DUR;
    cooldown = ESPERA;        // ← el recurso: no puedes abusar
  }

  if (dashT > 0) {
    dashT -= dt;
    x += mira * VEL * dt;
    vy = 0;                   // flotas: el dash ignora la gravedad
    fantasmas.push({ x, y, alpha: 1 });   // estela
  }
}`,
    bullets: [
      "El enfriamiento no es un castigo: es lo que convierte el dash en una decisión. Sin espera, se pulsa sin pensar y deja de significar nada.",
      "Anular la gravedad durante el dash (vy = 0) lo vuelve predecible y permite usarlo para cruzar huecos: una regla clara se aprende en un intento.",
      "Los 'fantasmas' son copias del sprite con transparencia decreciente. Cuestan diez líneas y multiplican la sensación de velocidad.",
    ],
    apps: ["Celeste", "Hades", "Hollow Knight"],
    create: makeDash,
  },
  {
    id: "deadzone", cat: "camara", icon: Camera, title: "Cámara con zona muerta",
    blurb: "Una caja invisible en la que el personaje se mueve sin que la cámara reaccione. Adiós al mareo.",
    toggle: "zona muerta",
    code: `const ZONA = 34;   // mitad del ancho de la caja invisible

function actualizarCamara(dt) {
  const centro = camX + PANTALLA_W / 2;

  // la cámara SOLO se mueve si el jugador sale de la caja
  if (jugador.x > centro + ZONA) objetivo = jugador.x - ZONA - PANTALLA_W / 2;
  else if (jugador.x < centro - ZONA) objetivo = jugador.x + ZONA - PANTALLA_W / 2;
  else return;    // dentro de la zona: no hacemos nada

  camX += (objetivo - camX) * (1 - Math.exp(-6 * dt));  // y además, suave
}`,
    bullets: [
      "Una cámara pegada al jugador copia cada micro-paso y produce un temblor constante que cansa la vista sin que sepas por qué.",
      "La zona muerta se combina con el suavizado: primero decides SI moverse, después CÓMO moverse. Son dos problemas distintos.",
      "Variante profesional: añadir 'look-ahead', desplazar la cámara unos píxeles hacia donde mira el jugador para que vea antes lo que viene.",
    ],
    apps: ["Super Mario World", "Hollow Knight", "Ori"],
    create: makeDeadzone,
  },
  {
    id: "juice", cat: "camara", icon: Vibrate, title: "Hitstop y temblor",
    blurb: "Congelar el mundo 70 milisegundos en el momento del golpe. El truco más barato y más efectivo que existe.",
    toggle: "jugo activado",
    code: `let freeze = 0, temblor = 0;

function alGolpear() {
  freeze = 0.07;     // ← hitstop: 70 ms de pausa total
  temblor = 7;       // píxeles de sacudida
  chispas();
  aplastar();        // squash & stretch del sprite
}

function actualizar(dt) {
  if (freeze > 0) { freeze -= dt; return; }   // ¡el mundo entero se detiene!
  if (temblor > 0) temblor = Math.max(0, temblor - dt * 16);
  // ...resto de la lógica
}

function dibujar() {
  ctx.save();
  if (temblor > 0)
    ctx.translate((Math.random() - .5) * temblor, (Math.random() - .5) * temblor);
  // ...dibujar todo
  ctx.restore();
}`,
    bullets: [
      "El hitstop es un 'return' temprano en tu update: durante unas milésimas nada se mueve y el cerebro interpreta que el golpe tuvo un peso brutal.",
      "El temblor se aplica con translate() antes de dibujar, así afecta a toda la escena sin tocar ni una coordenada de tu lógica.",
      "Úsalo con medida: si todo tiembla, nada destaca. Reserva el hitstop para golpes críticos, muertes y momentos de impacto real.",
    ],
    apps: ["Street Fighter", "Hollow Knight", "Dead Cells"],
    create: makeJuice,
  },
  {
    id: "patrol", cat: "enemigos", icon: Eye, title: "Visión y persecución",
    blurb: "Patrulla, te ve, se sorprende, te persigue y vuelve a casa. Una IA completa con cuatro estados y un cono.",
    toggle: "cono de visión",
    code: `type Estado = "patrulla" | "alerta" | "persigue" | "vuelve";
let estado: Estado = "patrulla";

function teVe() {
  const dist = Math.abs(jugador.x - enemigo.x);
  const delante = Math.sign(jugador.x - enemigo.x) === enemigo.mira;
  return delante && dist < ALCANCE_VISION;      // cono simplificado
}

function actualizar(dt) {
  switch (estado) {
    case "patrulla":
      moverEntre(puntoA, puntoB, dt);
      if (teVe()) { estado = "alerta"; alerta = 0.45; }    // "!"
      break;
    case "alerta":                      // pausa dramática: te da margen
      if ((alerta -= dt) <= 0) estado = teVe() ? "persigue" : "vuelve";
      break;
    case "persigue":
      enemigo.x += Math.sign(jugador.x - enemigo.x) * VEL_PERSEGUIR * dt;
      if (!teVe() && (perdido += dt) > 1.1) estado = "vuelve";
      break;
    case "vuelve":
      volverACasa(dt);
      break;
  }
}`,
    bullets: [
      "El estado 'alerta' con su signo de exclamación no es decoración: ese medio segundo de pausa es lo que te da la oportunidad de esconderte.",
      "Perder al jugador requiere un temporizador (1,1 s). Si el enemigo olvidara al instante, parecería tonto; si no olvidara nunca, sería injusto.",
      "Cuatro estados y dos comparaciones bastan para que parezca que el enemigo piensa. La IA de juegos es teatro, no inteligencia real.",
    ],
    apps: ["Metal Gear (los conos de visión)", "Mark of the Ninja", "Zelda"],
    create: makePatrol,
  },
  {
    id: "flyer", cat: "enemigos", icon: Waves, title: "Vuelo senoidal y aviso",
    blurb: "Un enemigo que flota con un seno y avisa antes de disparar. La diferencia entre difícil y tramposo.",
    toggle: "telegrafiar el ataque",
    code: `// MOVIMIENTO: un seno es una ruta elegante sin escribir rutas
enemigo.x = CENTRO + Math.sin(t * 0.9) * 85;   // vaivén amplio
enemigo.y = ALTURA + Math.sin(t * 2.4) * 8;    // aleteo rápido

// ATAQUE TELEGRAFIADO: primero el aviso, después el peligro
if ((reloj -= dt) <= 0) {
  reloj = 1.25;
  avisos.push({ x: jugador.x, t: 0.5 });   // marca en el suelo 0,5 s
}

for (const aviso of avisos) {
  aviso.t -= dt;
  if (aviso.t <= 0) balas.push({ x: aviso.x, y: 0, vy: 90 });
}`,
    bullets: [
      "Dos senos con frecuencias distintas crean un movimiento orgánico imposible de predecir del todo y, aun así, totalmente determinista.",
      "El aviso previo es la regla de oro del diseño justo: el jugador debe poder reaccionar. Medio segundo basta para que la culpa del fallo sea suya.",
      "Apuntar al jugador en el momento del aviso (y no al disparar) te permite esquivar moviéndote: el ataque premia la reacción, no la suerte.",
    ],
    apps: ["Cuphead (todos los ataques avisan)", "Hollow Knight", "Hades"],
    create: makeFlyer,
  },
  {
    id: "pool", cat: "sistemas", icon: Recycle, title: "Object pooling",
    blurb: "En vez de crear y tirar mil balas, reutilizas siempre las mismas. Tu juego deja de dar tirones.",
    toggle: "reutilizar objetos",
    code: `const piscina = [];            // todas las balas, vivas y muertas

function obtenerBala() {
  // 1. ¿hay alguna libre? la reciclamos
  const libre = piscina.find(b => !b.viva);
  if (libre) return libre;

  // 2. si no, creamos UNA nueva y se queda en la piscina para siempre
  const nueva = { x: 0, y: 0, vx: 0, viva: false };
  piscina.push(nueva);
  return nueva;
}

function disparar(x, y) {
  const b = obtenerBala();
  b.x = x; b.y = y; b.vx = 300; b.viva = true;   // "nace"
}

function actualizar(dt) {
  for (const b of piscina) {
    if (!b.viva) continue;                        // las muertas se ignoran
    b.x += b.vx * dt;
    if (b.x > ANCHO) b.viva = false;              // "muere": vuelve a la piscina
  }
}`,
    bullets: [
      "Crear objetos es barato; crear MILES por segundo no. El recolector de basura se despierta a limpiarlos y provoca microtirones justo en la acción.",
      "Con la piscina, el número de objetos creados se estabiliza en el máximo simultáneo (mira la gráfica). Después, cero creaciones nuevas para siempre.",
      "Una bala nunca se destruye: solo cambia viva = false. Ese booleano es toda la diferencia entre un bullet-hell fluido y uno con hipo.",
    ],
    apps: ["Vampire Survivors", "Todo bullet-hell", "Unity: ObjectPool<T>"],
    create: makePool,
  },
  {
    id: "powerup", cat: "sistemas", icon: Star, title: "Power-ups temporales",
    blurb: "Un temporizador, un efecto y, sobre todo, un aviso de que se acaba. Los buffs invisibles frustran.",
    toggle: "parpadeo final",
    code: `let boost = 0;
const DURACION = 2.6;

function alRecoger(estrella) {
  boost = DURACION;          // reiniciar el temporizador también "apila"
  sonidoPowerUp();
}

function actualizar(dt) {
  if (boost > 0) boost -= dt;
  velocidad = boost > 0 ? VEL_BASE * 2 : VEL_BASE;   // el efecto
}

function dibujar() {
  if (boost <= 0) return dibujarNormal();

  // AVISO: el último segundo parpadea para que nadie se lleve sorpresas
  const acabando = boost < 1;
  if (!acabando || Math.floor(t * 12) % 2 === 0) dibujarAura();

  barra(boost / DURACION, acabando ? ROJO : DORADO);
}`,
    bullets: [
      "La mecánica es un simple contador hacia atrás; lo que convierte un buff en buen diseño es COMUNICAR cuánto le queda.",
      "El parpadeo del último segundo es el lenguaje universal de 'prepárate'. Mario lleva usándolo con la estrella desde 1985.",
      "Mismo patrón para venenos, escudos, invencibilidad tras un golpe o ralentizaciones: un número que baja y un efecto condicionado a él.",
    ],
    apps: ["Super Mario (estrella)", "Sonic (escudo)", "Vampire Survivors"],
    create: makePowerup,
  },
  {
    id: "easing", cat: "sistemas", icon: Spline, title: "Curvas de animación",
    blurb: "La misma distancia recorrida en el mismo tiempo, pero con tres personalidades completamente distintas.",
    toggle: "aplicar curvas",
    code: `// progreso = 0 → 1 en función del tiempo transcurrido
const p = Math.min(1, (ahora - inicio) / DURACION);

// Las curvas transforman ese progreso lineal en movimiento con carácter
const lineal       = (p) => p;
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);                 // frena al llegar
const easeOutBack  = (p) => 1 + 2.7 * (p-1)**3 + 1.7 * (p-1)**2;    // se pasa y vuelve
const easeInOut    = (p) => p < .5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2) / 2;

// Y se aplican interpolando entre dos valores:
panel.x = inicio + (destino - inicio) * easeOutBack(p);`,
    bullets: [
      "Nada en el mundo real se mueve a velocidad constante: todo arranca y frena. Las curvas de easing son esa física simplificada en una línea.",
      "easeOutBack se pasa de largo y vuelve: ese pequeño rebote es lo que hace que un menú se sienta 'vivo' en vez de deslizarse como una hoja de cálculo.",
      "Son funciones puras que reciben 0..1 y devuelven 0..1. Sirven igual para menús, cámaras, barras de vida, golpes y transiciones de escena.",
    ],
    apps: ["Toda la interfaz de Hades", "Animator de Unity", "Apple iOS"],
    create: makeEasing,
  },
];
