import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Braces,
  Check,
  CheckCircle2,
  CirclePlus,
  Copy,
  Download,
  FileUp,
  Flag,
  GitBranch,
  LockKeyhole,
  MessageSquareText,
  Play,
  RefreshCw,
  Trash2,
  Variable,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import {
  DEFAULT_DIALOGUE,
  applyEffect,
  choose,
  cloneProject,
  conditionPasses,
  createRuntime,
  describeCondition,
  getNode,
  newNodeId,
  parseProject,
  projectToJson,
  setRuntimeVariable,
  validateProject,
} from "../game/narrative";
import type {
  Choice,
  CompareOp,
  DialogueNode,
  DialogueProject,
  EffectOp,
  Runtime,
  Value,
} from "../game/narrative";
import { drawPixels, ELDER_MAP, ELDER_PALETTE, heroSprite, HERO_PALETTE } from "../game/sprites";
import { cn } from "../utils/cn";
import CodeCard from "./CodeCard";
import { NARRATIVE_LESSONS } from "../game/systemsSnippets";

const SAVE_KEY = "cronolab-narrative-project";

function saveFile(name: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function loadProject(): DialogueProject {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? parseProject(raw) : cloneProject(DEFAULT_DIALOGUE);
  } catch {
    return cloneProject(DEFAULT_DIALOGUE);
  }
}

function valueFromInput(raw: string, sample: Value): Value {
  if (typeof sample === "number") return Number(raw) || 0;
  if (typeof sample === "boolean") return raw === "true";
  return raw;
}

/** Mini escena: demuestra que el texto vive separado del render. */
function DialogueScene({ speaking }: { speaking: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    canvas.width = 480;
    canvas.height = 170;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    const loop = (now: number) => {
      const t = now / 1000;
      const g = ctx.createLinearGradient(0, 0, 0, 170);
      g.addColorStop(0, "#3c4c86");
      g.addColorStop(1, "#b18b87");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 480, 170);
      ctx.fillStyle = "#405d46";
      for (let i = 0; i < 9; i++) {
        const x = i * 70 - 20;
        ctx.beginPath();
        ctx.arc(x, 150, 45 + (i % 3) * 8, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = "#6b4226";
      ctx.fillRect(0, 137, 480, 33);
      ctx.fillStyle = "#4fae52";
      ctx.fillRect(0, 134, 480, 5);
      const elderY = 136 + Math.sin(t * 2.4) * 1;
      drawPixels(ctx, ELDER_MAP, 174, elderY - 18, ELDER_PALETTE, false);
      const heroState = Math.floor(t * 3) % 2 === 0 ? "idle" : "runA";
      drawPixels(ctx, heroSprite(heroState), 288, 136 - 18, HERO_PALETTE, true);
      ctx.fillStyle = "rgba(0,0,0,.24)";
      ctx.fillRect(171, 138, 22, 3);
      ctx.fillRect(285, 138, 22, 3);
      if (speaking) {
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(178, 94 + Math.sin(t * 5) * 2, 13, 12);
        ctx.fillStyle = "#131313";
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText("…", 184.5, 103 + Math.sin(t * 5) * 2);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speaking]);
  return <canvas ref={ref} className="pixelated block aspect-[48/17] w-full" />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block font-pixel2 text-[10px] text-mist">{children}</span>;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("w-full rounded-md border border-line bg-void px-2.5 py-2 font-mono text-[11px] text-snow outline-none focus:border-viol", props.className)} />;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-md border border-line bg-void px-2.5 py-2 font-mono text-[11px] text-snow outline-none focus:border-viol", props.className)} />;
}

export default function NarrativeStudio() {
  const [project, setProject] = useState<DialogueProject>(() => loadProject());
  const [selectedId, setSelectedId] = useState(project.start);
  const [runtime, setRuntime] = useState<Runtime>(() => createRuntime(project));
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = project.nodes.find((node) => node.id === selectedId) ?? project.nodes[0];
  const current = getNode(project, runtime.nodeId);
  const issues = useMemo(() => validateProject(project), [project]);
  const variableKeys = Object.keys(project.variables);

  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, projectToJson(project)); } catch { /* sin almacenamiento */ }
  }, [project]);

  const updateNode = (id: string, fn: (node: DialogueNode) => DialogueNode) => {
    setProject((p) => ({ ...p, nodes: p.nodes.map((node) => (node.id === id ? fn(node) : node)) }));
  };

  const updateChoice = (choiceId: string, fn: (item: Choice) => Choice) => {
    if (!selected) return;
    updateNode(selected.id, (node) => ({
      ...node,
      choices: node.choices.map((item) => (item.id === choiceId ? fn(item) : item)),
    }));
  };

  const addNode = () => {
    const id = newNodeId(project);
    const node: DialogueNode = {
      id,
      speaker: "NPC",
      text: "Escribe aquí la nueva línea del diálogo.",
      choices: [{ id: "continuar", label: "Continuar.", target: null, effects: [] }],
    };
    setProject((p) => ({ ...p, nodes: [...p.nodes, node] }));
    setSelectedId(id);
  };

  const removeNode = () => {
    if (!selected || project.nodes.length <= 1 || selected.id === project.start) return;
    setProject((p) => ({
      ...p,
      nodes: p.nodes
        .filter((node) => node.id !== selected.id)
        .map((node) => ({
          ...node,
          choices: node.choices.map((item) => (item.target === selected.id ? { ...item, target: null } : item)),
        })),
    }));
    setSelectedId(project.start);
  };

  const addChoice = () => {
    if (!selected) return;
    const id = `opcion_${selected.choices.length + 1}`;
    updateNode(selected.id, (node) => ({
      ...node,
      choices: [...node.choices, { id, label: "Nueva respuesta", target: null, effects: [] }],
    }));
  };

  const restart = () => setRuntime(createRuntime(project));

  const pick = (choiceId: string) => setRuntime((r) => choose(project, r, choiceId));

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = parseProject(await file.text());
      setProject(next);
      setSelectedId(next.start);
      setRuntime(createRuntime(next));
      setImportError("");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "No se pudo importar el archivo");
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(projectToJson(project));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* sin portapapeles */ }
  };

  return (
    <section id="narrativa" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="06"
          eyebrow="DATOS QUE CUENTAN HISTORIAS"
          title="TALLER DE DIÁLOGOS"
          accent="RAMIFICADOS"
          blurb="Un diálogo de RPG no es una cadena de ifs escondida en el NPC: es un grafo de nodos, elecciones, condiciones y efectos. Edita la conversación, prueba variables en vivo, descubre rutas bloqueadas y exporta el resultado como JSON para reutilizarlo en cualquier motor."
          icon={GitBranch}
        />

        {/* barra de proyecto */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <MessageSquareText className="h-4 w-4 shrink-0 text-viol" />
            <input
              value={project.title}
              onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
              className="min-w-0 bg-transparent font-pixel2 text-base text-snow outline-none"
              aria-label="Título del proyecto narrativo"
            />
            <span className="hidden font-mono text-[10px] text-mist sm:inline">
              {project.nodes.length} nodos · {issues.filter((item) => item.level === "error").length} errores
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyJson} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist hover:border-gold hover:text-gold">
              {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
              {copied ? "copiado" : "copiar JSON"}
            </button>
            <button onClick={() => saveFile("dialogo-cronolab.json", projectToJson(project))} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist hover:border-mint hover:text-mint">
              <Download className="h-3 w-3" /> exportar
            </button>
            <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist hover:border-cyanx hover:text-cyanx">
              <FileUp className="h-3 w-3" /> importar
            </button>
            <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void importFile(e.target.files?.[0])} />
            <button
              onClick={() => {
                const next = cloneProject(DEFAULT_DIALOGUE);
                setProject(next); setSelectedId(next.start); setRuntime(createRuntime(next)); setImportError("");
              }}
              className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] text-mist hover:border-rose hover:text-rose"
            >
              <RefreshCw className="h-3 w-3" /> restaurar
            </button>
          </div>
        </div>
        {importError && <p className="mb-4 rounded-lg border border-rose/40 bg-rose/10 p-3 text-sm text-rose">{importError}</p>}

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_minmax(340px,.9fr)]">
          {/* -------- grafo / lista de nodos -------- */}
          <aside className="overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line bg-panel2 px-3 py-2.5">
              <span className="font-pixel text-[8px] text-snow">NODOS</span>
              <button onClick={addNode} className="rounded-md border border-line p-1.5 text-mint hover:border-mint" title="Añadir nodo">
                <CirclePlus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-[690px] space-y-1 overflow-auto p-2">
              {project.nodes.map((node, i) => {
                const nodeIssues = issues.filter((item) => item.nodeId === node.id);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                    className={cn(
                      "w-full rounded-lg border p-2.5 text-left transition-colors",
                      selectedId === node.id ? "border-gold/50 bg-gold/10" : "border-transparent hover:border-line hover:bg-panel2",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-snow">{node.id}</span>
                      <span className="flex items-center gap-1">
                        {project.start === node.id && <Flag className="h-3 w-3 fill-mint text-mint" />}
                        {nodeIssues.length > 0 && <AlertTriangle className="h-3 w-3 text-gold" />}
                      </span>
                    </span>
                    <span className="mt-1 block truncate font-pixel2 text-[10px] text-mist">{i + 1}. {node.speaker}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {node.choices.slice(0, 3).map((item) => (
                        <span key={item.id} className="rounded bg-void px-1 py-0.5 font-mono text-[8px] text-mist/70">
                          → {item.target ?? "FIN"}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* -------- inspector del nodo -------- */}
          <div className="overflow-hidden rounded-2xl border border-line bg-panel">
            {selected && (
              <>
                <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
                  <span className="font-pixel text-[8px] text-snow">INSPECTOR · {selected.id}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setProject((p) => ({ ...p, start: selected.id }))}
                      className={cn("rounded-md border px-2 py-1 font-pixel2 text-[9px]", project.start === selected.id ? "border-mint bg-mint/10 text-mint" : "border-line text-mist hover:text-mint")}
                    >
                      {project.start === selected.id ? "INICIO" : "HACER INICIO"}
                    </button>
                    <button
                      onClick={removeNode}
                      disabled={project.start === selected.id || project.nodes.length <= 1}
                      className="rounded-md border border-line p-1.5 text-mist hover:border-rose hover:text-rose disabled:opacity-30"
                      title="Eliminar nodo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[690px] space-y-5 overflow-auto p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label><FieldLabel>ID estable</FieldLabel><Input value={selected.id} disabled /></label>
                    <label>
                      <FieldLabel>Quién habla</FieldLabel>
                      <Input value={selected.speaker} onChange={(e) => updateNode(selected.id, (n) => ({ ...n, speaker: e.target.value }))} />
                    </label>
                  </div>
                  <label>
                    <FieldLabel>Texto del nodo</FieldLabel>
                    <textarea
                      value={selected.text}
                      onChange={(e) => updateNode(selected.id, (n) => ({ ...n, text: e.target.value }))}
                      className="min-h-24 w-full resize-y rounded-md border border-line bg-void px-3 py-2.5 text-sm leading-relaxed text-snow outline-none focus:border-viol"
                    />
                  </label>
                  <label>
                    <FieldLabel>Evento emitido al visitar (opcional)</FieldLabel>
                    <Input value={selected.event ?? ""} placeholder="ej: mision_aceptada" onChange={(e) => updateNode(selected.id, (n) => ({ ...n, event: e.target.value || undefined }))} />
                  </label>

                  <div className="border-t border-line pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-pixel text-[8px] text-gold">ELECCIONES ({selected.choices.length})</h4>
                      <button onClick={addChoice} className="flex items-center gap-1 font-pixel2 text-[10px] text-mint hover:underline">
                        <CirclePlus className="h-3 w-3" /> añadir
                      </button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {selected.choices.map((item, choiceIndex) => (
                        <div key={item.id} className="rounded-xl border border-line bg-void/40 p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-pixel text-[8px] text-gold">{choiceIndex + 1}</span>
                            <Input value={item.label} onChange={(e) => updateChoice(item.id, (c) => ({ ...c, label: e.target.value }))} />
                            <button
                              onClick={() => updateNode(selected.id, (node) => ({ ...node, choices: node.choices.filter((c) => c.id !== item.id) }))}
                              className="shrink-0 rounded-md border border-line p-2 text-mist hover:border-rose hover:text-rose"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <label>
                              <FieldLabel>Destino</FieldLabel>
                              <Select value={item.target ?? "__END__"} onChange={(e) => updateChoice(item.id, (c) => ({ ...c, target: e.target.value === "__END__" ? null : e.target.value }))}>
                                <option value="__END__">FIN DEL DIÁLOGO</option>
                                {project.nodes.map((node) => <option key={node.id} value={node.id}>{node.id}</option>)}
                              </Select>
                            </label>
                            <div>
                              <FieldLabel>Condición</FieldLabel>
                              <button
                                onClick={() => updateChoice(item.id, (c) => ({
                                  ...c,
                                  condition: c.condition ? undefined : { key: variableKeys[0] ?? "confianza", op: ">=" as CompareOp, value: 1 },
                                }))}
                                className={cn("flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-2 font-pixel2 text-[10px]", item.condition ? "border-viol bg-viol/10 text-viol" : "border-line text-mist")}
                              >
                                <LockKeyhole className="h-3 w-3" /> {item.condition ? "condicional" : "siempre visible"}
                              </button>
                            </div>
                          </div>
                          {item.condition && (
                            <div className="mt-2 grid grid-cols-[1fr_70px_1fr] gap-2">
                              <Select value={item.condition.key} onChange={(e) => updateChoice(item.id, (c) => ({ ...c, condition: c.condition ? { ...c.condition, key: e.target.value } : undefined }))}>
                                {variableKeys.map((key) => <option key={key}>{key}</option>)}
                              </Select>
                              <Select value={item.condition.op} onChange={(e) => updateChoice(item.id, (c) => ({ ...c, condition: c.condition ? { ...c.condition, op: e.target.value as CompareOp } : undefined }))}>
                                {[">=", "<=", ">", "<", "==", "!="].map((op) => <option key={op}>{op}</option>)}
                              </Select>
                              <Input
                                value={String(item.condition.value)}
                                onChange={(e) => updateChoice(item.id, (c) => ({ ...c, condition: c.condition ? { ...c.condition, value: valueFromInput(e.target.value, project.variables[c.condition.key] ?? "") } : undefined }))}
                              />
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
                            <span className="font-pixel2 text-[9px] text-mist">EFECTOS ({item.effects.length})</span>
                            <button
                              onClick={() => updateChoice(item.id, (c) => ({ ...c, effects: [...c.effects, { key: variableKeys[0] ?? "confianza", op: "set", value: 1 }] }))}
                              className="font-pixel2 text-[9px] text-cyanx hover:underline"
                            >
                              + efecto
                            </button>
                          </div>
                          {item.effects.map((effect, effectIndex) => (
                            <div key={`${item.id}-${effectIndex}`} className="mt-2 grid grid-cols-[1fr_74px_1fr_auto] gap-2">
                              <Select value={effect.key} onChange={(e) => updateChoice(item.id, (c) => ({ ...c, effects: c.effects.map((x, i) => i === effectIndex ? { ...x, key: e.target.value } : x) }))}>
                                {variableKeys.map((key) => <option key={key}>{key}</option>)}
                              </Select>
                              <Select value={effect.op} onChange={(e) => updateChoice(item.id, (c) => ({ ...c, effects: c.effects.map((x, i) => i === effectIndex ? { ...x, op: e.target.value as EffectOp } : x) }))}>
                                <option value="set">set</option><option value="add">add</option><option value="toggle">toggle</option>
                              </Select>
                              <Input value={String(effect.value)} onChange={(e) => updateChoice(item.id, (c) => ({ ...c, effects: c.effects.map((x, i) => i === effectIndex ? { ...x, value: valueFromInput(e.target.value, project.variables[x.key] ?? "") } : x) }))} />
                              <button onClick={() => updateChoice(item.id, (c) => ({ ...c, effects: c.effects.filter((_, i) => i !== effectIndex) }))} className="rounded-md border border-line p-2 text-mist hover:text-rose">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* -------- juego / preview -------- */}
          <div className="overflow-hidden rounded-2xl border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
              <span className="font-pixel text-[8px] text-snow">PROBAR EL DIÁLOGO</span>
              <button onClick={restart} className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] text-mist hover:border-gold hover:text-gold">
                <Play className="h-3 w-3" /> reiniciar
              </button>
            </div>
            <DialogueScene speaking={!runtime.ended} />
            <div className="border-t border-line bg-[#0d1126] p-4">
              {current && !runtime.ended ? (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-viol shadow-[0_0_8px_#7c6bff]" />
                    <span className="font-pixel text-[8px] text-viol">{current.speaker}</span>
                  </div>
                  <p className="min-h-16 text-sm leading-relaxed text-snow">{current.text}</p>
                  <div className="mt-4 space-y-2">
                    {current.choices.map((item) => {
                      const available = conditionPasses(item.condition, runtime.variables);
                      return (
                        <button
                          key={item.id}
                          disabled={!available}
                          onClick={() => pick(item.id)}
                          className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                            available ? "border-line bg-panel text-snow hover:border-gold hover:bg-gold/5" : "cursor-not-allowed border-line/50 bg-void text-mist/40",
                          )}
                        >
                          <span className="text-[13px]">{item.label}</span>
                          <span className="shrink-0 font-mono text-[9px] text-mist">
                            {available ? `→ ${item.target ?? "FIN"}` : describeCondition(item.condition)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-8 w-8 text-mint" />
                  <p className="mt-3 font-pixel text-[9px] text-mint">DIÁLOGO TERMINADO</p>
                  <p className="mt-2 text-xs text-mist">La historia cambió las variables, emitió eventos y llegó a un final.</p>
                  <button onClick={restart} className="arcade-btn mt-4 rounded-md bg-gold px-4 py-2 font-pixel text-[8px] text-black">VOLVER A PROBAR</button>
                </div>
              )}
            </div>

            {/* variables en vivo */}
            <div className="border-t border-line p-4">
              <h4 className="flex items-center gap-2 font-pixel text-[8px] text-cyanx">
                <Variable className="h-3.5 w-3.5" /> VARIABLES DE PRUEBA
              </h4>
              <p className="mt-1 text-[11px] text-mist">Cámbialas para desbloquear rutas sin repetir toda la misión.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(runtime.variables).map(([key, value]) => (
                  <label key={key} className="rounded-lg border border-line bg-void/40 p-2">
                    <span className="block truncate font-mono text-[9px] text-mist">{key}</span>
                    {typeof value === "boolean" ? (
                      <button
                        onClick={() => setRuntime((r) => setRuntimeVariable(r, key, !value))}
                        className={cn("mt-1 w-full rounded px-2 py-1 font-pixel2 text-[10px]", value ? "bg-mint/15 text-mint" : "bg-panel text-mist")}
                      >
                        {String(value)}
                      </button>
                    ) : (
                      <input
                        value={String(value)}
                        onChange={(e) => setRuntime((r) => setRuntimeVariable(r, key, valueFromInput(e.target.value, value)))}
                        className="mt-1 w-full bg-transparent font-mono text-[12px] text-snow outline-none"
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* eventos y validación */}
            <div className="grid border-t border-line sm:grid-cols-2">
              <div className="border-b border-line p-4 sm:border-b-0 sm:border-r">
                <h4 className="font-pixel text-[8px] text-gold">EVENTOS EMITIDOS</h4>
                <div className="mt-2 max-h-28 space-y-1 overflow-auto font-mono text-[9px] text-mist">
                  {runtime.events.length ? runtime.events.slice(-8).map((event, i) => <p key={`${event}-${i}`}>› {event}</p>) : <p className="text-mist/40">ninguno todavía</p>}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-pixel text-[8px] text-mint">VALIDACIÓN DEL GRAFO</h4>
                <div className="mt-2 max-h-28 space-y-1 overflow-auto font-mono text-[9px] text-mist">
                  {issues.length === 0 ? <p className="text-mint">✓ sin errores</p> : issues.slice(0, 8).map((item, i) => (
                    <p key={i} className={item.level === "error" ? "text-rose" : "text-gold"}>
                      {item.level === "error" ? "✗" : "!"} {item.nodeId ? `[${item.nodeId}] ` : ""}{item.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mt-6 grid gap-3 md:grid-cols-3"
        >
          {[
            [Braces, "El JSON es el contenido", "El motor no contiene la historia: interpreta datos. Un guionista puede trabajar sin tocar la física del juego."],
            [LockKeyhole, "Las condiciones ocultan rutas", "Una elección puede exigir cristales, reputación, una llave o cualquier variable que exista en tu mundo."],
            [Flag, "Los efectos cambian el futuro", "Sumar confianza, entregar monedas o activar una misión hace que conversaciones posteriores respondan a tus decisiones."],
          ].map(([Icon, title, text]) => {
            const C = Icon as typeof Braces;
            return (
              <div key={String(title)} className="rounded-xl border border-line bg-panel p-4">
                <C className="h-4 w-4 text-cyanx" />
                <h3 className="mt-3 font-pixel2 text-[14px] text-snow">{String(title)}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-mist">{String(text)}</p>
              </div>
            );
          })}
        </motion.div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {NARRATIVE_LESSONS.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <CodeCard lesson={lesson} accent="#7c6bff" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Exportado para pruebas del pack descargable: demuestra que efectos aislados son funciones puras.
export const previewEffect = applyEffect;