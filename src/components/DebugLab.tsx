import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Box,
  Bug,
  CircleDot,
  Gauge,
  Grid3x3,
  Hash,
  MousePointerClick,
  Pause,
  Play,
  Radar,
  RefreshCw,
  SkipForward,
  VectorSquare,
  Zap,
} from "lucide-react";
import { createDebugWorld, DEBUG_H, DEBUG_W } from "../game/debugWorld";
import type { DebugEvent, DebugOptions, DebugSnapshot } from "../game/debugWorld";
import type { MiniInput } from "../game/minis";
import { cn } from "../utils/cn";

const DEFAULT_OPTIONS: DebugOptions = {
  grid: true,
  hitboxes: true,
  vectors: true,
  ids: true,
  sensors: true,
  contacts: true,
  pauseOnDamage: false,
};

const EMPTY_SNAPSHOT: DebugSnapshot = {
  frame: 0,
  hero: { x: 0, y: 0, vx: 0, vy: 0, grounded: true, hearts: 3 },
  enemy: { x: 0, vx: 0, state: "patrol" },
  projectileCount: 0,
  entityCount: 0,
  collisionChecks: 0,
  contacts: 0,
  lastBreakpoint: "",
  events: [],
};

const EVENT_COLOR: Record<DebugEvent["type"], string> = {
  input: "text-cyanx",
  physics: "text-mint",
  collision: "text-gold",
  trigger: "text-viol",
  damage: "text-rose",
  spawn: "text-snow",
};

function Toggle(props: { icon: typeof Grid3x3; label: string; on: boolean; set: (v: boolean) => void }) {
  const Icon = props.icon;
  return (
    <button
      onClick={() => props.set(!props.on)}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors",
        props.on ? "border-mint/40 bg-mint/10 text-snow" : "border-line bg-void/50 text-mist",
      )}
    >
      <span className="flex items-center gap-2 font-pixel2 text-[11px]">
        <Icon className={cn("h-3.5 w-3.5", props.on ? "text-mint" : "text-mist")} /> {props.label}
      </span>
      <span className="font-pixel text-[7px]">{props.on ? "ON" : "OFF"}</span>
    </button>
  );
}

export default function DebugLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof createDebugWorld> | null>(null);
  const keysRef = useRef(new Set<string>());
  const optionsRef = useRef(DEFAULT_OPTIONS);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);
  const focusedRef = useRef(false);

  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [focused, setFocused] = useState(false);
  const [snapshot, setSnapshot] = useState<DebugSnapshot>(EMPTY_SNAPSHOT);
  const [fps, setFps] = useState(60);

  useEffect(() => { optionsRef.current = options; }, [options]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const makeInput = useCallback((): MiniInput => {
    const keys = keysRef.current;
    return {
      left: keys.has("ArrowLeft") || keys.has("KeyA"),
      right: keys.has("ArrowRight") || keys.has("KeyD"),
      up: keys.has("ArrowUp") || keys.has("KeyW"),
      down: keys.has("ArrowDown") || keys.has("KeyS"),
      jump: keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW"),
      interact: false,
      reset: false,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = DEBUG_W;
    canvas.height = DEBUG_H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const engine = createDebugWorld();
    engineRef.current = engine;

    let raf = 0;
    let last = performance.now();
    let uiAcc = 0;
    let fpsAcc = 0;
    let fpsFrames = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      fpsFrames++;
      fpsAcc += dt;

      if (!pausedRef.current) {
        const breakpoint = engine.update(dt * speedRef.current, makeInput(), optionsRef.current);
        if (breakpoint) {
          pausedRef.current = true;
          setPaused(true);
        }
      }
      engine.draw(ctx, optionsRef.current);

      uiAcc += dt;
      if (uiAcc > 0.1) { uiAcc = 0; setSnapshot(engine.snapshot()); }
      if (fpsAcc > 0.5) {
        setFps(Math.round(fpsFrames / fpsAcc));
        fpsAcc = 0; fpsFrames = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [makeInput]);

  useEffect(() => {
    const gameKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);
    const down = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      if (gameKeys.has(e.code)) e.preventDefault();
      keysRef.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    const clear = () => keysRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  const setOption = <K extends keyof DebugOptions>(key: K, value: DebugOptions[K]) =>
    setOptions((current) => ({ ...current, [key]: value }));

  const singleStep = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.update(1 / 60, makeInput(), optionsRef.current);
    setSnapshot(engine.snapshot());
  };

  const reset = () => {
    engineRef.current?.reset();
    setSnapshot(engineRef.current?.snapshot() ?? EMPTY_SNAPSHOT);
    setPaused(false);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-12">
      {/* -------- pantalla y transporte -------- */}
      <div className="xl:col-span-8">
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_0_70px_-28px_rgba(92,225,230,.45)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel2 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <Bug className="h-4 w-4 text-cyanx" />
              <span className="font-pixel2 text-[11px] text-snow">DEBUG_BUILD // SALA DE PRUEBAS</span>
              <span className="rounded bg-void px-2 py-0.5 font-mono text-[9px] text-mint">{fps} fps</span>
            </div>
            <span className="font-mono text-[10px] text-mist">frame {snapshot.frame}</span>
          </div>

          <div
            ref={screenRef}
            tabIndex={0}
            onFocus={() => { focusedRef.current = true; setFocused(true); }}
            onBlur={() => { focusedRef.current = false; setFocused(false); keysRef.current.clear(); }}
            className="crt relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyanx"
          >
            <canvas ref={canvasRef} className="pixelated block aspect-video w-full" />
            {!focused && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-void/68 backdrop-blur-[2px]">
                <MousePointerClick className="lab-float h-6 w-6 text-cyanx" />
                <p className="font-pixel text-[9px] text-snow">CLIC PARA CONTROLAR</p>
                <p className="font-pixel2 text-[11px] text-mist">A D / flechas · espacio para saltar</p>
              </div>
            )}
            {paused && (
              <div className="pointer-events-none absolute left-3 top-3 z-40 flex items-center gap-2 rounded-md bg-rose/85 px-2.5 py-1 text-white">
                <Pause className="h-3 w-3 fill-white" />
                <span className="font-pixel text-[8px]">PAUSA</span>
              </div>
            )}
          </div>

          {/* controles del tiempo */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-panel2 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaused((v) => !v)}
                className={cn("arcade-btn flex items-center gap-2 rounded-md px-4 py-2 font-pixel text-[8px]", paused ? "bg-mint text-black" : "bg-rose text-white")}
              >
                {paused ? <Play className="h-3 w-3 fill-black" /> : <Pause className="h-3 w-3 fill-white" />}
                {paused ? "CONTINUAR" : "PAUSAR"}
              </button>
              <button
                onClick={singleStep}
                disabled={!paused}
                className="arcade-btn flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 font-pixel text-[8px] text-snow disabled:cursor-not-allowed disabled:opacity-35"
                title="Avanzar exactamente 1/60 de segundo"
              >
                <SkipForward className="h-3 w-3" /> 1 FRAME
              </button>
              <button onClick={reset} className="rounded-md border border-line p-2 text-mist hover:border-gold hover:text-gold" title="Reiniciar mundo">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="mr-1 font-pixel2 text-[10px] text-mist">TIEMPO</span>
              {[0.25, 0.5, 1, 2].map((value) => (
                <button
                  key={value}
                  onClick={() => setSpeed(value)}
                  className={cn("rounded-md border px-2 py-1 font-mono text-[10px]", speed === value ? "border-gold bg-gold/10 text-gold" : "border-line text-mist")}
                >
                  {value}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* eventos */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-[#0d1126]">
          <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
            <span className="flex items-center gap-2 font-pixel text-[8px] text-snow">
              <Activity className="h-3.5 w-3.5 text-mint" /> REGISTRO DE EVENTOS
            </span>
            <span className="font-mono text-[9px] text-mist">últimos {Math.min(12, snapshot.events.length)} de {snapshot.events.length}</span>
          </div>
          <div className="h-44 overflow-auto p-3 font-mono text-[10px] leading-relaxed">
            {snapshot.events.length === 0 ? (
              <p className="text-mist/40">El mundo aún no emitió eventos. Muévete, salta o espera un proyectil.</p>
            ) : [...snapshot.events].reverse().slice(0, 12).map((event) => (
              <p key={event.seq} className="flex gap-2 border-b border-line/40 py-1">
                <span className="w-12 shrink-0 text-mist/45">f{String(event.frame).padStart(4, "0")}</span>
                <span className={cn("w-16 shrink-0", EVENT_COLOR[event.type])}>{event.type}</span>
                <span className="text-mist">{event.message}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* -------- panel derecho -------- */}
      <aside className="space-y-5 xl:col-span-4">
        <div className="rounded-2xl border border-line bg-panel p-4">
          <h3 className="flex items-center gap-2 font-pixel text-[8px] text-snow">
            <Radar className="h-4 w-4 text-cyanx" /> CAPAS DE DEPURACIÓN
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Toggle icon={Grid3x3} label="cuadrícula 16 px" on={options.grid} set={(v) => setOption("grid", v)} />
            <Toggle icon={Box} label="hitboxes" on={options.hitboxes} set={(v) => setOption("hitboxes", v)} />
            <Toggle icon={VectorSquare} label="vectores" on={options.vectors} set={(v) => setOption("vectors", v)} />
            <Toggle icon={Hash} label="IDs de entidades" on={options.ids} set={(v) => setOption("ids", v)} />
            <Toggle icon={Radar} label="sensores y triggers" on={options.sensors} set={(v) => setOption("sensors", v)} />
            <Toggle icon={CircleDot} label="puntos de contacto" on={options.contacts} set={(v) => setOption("contacts", v)} />
          </div>
          <button
            onClick={() => setOption("pauseOnDamage", !options.pauseOnDamage)}
            className={cn("mt-3 flex w-full items-center justify-between rounded-lg border px-3 py-2.5", options.pauseOnDamage ? "border-rose/50 bg-rose/10" : "border-line bg-void/50")}
          >
            <span className="flex items-center gap-2 font-pixel2 text-[11px] text-snow"><Zap className="h-3.5 w-3.5 text-rose" /> breakpoint al recibir daño</span>
            <span className="lab-toggle scale-75" data-on={options.pauseOnDamage} />
          </button>
          {snapshot.lastBreakpoint && (
            <p className="mt-2 rounded-md border border-rose/40 bg-rose/10 p-2 font-mono text-[10px] text-rose">
              breakpoint: {snapshot.lastBreakpoint}
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="border-b border-line bg-panel2 px-4 py-2.5">
            <h3 className="flex items-center gap-2 font-pixel text-[8px] text-snow"><Gauge className="h-4 w-4 text-gold" /> INSPECTOR EN VIVO</h3>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line font-mono text-[10px]">
            {[
              ["player.x", snapshot.hero.x.toFixed(2), "#ffd23f"],
              ["player.y", snapshot.hero.y.toFixed(2), "#ffd23f"],
              ["velocity.x", snapshot.hero.vx.toFixed(2), "#5ce1e6"],
              ["velocity.y", snapshot.hero.vy.toFixed(2), "#5ce1e6"],
              ["grounded", String(snapshot.hero.grounded), snapshot.hero.grounded ? "#4ade80" : "#ff5d73"],
              ["hearts", String(snapshot.hero.hearts), "#ff5d73"],
              ["slime.state", snapshot.enemy.state, "#7c6bff"],
              ["projectiles", String(snapshot.projectileCount), "#ff7ad9"],
              ["entities", String(snapshot.entityCount), "#e9ecff"],
              ["AABB checks", String(snapshot.collisionChecks), "#ffd23f"],
              ["contacts", String(snapshot.contacts), "#ffffff"],
              ["time scale", `${speed}×`, "#4ade80"],
            ].map(([key, value, color]) => (
              <div key={key} className="bg-panel p-3">
                <p className="text-mist/60">{key}</p>
                <p className="mt-1 truncate font-semibold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <h3 className="font-pixel text-[8px] text-gold">PRUEBAS PARA HACER</h3>
          <ol className="mt-3 space-y-2 text-[12px] leading-relaxed text-mist">
            <li>1. Pon el tiempo a 0.25× y salta contra el bloque.</li>
            <li>2. Pausa en el aire y avanza con «1 frame».</li>
            <li>3. Activa el breakpoint y deja que te golpee una bala.</li>
            <li>4. Apaga hitboxes: el juego sigue igual; solo perdiste información.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}