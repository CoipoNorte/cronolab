import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Paintbrush, Copy, Check, Eraser, Trash2, Database } from "lucide-react";
import SectionHeading from "./SectionHeading";
import CodeCard from "./CodeCard";
import {
  drawPixels,
  heroSprite,
  SLIME_A,
  CHEST_CLOSED,
  TREE_MAP,
  POTION_MAP,
} from "../game/sprites";
import type { PixelMap } from "../game/sprites";
import { SPRITE_LESSONS } from "../game/moreSnippets";
import { cn } from "../utils/cn";

/* ============================================================
   EDITOR DE SPRITES — pinta sobre una cuadrícula de 16×16.
   Lo que pintas ES el mismo array de strings del juego.
   ============================================================ */

const W = 16, H = 18, CELL = 18;

const PALETTE: { key: string; color: string; label: string }[] = [
  { key: "H", color: "#ff7847", label: "naranja" },
  { key: "S", color: "#ffcf9e", label: "piel" },
  { key: "W", color: "#f4f4f4", label: "blanco" },
  { key: "K", color: "#23232f", label: "negro" },
  { key: "R", color: "#ff5d73", label: "rojo" },
  { key: "T", color: "#1fae9e", label: "turquesa" },
  { key: "B", color: "#7a4a2b", label: "marrón" },
  { key: "P", color: "#3d4a7a", label: "vaquero" },
  { key: "O", color: "#5a3b2a", label: "cuero" },
  { key: "Y", color: "#ffd23f", label: "oro" },
  { key: "G", color: "#4ade80", label: "verde" },
  { key: "g", color: "#2e8f43", label: "verde osc." },
  { key: "C", color: "#8a5a3b", label: "madera" },
  { key: "c", color: "#6f4429", label: "madera osc." },
  { key: "X", color: "#241408", label: "interior" },
  { key: "L", color: "#cfe8ff", label: "hielo" },
  { key: "M", color: "#ff7ad9", label: "mágico" },
  { key: "V", color: "#7c6bff", label: "violeta" },
];

const COLOR_OF: Record<string, string> = Object.fromEntries(PALETTE.map((p) => [p.key, p.color]));

const PRESETS: { name: string; map: PixelMap }[] = [
  { name: "héroe (pj)", map: heroSprite("idle") },
  { name: "slime (enemigo)", map: SLIME_A },
  { name: "cofre (objeto)", map: CHEST_CLOSED },
  { name: "árbol (escenario)", map: TREE_MAP },
  { name: "poción (objeto)", map: POTION_MAP },
];

function padTo16(map: PixelMap): string[] {
  const rows: string[] = [];
  for (let r = 0; r < H; r++) {
    const src = map[r] ?? "";
    const w = src.length;
    const left = Math.max(0, Math.floor((W - w) / 2));
    rows[r] = (".".repeat(W) );
    if (src) rows[r] = ".".repeat(left) + src + ".".repeat(Math.max(0, W - left - w));
  }
  return rows.map((r) => (r + ".".repeat(W)).slice(0, W));
}

const EMPTY = padTo16([]);

export default function SpriteEditor() {
  const [rows, setRows] = useState<string[]>(() => padTo16(PRESETS[0].map));
  const [sel, setSel] = useState("K");
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(PRESETS[0].name);

  const gridRef = useRef<HTMLCanvasElement>(null);
  const prevRef = useRef<HTMLCanvasElement>(null);
  const rowsRef = useRef(rows);
  const paintingRef = useRef(false);

  useEffect(() => { rowsRef.current = rows; }, [rows]);

  /* ---- pintar celdas ---- */
  const paintAt = (clientX: number, clientY: number) => {
    const canvas = gridRef.current!;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * W);
    const row = Math.floor(((clientY - rect.top) / rect.height) * H);
    if (col < 0 || col >= W || row < 0 || row >= H) return;
    setRows((prev) => {
      if (prev[row][col] === sel) return prev;
      const next = prev.slice();
      next[row] = next[row].slice(0, col) + sel + next[row].slice(col + 1);
      return next;
    });
    setActivePreset(null);
  };

  /* ---- dibujar la cuadrícula ---- */
  useEffect(() => {
    const canvas = gridRef.current!;
    canvas.width = W * CELL;
    canvas.height = H * CELL;
    const ctx = canvas.getContext("2d")!;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const ch = rows[r]?.[c] ?? ".";
        ctx.fillStyle = ch === "." ? ((r + c) % 2 === 0 ? "#141936" : "#10142a") : COLOR_OF[ch] ?? "#ff00ff";
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
    ctx.strokeStyle = "rgba(139,147,201,0.12)";
    for (let i = 0; i <= W; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL + 0.5, 0); ctx.lineTo(i * CELL + 0.5, H * CELL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL + 0.5); ctx.lineTo(W * CELL, i * CELL + 0.5); ctx.stroke();
    }
  }, [rows]);

  /* ---- vista previa: tu sprite ENTREGA sus datos a dos instancias ---- */
  useEffect(() => {
    const canvas = prevRef.current!;
    const PW = 400, PH = 128;
    canvas.width = PW;
    canvas.height = PH;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const scratch = document.createElement("canvas");
    scratch.width = W; scratch.height = H;
    const sctx = scratch.getContext("2d")!;
    const GROUND = 96;
    let raf = 0;

    const loop = (now: number) => {
      const t = now / 1000;
      // cielo
      const grad = ctx.createLinearGradient(0, 0, 0, PH);
      grad.addColorStop(0, "#4f8fd6");
      grad.addColorStop(1, "#dff6fb");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, PW, PH);
      // suelo
      ctx.fillStyle = "#8a5a3b";
      ctx.fillRect(0, GROUND + 5, PW, PH - GROUND - 5);
      ctx.fillStyle = "#4fae52";
      ctx.fillRect(0, GROUND, PW, 5);
      ctx.fillStyle = "#7ed37a";
      ctx.fillRect(0, GROUND, PW, 1);
      // hierba pasando (scroll)
      ctx.fillStyle = "#3e9c47";
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 29 - t * 46) % (PW + 30) + PW + 30) % (PW + 30) - 15;
        ctx.fillRect(sx, GROUND - 3 - (i % 3), 2, 3 + (i % 3));
      }

      sctx.clearRect(0, 0, W, H);
      drawPixels(sctx, rowsRef.current, 0, 0, COLOR_OF);

      // instancia 1: grande, caminando con brinco
      const bob = Math.abs(Math.sin(t * 6)) * 5;
      ctx.fillStyle = "rgba(20,50,20,0.25)";
      ctx.fillRect(60 - 34, GROUND + 8, 72, 5);
      ctx.drawImage(scratch, 60 - 80 / 2, GROUND - 80 - bob + 4, 80, 80);

      // instancia 2: pequeña, en la distancia, con brillo distinto
      ctx.fillRect(250, GROUND + 6, 44, 4);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(scratch, 248, GROUND - 40 + 2, 40, 40);
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const codeText = useMemo(
    () => `const MI_SPRITE = [\n${rows.map((r) => `  "${r}",`).join("\n")}\n];`,
    [rows],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* sin portapapeles */ }
  };

  return (
    <section id="sprites" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="03"
          eyebrow="TALLER DE PÍXELES"
          title="EL EDITOR DE SPRITES:"
          accent="PINTA TU PROPIO PJ"
          blurb="Personajes, enemigos, objetos y escenarios comparten un único formato: el array de letras. Aquí puedes pintar uno con el ratón. Lo que dibujes aparecerá caminando en la vista previa en tiempo real."
          icon={Paintbrush}
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* -------- editor -------- */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl border border-line bg-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-pixel text-[9px] text-snow">LIENZO 16×16</h3>
                <button
                  onClick={() => { setRows(EMPTY); setActivePreset(null); }}
                  className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[10px] text-mist transition-colors hover:border-rose hover:text-rose"
                >
                  <Trash2 className="h-3 w-3" /> limpiar
                </button>
              </div>

              {/* presets */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => { setRows(padTo16(p.map)); setActivePreset(p.name); }}
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-pixel2 text-[10px] transition-colors",
                      activePreset === p.name
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-line bg-void text-mist hover:border-cyanx hover:text-cyanx",
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* cuadrícula */}
              <canvas
                ref={gridRef}
                className="mt-4 w-full cursor-crosshair rounded-lg border border-line"
                style={{ imageRendering: "pixelated", touchAction: "none" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  paintingRef.current = true;
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  paintAt(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => { if (paintingRef.current) paintAt(e.clientX, e.clientY); }}
                onPointerUp={() => { paintingRef.current = false; }}
                onPointerCancel={() => { paintingRef.current = false; }}
              />

              {/* paleta */}
              <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                {PALETTE.map((p) => (
                  <button
                    key={p.key}
                    title={`${p.label} (${p.key})`}
                    onClick={() => setSel(p.key)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-md border-2 font-pixel2 text-[10px] transition-transform",
                      sel === p.key ? "scale-110 border-gold" : "border-black/50 hover:scale-105",
                    )}
                    style={{ background: p.color, color: ["W", "L", "Y", "S"].includes(p.key) ? "#131313" : "#e9ecff" }}
                  >
                    {p.key}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSel(".")}
                className={cn(
                  "mt-2 flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 font-pixel2 text-[11px] transition-colors",
                  sel === "." ? "border-gold bg-gold/15 text-gold" : "border-line bg-void text-mist hover:text-snow",
                )}
              >
                <Eraser className="h-3.5 w-3.5" /> borrador (transparente)
              </button>
            </div>
          </motion.div>

          {/* -------- vista previa + datos -------- */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="lg:col-span-7"
          >
            <div className="flex h-full flex-col gap-4">
              <div className="overflow-hidden rounded-2xl border border-line bg-panel">
                <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2">
                  <span className="font-pixel2 text-[11px] tracking-wider text-mist">VISTA PREVIA · EN VIVO</span>
                  <span className="font-mono text-[10px] text-mist/60">dos instancias · un solo dato</span>
                </div>
                <canvas ref={prevRef} className="pixelated block w-full" />
                <p className="border-t border-line bg-panel2 px-4 py-2 text-[11px] text-mist">
                  Tu dibujo se pinta dos veces por fotograma: una grande y una lejana. El bosque de un JRPG es esto mismo, con 200 coordenadas.
                </p>
              </div>

              {/* los datos en vivo */}
              <div className="flex-1 overflow-hidden rounded-2xl border border-line bg-[#0d1126]">
                <div className="flex items-center justify-between border-b border-line bg-panel2/80 px-4 py-2.5">
                  <span className="flex items-center gap-2 font-pixel2 text-[11px] text-mist">
                    <Database className="h-3.5 w-3.5 text-cyanx" />
                    LOS DATOS (se reescriben al pintar)
                  </span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] text-mist transition-colors hover:border-gold hover:text-gold"
                  >
                    {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                    {copied ? "¡copiado!" : "copiar como código"}
                  </button>
                </div>
                <pre className="max-h-56 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-mist">
                  <code>{codeText}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>

        {/* lecciones del editor */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {SPRITE_LESSONS.map((l) => (
            <CodeCard key={l.id} lesson={l} accent="#ff7ad9" />
          ))}
        </div>
      </div>
    </section>
  );
}
