import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Code2, ChevronDown, Sparkles, MoveHorizontal, ArrowUp, Rocket } from "lucide-react";
import { heroSprite, drawPixels, HERO_PALETTE, HERO_W, HERO_H } from "../game/sprites";
import { HERO_ART as heroArt } from "../game/heroArt";

/** El héroe del juego caminando en un mini-canvas.
 *  La misma tabla de letras que corre dentro del juego, a escala ×7. */
function PixelHero() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const SCALE = 7;
    canvas.width = HERO_W * SCALE;
    canvas.height = HERO_H * SCALE + 14;
    ctx.imageSmoothingEnabled = false;
    // canvas auxiliar a resolución 1:1, luego lo escalamos de golpe
    const scratch = document.createElement("canvas");
    scratch.width = HERO_W;
    scratch.height = HERO_H;
    const sctx = scratch.getContext("2d")!;
    let raf = 0;
    const loop = (now: number) => {
      const frame = Math.floor(now / 160) % 2 === 0 ? "runA" : "runB";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // sombra
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height - 6, 40, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      sctx.clearRect(0, 0, HERO_W, HERO_H);
      drawPixels(sctx, heroSprite(frame as "runA" | "runB"), 0, 0, HERO_PALETTE);
      const bob = Math.floor(now / 160) % 2; // brinco de 1px al correr
      ctx.drawImage(scratch, 0, bob);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      className="pixelated h-auto w-[120px] sm:w-[150px]"
      aria-label="El héroe del juego, dibujado con datos"
    />
  );
}

export default function Hero() {
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 800], [0, 180]);
  const yFg = useTransform(scrollY, [0, 800], [0, -60]);

  return (
    <section id="top" className="relative flex min-h-svh items-center overflow-hidden">
      {/* fondo pixel-art con parallax al hacer scroll */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 -bottom-48">
        <img
          src={heroArt}
          alt=""
          className="pixelated h-full w-full scale-105 object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-void/85 via-void/30 to-void" />
      <div className="absolute inset-0 bg-gradient-to-r from-void/80 via-transparent to-void/40" />
      <div className="crt absolute inset-0 opacity-60" />
      <div className="lab-noise absolute inset-0" />

      <motion.div
        style={{ y: yFg }}
        className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-28 pt-32 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:items-center"
      >
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-void/60 px-4 py-1.5 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span className="font-pixel2 text-xs tracking-wide text-gold">
              tutorial interactivo · sin instalar nada
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-pixel text-[clamp(1.5rem,4.4vw,3.1rem)] leading-[1.45] text-snow"
          >
            CREA TU PROPIO
            <br />
            <span className="bg-gradient-to-r from-gold via-rose to-viol bg-clip-text text-transparent">
              CHRONO TRIGGER
            </span>
            <br />
            <span className="text-outline">EN EL NAVEGADOR</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-mist sm:text-lg"
          >
            Un juego de desplazamiento lateral <strong className="text-snow">2.5D que puedes jugar ahora mismo</strong>,
            con el código real explicado <strong className="text-snow">función por función en español</strong>.
            Editor de sprites, editor de niveles, mundo RPG con misiones y guardado, NPCs, arena de evasión, batalla ATB, descargas y puente a Unity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#/tutorial"
              className="arcade-btn flex items-center gap-3 rounded-md bg-mint px-6 py-3.5 font-pixel text-[10px] text-black"
            >
              <Rocket className="h-3.5 w-3.5" />
              TUTORIAL PASO A PASO
            </a>
            <a
              href="#juego"
              className="arcade-btn flex items-center gap-3 rounded-md bg-gold px-6 py-3.5 font-pixel text-[10px] text-black"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              JUGAR Y APRENDER
            </a>
            <a
              href="#codigo"
              className="arcade-btn flex items-center gap-3 rounded-md border-2 border-viol bg-panel px-6 py-3 font-pixel text-[10px] text-snow"
            >
              <Code2 className="h-3.5 w-3.5 text-viol" />
              VER EL CÓDIGO
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-mist"
          >
            <span className="flex items-center gap-2">
              <span className="kbd"><MoveHorizontal className="h-3 w-3" /></span>
              <span className="kbd">A</span><span className="kbd">D</span> moverse
            </span>
            <span className="flex items-center gap-2">
              <span className="kbd"><ArrowUp className="h-3 w-3" /></span>
              <span className="kbd">ESPACIO</span> saltar
            </span>
            <span className="flex items-center gap-2">
              <span className="kbd">R</span> reiniciar
            </span>
          </motion.div>
        </div>

        {/* columna derecha: el héroe + tarjeta de datos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="hidden justify-center lg:flex"
        >
          <div className="lab-float relative">
            <div className="pixel-corners relative rounded-xl border border-line bg-panel/80 p-8 backdrop-blur-md [--pc:#7c6bff]">
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-panel px-3 py-1.5 font-pixel2 text-[10px] text-cyanx">
                hola, soy un array de letras
              </div>
              <PixelHero />
              <div className="mt-4 space-y-1.5 border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-mist">
                <p><span className="text-rose">const</span> <span className="text-cyanx">heroe</span> = {"{"}</p>
                <p className="pl-4">sprite: <span className="text-gold">"16×18 píxeles"</span>,</p>
                <p className="pl-4">fisicas: <span className="text-mint">gravedad + salto</span>,</p>
                <p className="pl-4">animacion: <span className="text-viol">4 fotogramas</span>,</p>
                <p>{"}"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* tira de estadísticas */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-line/60 bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-4 py-3 sm:px-6">
          {[
            ["8", "juegos en una web"],
            ["73", "lecciones descargables"],
            ["60", "fotogramas / segundo"],
            ["0", "instalaciones previas"],
          ].map(([n, label]) => (
            <div key={label} className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-pixel text-sm text-gold">{n}</span>
              <span className="font-pixel2 text-xs text-mist">{label}</span>
            </div>
          ))}
          <a href="#juego" className="lab-blink hidden items-center gap-1 font-pixel2 text-xs text-cyanx sm:flex">
            baja para jugar <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
