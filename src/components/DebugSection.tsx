import { motion } from "framer-motion";
import { Bug } from "lucide-react";
import SectionHeading from "./SectionHeading";
import DebugLab from "./DebugLab";
import CodeCard from "./CodeCard";
import { DEBUG_LESSONS } from "../game/systemsSnippets";

export default function DebugSection() {
  return (
    <section id="debug" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-35" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="07"
          eyebrow="VER LO INVISIBLE"
          title="LABORATORIO DE"
          accent="DEPURACIÓN"
          blurb="Programar no es acertar a la primera: es construir herramientas que expliquen por qué algo salió mal. Controla la escena, ralentiza el tiempo, avanza un solo fotograma y superpone los datos reales que usa el motor."
          icon={Bug}
        />

        <DebugLab />

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {DEBUG_LESSONS.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <CodeCard lesson={lesson} accent="#5ce1e6" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}