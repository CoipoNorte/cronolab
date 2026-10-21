import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  RefreshCw,
  Timer,
  Grid2x2,
  Layers,
  MoveVertical,
  Boxes,
  Lightbulb,
  Square,
  ArrowRight,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

function Card(props: {
  icon: typeof RefreshCw;
  title: string;
  text: string;
  demo?: ReactNode;
  span?: string;
  delay?: number;
}) {
  const { icon: Icon, title, text, demo, span = "", delay = 0 } = props;
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={`group relative overflow-hidden rounded-2xl border border-line bg-panel p-6 transition-colors hover:border-viol/50 ${span}`}
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-viol/10 blur-2xl transition-all group-hover:bg-viol/20" />
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-void text-cyanx">
          <Icon className="h-4.5 w-4.5" />
        </span>
        {demo}
      </div>
      <h3 className="mt-4 font-pixel2 text-lg text-snow">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mist">{text}</p>
    </motion.article>
  );
}

/** mini-demo: capas deslizando a distinta velocidad = parallax */
function ParallaxDemo() {
  const row = (cls: string, bg: string, h: number) => (
    <div
      className={`w-[200%] ${cls}`}
      style={{
        height: h,
        backgroundImage: `repeating-linear-gradient(90deg, ${bg} 0 14px, transparent 14px 30px)`,
      }}
    />
  );
  return (
    <div className="flex h-12 w-28 flex-col justify-end gap-1 overflow-hidden rounded border border-line bg-void">
      {row("strip-far", "#5b7fa6", 8)}
      {row("strip-mid", "#4c9455", 9)}
      {row("strip-near", "#2c7038", 12)}
    </div>
  );
}

/** mini-demo: bola con squash & stretch = física */
function PhysicsDemo() {
  return (
    <div className="flex h-12 w-28 items-end justify-center overflow-hidden rounded border border-line bg-void">
      <div className="lab-bounce h-4 w-4 rounded-full bg-gold" />
    </div>
  );
}

/** mini-demo: punto orbitando = el bucle no se detiene */
function LoopDemo() {
  return (
    <div className="flex h-12 w-28 items-center justify-center rounded border border-line bg-void">
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border border-dashed border-mint/30" />
        <div className="lab-orbit absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-mint" />
      </div>
    </div>
  );
}

export default function Concepts() {
  return (
    <section id="conceptos" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="08"
          eyebrow="VOCABULARIO DE PIRATA"
          title="SEIS IDEAS QUE USARÁS"
          accent="EN TODOS LOS JUEGOS"
          blurb="Lo que acabas de ver en el código no es 'cosa de este tutorial': es la caja de herramientas universal. Cambian los gráficos, cambian los nombres… estas seis ideas no cambian nunca."
          icon={Lightbulb}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            icon={RefreshCw}
            title="El game loop"
            text="Actualizar y dibujar, unas 60 veces por segundo, hasta el fin de los tiempos. Todo juego del universo — de Tetris a Zelda — es este bucle disfrazado."
            demo={<LoopDemo />}
          />
          <Card
            icon={Timer}
            title="Delta time"
            text="El tiempo real entre fotogramas. Multiplica los movimientos por él y el juego correrá igual de rápido en un PC potente que en una tostadora del 2009."
            delay={0.05}
          />
          <Card
            icon={Grid2x2}
            title="Sprites = datos"
            text="Un sprite es una tabla de letras: cada letra, un color de píxel. Cambia una letra y cambias el dibujo. Por eso el pixel art es el mejor taller para empezar."
            delay={0.1}
          />
          <Card
            icon={Layers}
            title="Parallax 2.5D"
            text="Capas que se mueven a velocidades distintas: lejos = lento, cerca = rápido. Tu cerebro rellena la profundidad. Cero 3D, cien por cien teatro."
            demo={<ParallaxDemo />}
            delay={0.05}
          />
          <Card
            icon={MoveVertical}
            title="Físicas de juguete"
            text="Gravedad: sumar un número a la velocidad cada fotograma. Saltar: poner ese número en negativo. Suena ridículamente simple porque lo es. Y funciona."
            demo={<PhysicsDemo />}
            delay={0.1}
          />
          <Card
            icon={Boxes}
            title="Colisiones AABB"
            text="¿Se tocan dos rectángulos? Cuatro comparaciones y lo sabes. Con esa única pregunta construyes monedas, enemigos, puertas, suelos y finales de nivel."
            delay={0.15}
          />
        </div>

        {/* -------- retos -------- */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="pixel-corners mt-12 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-panel to-panel p-6 [--pc:#ffd23f] sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-pixel text-[11px] text-gold">MISIONES SECUNDARIAS</h3>
            <span className="font-pixel2 text-[11px] text-mist">para cuando domines lo básico</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "Añade un doble salto. Pista: cuenta cuántas veces saltó el héroe desde que tocó el suelo.",
              "Haz que la última moneda del nivel valga 5 puntos. Pista: compara su coordenada x con un límite.",
              "Cambia la paleta del héroe a tus colores favoritos en src/game/sprites.ts. Es literalmente editar un string.",
            ].map((challenge, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-line bg-void/50 p-4">
                <Square className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-sm leading-relaxed text-mist">{challenge}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-snow">
            La regla de oro: rompe algo, mira qué pasa, arregla lo que se rompió.
            <span className="flex items-center gap-1 font-pixel2 text-xs text-gold">
              eso es programar <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
