import { useEffect, useRef, useState } from "react";
import { Play, Pencil, Trash2, Copy, Check, RotateCcw, Database, FileJson } from "lucide-react";
import MiniFrame from "./MiniFrame";
import { createPlatformer, LEVEL } from "../game/minis";
import type { Mini } from "../game/minis";
import { Coins, Flag } from "lucide-react";
import { cn } from "../utils/cn";

/* ============================================================
   EDITOR DE NIVELES — Mario Maker de bolsillo.
   Pintas el array del tilemap y JUEGAS el resultado al instante.
   ============================================================ */

const COLS = 56, ROWS = 17, CELL = 10;
const LS_KEY = "cronolab-mi-nivel";

type Tool = "#" | "=" | "o" | "F" | ".";

const TOOLS: { id: Tool; label: string; color: string; symbol: string }[] = [
  { id: "#", label: "suelo", color: "#4fae52", symbol: "#" },
  { id: "=", label: "ladrillo", color: "#a55d3f", symbol: "=" },
  { id: "o", label: "moneda", color: "#ffd23f", symbol: "o" },
  { id: "F", label: "meta (una)", color: "#ff5470", symbol: "F" },
  { id: ".", label: "borrador", color: "#10142a", symbol: "·" },
];

const blankRow = () => ".".repeat(COLS);
const blankLevel = () => {
  const rows = Array.from({ length: ROWS }, blankRow);
  for (let r = 13; r < ROWS; r++) rows[r] = "#".repeat(COLS);
  return rows;
};

function loadSaved(): string[] | null {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (!s) return null;
    const rows = JSON.parse(s) as string[];
    if (rows.length !== ROWS || rows.some((r) => r.length !== COLS)) return null;
    return rows;
  } catch {
    return null;
  }
}

function Chip2(props: { icon: typeof Coins; label: string; value: string; color?: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md bg-void/70 px-2 py-1 backdrop-blur-sm">
      <props.icon className="h-3 w-3" style={{ color: props.color ?? "#ffd23f" }} />
      <span className="font-pixel2 text-[9px] text-mist">{props.label}</span>
      <span className="font-pixel text-[9px]" style={{ color: props.color ?? "#ffd23f" }}>{props.value}</span>
    </span>
  );
}

export default function LevelEditor() {
  const [rows, setRows] = useState<string[]>(() => loadSaved() ?? LEVEL.slice());
  const [tool, setTool] = useState<Tool>("#");
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState<{ rows: string[]; id: number } | null>(null);

  const gridRef = useRef<HTMLCanvasElement>(null);
  const paintingRef = useRef(false);

  /* guardar automáticamente (localStorage = tu disco duro) */
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch { /* sin espacio */ }
  }, [rows]);

  const paintAt = (clientX: number, clientY: number) => {
    const canvas = gridRef.current!;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(((clientX - rect.left) / rect.width) * COLS);
    const row = Math.floor(((clientY - rect.top) / rect.height) * ROWS);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    setRows((prev) => {
      if (prev[row][col] === tool && tool !== "F") return prev;
      let next = prev.slice();
      // la meta es única: borra las demás F
      if (tool === "F") next = next.map((r) => r.split("F").join("."));
      next[row] = next[row].slice(0, col) + tool + next[row].slice(col + 1);
      return next;
    });
  };

  /* ---- dibujar la rejilla del tilemap ---- */
  useEffect(() => {
    const canvas = gridRef.current!;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#7ec8f2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = rows[r][c];
        const x = c * CELL, y = r * CELL;
        if (ch === ".") {
          ctx.fillStyle = ((r + c) % 2 === 0) ? "#8fcdf0" : "#86c4ec";
          ctx.fillRect(x, y, CELL, CELL);
        } else if (ch === "#") {
          ctx.fillStyle = "#8a5a3b";
          ctx.fillRect(x, y, CELL, CELL);
          if (r === 0 || rows[r - 1][c] !== "#") {
            ctx.fillStyle = "#4fae52";
            ctx.fillRect(x, y, CELL, 4);
            ctx.fillStyle = "#7ed37a";
            ctx.fillRect(x, y, CELL, 1);
          }
        } else if (ch === "=") {
          ctx.fillStyle = "#a55d3f";
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = "#7c3f2a";
          ctx.fillRect(x, y + CELL / 2 - 1, CELL, 2);
        } else if (ch === "o") {
          ctx.fillStyle = "#8fcdf0";
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = "#ffd23f";
          ctx.beginPath();
          ctx.arc(x + CELL / 2, y + CELL / 2, 3.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (ch === "F") {
          ctx.fillStyle = "#8fcdf0";
          ctx.fillRect(x, y, CELL, CELL);
          ctx.fillStyle = "#7a4a2b";
          ctx.fillRect(x + CELL / 2 - 1, y - 4, 2, CELL + 4);
          ctx.fillStyle = "#ff5470";
          ctx.fillRect(x + CELL / 2 + 1, y - 4, 6, 4);
        }
      }
    }
    // marcador de aparición del héroe
    ctx.fillStyle = "rgba(255,210,63,0.85)";
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText("INICIO", 4, 12 * CELL - 2);
    // rejilla fina
    ctx.strokeStyle = "rgba(11,14,26,0.10)";
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL + 0.5, 0); ctx.lineTo(c * CELL + 0.5, ROWS * CELL); ctx.stroke(); }
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL + 0.5); ctx.lineTo(COLS * CELL, r * CELL + 0.5); ctx.stroke(); }
  }, [rows]);

  const coins = rows.reduce((a, r) => a + (r.split("o").length - 1), 0);
  const hasFlag = rows.some((r) => r.includes("F"));
  const codeText = `const MI_NIVEL = [\n${rows.map((r) => `  "${r}",`).join("\n")}\n];`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* sin portapapeles */ }
  };

  /* exportar a JSON: el dialecto que hablan Tiled, Unity y medio mundo */
  const exportJson = () => {
    const data = {
      tileSize: 16,
      width: COLS,
      height: ROWS,
      leyenda: { "#": "suelo", "=": "ladrillo", "o": "moneda", "F": "meta", ".": "aire" },
      capas: [{ nombre: "mundo", tiles: rows }],
      generadoCon: "CronoLab · editor de niveles",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mi-nivel.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const play = () => setSession({ rows: rows.slice(), id: Date.now() });

  /* ---------------- MODO JUGAR ---------------- */
  if (session) {
    const makeSession: () => Mini = () => createPlatformer(session.rows);
    return (
      <div className="space-y-4">
        <MiniFrame
          key={session.id}
          make={makeSession}
          title="TU_NIVEL // MODO JUGAR"
          accent="#4ade80"
          hints={["← → / A D moverse", "ESPACIO saltar", "R reiniciar tu nivel"]}
          renderHud={(h) => (
            <>
              <Chip2 icon={Coins} label="monedas" value={String(h.monedas ?? "0/0")} />
              <Chip2 icon={Flag} label="meta" value={String(h.meta ?? "—")} color="#4ade80" />
            </>
          )}
        />
        <button
          onClick={() => setSession(null)}
          className="arcade-btn flex items-center gap-2 rounded-md border-2 border-viol bg-panel px-5 py-2.5 font-pixel text-[9px] text-snow"
        >
          <Pencil className="h-3.5 w-3.5 text-viol" />
          VOLVER AL EDITOR
        </button>
      </div>
    );
  }

  /* ---------------- MODO EDITAR ---------------- */
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_8px_#4ade80]" />
          <span className="font-pixel2 text-[11px] tracking-wider text-mist">EDITOR DE NIVELES // TILEMAP 56×17</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-mist">
          <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-gold" /> {coins}</span>
          <span className="flex items-center gap-1"><Flag className="h-3 w-3 text-rose" /> {hasFlag ? "sí" : "falta"}</span>
        </div>
      </div>

      {/* herramientas */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-void/40 px-4 py-2.5">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-pixel2 text-[10px] transition-all",
              tool === t.id ? "scale-105 border-gold bg-gold/15 text-gold" : "border-line bg-panel text-mist hover:text-snow",
            )}
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-sm font-mono text-[10px] font-bold"
              style={{ background: t.color, color: t.id === "." ? "#ffd23f" : "#131313" }}
            >
              {t.symbol}
            </span>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setRows(LEVEL.slice())}
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist transition-colors hover:border-cyanx hover:text-cyanx"
          >
            <RotateCcw className="h-3 w-3" /> nivel original
          </button>
          <button
            onClick={() => setRows(blankLevel())}
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist transition-colors hover:border-rose hover:text-rose"
          >
            <Trash2 className="h-3 w-3" /> vacío
          </button>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist transition-colors hover:border-gold hover:text-gold"
          >
            {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
            {copied ? "¡copiado!" : "copiar"}
          </button>
          <button
            onClick={exportJson}
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist transition-colors hover:border-mint hover:text-mint"
            title="Descarga tu nivel en formato JSON, listo para Tiled o Unity"
          >
            <FileJson className="h-3 w-3" /> exportar JSON
          </button>
        </div>
      </div>

      {/* lienzal del nivel */}
      <canvas
        ref={gridRef}
        className="pixelated block w-full cursor-crosshair"
        style={{ touchAction: "none" }}
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

      {/* acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-panel2 px-4 py-3">
        <p className="flex items-center gap-2 text-[11px] text-mist">
          <Database className="h-3.5 w-3.5 text-cyanx" />
          Se guarda solo en tu navegador. Borra bloques para hacer pozos; apila '#' para hacer torres.
          {!hasFlag && <span className="text-rose"> · ¡Pon una meta 'F' para poder ganar!</span>}
        </p>
        <button
          onClick={play}
          className="arcade-btn flex items-center gap-2 rounded-md bg-mint px-6 py-3 font-pixel text-[10px] text-black"
        >
          <Play className="h-3.5 w-3.5 fill-black" />
          JUGAR MI NIVEL
        </button>
      </div>
    </div>
  );
}
