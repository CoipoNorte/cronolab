import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftCircle,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Target,
  Lightbulb,
  Gamepad2,
  FileCode2,
  Trophy,
  Coins,
  Heart,
  Flame,
  Activity,
  Rocket,
  ListChecks,
} from "lucide-react";
import MiniFrame from "./MiniFrame";
import { createTutorialGame } from "../game/tutorial";
import type { Mini } from "../game/minis";
import { TUTORIAL_STEPS } from "../game/tutorialSteps";
import { buildStandaloneGame } from "../game/standalone";
import tutorialRaw from "../game/tutorial.ts?raw";
import { cn } from "../utils/cn";

const DONE_KEY = "cronolab-tutorial-progreso";

function loadDone(): number[] {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function Chip(props: { icon: typeof Coins; label: string; value: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md bg-void/70 px-2 py-1 backdrop-blur-sm">
      <props.icon className="h-3 w-3" style={{ color: props.color }} />
      <span className="font-pixel2 text-[9px] text-mist">{props.label}</span>
      <span className="font-pixel text-[9px]" style={{ color: props.color }}>{props.value}</span>
    </span>
  );
}

export default function TutorialPage() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState<number[]>(() => loadDone());
  const [copied, setCopied] = useState(false);

  const current = TUTORIAL_STEPS[step - 1];
  const total = TUTORIAL_STEPS.length;

  /* la fábrica del motor cambia solo cuando cambia el paso */
  const make = useCallback((): Mini => createTutorialGame(step), [step]);

  useEffect(() => {
    try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch { /* bloqueado */ }
  }, [done]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const toggleDone = (n: number) =>
    setDone((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n]));

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* sin portapapeles */ }
  };

  const progress = Math.round((done.length / total) * 100);
  const hudColor = useMemo(() => ["#5ce1e6", "#4ade80", "#ffd23f", "#ff5d73"], []);

  return (
    <div className="min-h-screen bg-void">
      {/* ---------- barra superior ---------- */}
      <header className="sticky top-0 z-50 border-b border-line bg-void/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="#top"
            className="flex items-center gap-2 font-pixel2 text-sm text-mist transition-colors hover:text-gold"
          >
            <ArrowLeftCircle className="h-4 w-4" />
            volver a CronoLab
          </a>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="font-pixel text-[9px] text-mist">PROGRESO</span>
            <div className="h-2 w-40 overflow-hidden rounded-full border border-line bg-panel">
              <motion.div
                className="h-full bg-gradient-to-r from-mint to-gold"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="font-pixel text-[9px] text-gold">{progress}%</span>
          </div>
        </div>
      </header>

      {/* ---------- cabecera del proyecto ---------- */}
      <section className="relative overflow-hidden border-b border-line px-4 py-14 sm:px-6">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 px-4 py-1.5">
            <Rocket className="h-3.5 w-3.5 text-mint" />
            <span className="font-pixel2 text-xs tracking-wide text-mint">PROYECTO GUIADO · 8 PASOS</span>
          </span>
          <h1 className="mt-5 font-pixel text-[clamp(1.2rem,3.6vw,2.4rem)] leading-[1.5] text-snow">
            CRONO <span className="text-gold">JUMP</span>
            <br />
            <span className="text-outline">UN CLON DE MARIO</span>{" "}
            <span className="text-rose">CON METEORITOS</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-mist">
            Construye un juego completo desde cero: un lienzo vacío se convierte en un plataformas con monedas,
            obstáculos y proyectiles que caen del cielo. <strong className="text-snow">Cada paso trae su propia
            demo jugable</strong> con solo lo programado hasta ahí, su código comentado y una lista de
            comprobación. Al final te lo descargas en un archivo .html que funciona sin internet.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-pixel2 text-xs text-mist">
            <span>🎯 recoge monedas para puntuar</span>
            <span>☄️ esquiva meteoritos verticales</span>
            <span>🧱 sortea bloques y pinchos</span>
            <span>🏁 llega a la bandera</span>
          </div>
        </div>
      </section>

      {/* ---------- cuerpo ---------- */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-12">
        {/* índice de pasos */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <h2 className="mb-3 flex items-center gap-2 font-pixel text-[9px] text-mist">
              <ListChecks className="h-4 w-4 text-cyanx" />
              LOS 8 PASOS
            </h2>
            <ol className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {TUTORIAL_STEPS.map((s) => {
                const active = s.n === step;
                const isDone = done.includes(s.n);
                return (
                  <li key={s.id} className="min-w-[190px] lg:min-w-0">
                    <button
                      onClick={() => setStep(s.n)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-gold/60 bg-panel2 shadow-[0_0_26px_-12px_rgba(255,210,63,.5)]"
                          : "border-line bg-panel hover:border-viol/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-pixel text-[9px]",
                          isDone
                            ? "border-mint/50 bg-mint/15 text-mint"
                            : active
                              ? "border-gold/50 bg-gold/15 text-gold"
                              : "border-line bg-void text-mist",
                        )}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" /> : s.n}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block truncate font-pixel2 text-[13px]", active ? "text-snow" : "text-mist")}>
                          {s.title}
                        </span>
                        <span className="block truncate text-[11px] text-mist/60">{s.subtitle}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-4 hidden rounded-xl border border-line bg-panel p-4 lg:block">
              <p className="font-pixel text-[8px] text-gold">CÓMO USAR ESTO</p>
              <p className="mt-2 text-[12px] leading-relaxed text-mist">
                Lee el objetivo, juega la demo del paso, copia el código a tu editor y marca la casilla
                cuando lo veas funcionar. Sin prisa: cada paso funciona por sí solo.
              </p>
            </div>
          </div>
        </aside>

        {/* contenido del paso */}
        <main className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              {/* encabezado del paso */}
              <div className="rounded-2xl border border-line bg-panel p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
                    <current.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-pixel text-[9px] text-gold">PASO {current.n} DE {total}</p>
                    <h2 className="font-pixel2 text-xl text-snow">{current.title}</h2>
                  </div>
                </div>
                <p className="mt-4 flex gap-2.5 rounded-xl border border-cyanx/30 bg-cyanx/5 p-4 text-sm leading-relaxed text-snow/85">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-cyanx" />
                  <span><strong className="text-cyanx">Objetivo:</strong> {current.goal}</span>
                </p>
              </div>

              {/* demo jugable del paso */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-pixel text-[9px] text-snow">
                  <Gamepad2 className="h-4 w-4 text-mint" />
                  DEMO DE ESTE PASO · solo tiene lo programado hasta aquí
                </h3>
                <MiniFrame
                  key={`tut-${step}`}
                  make={make}
                  title={`CRONO_JUMP // PASO ${current.n}: ${current.title.toUpperCase()}`}
                  accent="#4ade80"
                  hints={current.controls}
                  renderHud={(h) => (
                    <>
                      <span className="flex gap-1.5">
                        {h.puntos !== undefined && (
                          <Chip icon={Coins} label="puntos" value={String(h.puntos)} color={hudColor[2]} />
                        )}
                        {h.vidas !== undefined && (
                          <Chip icon={Heart} label="vidas" value={String(h.vidas)} color={hudColor[3]} />
                        )}
                      </span>
                      <span className="flex gap-1.5">
                        {h.meteoros !== undefined && (
                          <Chip icon={Flame} label="meteoros" value={String(h.meteoros)} color="#ff7847" />
                        )}
                        <Chip icon={Activity} label="estado" value={String(h.estado ?? "—")} color={hudColor[0]} />
                      </span>
                    </>
                  )}
                />
              </div>

              {/* código */}
              <div className="overflow-hidden rounded-2xl border border-line bg-[#0d1126]">
                <div className="flex items-center justify-between border-b border-line bg-panel2/80 px-4 py-2.5">
                  <span className="flex items-center gap-2 font-mono text-[11px] text-mist">
                    <FileCode2 className="h-3.5 w-3.5 text-cyanx" />
                    crono-jump.js · paso {current.n}
                  </span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[10px] text-mist transition-colors hover:border-gold hover:text-gold"
                  >
                    {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                    {copied ? "¡copiado!" : "copiar código"}
                  </button>
                </div>
                <div className="code-scroll code-block overflow-x-auto py-4">
                  <Highlight theme={themes.nightOwl} code={current.code} language="jsx">
                    {({ tokens, getLineProps, getTokenProps }) => (
                      <pre className="!m-0 bg-transparent">
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            <span className="code-line-num">{i + 1}</span>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              </div>

              {/* explicación + checklist */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-panel p-5">
                  <h3 className="flex items-center gap-2 font-pixel text-[9px] text-mint">
                    <Lightbulb className="h-4 w-4" />
                    POR QUÉ FUNCIONA
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {current.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-mist">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-mint/70" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {current.tip && (
                    <p className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-3 text-[12px] leading-relaxed text-snow/85">
                      <strong className="text-gold">Truco:</strong> {current.tip}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-line bg-panel p-5">
                  <h3 className="flex items-center gap-2 font-pixel text-[9px] text-cyanx">
                    <CheckCircle2 className="h-4 w-4" />
                    QUÉ DEBERÍAS VER
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {current.checklist.map((c, i) => (
                      <li key={i} className="flex gap-2.5 rounded-lg border border-line bg-void/40 p-3 text-[13px] leading-relaxed text-mist">
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyanx" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => toggleDone(current.n)}
                    className={cn(
                      "arcade-btn mt-4 flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-pixel text-[9px]",
                      done.includes(current.n) ? "bg-mint text-black" : "bg-panel2 text-snow",
                    )}
                  >
                    {done.includes(current.n) ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {done.includes(current.n) ? "PASO COMPLETADO" : "MARCAR COMO HECHO"}
                  </button>
                </div>
              </div>

              {/* navegación */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="arcade-btn flex items-center gap-2 rounded-md border-2 border-line bg-panel px-5 py-3 font-pixel text-[9px] text-snow disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> ANTERIOR
                </button>
                <span className="font-pixel2 text-xs text-mist">
                  {current.n} / {total}
                </span>
                <button
                  onClick={() => setStep((s) => Math.min(total, s + 1))}
                  disabled={step === total}
                  className="arcade-btn flex items-center gap-2 rounded-md bg-gold px-5 py-3 font-pixel text-[9px] text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  SIGUIENTE <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ---------- final: juego completo + descargas ---------- */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mt-14 rounded-2xl border border-gold/35 bg-gradient-to-br from-gold/10 via-panel to-panel p-6 sm:p-8"
          >
            <h2 className="flex items-center gap-2 font-pixel text-[11px] text-gold">
              <Trophy className="h-4.5 w-4.5" />
              EL JUEGO TERMINADO
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mist">
              Esto es todo junto: movimiento, salto, bloques, pinchos, monedas, meteoritos con aviso, vidas,
              partículas, sonido y meta. Juégalo aquí y llévatelo en un archivo <strong className="text-snow">.html
              autónomo</strong>: ábrelo con doble clic en cualquier ordenador y funcionará, también sin internet.
            </p>

            <div className="mt-6">
              <MiniFrame
                key="tut-final"
                make={useCallback((): Mini => createTutorialGame(8), [])}
                title="CRONO_JUMP // JUEGO COMPLETO"
                accent="#ffd23f"
                hints={["← → / A D moverse", "ESPACIO saltar", "R reiniciar"]}
                renderHud={(h) => (
                  <>
                    <span className="flex gap-1.5">
                      <Chip icon={Coins} label="puntos" value={String(h.puntos ?? 0)} color="#ffd23f" />
                      <Chip icon={Heart} label="vidas" value={String(h.vidas ?? 3)} color="#ff5d73" />
                    </span>
                    <Chip icon={Activity} label="estado" value={String(h.estado ?? "—")} color="#5ce1e6" />
                  </>
                )}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => download("crono-jump.html", buildStandaloneGame(), "text/html;charset=utf-8")}
                className="arcade-btn flex items-center justify-center gap-2.5 rounded-md bg-mint px-5 py-4 font-pixel text-[9px] text-black"
              >
                <Download className="h-4 w-4" />
                DESCARGAR EL JUEGO (.HTML)
              </button>
              <button
                onClick={() => download("tutorial-motor.ts", tutorialRaw, "text/plain;charset=utf-8")}
                className="arcade-btn flex items-center justify-center gap-2.5 rounded-md border-2 border-viol bg-panel px-5 py-3.5 font-pixel text-[9px] text-snow"
              >
                <FileCode2 className="h-4 w-4 text-viol" />
                DESCARGAR EL MOTOR (.TS)
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Haz el nivel tuyo", "Edita el array de cajas y monedas: cada número es una decisión de diseño."],
                ["Sube la apuesta", "Añade un segundo tipo de meteorito que caiga en diagonal, o monedas que valgan 50."],
                ["Llévalo a Unity", "Movimiento2D.cs y el resto de scripts del puente hacen exactamente esto en C#."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-line bg-void/50 p-4">
                  <p className="font-pixel2 text-[13px] text-snow">{t}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-mist">{d}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </main>
      </div>

      <footer className="border-t border-line bg-ink px-4 py-10 text-center sm:px-6">
        <p className="font-pixel2 text-sm text-mist">
          ¿Terminaste los 8 pasos? Ya programaste un videojuego completo.
        </p>
        <a
          href="#top"
          className="mt-4 inline-flex items-center gap-2 font-pixel text-[9px] text-gold hover:underline"
        >
          <ArrowLeftCircle className="h-3.5 w-3.5" /> VOLVER A CRONOLAB
        </a>
      </footer>
    </div>
  );
}
