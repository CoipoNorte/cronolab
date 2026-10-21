import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronLeft as LChevronLeft,
  ChevronRight as LChevronRight,
  ChevronUp as LChevronUp,
  ChevronDown as LChevronDown,
  ArrowBigUp as LArrowBigUp,
  MessagesSquare,
  MousePointerClick as LMousePointerClick,
} from "lucide-react";
import { MW, MH } from "../game/minis";
import type { Mini, MiniInput, Hud } from "../game/minis";
import { ensureAudio } from "../game/engine";

/* ============================================================
   MARCO MINI — la misma máquina arcade del juego grande,
   pero alimentada por cualquier motor con la interfaz Mini.
   El hecho de que los 3 juegos quepan en este marco demuestra
   el punto clave: EL BUCLE ES SIEMPRE EL MISMO.
   ============================================================ */

interface Props {
  make: (canvas: HTMLCanvasElement) => Mini;
  title: string;
  accent?: string;
  hints: string[];
  withInteract?: boolean;
  topDown?: boolean;
  renderHud: (h: Hud) => ReactNode;
}

export default function MiniFrame({ make, title, accent = "#ffd23f", hints, withInteract, topDown, renderHud }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef({ jump: false, interact: false, reset: false });
  const focusedRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const [hud, setHud] = useState<Hud>({});

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = MW;
    canvas.height = MH;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const engine = make(canvas);

    let raf = 0;
    let last = performance.now();
    let frame = 0;
    let lastHudJson = "";

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      frame++;

      const keys = keysRef.current;
      const pend = pendingRef.current;
      const input: MiniInput = {
        left: keys.has("ArrowLeft") || keys.has("KeyA") || keys.has("TouchLeft"),
        right: keys.has("ArrowRight") || keys.has("KeyD") || keys.has("TouchRight"),
        up: keys.has("ArrowUp") || keys.has("KeyW") || keys.has("TouchUp"),
        down: keys.has("ArrowDown") || keys.has("KeyS") || keys.has("TouchDown"),
        jump: pend.jump || keys.has("TouchJumpHeld"),
        interact: pend.interact,
        reset: pend.reset,
      };
      pend.jump = false;
      pend.interact = false;
      pend.reset = false;

      engine.update(dt, input);
      engine.draw(ctx);

      if (frame % 8 === 0) {
        const next = JSON.stringify(engine.hud());
        if (next !== lastHudJson) {
          lastHudJson = next;
          setHud(engine.hud());
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [make]);

  useEffect(() => {
    const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);
    const down = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      ensureAudio();
      if (e.code === "KeyR") { pendingRef.current.reset = true; return; }
      if (!topDown && (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && !e.repeat) {
        pendingRef.current.jump = true;
        return;
      }
      if (topDown && e.code === "Space" && !e.repeat) {
        pendingRef.current.interact = true;
        return;
      }
      if (e.code === "KeyE" && !e.repeat) { pendingRef.current.interact = true; return; }
      keysRef.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [topDown]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_0_60px_-25px_rgba(124,107,255,0.5)]">
      <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
          <span className="font-pixel2 text-[11px] tracking-wider text-mist">{title}</span>
        </div>
        <span className="font-mono text-[10px] text-mist/60">{MW}×{MH}</span>
      </div>

      <div
        ref={screenRef}
        tabIndex={0}
        onPointerDown={() => ensureAudio()}
        onFocus={() => { focusedRef.current = true; setFocused(true); }}
        onBlur={() => { focusedRef.current = false; setFocused(false); keysRef.current.clear(); }}
        className="crt relative cursor-pointer outline-none ring-gold/60 transition-shadow focus-visible:ring-2"
      >
        <canvas ref={canvasRef} className="pixelated block aspect-video w-full" />

        {/* HUD (chips inyectadas por cada juego) */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-40 flex flex-wrap items-center justify-between gap-2">
          {renderHud(hud)}
        </div>

        {!focused && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2.5 bg-void/70 backdrop-blur-[2px]">
            <LMousePointerClick className="lab-float h-6 w-6" style={{ color: accent }} />
            <p className="font-pixel text-[9px] tracking-wide text-snow">CLIC PARA TOMAR EL CONTROL</p>
          </div>
        )}

        {/* controles táctiles */}
        <div className="absolute inset-x-0 bottom-3 z-40 hidden items-end justify-between px-3 [@media(hover:none)]:flex">
          <div className={topDown ? "grid grid-cols-3 gap-1" : "flex gap-2"}>
            {topDown && <span />}
            {topDown && (
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-void/70 text-snow backdrop-blur-sm active:bg-viol"
                onPointerDown={(e) => { e.preventDefault(); keysRef.current.add("TouchUp"); }}
                onPointerUp={() => keysRef.current.delete("TouchUp")}
                onPointerLeave={() => keysRef.current.delete("TouchUp")}
                aria-label="Arriba"
              ><LChevronUp className="h-5 w-5" /></button>
            )}
            {topDown && <span />}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-void/70 text-snow backdrop-blur-sm active:bg-viol"
              onPointerDown={(e) => { e.preventDefault(); keysRef.current.add("TouchLeft"); }}
              onPointerUp={() => keysRef.current.delete("TouchLeft")}
              onPointerLeave={() => keysRef.current.delete("TouchLeft")}
              aria-label="Izquierda"
            ><LChevronLeft className="h-5 w-5" /></button>
            {topDown && (
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-void/70 text-snow backdrop-blur-sm active:bg-viol"
                onPointerDown={(e) => { e.preventDefault(); keysRef.current.add("TouchDown"); }}
                onPointerUp={() => keysRef.current.delete("TouchDown")}
                onPointerLeave={() => keysRef.current.delete("TouchDown")}
                aria-label="Abajo"
              ><LChevronDown className="h-5 w-5" /></button>
            )}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-void/70 text-snow backdrop-blur-sm active:bg-viol"
              onPointerDown={(e) => { e.preventDefault(); keysRef.current.add("TouchRight"); }}
              onPointerUp={() => keysRef.current.delete("TouchRight")}
              onPointerLeave={() => keysRef.current.delete("TouchRight")}
              aria-label="Derecha"
            ><LChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="flex gap-2">
            {withInteract && (
              <button
                className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-cyanx bg-cyanx/20 text-cyanx backdrop-blur-sm active:bg-cyanx active:text-black"
                onPointerDown={(e) => { e.preventDefault(); pendingRef.current.interact = true; }}
                aria-label="Interactuar"
              >
                <MessagesSquare className="h-5 w-5" />
              </button>
            )}
            {!topDown && (
              <button
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-gold/20 text-gold backdrop-blur-sm active:bg-gold active:text-black"
                onPointerDown={(e) => { e.preventDefault(); pendingRef.current.jump = true; }}
                aria-label="Saltar"
              >
                <LArrowBigUp className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line bg-panel2 px-4 py-2">
        {hints.map((ht) => (
          <span key={ht} className="text-[11px] text-mist">{ht}</span>
        ))}
      </div>
    </div>
  );
}
