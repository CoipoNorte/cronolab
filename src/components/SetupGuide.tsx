import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import {
  ArrowLeftCircle,
  Blocks,
  Check,
  CheckCircle2,
  Circle,
  Cpu,
  Download,
  ExternalLink,
  HardDrive,
  Laptop,
  LifeBuoy,
  MonitorPlay,
  Rocket,
  Scale,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { cn } from "../utils/cn";

/* ============================================================
   GUÍA DE INSTALACIÓN — el salto del navegador al motor.
   Dos caminos reales (Unity y Godot) explicados paso a paso,
   con requisitos, errores típicos y el primer proyecto.
   ============================================================ */

type Engine = "unity" | "godot";
const DONE_KEY = "cronolab-setup-progreso";

interface Step {
  title: string;
  body: string;
  detail?: string;
  link?: { label: string; href: string };
  warn?: string;
}

const UNITY_STEPS: Step[] = [
  {
    title: "Descarga Unity Hub",
    body: "Unity Hub es el gestor: desde él instalas versiones del editor y creas proyectos. No descargues el editor suelto.",
    detail: "Pesa unos 150 MB y existe para Windows, macOS y Linux.",
    link: { label: "unity.com/download", href: "https://unity.com/download" },
  },
  {
    title: "Crea tu cuenta y activa la licencia Personal",
    body: "Al abrir el Hub te pedirá iniciar sesión. Elige la licencia Personal: es gratuita mientras no factures grandes cantidades con tus juegos.",
    detail: "Hub → icono de perfil → Manage licenses → Add license → Get a free personal license.",
  },
  {
    title: "Instala una versión LTS del editor",
    body: "En la pestaña Installs pulsa Install Editor y elige la versión marcada como LTS (soporte a largo plazo). Son las versiones estables y con más tutoriales escritos.",
    detail: "Evita las versiones 'Alpha' o 'Beta' mientras aprendes: cambian cosas y los tutoriales dejan de coincidir.",
    warn: "La descarga ronda los 8–12 GB con los módulos básicos. Ten paciencia y espacio libre.",
  },
  {
    title: "Marca los módulos que necesitas",
    body: "Durante la instalación te ofrecerá añadir módulos. Para empezar con 2D te basta con el soporte de tu sistema; añade WebGL Build Support si quieres publicar en web como esta página.",
    detail: "Puedes añadir módulos después: Installs → los tres puntos → Add modules.",
  },
  {
    title: "Crea tu primer proyecto 2D",
    body: "Pestaña Projects → New project → plantilla «2D (Built-In Render Pipeline)» o «2D Core». Ponle nombre y elige una carpeta sin acentos ni espacios raros.",
    detail: "La plantilla 2D ya configura la cámara en ortográfica y los sprites listos para usar.",
  },
  {
    title: "Pega los scripts de CronoLab",
    body: "Descarga el pack de Unity de esta misma web. En el editor: Assets → Create → C# Script con el MISMO nombre del archivo, borra el contenido y pega el nuestro.",
    detail: "Movimiento2D en el jugador, Parallax en los fondos, DialogoNPC en los NPC, QuestManager en un objeto vacío.",
    warn: "El nombre del archivo y el de la clase deben coincidir exactamente o Unity no lo compilará.",
  },
];

const GODOT_STEPS: Step[] = [
  {
    title: "Descarga Godot Engine",
    body: "Godot es un único archivo ejecutable: no hay instalador ni cuenta. Lo descomprimes y ya está funcionando.",
    detail: "Elige la versión estable. Pesa menos de 100 MB y arranca en segundos.",
    link: { label: "godotengine.org/download", href: "https://godotengine.org/download" },
  },
  {
    title: "Elige entre GDScript o C#",
    body: "La descarga estándar usa GDScript, un lenguaje propio parecidísimo a Python. La versión «.NET» añade C#, el mismo lenguaje de Unity.",
    detail: "Si vienes de esta web, GDScript te resultará muy fácil: es el más parecido a leer pseudocódigo.",
  },
  {
    title: "Descomprime y ejecuta",
    body: "No necesita instalación: descomprime el ZIP en una carpeta y haz doble clic en el ejecutable. Puedes llevarlo en un pendrive.",
    detail: "En macOS quizá tengas que permitirlo en Ajustes → Privacidad y seguridad la primera vez.",
  },
  {
    title: "Crea un proyecto 2D",
    body: "Pulsa «Crear» → elige carpeta → renderizador «Compatibility» si tu equipo es modesto. Al abrirse, elige «2D Scene» como nodo raíz.",
    detail: "En Godot todo son nodos en un árbol: la escena es el equivalente a un prefab de Unity.",
  },
  {
    title: "Traduce lo que ya sabes",
    body: "_process(delta) es tu bucle, CharacterBody2D te da el movimiento con colisiones y Area2D es tu zona de evento invisible.",
    detail: "El diccionario de la sección Unity te sirve casi igual: cambian los nombres, no las ideas.",
  },
];

const COMPARE: { topic: string; unity: string; godot: string }[] = [
  { topic: "Precio", unity: "Gratis (licencia Personal)", godot: "Gratis y de código abierto, siempre" },
  { topic: "Tamaño en disco", unity: "8–12 GB con módulos", godot: "Menos de 100 MB" },
  { topic: "Lenguaje", unity: "C#", godot: "GDScript o C#" },
  { topic: "Curva inicial", unity: "Más conceptos de entrada", godot: "Arranca en minutos" },
  { topic: "Comunidad", unity: "Enorme, tutoriales para todo", godot: "Creciendo muy rápido" },
  { topic: "Usado en", unity: "Hollow Knight, Cuphead, Ori", godot: "Brotato, Cassette Beasts, Dome Keeper" },
  { topic: "Mejor para", unity: "Buscar trabajo y proyectos grandes", godot: "Prototipar rápido y equipos pequeños" },
];

const TROUBLE: { q: string; a: string }[] = [
  { q: "La instalación de Unity falla o se queda a medias", a: "Casi siempre es espacio en disco o antivirus. Libera 20 GB, desactiva el antivirus un momento y reintenta desde Unity Hub: reanuda la descarga sin empezar de cero." },
  { q: "Unity abre un proyecto en blanco y no veo nada", a: "Mira la pestaña Scene y pulsa la tecla F con un objeto seleccionado para enfocarlo. Si la cámara está lejísimos, selecciona Main Camera y usa GameObject → Align View to Selected." },
  { q: "Mi script da error y no aparece en el Inspector", a: "El nombre del archivo debe coincidir con el de la clase, sin espacios ni acentos. Revisa la consola: un solo error de compilación bloquea TODOS los scripts del proyecto." },
  { q: "El personaje atraviesa el suelo", a: "Te falta un Collider2D en el suelo o en el jugador, o el Rigidbody2D está en modo Kinematic sin código de colisión. Activa Gizmos para ver las cajas, igual que en el laboratorio de depuración de esta web." },
  { q: "Godot no abre en macOS", a: "Ajustes del Sistema → Privacidad y seguridad → «Abrir de todos modos». Es porque la app no está firmada por Apple, no porque sea peligrosa." },
  { q: "¿Necesito un ordenador potente?", a: "Para 2D no. Con 8 GB de RAM y un disco SSD vas sobrado en Godot y vas bien en Unity. Lo que más se nota es el SSD frente al disco duro clásico." },
];

const FIRST_CODE: Record<Engine, { file: string; lang: string; code: string }> = {
  unity: {
    file: "Assets/Scripts/PrimerMovimiento.cs",
    lang: "csharp",
    code: `using UnityEngine;

public class PrimerMovimiento : MonoBehaviour
{
    public float velocidad = 6f;
    public float salto = 9f;
    Rigidbody2D rb;
    bool enElSuelo;

    void Start() => rb = GetComponent<Rigidbody2D>();

    void Update()   // ← tu bucle de siempre
    {
        float dir = Input.GetAxisRaw("Horizontal");
        rb.linearVelocity = new Vector2(dir * velocidad, rb.linearVelocity.y);

        if (Input.GetKeyDown(KeyCode.Space) && enElSuelo)
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, salto);
    }

    void OnCollisionEnter2D(Collision2D c) => enElSuelo = true;
    void OnCollisionExit2D(Collision2D c) => enElSuelo = false;
}`,
  },
  godot: {
    file: "primer_movimiento.gd",
    lang: "python",
    code: `extends CharacterBody2D

@export var velocidad := 300.0
@export var salto := -420.0
var gravedad := 1200.0

func _physics_process(delta):          # ← tu bucle de siempre
    # 1. gravedad: exactamente lo mismo que hiciste en el navegador
    if not is_on_floor():
        velocity.y += gravedad * delta

    # 2. salto
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = salto

    # 3. movimiento horizontal
    var dir := Input.get_axis("ui_left", "ui_right")
    velocity.x = dir * velocidad

    move_and_slide()                   # Godot resuelve las colisiones`,
  },
};

function loadDone(): string[] {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function SetupGuide() {
  const [engine, setEngine] = useState<Engine>("unity");
  const [done, setDone] = useState<string[]>(() => loadDone());

  const steps = engine === "unity" ? UNITY_STEPS : GODOT_STEPS;
  const code = FIRST_CODE[engine];
  const keyOf = (i: number) => `${engine}-${i}`;
  const completed = steps.filter((_, i) => done.includes(keyOf(i))).length;
  const pct = Math.round((completed / steps.length) * 100);

  const toggle = (i: number) => {
    const key = keyOf(i);
    setDone((prev) => {
      const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
      try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch { /* sin almacenamiento */ }
      return next;
    });
  };

  const accent = engine === "unity" ? "#7c6bff" : "#5ce1e6";

  return (
    <div className="min-h-screen bg-void">
      {/* cabecera */}
      <header className="sticky top-0 z-50 border-b border-line bg-void/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2 font-pixel2 text-sm text-mist transition-colors hover:text-gold">
            <ArrowLeftCircle className="h-4 w-4" />
            volver a CronoLab
          </a>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="font-pixel text-[9px] text-mist">INSTALACIÓN</span>
            <div className="h-2 w-36 overflow-hidden rounded-full border border-line bg-panel">
              <motion.div className="h-full" style={{ background: accent }} animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }} />
            </div>
            <span className="font-pixel text-[9px]" style={{ color: accent }}>{pct}%</span>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden border-b border-line px-4 py-14 sm:px-6">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-viol/40 bg-viol/10 px-4 py-1.5">
            <Blocks className="h-3.5 w-3.5 text-viol" />
            <span className="font-pixel2 text-xs tracking-wide text-viol">EL SIGUIENTE PASO</span>
          </span>
          <h1 className="mt-5 font-pixel text-[clamp(1.2rem,3.6vw,2.3rem)] leading-[1.5] text-snow">
            INSTALA TU <span className="text-gold">MOTOR</span>
            <br />
            <span className="text-outline">UNITY</span> <span className="text-mist">O</span> <span className="text-cyanx">GODOT</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-mist">
            Ya sabes programar un juego: bucle, físicas, colisiones, diálogos, misiones y guardado.
            Un motor no te enseñará nada nuevo sobre eso — <strong className="text-snow">te ahorrará escribirlo a mano</strong>.
            Aquí tienes los dos caminos gratuitos, con requisitos reales, pasos marcables y los errores típicos de la primera vez.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        {/* selector */}
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            { id: "unity" as Engine, name: "Unity", tag: "El estándar de la industria", color: "#7c6bff", icon: Blocks, bullets: ["C#, igual que los scripts de esta web", "Tutoriales para absolutamente todo", "Lo piden en casi todas las ofertas de empleo"] },
            { id: "godot" as Engine, name: "Godot", tag: "Ligero, libre y rapidísimo", color: "#5ce1e6", icon: Rocket, bullets: ["Menos de 100 MB y sin instalador", "GDScript se lee casi como español", "Perfecto para prototipar en una tarde"] },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setEngine(opt.id)}
              className={cn(
                "rounded-2xl border p-5 text-left transition-all",
                engine === opt.id ? "scale-[1.01] border-2 bg-panel2" : "border-line bg-panel hover:border-viol/40",
              )}
              style={engine === opt.id ? { borderColor: opt.color } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-void" style={{ color: opt.color }}>
                    <opt.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-pixel text-[11px] text-snow">{opt.name}</span>
                    <span className="block font-pixel2 text-[11px] text-mist">{opt.tag}</span>
                  </span>
                </span>
                {engine === opt.id && <CheckCircle2 className="h-5 w-5" style={{ color: opt.color }} />}
              </div>
              <ul className="mt-4 space-y-1.5">
                {opt.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-[12.5px] text-mist">
                    <span className="mt-[7px] h-1 w-1 shrink-0" style={{ background: opt.color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-[13px] leading-relaxed text-mist">
          <strong className="text-gold">¿Cuál elijo?</strong> Si dudas, empieza por <strong className="text-cyanx">Godot</strong>:
          se instala en dos minutos y podrás portar tu Crono Jump esta misma tarde. Si tu objetivo es trabajar en estudios
          o seguir tutoriales de YouTube sin traducir nada, ve directo a <strong className="text-viol">Unity</strong>.
          Lo que aprendiste aquí funciona igual en los dos.
        </p>

        {/* pasos */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="mb-4 flex items-center gap-2 font-pixel text-[10px] text-snow">
              <Wrench className="h-4 w-4" style={{ color: accent }} />
              INSTALACIÓN DE {engine === "unity" ? "UNITY" : "GODOT"} · {steps.length} PASOS
            </h2>
            <AnimatePresence mode="wait">
              <motion.ol
                key={engine}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {steps.map((s, i) => {
                  const isDone = done.includes(keyOf(i));
                  return (
                    <li key={s.title} className={cn("rounded-2xl border p-4 transition-colors", isDone ? "border-mint/40 bg-mint/5" : "border-line bg-panel")}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggle(i)} className="mt-0.5 shrink-0" aria-label={isDone ? "Marcar como pendiente" : "Marcar como hecho"}>
                          {isDone ? <CheckCircle2 className="h-5 w-5 text-mint" /> : <Circle className="h-5 w-5 text-mist" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <h3 className={cn("font-pixel2 text-[15px]", isDone ? "text-mint line-through decoration-mint/40" : "text-snow")}>
                            <span className="mr-2 font-pixel text-[9px]" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                            {s.title}
                          </h3>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-mist">{s.body}</p>
                          {s.detail && <p className="mt-2 rounded-lg border border-line bg-void/50 p-2.5 font-mono text-[11px] leading-relaxed text-mist/90">{s.detail}</p>}
                          {s.warn && (
                            <p className="mt-2 flex gap-2 rounded-lg border border-gold/30 bg-gold/5 p-2.5 text-[12px] leading-relaxed text-snow/85">
                              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                              {s.warn}
                            </p>
                          )}
                          {s.link && (
                            <a
                              href={s.link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="arcade-btn mt-3 inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-pixel text-[8px] text-black"
                              style={{ background: accent }}
                            >
                              <Download className="h-3.5 w-3.5" />
                              {s.link.label}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </motion.ol>
            </AnimatePresence>
          </div>

          {/* lateral: requisitos + primer código */}
          <aside className="space-y-5 lg:col-span-5">
            <div className="rounded-2xl border border-line bg-panel p-5">
              <h3 className="flex items-center gap-2 font-pixel text-[9px] text-snow">
                <Laptop className="h-4 w-4 text-gold" /> ¿ME VA A FUNCIONAR?
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  [Cpu, "Procesador", "Cualquiera de los últimos 8 años sirve para 2D"],
                  [HardDrive, "Disco", engine === "unity" ? "20 GB libres y, a ser posible, SSD" : "200 MB libres: cabe en cualquier sitio"],
                  [MonitorPlay, "Memoria", engine === "unity" ? "8 GB de RAM recomendados" : "4 GB bastan de sobra"],
                ].map(([Icon, title, text]) => {
                  const C = Icon as typeof Cpu;
                  return (
                    <div key={String(title)} className="flex gap-3 rounded-xl border border-line bg-void/40 p-3">
                      <C className="mt-0.5 h-4 w-4 shrink-0 text-cyanx" />
                      <div>
                        <p className="font-pixel2 text-[12px] text-snow">{String(title)}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-mist">{String(text)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-[#0d1126]">
              <div className="flex items-center justify-between border-b border-line bg-panel2/80 px-4 py-2.5">
                <span className="flex items-center gap-2 font-mono text-[11px] text-mist">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
                  {code.file}
                </span>
                <span className="font-pixel text-[7px] text-mist/60">TU PRIMER SCRIPT</span>
              </div>
              <div className="code-scroll code-block overflow-x-auto py-3">
                <Highlight theme={themes.nightOwl} code={code.code} language={code.lang}>
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
              <p className="border-t border-line bg-panel px-4 py-3 text-[12px] leading-relaxed text-mist">
                Es el <strong className="text-snow">mismo salto del paso 3</strong> de tu tutorial. Cambia el idioma, no la idea:
                leer entrada, cambiar velocidad y comprobar el suelo.
              </p>
            </div>
          </aside>
        </div>

        {/* comparativa */}
        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="flex items-center gap-2 border-b border-line bg-panel2 px-5 py-3">
            <Scale className="h-4 w-4 text-gold" />
            <h2 className="font-pixel text-[10px] text-snow">UNITY FRENTE A GODOT</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-void/40">
                  <th className="px-5 py-3 font-pixel2 text-[11px] text-mist">Aspecto</th>
                  <th className="px-5 py-3 font-pixel2 text-[11px] text-viol">Unity</th>
                  <th className="px-5 py-3 font-pixel2 text-[11px] text-cyanx">Godot</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.topic} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3 font-pixel2 text-[12px] text-snow">{row.topic}</td>
                    <td className="px-5 py-3 text-[12.5px] text-mist">{row.unity}</td>
                    <td className="px-5 py-3 text-[12.5px] text-mist">{row.godot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* problemas frecuentes */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-pixel text-[10px] text-snow">
            <LifeBuoy className="h-4 w-4 text-rose" /> CUANDO ALGO FALLA
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {TROUBLE.map((item) => (
              <div key={item.q} className="rounded-2xl border border-line bg-panel p-4">
                <h3 className="flex gap-2 font-pixel2 text-[13px] text-snow">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {item.q}
                </h3>
                <p className="mt-2 pl-6 text-[12.5px] leading-relaxed text-mist">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* cierre */}
        <div className="pixel-corners rounded-2xl border border-mint/35 bg-gradient-to-br from-mint/10 via-panel to-panel p-6 [--pc:#4ade80] sm:p-8">
          <h2 className="flex items-center gap-2 font-pixel text-[11px] text-mint">
            <Check className="h-4.5 w-4.5" /> ¿YA LO TIENES INSTALADO?
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mist">
            Tu primer ejercicio real: <strong className="text-snow">reconstruye Crono Jump en tu motor nuevo</strong>.
            Ya conoces las catorce piezas — movimiento, salto, colisiones, monedas, meteoritos, enemigos, power-ups,
            checkpoints, pausa, niveles y récord. Ahora solo cambias de idioma.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#/tutorial" className="arcade-btn flex items-center gap-2 rounded-md bg-gold px-5 py-3 font-pixel text-[9px] text-black">
              <Rocket className="h-3.5 w-3.5" /> REPASAR LOS 14 PASOS
            </a>
            <a href={engine === "unity" ? "#unity-zips" : "#godot-zips"} className="arcade-btn flex items-center gap-2 rounded-md border-2 border-viol bg-panel px-5 py-2.5 font-pixel text-[9px] text-snow">
              <Download className="h-3.5 w-3.5 text-viol" /> {engine === "unity" ? "DESCARGAR ZIPS DE UNITY" : "DESCARGAR ZIPS DE GODOT"}
            </a>
            <a href="#unity" className="arcade-btn flex items-center gap-2 rounded-md border-2 border-cyanx bg-panel px-5 py-2.5 font-pixel text-[9px] text-snow">
              <Blocks className="h-3.5 w-3.5 text-cyanx" /> VER EL DICCIONARIO WEB ↔ UNITY
            </a>
          </div>
        </div>
      </div>

      <footer className="border-t border-line bg-ink px-4 py-10 text-center sm:px-6">
        <p className="font-pixel2 text-sm text-mist">
          Un motor no te hace mejor programador. Lo que ya aprendiste, sí.
        </p>
        <a href="#top" className="mt-4 inline-flex items-center gap-2 font-pixel text-[9px] text-gold hover:underline">
          <ArrowLeftCircle className="h-3.5 w-3.5" /> VOLVER A CRONOLAB
        </a>
      </footer>
    </div>
  );
}
