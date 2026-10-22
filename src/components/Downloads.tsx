import { useState } from "react";
import JSZip from "jszip";
import { motion } from "framer-motion";
import {
  Download,
  Package,
  FileCode2,
  Braces,
  ExternalLink,
  Check,
  Loader2,
  FolderDown,
  Gamepad2,
  Paintbrush,
  Hammer,
  Blocks,
  Route,
  Boxes,
  ScrollText,
  SlidersHorizontal,
  Rocket,
  Swords,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import { SNIPPETS } from "../game/codeSnippets";
import { MECH_DEMOS } from "../game/mechanics";
import { NARRATIVE_LESSONS, DEBUG_LESSONS } from "../game/systemsSnippets";
import { TUTORIAL_STEPS } from "../game/tutorialSteps";
import { PRODUCTION_LESSONS } from "../game/productionSnippets";
import { ADVANCED_LESSONS } from "../game/advancedSnippets";
import { COMBAT_LESSONS } from "../game/combatSnippets";
import { buildCronoJumpUnityProject, buildUnityProductionPack, buildUnityRpgPack } from "../game/unityPacks";
import { buildCronoJumpGodotProject, buildGodotProductionPack, buildGodotRpgPack } from "../game/godotPacks";
import { buildStandaloneGame } from "../game/standalone";
import {
  SPRITE_LESSONS,
  PLATFORM_LESSONS,
  LEVEL_EDITOR_LESSONS,
  DIALOGUE_LESSONS,
  ARENA_LESSONS,
  TOPDOWN_LESSONS,
  BATTLE_LESSONS,
  UNITY_LESSONS,
} from "../game/moreSnippets";

/* los archivos REALES que corren esta web, como texto (Vite ?raw) */
import engineRaw from "../game/engine.ts?raw";
import spritesRaw from "../game/sprites.ts?raw";
import minisRaw from "../game/minis.ts?raw";
import battleRaw from "../game/battle.ts?raw";
import topdownRaw from "../game/topdown.ts?raw";
import mechanicsRaw from "../game/mechanics.ts?raw";
import narrativeRaw from "../game/narrative.ts?raw";
import debugWorldRaw from "../game/debugWorld.ts?raw";
import tutorialRaw from "../game/tutorial.ts?raw";
import productionRaw from "../game/production.ts?raw";
import standaloneRaw from "../game/standalone.ts?raw";
import unityPacksRaw from "../game/unityPacks.ts?raw";
import godotPacksRaw from "../game/godotPacks.ts?raw";
import advancedSystemsRaw from "../game/advancedSystems.ts?raw";
import combatSystemsRaw from "../game/combatSystems.ts?raw";
import combatPacksRaw from "../game/combatPacks.ts?raw";
import { buildGodotCombatPack, buildUnityCombatPack } from "../game/combatPacks";

/* ---------------- utilidades de descarga ---------------- */

function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function saveZip(name: string, files: { path: string; content: string }[]) {
  const zip = new JSZip();
  for (const f of files) zip.file(f.path, f.content);
  const blob = await zip.generateAsync({ type: "blob" });
  saveBlob(name, blob);
}

const README_WEB = `CRONOLAB — CÓDIGO FUENTE DE LA WEB
==================================

Estos archivos son LITERALMENTE el código que corre los juegos
de la página donde descargaste esto. Sin magia, sin build secreto.

  src/game/engine.ts   → el juego principal (bucle, físicas, parallax,
                         colisiones, partículas y sonido 8-bit)
  src/game/sprites.ts  → todos los sprites como arrays de strings
  src/game/minis.ts    → plataformas por tilemap, NPCs con diálogos
                         y arena de evasión
  src/game/battle.ts   → batalla ATB, comandos, PM y jefe
  src/game/topdown.ts  → mundo cenital, misión, inventario y guardado
  src/game/mechanics.ts→ trece micro-demos de game feel
  src/game/narrative.ts→ grafo de diálogo, condiciones y validación
  src/game/debugWorld.ts → escena con hitboxes, eventos y breakpoints
  src/game/tutorial.ts → motor progresivo de los 14 pasos
  src/game/production.ts → audio, saves, logros, idiomas y accesibilidad
  src/game/unityPacks.ts → genera los tres ZIP de Unity
  src/game/godotPacks.ts → genera los tres ZIP de Godot
  src/game/advancedSystems.ts → procedural, input, crafting y replay
  src/game/combatSystems.ts → daño, estados, fases, simulación y botín
  src/game/combatPacks.ts → packs de combate Unity y Godot
  crono-jump.html      → el juego completo, listo para doble clic

CÓMO LEERLO (ruta sugerida):
  1. birds-eye: abre engine.ts y busca "update" y "draw".
  2. Sigue una variable concreta (por ejemplo heroe.vy) y mira
     quién la escribe y quién la lee.
  3. Cambia UN número, ejecuta, y mira qué se rompe.
     Eso ES programar videojuegos: romper con estilo.

Para ejecutarlo en local necesitas el proyecto completo de la web
(React + Vite). Si solo quieres jugar con las ideas, copia las
funciones a un archivo nuevo y experimenta: son TypeScript casi
plano.
`;

const README_UNITY = `CRONOLAB — SCRIPTS PARA UNITY (C#)
=================================

Seis scripts mínimos que replican lo que aprendiste en la web.
Están pensados para pegarse TAL CUAL en un proyecto 2D nuevo
de Unity 6 (o 2022 LTS), cada uno en un GameObject distinto:

  Movimiento2D.cs  → en tu Player (con Rigidbody2D + collider)
  Parallax.cs      → en cada capa de fondo (arrastra la cámara)
  DialogoNPC.cs    → en el NPC (con BoxCollider2D "Is Trigger")
  Pisoton.cs       → en tu Player (los enemigos con tag "Enemigo")
  QuestManager.cs  → en un GameObject vacío llamado "Sistemas"
  SaveSystem.cs    → clase estática; no necesita GameObject

PUESTA EN MARCHA RÁPIDA:
  1. Instala Unity Hub (enlace en esta misma página).
  2. Crea proyecto 2D (URP no es necesario: "2D Core").
  3. Assets → Create → C# Script con el MISMO nombre del archivo.
  4. Borra el contenido generado y pega el nuestro.
  5. Etiqueta el suelo como "Suelo" y a los enemigos "Enemigo"
     (ventana Inspector → Tag → Add Tag).

BONUS: el editor de niveles de la web exporta tu nivel como JSON;
en Unity puedes leer ese JSON con JsonUtility y colocar prefabs
de tiles. Datos fuera, datos dentro.

Los scripts que dependen de un gestor (GestorDialogos, Vida)
traen comentarios para que escribas ese gestor tú: es tu
primera misión secundaria de verdad.
`;

function buildWebSourceFiles() {
  return [
    { path: "cronolab-web/README.txt", content: README_WEB },
    { path: "cronolab-web/src/game/engine.ts", content: engineRaw },
    { path: "cronolab-web/src/game/sprites.ts", content: spritesRaw },
    { path: "cronolab-web/src/game/minis.ts", content: minisRaw },
    { path: "cronolab-web/src/game/battle.ts", content: battleRaw },
    { path: "cronolab-web/src/game/topdown.ts", content: topdownRaw },
    { path: "cronolab-web/src/game/mechanics.ts", content: mechanicsRaw },
    { path: "cronolab-web/src/game/narrative.ts", content: narrativeRaw },
    { path: "cronolab-web/src/game/debugWorld.ts", content: debugWorldRaw },
    { path: "cronolab-web/src/game/tutorial.ts", content: tutorialRaw },
    { path: "cronolab-web/src/game/production.ts", content: productionRaw },
    { path: "cronolab-web/src/game/standalone.ts", content: standaloneRaw },
    { path: "cronolab-web/src/game/unityPacks.ts", content: unityPacksRaw },
    { path: "cronolab-web/src/game/godotPacks.ts", content: godotPacksRaw },
    { path: "cronolab-web/src/game/advancedSystems.ts", content: advancedSystemsRaw },
    { path: "cronolab-web/src/game/combatSystems.ts", content: combatSystemsRaw },
    { path: "cronolab-web/src/game/combatPacks.ts", content: combatPacksRaw },
    { path: "cronolab-web/crono-jump.html", content: buildStandaloneGame() },
  ];
}

function buildUnityFiles() {
  return [
    { path: "cronolab-unity/README.txt", content: README_UNITY },
    ...UNITY_LESSONS.map((l) => ({
      path: "cronolab-unity/Assets/Scripts/" + l.file.split("/").pop()!,
      content: `// CRONOLAB → Unity\n// lección: ${l.title}\n\n${l.code}\n`,
    })),
  ];
}

function buildLessonFiles() {
  const groups: [string, { id: string; title: string; code: string; file: string }[]][] = [
    ["01-juego-principal", SNIPPETS],
    ["02-editor-de-sprites", SPRITE_LESSONS],
    ["03-plataformas-tilemap", PLATFORM_LESSONS],
    ["04-editor-de-niveles", LEVEL_EDITOR_LESSONS],
    ["05-dialogos-y-eventos", DIALOGUE_LESSONS],
    ["06-arena-de-evasion", ARENA_LESSONS],
    ["07-aventura-cenital", TOPDOWN_LESSONS],
    ["08-batalla-atb", BATTLE_LESSONS],
    ["09-mecanicas-game-feel", MECH_DEMOS.map((m) => ({ id: m.id, title: m.title, code: m.code, file: "src/juego/mecanicas/" + m.id + ".ts" }))],
    ["10-proyecto-crono-jump", TUTORIAL_STEPS.map((st) => ({ id: st.id, title: `Paso ${st.n}: ${st.title}`, code: st.code, file: `src/juego/crono-jump/paso-${String(st.n).padStart(2, "0")}.js` }))],
    ["11-narrativa-ramificada", NARRATIVE_LESSONS],
    ["12-depuracion", DEBUG_LESSONS],
    ["13-sistemas-produccion", PRODUCTION_LESSONS],
    ["14-sistemas-avanzados", ADVANCED_LESSONS],
    ["15-combate-balance", COMBAT_LESSONS],
    ["16-puente-unity", UNITY_LESSONS],
  ];
  const files: { path: string; content: string }[] = [];
  for (const [dir, lessons] of groups) {
    lessons.forEach((l, i) => {
      const ext = l.file.endsWith(".cs") ? ".cs" : ".ts";
      files.push({
        path: `cronolab-lecciones/${dir}/${String(i + 1).padStart(2, "0")}-${l.id}${ext}`,
        content: `// CRONOLAB · lección: ${l.title}\n// archivo original: ${l.file}\n\n${l.code}\n`,
      });
    });
  }
  return files;
}

/* ---------------- tarjeta de pack ---------------- */

interface PackProps {
  icon: typeof Package;
  color: string;
  title: string;
  desc: string;
  zipName: string;
  build: () => { path: string; content: string }[];
  filesLabel: string;
}

function PackCard({ icon: Icon, color, title, desc, zipName, build, filesLabel }: PackProps) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const download = async () => {
    setState("busy");
    try {
      // pequeño respiro para que la UI respire
      await new Promise((r) => setTimeout(r, 150));
      await saveZip(zipName, build());
      setState("done");
      setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("idle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-panel p-6 transition-colors hover:border-viol/50"
    >
      <div
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-opacity opacity-20 group-hover:opacity-40"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-void"
          style={{ color }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-[10px] text-mist/60">{filesLabel}</span>
      </div>
      <h3 className="mt-4 font-pixel2 text-lg text-snow">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{desc}</p>
      <button
        onClick={download}
        disabled={state === "busy"}
        className="arcade-btn mt-5 inline-flex w-fit items-center gap-2.5 rounded-md px-5 py-3 font-pixel text-[9px] text-black disabled:opacity-60"
        style={{ background: state === "done" ? "#4ade80" : color }}
      >
        {state === "busy" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state === "done" ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {state === "busy" ? "EMPAQUETANDO..." : state === "done" ? "¡DESCARGADO!" : "DESCARGAR .ZIP"}
      </button>
    </motion.div>
  );
}

/* ---------------- enlace externo ---------------- */

function LinkCard(props: { title: string; desc: string; href: string; badge: string }) {
  return (
    <motion.a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col rounded-2xl border border-line bg-panel p-5 transition-all hover:border-gold/60 hover:bg-panel2"
    >
      <div className="flex items-center justify-between">
        <span className="font-pixel text-[9px] text-gold">{props.badge}</span>
        <ExternalLink className="h-4 w-4 text-mist transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
      </div>
      <h4 className="mt-3 font-pixel2 text-base text-snow">{props.title}</h4>
      <p className="mt-1.5 text-[13px] leading-relaxed text-mist">{props.desc}</p>
    </motion.a>
  );
}

/* ---------------- sección completa ---------------- */

const STEPS = [
  { icon: Gamepad2, label: "JUEGA", href: "#juego" },
  { icon: Paintbrush, label: "PINTA", href: "#sprites" },
  { icon: Hammer, label: "CREA NIVELES", href: "#ejemplos" },
  { icon: FolderDown, label: "DESCARGA", href: "#descargas" },
  { icon: Blocks, label: "SALTA A UNITY", href: "#unity" },
];

export default function Downloads() {
  return (
    <section id="descargas" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="12"
          eyebrow="LLÉVATELO TODO"
          title="CENTRO DE"
          accent="DESCARGAS"
          blurb="Los .zip se generan aquí mismo, en tu navegador, con el código REAL que está corriendo esta página: nada de enlaces muertos ni repos de hace 3 años. Y para la gran aventura, los enlaces oficiales a Unity."
          icon={FolderDown}
        />

        {/* ruta de aprendizaje */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 overflow-x-auto rounded-2xl border border-line bg-panel p-4"
        >
          <div className="flex min-w-max items-center gap-2">
            <span className="mr-2 flex items-center gap-2 font-pixel text-[8px] text-mist/60">
              <Route className="h-3.5 w-3.5 text-gold" /> RUTA SUGERIDA
            </span>
            {STEPS.map((s, i) => (
              <span key={s.label} className="flex items-center gap-2">
                <a
                  href={s.href}
                  className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3.5 py-2 transition-colors hover:border-gold"
                >
                  <span className="font-pixel text-[8px] text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <s.icon className="h-3.5 w-3.5 text-cyanx" />
                  <span className="font-pixel2 text-[10px] text-snow">{s.label}</span>
                </a>
                {i < STEPS.length - 1 && <span className="font-pixel2 text-mist/50">→</span>}
              </span>
            ))}
          </div>
        </motion.div>

        {/* proyectos y packs Unity */}
        <div id="unity-zips" className="mb-5 scroll-mt-24 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-viol/40 bg-viol/10 text-viol"><Blocks className="h-4 w-4" /></span>
          <div>
            <h3 className="font-pixel text-[10px] text-snow">ZIPS PARA UNITY 6</h3>
            <p className="mt-1 text-[12px] text-mist">Proyecto completo y dos packs reutilizables. Se generan aquí mismo, sin enlaces externos.</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <PackCard
            icon={Gamepad2}
            color="#4ade80"
            title="Crono Jump · Proyecto completo"
            desc="Proyecto Unity 6.3 LTS listo para abrir. Genera automáticamente escena, jugador, plataformas, monedas, slimes, meteoritos, checkpoints, tres niveles, HUD y récord."
            zipName="cronolab-crono-jump-unity.zip"
            build={buildCronoJumpUnityProject}
            filesLabel="proyecto Unity completo"
          />
          <PackCard
            icon={ScrollText}
            color="#7c6bff"
            title="Pack RPG para Unity"
            desc="Carpeta Assets con diálogo desde JSON, condiciones, efectos, QuestManager, inventario, tres ranuras, migración y portales entre escenas."
            zipName="cronolab-unity-rpg-pack.zip"
            build={buildUnityRpgPack}
            filesLabel="5 scripts + ejemplo JSON"
          />
          <PackCard
            icon={SlidersHorizontal}
            color="#ff7ad9"
            title="Pack de producción Unity"
            desc="Audio por canales, logros por eventos, localización con variables, accesibilidad y SaveSlots JSON para incorporar a cualquier proyecto."
            zipName="cronolab-unity-production-pack.zip"
            build={buildUnityProductionPack}
            filesLabel="5 sistemas C#"
          />
          <PackCard
            icon={Swords}
            color="#ff7847"
            title="Pack de combate Unity"
            desc="Fórmula de daño y elementos, estados apilables, fases de jefe y tabla de botín ponderada como ScriptableObject."
            zipName="cronolab-unity-combat-pack.zip"
            build={buildUnityCombatPack}
            filesLabel="4 sistemas C#"
          />
        </div>

        {/* proyectos y packs Godot */}
        <div id="godot-zips" className="mb-5 mt-10 scroll-mt-24 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyanx/40 bg-cyanx/10 text-cyanx"><Rocket className="h-4 w-4" /></span>
          <div>
            <h3 className="font-pixel text-[10px] text-snow">ZIPS PARA GODOT 4</h3>
            <p className="mt-1 text-[12px] text-mist">Proyecto completo en GDScript y dos addons que puedes copiar a cualquier proyecto.</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <PackCard
            icon={Gamepad2}
            color="#5ce1e6"
            title="Crono Jump · Proyecto Godot"
            desc="Proyecto Godot 4 listo para importar y pulsar Play: CharacterBody2D, plataformas, monedas, slimes, meteoritos, checkpoints, tres niveles, HUD y récord."
            zipName="cronolab-crono-jump-godot.zip"
            build={buildCronoJumpGodotProject}
            filesLabel="proyecto Godot completo"
          />
          <PackCard
            icon={ScrollText}
            color="#7ec8f2"
            title="Pack RPG para Godot"
            desc="Addon con diálogo JSON ramificado, condiciones, efectos, señales, QuestManager, inventario, tres ranuras y portales de escena."
            zipName="cronolab-godot-rpg-pack.zip"
            build={buildGodotRpgPack}
            filesLabel="5 scripts + ejemplo JSON"
          />
          <PackCard
            icon={SlidersHorizontal}
            color="#4ade80"
            title="Pack de producción Godot"
            desc="AudioServer por buses, logros con señales, idiomas y fallback, accesibilidad y SaveSlots JSON para usar como Autoloads."
            zipName="cronolab-godot-production-pack.zip"
            build={buildGodotProductionPack}
            filesLabel="5 sistemas GDScript"
          />
          <PackCard
            icon={Swords}
            color="#ff7847"
            title="Pack de combate Godot"
            desc="DamageCalculator, estados por turnos, fases de jefe y Resource de botín ponderado listos para addons/cronolab_combat."
            zipName="cronolab-godot-combat-pack.zip"
            build={buildGodotCombatPack}
            filesLabel="4 sistemas GDScript"
          />
        </div>

        {/* packs generales */}
        <div className="mb-5 mt-10 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyanx/40 bg-cyanx/10 text-cyanx"><Boxes className="h-4 w-4" /></span>
          <div>
            <h3 className="font-pixel text-[10px] text-snow">CÓDIGO Y LECCIONES</h3>
            <p className="mt-1 text-[12px] text-mist">Fuentes de la web, scripts C# individuales y todas las lecciones por tema.</p>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <PackCard
            icon={Braces}
            color="#5ce1e6"
            title="El código de ESTA web"
            desc="Motores reales, generador del juego autónomo y generadores de los seis ZIP para Unity y Godot. Todo el código que alimenta las demos y descargas."
            zipName="cronolab-codigo-fuente.zip"
            build={buildWebSourceFiles}
            filesLabel="16 .ts + 1 .html + README"
          />
          <PackCard
            icon={FileCode2}
            color="#7c6bff"
            title="Scripts C# para Unity"
            desc="Los 6 scripts de Unity: movimiento, parallax, diálogos, pisotón, QuestManager y SaveSystem; listos para Assets/Scripts con guía de puesta en marcha."
            zipName="cronolab-scripts-unity.zip"
            build={buildUnityFiles}
            filesLabel="6 archivos .cs + README"
          />
          <PackCard
            icon={Package}
            color="#ffd23f"
            title="Las 73 lecciones sueltas"
            desc="Cada fragmento independiente: físicas, ATB, mecánicas, narrativa, producción, procedural, crafting, replay, combate, botín y motores."
            zipName="cronolab-lecciones.zip"
            build={buildLessonFiles}
            filesLabel="73 archivos en 16 carpetas"
          />
        </div>

        {/* enlaces oficiales */}
        <div className="mt-10">
          <h3 className="mb-4 flex items-center gap-2 font-pixel text-[10px] text-snow">
            <Blocks className="h-4 w-4 text-viol" />
            EL SIGUIENTE PASO DE VERDAD
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LinkCard
              badge="OFICIAL · GRATIS"
              title="Unity Hub"
              desc="El gestor que instala el editor de Unity y tus proyectos. Unity Personal no cuesta nada. Empieza aquí."
              href="https://unity.com/download"
            />
            <LinkCard
              badge="TUTORIALES OFICIALES"
              title="Unity Learn"
              desc="La escuela gratuita de Unity: rutas guiadas para principiantes, con proyectos 2D que ya entenderás gracias a esta web."
              href="https://learn.unity.com/"
            />
            <LinkCard
              badge="EDITOR DE CÓDIGO"
              title="Visual Studio Code"
              desc="El editor gratuito donde escribirás tus C# (y donde vive este proyecto). Con la extensión oficial de Unity."
              href="https://code.visualstudio.com/"
            />
            <LinkCard
              badge="MISMO VOCABULARIO"
              title="Godot Engine (bonus)"
              desc="Motor libre y ligero. El diccionario de la sección Unity se traduce casi igual: ¡otro dialecto del mismo idioma!"
              href="https://godotengine.org/download"
            />
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-4 text-[13px] leading-relaxed text-mist"
        >
          <strong className="text-gold">Recordatorio:</strong> tu nivel del editor y tus sprites pintados se guardan
          en tu navegador (localStorage). ¿Quieres conservarlos para siempre? Usa sus botones «copiar como código»
          y guárdalos en un archivo, o píntalos de nuevo en tu proyecto Unity como sprites reales.
        </motion.p>
      </div>
    </section>
  );
}
