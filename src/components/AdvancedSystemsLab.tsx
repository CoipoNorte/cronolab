import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Coins,
  Dices,
  Download,
  Gamepad2,
  Keyboard,
  PackageOpen,
  Play,
  Radio,
  RefreshCw,
  ShoppingCart,
  StopCircle,
  Video,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import CodeCard from "./CodeCard";
import { ADVANCED_LESSONS } from "../game/advancedSnippets";
import {
  DEFAULT_BINDINGS,
  DEFAULT_INVENTORY,
  ITEMS,
  RECIPES,
  actionsForCodes,
  addItem,
  bindingConflicts,
  buyItem,
  canCraft,
  craft,
  createReplayActor,
  decodeReplay,
  encodeReplay,
  equipItem,
  generateLevel,
  inventoryWeight,
  parseBindings,
  rebindAction,
  seededRandom,
  sellItem,
  serializeBindings,
  simulateReplayFrame,
  summarizeTelemetry,
  validateGeneratedLevel,
} from "../game/advancedSystems";
import type {
  BindingMap,
  InputAction,
  InventoryState,
  ProceduralLevel,
  ReplayData,
  ReplayInput,
  TelemetryEvent,
} from "../game/advancedSystems";
import { cn } from "../utils/cn";

type Tab = "procedural" | "input" | "inventory" | "replay";

const TABS: { id: Tab; label: string; icon: typeof Dices; color: string }[] = [
  { id: "procedural", label: "Procedural", icon: Dices, color: "#4ade80" },
  { id: "input", label: "Controles", icon: Gamepad2, color: "#5ce1e6" },
  { id: "inventory", label: "Crafting", icon: PackageOpen, color: "#ffd23f" },
  { id: "replay", label: "Replay", icon: Video, color: "#ff7ad9" },
];

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/* ---------------- Procedural ---------------- */

function LevelCanvas({ level }: { level: ProceduralLevel }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    canvas.width = 900; canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const tile = Math.min(canvas.width / level.width, canvas.height / level.height);
    const ox = (canvas.width - level.width * tile) / 2;
    const colors: Record<string, string> = { ".": "#5c8dcc", "#": "#7a4a2b", "=": "#b76b45", o: "#ffd23f", "^": "#ff5d73", E: "#58c94f", F: "#7c6bff", S: "#5ce1e6" };
    ctx.fillStyle = "#0d1126"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    level.tiles.forEach((row, y) => [...row].forEach((char, x) => {
      ctx.fillStyle = colors[char] ?? "#ff00ff";
      if (char === ".") ctx.fillRect(ox + x * tile, y * tile, tile + 0.5, tile + 0.5);
      else if (char === "#") {
        ctx.fillRect(ox + x * tile, y * tile, tile + 0.5, tile + 0.5);
        if (y === 0 || level.tiles[y - 1]?.[x] !== "#") { ctx.fillStyle = "#4fae52"; ctx.fillRect(ox + x * tile, y * tile, tile + 0.5, Math.max(1, tile * 0.2)); }
      } else if (char === "=") ctx.fillRect(ox + x * tile, y * tile + tile * 0.3, tile, tile * 0.4);
      else if (char === "o") { ctx.beginPath(); ctx.arc(ox + (x + .5) * tile, (y + .5) * tile, tile * .28, 0, Math.PI * 2); ctx.fill(); }
      else if (char === "^") { ctx.beginPath(); ctx.moveTo(ox + x * tile, (y + 1) * tile); ctx.lineTo(ox + (x + .5) * tile, y * tile); ctx.lineTo(ox + (x + 1) * tile, (y + 1) * tile); ctx.fill(); }
      else { ctx.fillRect(ox + x * tile + tile * .2, y * tile + tile * .15, tile * .6, tile * .7); }
    }));
  }, [level]);
  return <canvas ref={ref} className="pixelated block aspect-[3/1] w-full" />;
}

function ProceduralLab() {
  const [seed, setSeed] = useState("CRONO-42");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
  const [width, setWidth] = useState(64);
  const [nonce, setNonce] = useState(0);
  const level = useMemo(() => generateLevel({ seed: seed || "vacío", difficulty, width, height: 18 }), [seed, difficulty, width, nonce]);
  const issues = validateGeneratedLevel(level);
  const randomize = () => { const rng = seededRandom(Date.now()); setSeed(`MUNDO-${rng.int(1000, 9999)}`); setNonce((n) => n + 1); };
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-4">
        <h3 className="font-pixel text-[9px] text-mint">GENERADOR POR SEMILLA</h3>
        <label className="mt-4 block font-pixel2 text-[11px] text-mist">Semilla
          <div className="mt-2 flex gap-2"><input value={seed} onChange={(e) => setSeed(e.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-md border border-line bg-void px-3 py-2 font-mono text-sm text-snow" /><button onClick={randomize} className="rounded-md border border-line p-2 text-mint"><Dices className="h-4 w-4" /></button></div>
        </label>
        <label className="mt-4 block font-pixel2 text-[11px] text-mist">Ancho: {width} tiles
          <input className="lab-range mt-1" type="range" min="32" max="100" step="4" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </label>
        <div className="mt-4">
          <span className="font-pixel2 text-[11px] text-mist">Dificultad</span>
          <div className="mt-2 grid grid-cols-3 gap-2">{([1, 2, 3] as const).map((d) => <button key={d} onClick={() => setDifficulty(d)} className={cn("rounded-md border py-2 font-pixel text-[9px]", difficulty === d ? "border-mint bg-mint/10 text-mint" : "border-line text-mist")}>{["SUAVE", "MEDIA", "DURA"][d - 1]}</button>)}</div>
        </div>
        <button onClick={() => downloadText(`nivel-${seed}.json`, JSON.stringify(level, null, 2))} className="arcade-btn mt-5 flex items-center gap-2 rounded-md bg-mint px-5 py-3 font-pixel text-[8px] text-black"><Download className="h-4 w-4" /> EXPORTAR NIVEL</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-panel lg:col-span-8">
        <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5"><span className="font-pixel text-[8px] text-snow">NIVEL GENERADO · {seed}</span><span className={cn("font-mono text-[10px]", issues.length ? "text-rose" : "text-mint")}>{issues.length ? `${issues.length} problemas` : "ruta garantizada ✓"}</span></div>
        <LevelCanvas level={level} />
        <div className="grid grid-cols-3 gap-px border-t border-line bg-line sm:grid-cols-6">
          {Object.entries(level.metrics).map(([key, value]) => <div key={key} className="bg-panel p-3 text-center"><p className="font-mono text-[9px] text-mist">{key}</p><p className="mt-1 font-pixel2 text-[13px] text-gold">{String(value)}</p></div>)}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Input remapping ---------------- */

const ACTION_NAMES: Record<InputAction, string> = { left: "Izquierda", right: "Derecha", jump: "Saltar", interact: "Interactuar", dash: "Dash", pause: "Pausa" };

function InputLab() {
  const [bindings, setBindings] = useState<BindingMap>(() => { try { return parseBindings(localStorage.getItem("cronolab-bindings") ?? serializeBindings(DEFAULT_BINDINGS)); } catch { return parseBindings(serializeBindings(DEFAULT_BINDINGS)); } });
  const [capture, setCapture] = useState<InputAction | null>(null);
  const [pressed, setPressed] = useState<string[]>([]);
  const [gamepad, setGamepad] = useState("no detectado");
  const conflicts = bindingConflicts(bindings);
  const active = actionsForCodes(bindings, pressed);

  useEffect(() => { try { localStorage.setItem("cronolab-bindings", serializeBindings(bindings)); } catch { /* no-op */ } }, [bindings]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (capture) { e.preventDefault(); setBindings((b) => rebindAction(b, capture, e.code)); setCapture(null); return; }
      setPressed((p) => p.includes(e.code) ? p : [...p, e.code]);
    };
    const up = (e: KeyboardEvent) => setPressed((p) => p.filter((x) => x !== e.code));
    const clear = () => setPressed([]);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); };
  }, [capture]);
  useEffect(() => {
    let raf = 0;
    const poll = () => { const pad = navigator.getGamepads?.()[0]; setGamepad(pad ? `${pad.id.slice(0, 30)} · ${pad.buttons.filter((b) => b.pressed).length} botones pulsados` : "no detectado"); raf = requestAnimationFrame(poll); };
    raf = requestAnimationFrame(poll); return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-7">
        <div className="flex items-center justify-between"><h3 className="font-pixel text-[9px] text-cyanx">MAPA DE ACCIONES</h3><button onClick={() => setBindings(parseBindings(serializeBindings(DEFAULT_BINDINGS)))} className="flex items-center gap-1 font-mono text-[10px] text-mist hover:text-gold"><RefreshCw className="h-3 w-3" /> restaurar</button></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(Object.keys(bindings) as InputAction[]).map((action) => {
            const code = bindings[action][0]; const bad = Boolean(conflicts[code]);
            return <button key={action} onClick={() => setCapture(action)} className={cn("flex items-center justify-between rounded-xl border p-3 text-left", capture === action ? "border-gold bg-gold/10" : bad ? "border-rose/50 bg-rose/5" : "border-line bg-void/40")}><span><span className="block font-pixel2 text-[13px] text-snow">{ACTION_NAMES[action]}</span><span className="mt-1 block font-mono text-[10px] text-mist">acción: {action}</span></span><span className={cn("kbd min-w-20", active.has(action) && "!border-mint !bg-mint/15 !text-mint")}>{capture === action ? "pulsa…" : code}</span></button>;
          })}
        </div>
        {Object.keys(conflicts).length > 0 && <p className="mt-3 flex gap-2 rounded-lg border border-rose/40 bg-rose/10 p-3 font-mono text-[10px] text-rose"><AlertTriangle className="h-4 w-4 shrink-0" /> {Object.entries(conflicts).map(([key, acts]) => `${key}: ${acts.join(" + ")}`).join(" · ")}</p>}
      </div>
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="flex items-center gap-2 font-pixel text-[9px] text-snow"><Keyboard className="h-4 w-4 text-cyanx" /> PROBADOR EN VIVO</h3>
          <div className="mt-4 grid grid-cols-3 gap-2">{(Object.keys(ACTION_NAMES) as InputAction[]).map((a) => <div key={a} className={cn("rounded-lg border px-2 py-3 text-center transition-colors", active.has(a) ? "border-mint bg-mint/15" : "border-line bg-void/40")}><p className={cn("font-pixel text-[8px]", active.has(a) ? "text-mint" : "text-mist")}>{a}</p></div>)}</div>
          <p className="mt-3 text-[11px] leading-relaxed text-mist">Pulsa las teclas asignadas. El código de movimiento solo recibe acciones, nunca conoce Space o ArrowLeft.</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4"><p className="flex items-center gap-2 font-pixel2 text-[12px] text-snow"><Gamepad2 className="h-4 w-4 text-viol" /> Mando</p><p className="mt-2 font-mono text-[10px] text-mist">{gamepad}</p><p className="mt-2 text-[10px] text-mist/60">Conecta un mando y pulsa un botón para que el navegador lo detecte.</p></div>
      </div>
    </div>
  );
}

/* ---------------- Inventory ---------------- */

function InventoryLab() {
  const [state, setState] = useState<InventoryState>({ ...DEFAULT_INVENTORY, items: { ...DEFAULT_INVENTORY.items } });
  const weight = inventoryWeight(state);
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-5">
        <div className="flex items-center justify-between"><h3 className="font-pixel text-[9px] text-gold">MOCHILA</h3><span className="font-pixel2 text-sm text-gold"><Coins className="mr-1 inline h-4 w-4" />{state.coins}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-void"><div className={cn("h-full", weight > state.maxWeight * .85 ? "bg-rose" : "bg-mint")} style={{ width: `${Math.min(100, weight / state.maxWeight * 100)}%` }} /></div><p className="mt-1 text-right font-mono text-[9px] text-mist">{weight.toFixed(1)} / {state.maxWeight} kg</p>
        <div className="mt-4 space-y-2">{Object.entries(state.items).map(([id, amount]) => { const item = ITEMS[id]; return <div key={id} className={cn("flex items-center justify-between rounded-lg border p-3", state.equipped === id ? "border-gold bg-gold/10" : "border-line bg-void/40")}><span><span className="font-pixel2 text-[13px] text-snow">{item?.name ?? id}</span><span className="ml-2 font-mono text-[10px] text-mist">×{amount} · {((item?.weight ?? 0) * amount).toFixed(1)} kg</span></span>{item?.category === "equipment" && <button onClick={() => setState((s) => equipItem(s, id))} className="rounded bg-gold px-2 py-1 font-pixel text-[7px] text-black">{state.equipped === id ? "QUITAR" : "EQUIPAR"}</button>}</div>; })}</div>
        <div className="mt-4 flex flex-wrap gap-2">{["herb", "crystal", "cloth"].map((id) => <button key={id} onClick={() => setState((s) => addItem(s, id))} className="rounded-md border border-line bg-panel2 px-3 py-2 font-pixel2 text-[10px] text-mist hover:text-mint">+ {ITEMS[id].name}</button>)}</div>
      </div>
      <div className="space-y-5 lg:col-span-7">
        <div className="rounded-2xl border border-line bg-panel p-5"><h3 className="font-pixel text-[9px] text-mint">RECETAS</h3><div className="mt-4 grid gap-3 sm:grid-cols-3">{RECIPES.map((r) => { const possible = canCraft(state, r); return <button key={r.id} onClick={() => setState((s) => craft(s, r))} disabled={!possible} className={cn("rounded-xl border p-4 text-left", possible ? "border-mint/40 bg-mint/5" : "border-line bg-void/40 opacity-50")}><p className="font-pixel2 text-[13px] text-snow">{r.name}</p><p className="mt-2 font-mono text-[9px] text-mist">{Object.entries(r.inputs).map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(" + ")}</p><p className={cn("mt-3 font-pixel text-[7px]", possible ? "text-mint" : "text-rose")}>{possible ? "FABRICAR" : "FALTAN MATERIALES"}</p></button>; })}</div></div>
        <div className="rounded-2xl border border-line bg-panel p-5"><h3 className="flex items-center gap-2 font-pixel text-[9px] text-viol"><ShoppingCart className="h-4 w-4" /> TIENDA</h3><div className="mt-4 grid gap-2 sm:grid-cols-3">{["herb", "crystal", "cloth", "potion", "boots"].map((id) => <div key={id} className="rounded-lg border border-line bg-void/40 p-3"><p className="font-pixel2 text-[12px] text-snow">{ITEMS[id].name}</p><p className="mt-1 font-mono text-[9px] text-mist">compra {ITEMS[id].buy} · venta {ITEMS[id].sell}</p><div className="mt-3 flex gap-1"><button onClick={() => setState((s) => buyItem(s, id))} className="flex-1 rounded bg-viol px-2 py-1.5 font-pixel text-[7px] text-white">COMPRAR</button><button onClick={() => setState((s) => sellItem(s, id))} className="flex-1 rounded border border-line px-2 py-1.5 font-pixel text-[7px] text-mist">VENDER</button></div></div>)}</div></div>
      </div>
    </div>
  );
}

/* ---------------- Replay ---------------- */

function ReplayLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusedRef = useRef(false);
  const keysRef = useRef(new Set<string>());
  const actorRef = useRef(createReplayActor());
  const ghostRef = useRef(createReplayActor());
  const frameRef = useRef(0);
  const replayIndexRef = useRef(0);
  const framesRef = useRef<ReplayData["frames"]>([]);
  const eventsRef = useRef<TelemetryEvent[]>([]);
  const [recording, setRecording] = useState(false);
  const recordingRef = useRef(false);
  const [replaying, setReplaying] = useState(false);
  const replayingRef = useRef(false);
  const [frameCount, setFrameCount] = useState(0);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [focused, setFocused] = useState(false);
  const summary = useMemo(() => summarizeTelemetry(events), [events]);

  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { replayingRef.current = replaying; }, [replaying]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (!focusedRef.current) return; if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault(); keysRef.current.add(e.code); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current!; canvas.width = 480; canvas.height = 150; const ctx = canvas.getContext("2d")!;
    let raf = 0, last = performance.now(), ui = 0;
    const loop = (now: number) => {
      const elapsed = now - last; last = now;
      const steps = Math.min(3, Math.max(1, Math.round(elapsed / (1000 / 60))));
      for (let s = 0; s < steps; s++) {
        const keys = keysRef.current;
        const input: ReplayInput = { left: keys.has("ArrowLeft") || keys.has("KeyA"), right: keys.has("ArrowRight") || keys.has("KeyD"), jump: keys.has("Space") };
        const beforeGround = actorRef.current.grounded;
        actorRef.current = simulateReplayFrame(actorRef.current, input, 1 / 60);
        if (recordingRef.current) framesRef.current.push({ frame: frameRef.current, input: { ...input } });
        if (input.jump && beforeGround) eventsRef.current.push({ frame: frameRef.current, type: "jump", x: actorRef.current.x });
        // zonas de daño artificiales para la telemetría
        if ((Math.abs(actorRef.current.x - 190) < 3 || Math.abs(actorRef.current.x - 350) < 3) && actorRef.current.y > 92) eventsRef.current.push({ frame: frameRef.current, type: "damage", x: actorRef.current.x });
        if (replayingRef.current && replayIndexRef.current < framesRef.current.length) {
          ghostRef.current = simulateReplayFrame(ghostRef.current, framesRef.current[replayIndexRef.current].input, 1 / 60);
          replayIndexRef.current++;
        } else if (replayingRef.current) { replayingRef.current = false; setReplaying(false); }
        frameRef.current++;
      }
      ctx.fillStyle = "#1b2744"; ctx.fillRect(0, 0, 480, 150); ctx.fillStyle = "#4c9455"; ctx.fillRect(0, 100, 480, 50);
      for (let x = 0; x < 480; x += 40) { ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(x, 0, 1, 150); }
      [190, 350].forEach((x) => { ctx.fillStyle = "#ff5d73"; ctx.beginPath(); ctx.moveTo(x - 8, 100); ctx.lineTo(x, 84); ctx.lineTo(x + 8, 100); ctx.fill(); });
      if (replayingRef.current) { ctx.globalAlpha = .45; ctx.fillStyle = "#ff7ad9"; ctx.fillRect(ghostRef.current.x - 7, ghostRef.current.y - 18, 14, 18); ctx.globalAlpha = 1; }
      ctx.fillStyle = "#ffd23f"; ctx.fillRect(actorRef.current.x - 7, actorRef.current.y - 18, 14, 18);
      if (recordingRef.current) { ctx.fillStyle = "#ff5d73"; ctx.beginPath(); ctx.arc(15, 15, 5, 0, Math.PI * 2); ctx.fill(); }
      ui += elapsed;
      if (ui > 250) { ui = 0; setFrameCount(framesRef.current.length); setEvents([...eventsRef.current]); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);

  const reset = () => { actorRef.current = createReplayActor(); ghostRef.current = createReplayActor(); frameRef.current = 0; replayIndexRef.current = 0; framesRef.current = []; eventsRef.current = []; setEvents([]); setFrameCount(0); setRecording(false); setReplaying(false); };
  const play = () => { ghostRef.current = createReplayActor(); replayIndexRef.current = 0; setReplaying(true); };
  const exportReplay = () => downloadText("cronolab-replay.txt", encodeReplay({ version: 1, seed: "LAB", fixedDelta: 1 / 60, frames: framesRef.current }));
  const verifyRoundTrip = () => { const data: ReplayData = { version: 1, seed: "LAB", fixedDelta: 1 / 60, frames: framesRef.current }; decodeReplay(encodeReplay(data)); };

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="overflow-hidden rounded-2xl border border-line bg-panel lg:col-span-8">
        <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5"><span className="font-pixel text-[8px] text-snow">GRABADOR DETERMINISTA · 60 FPS</span><span className="font-mono text-[10px] text-mist">{frameCount} frames · {(frameCount / 60).toFixed(1)}s</span></div>
        <div tabIndex={0} onFocus={() => { focusedRef.current = true; setFocused(true); }} onBlur={() => { focusedRef.current = false; setFocused(false); keysRef.current.clear(); }} className="relative outline-none focus-visible:ring-2 focus-visible:ring-gold"><canvas ref={canvasRef} className="pixelated block aspect-[16/5] w-full" />{!focused && <div className="absolute inset-0 flex items-center justify-center bg-void/65 font-pixel text-[8px] text-snow">CLIC · A/D MOVER · ESPACIO SALTAR</div>}</div>
        <div className="flex flex-wrap gap-2 border-t border-line bg-panel2 p-3">
          <button onClick={() => setRecording((v) => !v)} className={cn("arcade-btn flex items-center gap-2 rounded-md px-4 py-2 font-pixel text-[8px]", recording ? "bg-rose text-white" : "bg-gold text-black")}>{recording ? <StopCircle className="h-4 w-4" /> : <Radio className="h-4 w-4" />}{recording ? "DETENER" : "GRABAR"}</button>
          <button disabled={!frameCount} onClick={play} className="arcade-btn flex items-center gap-2 rounded-md bg-viol px-4 py-2 font-pixel text-[8px] text-white disabled:opacity-30"><Play className="h-4 w-4" /> FANTASMA</button>
          <button disabled={!frameCount} onClick={() => { verifyRoundTrip(); exportReplay(); }} className="rounded-md border border-line px-3 py-2 text-mist hover:text-mint disabled:opacity-30"><Download className="h-4 w-4" /></button>
          <button onClick={reset} className="rounded-md border border-line px-3 py-2 text-mist hover:text-rose"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-4">
        <h3 className="font-pixel text-[9px] text-rose">TELEMETRÍA LOCAL</h3>
        <div className="mt-4 grid grid-cols-2 gap-2">{[["saltos", summary.jumps], ["daño", summary.damage], ["muertes", summary.deaths], ["eventos", events.length]].map(([k, v]) => <div key={k} className="rounded-lg border border-line bg-void/40 p-3"><p className="font-mono text-[9px] text-mist">{k}</p><p className="mt-1 font-pixel2 text-lg text-gold">{v}</p></div>)}</div>
        <p className="mt-4 font-pixel2 text-[11px] text-mist">MAPA DE PELIGRO</p>
        <div className="mt-2 grid grid-cols-12 gap-1">{Array.from({ length: 12 }, (_, i) => <div key={i} className={cn("h-10 rounded-sm", summary.dangerZone === i ? "bg-rose" : "bg-line")} title={`zona ${i}`} />)}</div>
        <p className="mt-3 text-[11px] leading-relaxed text-mist">Solo registra acciones de diseño dentro de esta demo. No envía datos ni identifica al jugador.</p>
      </div>
    </div>
  );
}

export default function AdvancedSystemsLab() {
  const [tab, setTab] = useState<Tab>("procedural");
  const active = TABS.find((item) => item.id === tab)!;
  return (
    <section id="avanzado" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-35" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading index="09" eyebrow="ARQUITECTURA PARA JUEGOS QUE CRECEN" title="SISTEMAS" accent="AVANZADOS" blurb="Cuando el contenido se multiplica necesitas reproducibilidad, controles configurables, economías consistentes y herramientas para observar cómo juega la gente. Cuatro laboratorios convierten esas necesidades en datos comprobables." icon={Dices} />
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn("flex min-w-max items-center gap-2 rounded-xl border px-4 py-3", tab === item.id ? "border-gold bg-panel2" : "border-line bg-panel text-mist")}><item.icon className="h-4 w-4" style={{ color: item.color }} /><span className="font-pixel2 text-[13px]">{item.label}</span></button>)}</div>
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {tab === "procedural" && <ProceduralLab />}{tab === "input" && <InputLab />}{tab === "inventory" && <InventoryLab />}{tab === "replay" && <ReplayLab />}
        </motion.div>
        <div className="mt-6"><CodeCard lesson={ADVANCED_LESSONS[TABS.findIndex((item) => item.id === tab)]} accent={active.color} /></div>
      </div>
    </section>
  );
}