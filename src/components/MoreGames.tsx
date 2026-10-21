import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Gamepad2,
  Coins,
  Flag,
  Backpack,
  Activity,
  Heart,
  Swords,
  Trophy,
  MapPin,
  Gem,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import MiniFrame from "./MiniFrame";
import CodeCard from "./CodeCard";
import LevelEditor from "./LevelEditor";
import { createPlatformer, createDialogue, createArena } from "../game/minis";
import { createBattle } from "../game/battle";
import { createTopDown } from "../game/topdown";
import type { Mini } from "../game/minis";
import { PLATFORM_LESSONS, DIALOGUE_LESSONS, ARENA_LESSONS, LEVEL_EDITOR_LESSONS, TOPDOWN_LESSONS, BATTLE_LESSONS } from "../game/moreSnippets";
import type { Lesson } from "../game/moreSnippets";

/* fábricas estables para que el bucle de cada marco no se reinicie */
const makePlatformer = (): Mini => createPlatformer();
const makeDialogue = (): Mini => createDialogue();
const makeArena = (): Mini => createArena();
const makeBattle = (): Mini => createBattle();
const makeTopDown = (): Mini => createTopDown();

function Chip(props: { icon: typeof Coins; label: string; value: string; color?: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md bg-void/70 px-2 py-1 backdrop-blur-sm">
      <props.icon className="h-3 w-3" style={{ color: props.color ?? "#ffd23f" }} />
      <span className="font-pixel2 text-[9px] text-mist">{props.label}</span>
      <span className="font-pixel text-[9px]" style={{ color: props.color ?? "#ffd23f" }}>{props.value}</span>
    </span>
  );
}

interface BlockProps {
  num: string;
  tag: string;
  title: string;
  blurb: string;
  flip?: boolean;
  children: [ReactNode, ReactNode];
}

function Block({ num, tag, title, blurb, flip, children }: BlockProps) {
  return (
    <div className="mt-20 first:mt-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-2"
      >
        <span className="font-pixel text-[11px] text-gold">{num}</span>
        <span className="rounded-full border border-line bg-panel px-3 py-1 font-pixel2 text-[10px] tracking-wider text-cyanx">
          {tag}
        </span>
        <h3 className="font-pixel text-[clamp(0.85rem,1.8vw,1.2rem)] leading-relaxed text-snow">{title}</h3>
        <p className="w-full max-w-3xl text-sm leading-relaxed text-mist">{blurb}</p>
      </motion.div>
      <div className="grid gap-6 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className={`lg:col-span-7 ${flip ? "lg:order-2" : ""}`}
        >
          {children[0]}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className={`flex flex-col gap-5 lg:col-span-5 ${flip ? "lg:order-1" : ""}`}
        >
          {children[1]}
        </motion.div>
      </div>
    </div>
  );
}

export default function MoreGames() {
  return (
    <section id="ejemplos" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="04"
          eyebrow="SEIS FORMATOS, LAS MISMAS LEYES"
          title="PLATAFORMAS · DIÁLOGOS · MUNDO RPG"
          accent="· EVASIÓN · ATB"
          blurb="Cada ejemplo usa el mismo bucle, los mismos sprites y las mismas máquinas de estados. Cambia la cámara, la física o la regla principal y nace otro género. Juega cada uno y lee su receta al lado."
          icon={Gamepad2}
        />

        {/* ============ PLATAFORMAS ============ */}
        <Block
          num="04·1"
          tag="TILEMAP"
          title="GENERAR ESCENARIOS DE PLATAFORMEO"
          blurb="Un nivel de plataformas es un texto con forma de mundo: '#' suelo, '=' ladrillo, 'o' moneda, 'F' meta. Salta los pozos, sube por los ladrillos y llega a la bandera. Cambiar una letra = rediseñar el nivel."
        >
          <MiniFrame
            make={makePlatformer}
            title="NIVEL_01 // COLINAS DEL TILEMAP"
            hints={["← → / A D moverse", "ESPACIO saltar", "R reiniciar"]}
            renderHud={(h) => (
              <>
                <Chip icon={Coins} label="monedas" value={String(h.monedas ?? "0/0")} />
                <Chip icon={Flag} label="meta" value={String(h.meta ?? "—")} color="#4ade80" />
              </>
            )}
          />
          <>
            {PLATFORM_LESSONS.map((l: Lesson) => (
              <CodeCard key={l.id} lesson={l} accent="#4ade80" />
            ))}
          </>
        </Block>

        {/* ============ DIÁLOGOS / NPCs / EVENTOS ============ */}
        <Block
          flip
          num="04·2"
          tag="NPCs + EVENTOS"
          title="HABLAR CON NPCs, ABRIR COFRES, DISPARAR EVENTOS"
          blurb="Acércate a alguien y pulsa E: cartel que leer, anciana con una decisión, soldado parlanchín, cofre con botín. Y al final del camino, un evento que salta SOLO. Todo es una máquina de estados con dos modos: explorando y hablando."
        >
          <MiniFrame
            make={makeDialogue}
            title="ALDEA_01 // PRADERA DE LOS NPC"
            accent="#7c6bff"
            withInteract
            hints={["← → moverse", "ESPACIO saltar / avanzar", "E hablar · confirmar", "← → elegir opción"]}
            renderHud={(h) => (
              <>
                <Chip icon={Backpack} label="bolsa" value={String(h.inventario ?? "vacío")} color="#5ce1e6" />
                <Chip icon={Activity} label="estado" value={String(h.estado ?? "—")} color="#7c6bff" />
              </>
            )}
          />
          <>
            {DIALOGUE_LESSONS.map((l: Lesson) => (
              <CodeCard key={l.id} lesson={l} accent="#7c6bff" />
            ))}
          </>
        </Block>

        {/* ============ ARENA DE EVASIÓN ============ */}
        <Block
          num="04·3"
          tag="COMBATE MARIO-STYLE"
          title="ARENA DE EVASIÓN: APLASTA O ESQUIVA"
          blurb="Sin espadas, sin menús: el combate de Mario es esquivar y caer encima. Los slimes saltan hacia ti cada vez más rápido. Aplasta varios sin tocar el suelo para multiplicar puntos. Aterrizar rompe el combo: el suelo cobra peaje."
        >
          <MiniFrame
            make={makeArena}
            title="ARENA_01 // LA POZOLETA"
            accent="#ff5d73"
            hints={["← → / A D moverse", "ESPACIO saltar", "R nueva ronda"]}
            renderHud={(h) => (
              <>
                <span className="flex items-center gap-1 rounded-md bg-void/70 px-2 py-1 backdrop-blur-sm">
                  {[0, 1, 2].map((i) => (
                    <Heart
                      key={i}
                      className={
                        i < Number(h.corazones ?? 3)
                          ? "h-3.5 w-3.5 fill-rose text-rose"
                          : "h-3.5 w-3.5 text-snow/25"
                      }
                    />
                  ))}
                </span>
                <span className="flex gap-1.5">
                  <Chip icon={Swords} label="puntos" value={String(h.puntos ?? 0)} color="#ff5d73" />
                  <Chip icon={Trophy} label="combo" value={String(h.combo ?? "—")} color="#ffd23f" />
                </span>
              </>
            )}
          />
          <>
            {ARENA_LESSONS.map((l: Lesson) => (
              <CodeCard key={l.id} lesson={l} accent="#ff5d73" />
            ))}
          </>
        </Block>

        {/* ============ EDITOR DE NIVELES ============ */}
        <Block
          flip
          num="04·4"
          tag="NIVEL EDITOR"
          title="DISEÑA TU PROPIO NIVEL Y JUÉGALO"
          blurb="La guinda: el mismo motor del plataformas, pero el nivel lo escribes TÚ pintando tiles. Cava pozos imposibles, construye escaleras al cielo, siembra monedas… y pulsa JUGAR. Se guarda solo en tu navegador."
        >
          <LevelEditor />
          <>
            {LEVEL_EDITOR_LESSONS.map((l: Lesson) => (
              <CodeCard key={l.id} lesson={l} accent="#4ade80" />
            ))}
          </>
        </Block>

        {/* ============ AVENTURA CENITAL / QUEST ============ */}
        <Block
          num="04·5"
          tag="MUNDO RPG + GUARDADO"
          title="EXPLORA, COMPLETA UNA MISIÓN Y CAMBIA DE ESCENA"
          blurb="El esqueleto de un JRPG: muévete en cuatro direcciones, habla con MIRA, recoge tres cristales, recibe una llave, abre el portal y encuentra la reliquia en las ruinas. Árboles y agua tienen colisión; el progreso se guarda solo y sobrevive al recargar la página."
        >
          <MiniFrame
            make={makeTopDown}
            title="MUNDO_01 // PRADERA LUMIA + RUINAS"
            accent="#5ce1e6"
            withInteract
            topDown
            hints={["WASD / flechas moverse", "E / ESPACIO interactuar", "R borrar partida guardada"]}
            renderHud={(h) => (
              <>
                <Chip icon={MapPin} label="zona" value={String(h.zona ?? "Pradera Lumia")} color="#5ce1e6" />
                <span className="flex gap-1.5">
                  <Chip icon={Gem} label="cristales" value={String(h.cristales ?? "0/3")} color="#4ade80" />
                  <Chip icon={Backpack} label="bolsa" value={String(h.inventario ?? "vacío")} color="#ffd23f" />
                </span>
              </>
            )}
          />
          <>
            {TOPDOWN_LESSONS.map((l: Lesson) => (
              <CodeCard key={l.id} lesson={l} accent="#5ce1e6" />
            ))}
          </>
        </Block>

        {/* ============ BATALLA ATB ============ */}
        <Block
          flip
          num="04·6"
          tag="COMBATE POR TURNOS"
          title="BATALLA ATB: EL COMBATE DE CHRONO TRIGGER"
          blurb="El plato estrella: un combate por turnos de verdad contra el REY SLIME. Barras ATB que se llenan con el tiempo, menú de comandos (atacar, chispa, poción), críticos, daño flotante y un jefe que NO espera a que decidas. Elige con ← →, confirma con E."
        >
          <MiniFrame
            make={makeBattle}
            title="BATALLA_01 // REY SLIME AL ANOCHECER"
            accent="#ffd23f"
            withInteract
            hints={["← → elegir comando", "E / ESPACIO confirmar", "R nueva batalla"]}
            renderHud={(h) => (
              <>
                <Chip icon={Heart} label="pv" value={String(h.pv ?? "40/40")} color="#4ade80" />
                <span className="flex gap-1.5">
                  <Chip icon={Swords} label="jefe" value={String(h.jefe ?? "70/70")} color="#ff5d73" />
                  <Chip icon={Trophy} label="turnos" value={String(h.turnos ?? 0)} color="#ffd23f" />
                </span>
              </>
            )}
          />
          <>
            {BATTLE_LESSONS.map((l: Lesson) => (
              <CodeCard key={l.id} lesson={l} accent="#ffd23f" />
            ))}
          </>
        </Block>
      </div>
    </section>
  );
}
