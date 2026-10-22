import { motion } from "framer-motion";
import { Blocks, ArrowRight, Languages, KeyRound, Download } from "lucide-react";
import SectionHeading from "./SectionHeading";
import CodeCard from "./CodeCard";
import { UNITY_LESSONS, UNITY_MAP } from "../game/moreSnippets";

export default function UnityBridge() {
  return (
    <section id="unity" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="11"
          eyebrow="LA PREGUNTA DEL MILLÓN"
          title="¿Y ESTO EN UNITY?"
          accent="SÍ. MISMAS IDEAS, OTRO ACENTO."
          blurb="Todo lo practicado se traduce casi palabra por palabra a Unity (y a Godot, GameMaker o Unreal). El motor aporta física y herramientas; saltos, diálogos, misiones, guardado, combos y eventos siguen siendo decisiones tuyas. Aquí tienes el diccionario y seis scripts descargables."
          icon={Blocks}
        />

        {/* diccionario de traducción */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="pixel-corners relative rounded-2xl border border-line bg-panel p-6 [--pc:#7c6bff] sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-pixel text-[10px] text-snow">
              <Languages className="h-4 w-4 text-viol" />
              DICCIONARIO WEB ↔ UNITY
            </h3>
            <span className="font-pixel2 text-[11px] text-mist">el 80% del vocabulario es compartido</span>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2">
            {UNITY_MAP.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-xl border border-line bg-void/50 px-4 py-3"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-cyanx">{row.web}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gold" />
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-mist">{row.unity}</span>
              </motion.div>
            ))}
          </div>

          <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-mist">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              La clave mental: <strong className="text-snow">Unity no sustituye lo que aprendiste, lo reempaqueta.</strong>{" "}
              Donde tú escribiste <em className="text-cyanx not-italic">vy += gravedad * dt</em>, Unity pone un
              Rigidbody2D con un número llamado gravityScale. Donde tú comprobaste solapes, Unity pone colliders
              con eventos. El razonamiento detrás es el mismo.
            </span>
          </p>
        </motion.div>

        {/* acceso a la guía de instalación */}
        <a
          href="#/instalar"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mint/40 bg-mint/5 p-5 transition-colors hover:border-mint"
        >
          <span>
            <span className="block font-pixel text-[10px] text-mint">¿NO TIENES EL MOTOR INSTALADO?</span>
            <span className="mt-1.5 block text-sm text-mist">
              Guía paso a paso para descargar Unity o Godot, con requisitos reales y los errores típicos de la primera vez.
            </span>
          </span>
          <span className="arcade-btn flex items-center gap-2 rounded-md bg-mint px-5 py-3 font-pixel text-[9px] text-black">
            ABRIR LA GUÍA <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </a>

        <a
          href="#unity-zips"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-viol/40 bg-viol/5 p-5 transition-colors hover:border-viol"
        >
          <span>
            <span className="block font-pixel text-[10px] text-viol">TRES ZIPS DE UNITY LISTOS</span>
            <span className="mt-1.5 block text-sm text-mist">
              Proyecto completo de Crono Jump, pack RPG y pack de producción. Todos incluyen README y código C# editable.
            </span>
          </span>
          <span className="arcade-btn flex items-center gap-2 rounded-md bg-viol px-5 py-3 font-pixel text-[9px] text-white">
            <Download className="h-3.5 w-3.5" /> DESCARGAR PACKS
          </span>
        </a>

        {/* scripts C# */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {UNITY_LESSONS.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
            >
              <CodeCard lesson={l} accent="#7c6bff" />
            </motion.div>
          ))}
        </div>

        {/* nota honesta */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 rounded-xl border border-cyanx/30 bg-cyanx/5 p-4 text-[13px] leading-relaxed text-mist"
        >
          <strong className="text-cyanx">Nota honesta:</strong> estos scripts son deliberadamente mínimos para que veas
          el paralelismo. En un proyecto real usarías el nuevo Input System, ScriptableObjects para los diálogos,
          y el Animator para las animaciones… pero todos esos sistemas existen para resolver los problemas que
          aquí resolviste a mano. Ahora sabes QUÉ hacen por dentro.
        </motion.p>
      </div>
    </section>
  );
}
