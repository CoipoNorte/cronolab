import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import { ChevronDown, Code2, Copy, Check, FlaskConical, Lightbulb, Power } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { MECH_DEMOS, CATS, DW, DH } from "../game/mechanics";
import type { MechDemo, Cat } from "../game/mechanics";
import { cn } from "../utils/cn";

/* ============================================================
   UNA TARJETA = UN CONCEPTO.
   Cada canvas tiene su propio bucle y se pausa automáticamente
   cuando sale de la pantalla (13 demos a la vez serían mucho).
   ============================================================ */

function DemoCard({ demo, index }: { demo: MechDemo; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onRef = useRef(true);
  const visibleRef = useRef(false);

  const [on, setOn] = useState(true);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readout, setReadout] = useState("");

  useEffect(() => { onRef.current = on; }, [on]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = DW;
    canvas.height = DH;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const inst = demo.create();
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastText = "";

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (visibleRef.current) {
        inst.update(dt, onRef.current);
        inst.draw(ctx, onRef.current);
        acc += dt;
        if (acc > 0.35) {
          acc = 0;
          const txt = inst.readout(onRef.current);
          if (txt !== lastText) { lastText = txt; setReadout(txt); }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* pausa lo que no se ve: la batería del portátil lo agradece */
    const io = new IntersectionObserver(
      (entries) => { visibleRef.current = entries[0].isIntersecting; },
      { rootMargin: "120px" },
    );
    if (wrapRef.current) io.observe(wrapRef.current);

    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [demo]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(demo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* sin portapapeles */ }
  };

  return (
    <motion.article
      ref={wrapRef}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.06 }}
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-viol/40"
    >
      {/* cabecera */}
      <div className="flex items-start gap-3 border-b border-line bg-panel2/70 px-4 py-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-void text-cyanx">
          <demo.icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-pixel2 text-[15px] leading-tight text-snow">{demo.title}</h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-mist">{demo.blurb}</p>
        </div>
      </div>

      {/* pantalla */}
      <div className="crt relative bg-void">
        <canvas ref={canvasRef} className="pixelated block aspect-[240/135] w-full" />
        <span
          className={cn(
            "pointer-events-none absolute right-2 top-2 z-40 rounded px-1.5 py-0.5 font-pixel text-[7px]",
            on ? "bg-mint/20 text-mint" : "bg-rose/20 text-rose",
          )}
        >
          {on ? "ON" : "OFF"}
        </span>
      </div>

      {/* interruptor + lectura */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-void/40 px-4 py-2.5">
        <button
          onClick={() => setOn((v) => !v)}
          className="flex items-center gap-2 font-pixel2 text-[11px] text-snow transition-colors hover:text-gold"
        >
          <Power className={cn("h-3.5 w-3.5", on ? "text-mint" : "text-mist")} />
          {demo.toggle}
          <span className="lab-toggle ml-1 scale-75" data-on={on} />
        </button>
      </div>

      <p className="min-h-[38px] px-4 py-2.5 font-mono text-[11px] leading-relaxed text-mist">
        <span className={cn("mr-1.5", on ? "text-mint" : "text-rose")}>›</span>
        {readout}
      </p>

      {/* código plegable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-auto flex items-center justify-between border-t border-line px-4 py-2.5 text-left transition-colors hover:bg-panel2"
      >
        <span className="flex items-center gap-2 font-pixel text-[8px] text-mist">
          <Code2 className="h-3.5 w-3.5 text-viol" />
          {open ? "OCULTAR EL CÓDIGO" : "VER EL CÓDIGO"}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-mist transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-line bg-[#0d1126]"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="font-mono text-[10px] text-mist/70">{demo.id}.ts</span>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] text-mist transition-colors hover:border-gold hover:text-gold"
              >
                {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                {copied ? "¡copiado!" : "copiar"}
              </button>
            </div>
            <div className="code-scroll code-block overflow-x-auto py-3">
              <Highlight theme={themes.nightOwl} code={demo.code} language="tsx">
                {({ tokens, getLineProps, getTokenProps }) => (
                  <pre className="!m-0 bg-transparent !text-[11px]">
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
            <div className="border-t border-line bg-panel px-4 py-4">
              <h4 className="flex items-center gap-2 font-pixel text-[8px] text-mint">
                <Lightbulb className="h-3.5 w-3.5" />
                POR QUÉ IMPORTA
              </h4>
              <ul className="mt-2.5 space-y-2">
                {demo.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-mist">
                    <span className="mt-[7px] h-1 w-1 shrink-0 bg-mint/70" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                <span className="font-pixel text-[7px] text-mist/60">VISTO EN</span>
                {demo.apps.map((a) => (
                  <span key={a} className="rounded border border-line bg-void px-1.5 py-0.5 font-pixel2 text-[9px] text-mist">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ============================================================
   LA SECCIÓN
   ============================================================ */

export default function MechanicsLab() {
  const [cat, setCat] = useState<Cat | "todas">("todas");
  const demos = cat === "todas" ? MECH_DEMOS : MECH_DEMOS.filter((d) => d.cat === cat);

  return (
    <section id="mecanicas" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="05"
          eyebrow="EL RECETARIO DEL GAME FEEL"
          title="13 MECÁNICAS QUE NO SE VEN"
          accent="PERO SE SIENTEN"
          blurb="Coyote time, buffer de salto, hitstop, zona muerta, object pooling… Son las técnicas invisibles que separan un prototipo de un juego que da gusto jugar. Cada demo se anima sola: pulsa su interruptor para ver la MISMA escena con y sin la técnica. La diferencia es el oficio."
          icon={FlaskConical}
        />

        {/* filtros */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCat("todas")}
            className={cn(
              "rounded-lg border px-3.5 py-2 font-pixel2 text-[12px] transition-all",
              cat === "todas" ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel text-mist hover:text-snow",
            )}
          >
            todas ({MECH_DEMOS.length})
          </button>
          {CATS.map((c) => {
            const n = MECH_DEMOS.filter((d) => d.cat === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  "rounded-lg border px-3.5 py-2 font-pixel2 text-[12px] transition-all",
                  cat === c.id ? "border-gold bg-gold/15 text-gold" : "border-line bg-panel text-mist hover:text-snow",
                )}
              >
                {c.label} ({n})
              </button>
            );
          })}
        </div>

        {/* rejilla de demos */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {demos.map((d, i) => (
            <DemoCard key={d.id} demo={d} index={i} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-4 text-[13px] leading-relaxed text-mist"
        >
          <strong className="text-gold">La lección escondida:</strong> ninguna de estas trece técnicas aparece
          en la lista de características de un juego. Nadie anuncia «¡con buffer de salto!». Y aun así, son
          exactamente lo que hace que un juego se sienta bien o se sienta roto. Cuando algo te resulte
          «injusto» o «pastoso» al jugar, ya sabes qué buscar.
        </motion.p>
      </div>
    </section>
  );
}
