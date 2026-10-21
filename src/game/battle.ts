/* ============================================================
   BATALLA ATB — el combate por turnos de Chrono Trigger.
   Misma interfaz Mini: update / draw / hud.
   Estados: "fill" → "menu" → "anim" → "fin".
   ============================================================ */

import type { Mini, MiniInput, Hud } from "./minis";
import { drawPixels, heroSprite, HERO_PALETTE, HERO_W, HERO_H, SLIME_A, SLIME_B } from "./sprites";
import { sfx } from "./engine";

const VW = 480, VH = 270, FLOOR = 190;

type Ctx = CanvasRenderingContext2D;
type Mode = "fill" | "menu" | "animHero" | "animEnemy" | "fin";

/* corona del rey (se dibuja escalada ×3 sobre el slime gigante) */
const CROWN = [
  "..Y..Y..Y..",
  ".YYY.YYY.Y.",
  "YYYYYYYYYYY",
  "YKYYKYYYKYY",
  "YYYYYYYYYYY",
];
const CROWN_PAL = { Y: "#ffd23f", K: "#c88a1d" };
const BOSS_PAL = { G: "#6b4fae", g: "#4c3483", W: "#ffffff", K: "#1d1430" };

interface FloatNum { x: number; y: number; vy: number; life: number; text: string; color: string }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const azar = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export function createBattle(): Mini {
  /* ---- estado de la batalla (una foto de variables) ---- */
  let mode: Mode;
  let hero: { hp: number; maxHp: number; mp: number; maxMp: number; atb: number; pots: number };
  let boss: { hp: number; maxHp: number; atb: number; ph: number };
  let sel: number, msg: string, msgT: number, turns: number, win: boolean;
  let t = 0, shake = 0, bossFlash = 0, heroFlash = 0;
  let heroX = 360, heroVY = 0, heroAirY = 0;
  let bossX = 110, bossAirY = 0;
  let animA = { kind: "golpe" as "golpe" | "chispa" | "pocion" | "ataque" | "saltazo", t: 0, hit: false };
  let dmgNums: FloatNum[] = [];
  let sparks: Spark[] = [];

  const OPTIONS = ["ATACAR", "CHISPA  ·8PM", "POCIÓN ×"];

  const reset = () => {
    mode = "fill";
    hero = { hp: 40, maxHp: 40, mp: 20, maxMp: 20, atb: 0, pots: 2 };
    boss = { hp: 70, maxHp: 70, atb: 8, ph: 0 };
    sel = 0; turns = 0; win = false; t = 0; shake = 0; bossFlash = 0; heroFlash = 0;
    heroX = 360; bossX = 110; heroAirY = 0; bossAirY = 0; heroVY = 0;
    dmgNums = []; sparks = [];
    msg = "¡un REY SLIME corta el camino!"; msgT = 3.5;
  };

  const floatDmg = (x: number, y: number, text: string, color: string) =>
    dmgNums.push({ x, y: y - 6, vy: -30, life: 1.2, text, color });

  const burst = (x: number, y: number, colors: string[], n: number, pow = 80) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.3 + Math.random() * 0.7) * pow;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - pow * 0.4, life: 0.5 + Math.random() * 0.4, max: 0.9, color: colors[i % colors.length] });
    }
  };

  const hitBoss = (base: number, extra: number, special: boolean) => {
    const crit = Math.random() < 0.15;
    const dmg = (base + azar(0, extra)) * (crit ? 2 : 1);
    boss.hp = Math.max(0, boss.hp - dmg);
    bossFlash = 0.28;
    shake = crit ? 6 : 4;
    floatDmg(bossX, FLOOR - 52, (crit ? "¡CRÍT " : "") + dmg + (crit ? "!" : ""), crit ? "#ffd23f" : "#ffffff");
    burst(bossX, FLOOR - 30, special ? ["#5ce1e6", "#7c6bff", "#ffffff"] : ["#ffd23f", "#ffffff"], special ? 22 : 12, special ? 110 : 85);
    if (special) sfx.hurt(); else sfx.stomp();
  };

  const hitHero = (dmg: number, heavy: boolean) => {
    hero.hp = Math.max(0, hero.hp - dmg);
    heroFlash = 0.28;
    shake = heavy ? 7 : 5;
    floatDmg(heroX, FLOOR - 34, "-" + dmg, "#ff5d73");
    burst(heroX, FLOOR - 18, ["#ff5d73", "#ffffff"], 10, 70);
    sfx.hurt();
  };

  const checkFin = () => {
    if (boss.hp <= 0) {
      mode = "fin"; win = true;
      msg = "¡VICTORIA!  +30 XP  ·  pulsa R"; msgT = 999;
      burst(bossX, FLOOR - 30, ["#ffd23f", "#4ade80", "#7c6bff", "#ff5d73"], 60, 140);
      sfx.win();
    } else if (hero.hp <= 0) {
      mode = "fin"; win = false;
      msg = "HAS CAÍDO…  pulsa R para otra batalla"; msgT = 999;
      sfx.hurt();
    }
  };

  reset();

  return {
    update(dt: number, inp: MiniInput) {
      if (inp.reset) { reset(); return; }
      t += dt;
      boss.ph += dt;
      if (msgT > 0) msgT -= dt;
      if (shake > 0) shake = Math.max(0, shake - dt * 14);
      if (bossFlash > 0) bossFlash -= dt;
      if (heroFlash > 0) heroFlash -= dt;
      for (const n of dmgNums) { n.y += n.vy * dt; n.vy += 40 * dt; n.life -= dt; }
      dmgNums = dmgNums.filter((n) => n.life > 0);
      for (const s of sparks) { s.vy += 260 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
      sparks = sparks.filter((s) => s.life > 0);
      if (mode === "fin") return;

      if (mode === "fill") {
        // ATB: el tiempo rellena ambas barras (modo Espera: fuera de "fill" descansan)
        hero.atb = Math.min(100, hero.atb + 62 * dt);
        boss.atb = Math.min(100, boss.atb + 40 * dt);
        if (boss.atb >= 100) {
          // ataque del jefe: salto doble cada 3º turno suyo
          animA = { kind: turns % 3 === 2 ? "saltazo" : "ataque", t: 0, hit: false };
          mode = "animEnemy";
          msg = animA.kind === "saltazo" ? "¡REY SLIME usa SALTAZO!" : "REY SLIME ataca…";
          msgT = 2;
        } else if (hero.atb >= 100) {
          mode = "menu"; sel = 0;
          msg = "tu turno: elige un comando"; msgT = 2.5;
        }
        return;
      }

      if (mode === "menu") {
        // MODO ACTIVO (el de Chrono Trigger): el jefe NO espera a que decidas
        boss.atb = Math.min(100, boss.atb + 40 * dt);
        if (boss.atb >= 100) {
          animA = { kind: turns % 3 === 2 ? "saltazo" : "ataque", t: 0, hit: false };
          mode = "animEnemy";
          msg = "¡te golpean mientras decides!"; msgT = 1.6;
          return;
        }
        if (inp.left) { sel = (sel + OPTIONS.length - 1) % OPTIONS.length; sfx.jump(); }
        if (inp.right) { sel = (sel + 1) % OPTIONS.length; sfx.jump(); }
        if (inp.interact || inp.jump) {
          if (sel === 0) {
            animA = { kind: "golpe", t: 0, hit: false };
            mode = "animHero";
          } else if (sel === 1) {
            if (hero.mp >= 8) {
              hero.mp -= 8;
              animA = { kind: "chispa", t: 0, hit: false };
              mode = "animHero";
              msg = "¡CHISPA!"; msgT = 1.5;
            } else { msg = "¡PM insuficientes!"; msgT = 1.5; sfx.hurt(); }
          } else {
            if (hero.pots <= 0) { msg = "¡no quedan POCIONES!"; msgT = 1.5; sfx.hurt(); }
            else if (hero.hp >= hero.maxHp) { msg = "¡PV ya al máximo!"; msgT = 1.5; sfx.hurt(); }
            else {
              hero.pots--;
              animA = { kind: "pocion", t: 0, hit: false };
              mode = "animHero";
            }
          }
          if (mode === "animHero") turns++;
        }
        return;
      }

      if (mode === "animHero") {
        const a = animA; a.t += dt;
        if (a.kind === "golpe") {
          // carrera → golpe → regreso
          const dash = 0.22, back = 0.5;
          if (a.t < dash) heroX = 360 + (196 - 360) * (a.t / dash);
          else if (a.t < back) {
            if (!a.hit) { a.hit = true; hitBoss(8, 5, false); }
            heroX = 196 + (360 - 196) * ((a.t - dash) / (back - dash));
          } else { heroX = 360; hero.atb = 0; mode = "fill"; checkFin(); }
        } else if (a.kind === "chispa") {
          if (a.t > 0.15 && a.t < 0.6 && Math.random() < 0.75) {
            sparks.push({ x: bossX - 20 + Math.random() * 40, y: 40 + Math.random() * 20, vx: 0, vy: 160, life: 0.5, max: 0.5, color: ["#5ce1e6", "#7c6bff", "#ffffff"][azar(0, 2)] });
          }
          if (!a.hit && a.t >= 0.28) { a.hit = true; hitBoss(14, 5, true); }
          if (a.t >= 0.75) { hero.atb = 0; mode = "fill"; checkFin(); }
        } else {
          if (!a.hit) {
            a.hit = true;
            const heal = 14;
            hero.hp = Math.min(hero.maxHp, hero.hp + heal);
            floatDmg(heroX, FLOOR - 34, "+" + heal + " PV", "#4ade80");
            burst(heroX, FLOOR - 18, ["#4ade80", "#bff5b0"], 12, 60);
            sfx.coin();
          }
          if (a.t >= 0.5) { hero.atb = 0; mode = "fill"; checkFin(); }
        }
        return;
      }

      if (mode === "animEnemy") {
        const a = animA; a.t += dt;
        const out = 0.26, back = 0.55;
        if (a.t < out) {
          const k = a.t / out;
          bossX = 110 + (330 - 110) * k;
          bossAirY = -Math.sin(k * Math.PI) * (a.kind === "saltazo" ? 44 : 26);
          if (!a.hit && k > 0.85) {
            a.hit = true;
            hitHero(azar(5, 9) * (a.kind === "saltazo" ? 2 : 1), a.kind === "saltazo");
            heroVY = -3;
          }
        } else if (a.t < back) {
          const k = (a.t - out) / (back - out);
          bossX = 330 + (110 - 330) * k;
          bossAirY = -Math.sin(k * Math.PI) * 18;
        } else {
          bossX = 110; bossAirY = 0;
          boss.atb = 0;
          // si tu barra seguía llena, vuelves directo al menú (estabas decidiendo)
          mode = hero.atb >= 100 && hero.hp > 0 ? "menu" : "fill";
          checkFin();
        }
        if (heroAirY < 0 || heroVY < 0) {
          heroAirY += heroVY * dt * 40;
          heroVY += dt * 40;
          if (heroAirY > 0) heroAirY = 0;
        }
      }
    },

    draw(ctx: Ctx) {
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      ctx.save();
      ctx.translate(sx, sy);

      /* cielo de batalla: atardecer dramático (paleta nueva = otra hora) */
      const grad = ctx.createLinearGradient(0, 0, 0, VH);
      grad.addColorStop(0, "#191840");
      grad.addColorStop(0.5, "#5b3266");
      grad.addColorStop(1, "#c9726a");
      ctx.fillStyle = grad;
      ctx.fillRect(-10, -10, VW + 20, VH + 20);
      // estrellas
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 26; i++) {
        if (hash(i * 3) > (Math.floor(t * 2 + i) % 3 === 0 ? 0.55 : 0.9)) ctx.fillRect(hash(i) * VW, hash(i * 7) * 90, 1.6, 1.6);
      }
      // luna grande
      ctx.fillStyle = "#ffe9c4";
      const mx = 392, my = 42, mrows = [8, 14, 18, 20, 22, 22, 22, 20, 18, 14, 8];
      mrows.forEach((w, r) => ctx.fillRect(mx - w / 2, my + r * 2 - 11, w, 2));
      ctx.fillStyle = "rgba(160,120,90,0.35)";
      ctx.fillRect(mx + 3, my - 4, 5, 4);
      ctx.fillRect(mx - 7, my + 3, 4, 3);
      // pinos lejanos en silueta
      ctx.fillStyle = "rgba(20,16,44,0.85)";
      for (let i = 0; i < 9; i++) {
        const px = i * 64 - 10 + hash(i * 11) * 20;
        const ph2 = 24 + hash(i * 5) * 18;
        ctx.beginPath();
        ctx.moveTo(px - 14, FLOOR);
        ctx.lineTo(px, FLOOR - ph2);
        ctx.lineTo(px + 14, FLOOR);
        ctx.fill();
      }
      // suelo del campo de batalla
      ctx.fillStyle = "#463061";
      ctx.fillRect(-10, FLOOR, VW + 20, VH - FLOOR + 10);
      ctx.fillStyle = "#5c3f80";
      ctx.fillRect(-10, FLOOR, VW + 20, 3);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(-10, FLOOR + 3, VW + 20, 6);

      /* ---- REY SLIME (slime ×3 + corona: el jefe es un enemigo conocido, agrandado) ---- */
      if (boss.hp > 0 || win) {
        const bobH = Math.sin(boss.ph * 3) * 2 + bossAirY;
        const sc = 3;
        ctx.save();
        ctx.translate(Math.round(bossX - (14 * sc) / 2), Math.round(FLOOR - 10 * sc + bobH));
        ctx.scale(sc, sc);
        const frame = Math.sin(boss.ph * 5) > 0 ? SLIME_A : SLIME_B;
        drawPixels(ctx, frame, 0, 0, boss.hp > 0 ? BOSS_PAL : { ...BOSS_PAL, G: "#3a3a4a", g: "#2a2a38" });
        drawPixels(ctx, CROWN, 1.5, -5 + (Math.sin(boss.ph * 3) > 0.6 ? -1 : 0), CROWN_PAL);
        ctx.restore();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(bossX - 22, FLOOR + 2, 44, 4);
        if (bossFlash > 0 && Math.floor(t * 30) % 2 === 0) {
          ctx.globalAlpha = 0.65;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(bossX - 24, FLOOR - 46 + bobH, 48, 40);
          ctx.globalAlpha = 1;
        }
        // barra del jefe
        ctx.fillStyle = "#191428";
        ctx.fillRect(bossX - 26, FLOOR - 58 + bobH, 52, 5);
        ctx.fillStyle = "#ff5d73";
        ctx.fillRect(bossX - 25, FLOOR - 57 + bobH, 50 * (boss.hp / boss.maxHp), 3);
      }

      /* ---- héroe ---- */
      {
        const hx = Math.round(heroX), hy = Math.round(FLOOR + heroAirY);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(hx - 8, FLOOR + 2, 16, 3);
        const dashing = mode === "animHero" && animA.kind === "golpe" && animA.t < 0.5;
        const state = dashing ? (Math.floor(t * 12) % 2 === 0 ? "runA" : "runB") : "idle";
        drawPixels(ctx, heroSprite(state as "runA" | "runB" | "idle"), hx - HERO_W / 2, hy - HERO_H, HERO_PALETTE, true);
        if (heroFlash > 0 && Math.floor(t * 30) % 2 === 0) {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = "#ff5d73";
          ctx.fillRect(hx - 9, hy - HERO_H, 18, HERO_H);
          ctx.globalAlpha = 1;
        }
      }

      /* chispas y números */
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(0, s.life / s.max);
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, 2, 2);
      }
      ctx.globalAlpha = 1;
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      for (const n of dmgNums) {
        ctx.globalAlpha = clamp(n.life, 0, 1);
        ctx.fillStyle = n.color;
        ctx.fillText(n.text, n.x, n.y);
      }
      ctx.globalAlpha = 1;

      /* ------------ panel de interfaz ------------ */
      ctx.fillStyle = "rgba(11,14,26,0.92)";
      ctx.fillRect(6, 206, VW - 12, 58);
      ctx.strokeStyle = "#7c6bff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(6.5, 206.5, VW - 13, 57);

      // mensaje del sistema (arriba)
      if (msgT > 0) {
        ctx.fillStyle = "rgba(11,14,26,0.85)";
        const mw = msg.length * 7 + 18;
        ctx.fillRect(VW / 2 - mw / 2, 8, mw, 16);
        ctx.fillStyle = "#e9ecff";
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText(msg, VW / 2, 19);
      }

      // menú de comandos
      if (mode === "menu") {
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffd23f";
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText("COMANDO", 18, 220);
        OPTIONS.forEach((o, i) => {
          const disabled = (i === 1 && hero.mp < 8) || (i === 2 && (hero.pots <= 0 || hero.hp >= hero.maxHp));
          const label = i === 2 ? o + hero.pots : o;
          ctx.fillStyle = disabled ? "#4a5070" : sel === i ? "#ffd23f" : "#e9ecff";
          ctx.fillText((sel === i ? "> " : "  ") + label, 18, 234 + i * 10);
        });
      } else if (mode === "fill") {
        ctx.fillStyle = "#8b93c9";
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = "left";
        ctx.fillText("esperando turno…", 18, 238);
      } else {
        ctx.fillStyle = "#8b93c9";
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = "left";
        ctx.fillText(mode === "fin" ? (win ? "¡victoria!" : "derrota…") : "…", 18, 238);
      }

      // barras del héroe (derecha del panel)
      const bx = 300, bw = 64;
      ctx.textAlign = "left";
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = "#e9ecff";
      ctx.fillText("CRONO", bx - 40, 220);
      ctx.fillText("PV", bx - 40, 234);
      ctx.fillStyle = "#191428"; ctx.fillRect(bx, 230, bw, 5);
      ctx.fillStyle = "#4ade80"; ctx.fillRect(bx + 1, 231, (bw - 2) * (hero.hp / hero.maxHp), 3);
      ctx.fillText(String(hero.hp), bx + bw + 6, 234);
      ctx.fillStyle = "#e9ecff";
      ctx.fillText("PM", bx - 40, 246);
      ctx.fillStyle = "#191428"; ctx.fillRect(bx, 242, bw, 5);
      ctx.fillStyle = "#5ce1e6"; ctx.fillRect(bx + 1, 243, (bw - 2) * (hero.mp / hero.maxMp), 3);
      ctx.fillText(String(hero.mp), bx + bw + 6, 246);
      ctx.fillStyle = "#e9ecff";
      ctx.fillText("ATB", bx - 40, 258);
      ctx.fillStyle = "#191428"; ctx.fillRect(bx, 254, bw, 5);
      const full = hero.atb >= 100;
      ctx.fillStyle = full ? (Math.floor(t * 6) % 2 === 0 ? "#ffd23f" : "#fff3a3") : "#4ade80";
      ctx.fillRect(bx + 1, 255, (bw - 2) * (hero.atb / 100), 3);

      /* overlay final */
      if (mode === "fin") {
        ctx.fillStyle = "rgba(7,9,18,0.55)";
        ctx.fillRect(0, 0, VW, 206);
        ctx.textAlign = "center";
        ctx.fillStyle = win ? "#4ade80" : "#ff5d73";
        ctx.font = '13px "Press Start 2P", monospace';
        ctx.fillText(win ? "¡VICTORIA!" : "DERROTA", VW / 2, 96);
        ctx.fillStyle = "#e9ecff";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(win ? `turnos: ${turns}   pv restantes: ${hero.hp}` : `turnos aguantados: ${turns}`, VW / 2, 116);
        ctx.fillStyle = "#ffd23f";
        ctx.fillText("pulsa R para otra batalla", VW / 2, 136);
      }

      ctx.restore();
    },

    hud(): Hud {
      return {
        pv: `${hero.hp}/${hero.maxHp}`,
        jefe: `${boss.hp}/${boss.maxHp}`,
        turnos: turns,
        modo: mode === "fill" ? "rellenando" : mode,
      };
    },
  };
}
