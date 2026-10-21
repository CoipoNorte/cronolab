import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Coins,
  Volume2,
  VolumeX,
  RotateCcw,
  MousePointerClick,
  Gamepad2,
  Gauge,
  ArrowDownToLine,
  ChevronsUp,
  Layers,
  Video,
  ChevronLeft,
  ChevronRight,
  ArrowBigUp,
  FlaskConical,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import {
  createGame,
  resetGame,
  update,
  draw,
  ensureAudio,
  setMuted,
  DEFAULT_PARAMS,
  VIEW_W,
  VIEW_H,
} from "../game/engine";
import type { Game, Params } from "../game/engine";

/* ------------------------------------------------------------------ */
/*  Panel de experimentos: cada slider toca una variable REAL del juego */
/* ------------------------------------------------------------------ */

function LabSlider(props: {
  icon: typeof Gauge;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const { icon: Icon, label, value, min, max, step, unit, onChange } = props;
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-pixel2 text-xs text-snow">
          <Icon className="h-3.5 w-3.5 text-cyanx" />
          {label}
        </label>
        <span className="rounded border border-line bg-void px-2 py-0.5 font-mono text-[11px] text-gold">
          {value} <span className="text-mist">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="lab-range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function LabToggle(props: { icon: typeof Video; label: string; on: boolean; onChange: (v: boolean) => void }) {
  const { icon: Icon, label, on, onChange } = props;
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-lg border border-line bg-void/40 px-3 py-2.5 transition-colors hover:border-viol/50"
    >
      <span className="flex items-center gap-2 font-pixel2 text-xs text-snow">
        <Icon className="h-3.5 w-3.5 text-cyanx" />
        {label}
      </span>
      <span className="lab-toggle" data-on={on} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  El laboratorio completo                                             */
/* ------------------------------------------------------------------ */

export default function GameLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const gameRef = useRef<Game | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const focusedRef = useRef(false);

  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const paramsRef = useRef(params);
  const [hud, setHud] = useState({ score: 0, hearts: 3, won: false });
  const [focused, setFocused] = useState(false);

  /* sincroniza params → ref (el bucle lee el ref, sin re-render) */
  useEffect(() => {
    paramsRef.current = params;
    setMuted(!params.sound);
  }, [params]);

  /* ---- EL BUCLE DEL JUEGO (este de verdad, el que corre) ---- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const game = createGame();
    gameRef.current = game;

    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    let lastHud = { score: -1, hearts: -1, won: false };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const keys = keysRef.current;
      game.input.left = keys.has("ArrowLeft") || keys.has("KeyA") || keys.has("TouchLeft");
      game.input.right = keys.has("ArrowRight") || keys.has("KeyD") || keys.has("TouchRight");

      update(game, dt, paramsRef.current);
      draw(game, ctx, paramsRef.current);

      /* FPS sin pasar por React */
      frames++;
      acc += dt;
      if (acc >= 0.5) {
        if (fpsRef.current) fpsRef.current.textContent = String(Math.round(frames / acc));
        frames = 0;
        acc = 0;
      }

      /* HUD: solo re-render cuando algo cambia */
      if (game.score !== lastHud.score || game.hearts !== lastHud.hearts || game.won !== lastHud.won) {
        lastHud = { score: game.score, hearts: game.hearts, won: game.won };
        setHud(lastHud);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---- teclado ---- */
  useEffect(() => {
    const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      ensureAudio();
      if (e.code === "KeyR") {
        if (gameRef.current) resetGame(gameRef.current);
        return;
      }
      if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !e.repeat) {
        gameRef.current && (gameRef.current.input.jump = true);
        return;
      }
      keysRef.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    const onBlur = () => keysRef.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const pressTouch = (code: string, down: boolean) => {
    ensureAudio();
    if (code === "TouchJump") {
      if (down && gameRef.current) gameRef.current.input.jump = true;
      return;
    }
    if (down) keysRef.current.add(code);
    else keysRef.current.delete(code);
  };

  const doReset = () => {
    if (gameRef.current) resetGame(gameRef.current);
    screenRef.current?.focus();
  };

  const setP = <K extends keyof Params>(k: K, v: Params[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  return (
    <section id="juego" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="01"
          eyebrow="LA PIEZA PRINCIPAL"
          title="JUEGA PRIMERO,"
          accent="ENTIENDE DESPUÉS"
          blurb="Esto no es un GIF: es un juego real corriendo en tu navegador. Haz clic en la pantalla, muévete con las flechas o A/D, salta con ESPACIO, recoge monedas, aplasta slimes y llega a la bandera. Luego rompe las reglas con el panel de la derecha."
          icon={Gamepad2}
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* ---------------- EL MARCO ARCADE ---------------- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-8"
          >
            <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_0_80px_-20px_rgba(124,107,255,0.45)]">
              {/* barra superior del marco */}
              <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose shadow-[0_0_8px_#ff5d73]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_8px_#ffd23f]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-mint shadow-[0_0_8px_#4ade80]" />
                  <span className="ml-2 hidden font-pixel2 text-[11px] tracking-wider text-mist sm:block">
                    PANTALLA_01 // PRADERA DEL BUCLE
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setP("sound", !params.sound)}
                    className="rounded-md border border-line p-1.5 text-mist transition-colors hover:border-gold hover:text-gold"
                    aria-label={params.sound ? "Silenciar" : "Activar sonido"}
                  >
                    {params.sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={doReset}
                    className="rounded-md border border-line p-1.5 text-mist transition-colors hover:border-gold hover:text-gold"
                    aria-label="Reiniciar nivel"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* LA PANTALLA */}
              <div
                ref={screenRef}
                tabIndex={0}
                onPointerDown={() => ensureAudio()}
                onFocus={() => { focusedRef.current = true; setFocused(true); }}
                onBlur={() => { focusedRef.current = false; setFocused(false); keysRef.current.clear(); }}
                className="crt relative cursor-pointer outline-none ring-gold/60 transition-shadow focus-visible:ring-2"
                aria-label="Pantalla del juego. Usa las flechas para moverte y espacio para saltar."
              >
                <canvas ref={canvasRef} className="pixelated block aspect-video w-full" />

                {/* HUD */}
                <div className="pointer-events-none absolute left-3 top-3 z-40 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <Heart
                      key={i}
                      className={
                        i < hud.hearts
                          ? "h-4 w-4 fill-rose text-rose drop-shadow-[0_0_6px_rgba(255,93,115,0.8)]"
                          : "h-4 w-4 text-snow/25"
                      }
                    />
                  ))}
                </div>
                <div className="pointer-events-none absolute right-3 top-3 z-40 flex items-center gap-1.5 rounded-md bg-void/70 px-2.5 py-1 backdrop-blur-sm">
                  <Coins className="h-3.5 w-3.5 text-gold" />
                  <span className="font-pixel text-[10px] text-gold">×{hud.score}</span>
                </div>
                <div className="pointer-events-none absolute bottom-3 left-3 z-40 rounded bg-void/70 px-2 py-1 backdrop-blur-sm">
                  <span ref={fpsRef} className="font-mono text-[10px] text-mint">60</span>
                  <span className="font-mono text-[10px] text-mist"> fps</span>
                </div>

                {/* overlay de foco */}
                {!focused && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-void/70 backdrop-blur-[2px] transition-opacity">
                    <MousePointerClick className="lab-float h-7 w-7 text-gold" />
                    <p className="font-pixel text-[10px] tracking-wide text-snow">
                      CLIC PARA TOMAR EL CONTROL
                    </p>
                    <p className="font-pixel2 text-[11px] text-mist">← → mover · espacio saltar · R reiniciar</p>
                  </div>
                )}

                {/* controles táctiles (solo pantallas táctiles) */}
                <div className="absolute inset-x-0 bottom-3 z-40 hidden items-end justify-between px-3 [@media(hover:none)]:flex">
                  <div className="flex gap-2">
                    <button
                      className="flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-void/70 text-snow backdrop-blur-sm active:bg-viol"
                      onPointerDown={(e) => { e.preventDefault(); pressTouch("TouchLeft", true); }}
                      onPointerUp={() => pressTouch("TouchLeft", false)}
                      onPointerLeave={() => pressTouch("TouchLeft", false)}
                      onPointerCancel={() => pressTouch("TouchLeft", false)}
                      aria-label="Izquierda"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      className="flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-void/70 text-snow backdrop-blur-sm active:bg-viol"
                      onPointerDown={(e) => { e.preventDefault(); pressTouch("TouchRight", true); }}
                      onPointerUp={() => pressTouch("TouchRight", false)}
                      onPointerLeave={() => pressTouch("TouchRight", false)}
                      onPointerCancel={() => pressTouch("TouchRight", false)}
                      aria-label="Derecha"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                  <button
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-gold/20 text-gold backdrop-blur-sm active:bg-gold active:text-black"
                    onPointerDown={(e) => { e.preventDefault(); pressTouch("TouchJump", true); }}
                    aria-label="Saltar"
                  >
                    <ArrowBigUp className="h-7 w-7" />
                  </button>
                </div>
              </div>

              {/* pie del marco */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-panel2 px-4 py-2.5">
                <div className="flex items-center gap-4 text-[11px] text-mist">
                  <span className="flex items-center gap-1.5"><span className="kbd">←</span><span className="kbd">→</span> correr</span>
                  <span className="flex items-center gap-1.5"><span className="kbd">ESPACIO</span> saltar</span>
                  <span className="hidden items-center gap-1.5 sm:flex"><span className="kbd">R</span> reiniciar</span>
                </div>
                <span className="font-pixel2 text-[10px] text-mist/60">
                  resolución interna real: {VIEW_W}×{VIEW_H}px
                </span>
              </div>
            </div>
          </motion.div>

          {/* ---------------- PANEL DE EXPERIMENTOS ---------------- */}
          <motion.aside
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-4"
          >
            <div className="flex h-full flex-col rounded-2xl border border-line bg-panel p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-pixel text-[10px] text-snow">
                  <FlaskConical className="h-4 w-4 text-mint" />
                  LABORATORIO
                </h3>
                <button
                  onClick={() => setParams(DEFAULT_PARAMS)}
                  className="font-mono text-[10px] text-mist underline-offset-2 hover:text-gold hover:underline"
                >
                  valores originales
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mist">
                Cada slider es <strong className="text-snow">una variable real</strong> del motor.
                Mueve uno y mira qué rompe.
              </p>

              <div className="mt-5 space-y-5">
                <LabSlider icon={Gauge} label="velocidad de carrera" value={params.speed} min={60} max={240} step={5} unit="px/s" onChange={(v) => setP("speed", v)} />
                <LabSlider icon={ArrowDownToLine} label="gravedad" value={params.gravity} min={300} max={1600} step={25} unit="px/s²" onChange={(v) => setP("gravity", v)} />
                <LabSlider icon={ChevronsUp} label="fuerza de salto" value={params.jump} min={150} max={520} step={10} unit="px/s" onChange={(v) => setP("jump", v)} />
                <LabSlider icon={Layers} label="intensidad parallax" value={params.parallax} min={0} max={2} step={0.1} unit="×" onChange={(v) => setP("parallax", v)} />
              </div>

              <div className="mt-5 space-y-2.5">
                <LabToggle icon={Video} label="cámara suave (lerp)" on={params.smoothCam} onChange={(v) => setP("smoothCam", v)} />
                <LabToggle icon={Volume2} label="sonido 8-bit" on={params.sound} onChange={(v) => setP("sound", v)} />
              </div>

              <div className="mt-5 rounded-lg border border-gold/30 bg-gold/5 p-3.5">
                <p className="font-pixel2 text-[11px] text-gold">RECETAS PARA PROBAR</p>
                <ul className="mt-2 space-y-1.5 font-mono text-[11px] leading-relaxed text-mist">
                  <li>· modo luna → gravedad <span className="text-cyanx">400</span> + salto <span className="text-cyanx">460</span></li>
                  <li>· modo roblox → salto <span className="text-cyanx">150</span></li>
                  <li>· sin profundidad → parallax <span className="text-cyanx">0</span></li>
                  <li>· modo tortuga → velocidad <span className="text-cyanx">60</span></li>
                </ul>
              </div>

              <p className="mt-auto pt-5 text-[11px] leading-relaxed text-mist/70">
                Cuando muevas un slider, pregúntate: «¿dónde en el código se usa este número?».
                Esa pregunta ES aprender a programar juegos.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
