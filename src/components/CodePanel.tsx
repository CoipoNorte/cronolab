import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Copy, Check, Lightbulb, Wrench, CirclePlay } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { SNIPPETS } from "../game/codeSnippets";
import { cn } from "../utils/cn";

export default function CodePanel() {
  const [active, setActive] = useState(SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);
  const snippet = SNIPPETS.find((s) => s.id === active)!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* portapapeles no disponible */
    }
  };

  return (
    <section id="codigo" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="02"
          eyebrow="¿CÓMO ESTÁ HECHO?"
          title="EL CÓDIGO, EXPLICADO"
          accent="LÍNEA A LÍNEA"
          blurb="Seis funciones pequeñas. Eso es todo lo que separa una página web de un videojuego. Léelas sin miedo: cada una está comentada como si me la explicaran a mí por primera vez."
          icon={Code2}
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* --------- lista de funciones --------- */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-4"
          >
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {SNIPPETS.map((s, i) => {
                const isActive = s.id === active;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "group flex min-w-[200px] items-center gap-3 rounded-xl border p-3.5 text-left transition-all lg:min-w-0",
                      isActive
                        ? "border-gold/60 bg-panel2 shadow-[0_0_30px_-10px_rgba(255,210,63,0.35)]"
                        : "border-line bg-panel hover:border-viol/50 hover:bg-panel2/60",
                    )}
                  >
                    <span
                      className={cn(
                        "font-pixel text-[9px]",
                        isActive ? "text-gold" : "text-mist/50",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        isActive ? "border-gold/40 bg-gold/10 text-gold" : "border-line bg-void text-mist group-hover:text-cyanx",
                      )}
                    >
                      <s.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block truncate font-pixel2 text-[13px]", isActive ? "text-snow" : "text-mist group-hover:text-snow")}>
                        {s.title}
                      </span>
                      <span className="block truncate text-[11px] text-mist/70">{s.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* --------- visor de código --------- */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="lg:col-span-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={snippet.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="overflow-hidden rounded-2xl border border-line bg-[#0d1126] shadow-[0_0_60px_-25px_rgba(92,225,230,0.35)]">
                  {/* barra del archivo */}
                  <div className="flex items-center justify-between border-b border-line bg-panel2/80 px-4 py-2.5">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-mist">
                      <span className="h-2 w-2 rounded-full bg-cyanx/70" />
                      {snippet.file}
                    </div>
                    <button
                      onClick={copy}
                      className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[10px] text-mist transition-colors hover:border-gold hover:text-gold"
                    >
                      {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                      {copied ? "¡copiado!" : "copiar"}
                    </button>
                  </div>

                  {/* código con números de línea */}
                  <div className="code-scroll code-block overflow-x-auto py-4">
                    <Highlight theme={themes.nightOwl} code={snippet.code} language="tsx">
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

                {/* explicación en humano */}
                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="rounded-xl border border-line bg-panel p-5">
                    <h4 className="flex items-center gap-2 font-pixel text-[9px] text-mint">
                      <Lightbulb className="h-4 w-4" />
                      EN HUMANO, POR FAVOR
                    </h4>
                    <ul className="mt-3 space-y-2.5">
                      {snippet.plain.map((p, i) => (
                        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-mist">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-mint/70" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                      <span className="font-pixel text-[7px] text-mist/60">VISTO EN</span>
                      {snippet.apps.map((a) => (
                        <span key={a} className="rounded border border-line bg-void px-1.5 py-0.5 font-pixel2 text-[9px] text-mist">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col rounded-xl border border-viol/40 bg-viol/10 p-5 md:max-w-[260px]">
                    <h4 className="flex items-center gap-2 font-pixel text-[9px] text-viol">
                      <CirclePlay className="h-4 w-4" />
                      PRUÉBALO AHORA
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-snow/80">{snippet.tryIt}</p>
                    <a
                      href="#juego"
                      className="arcade-btn mt-auto inline-flex w-fit items-center gap-2 rounded-md bg-viol px-4 py-2 pt-2.5 font-pixel text-[8px] text-white"
                    >
                      <Wrench className="h-3 w-3" />
                      IR A LA PANTALLA
                    </a>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
