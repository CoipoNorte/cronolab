import { useState } from "react";
import { motion } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import {
  Globe,
  GitBranch,
  Terminal,
  MousePointerClick,
  Rocket,
  Copy,
  Check,
  FolderGit2,
  CircleAlert,
  Share2,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import { cn } from "../utils/cn";

/* ============================================================
   PUBLICA TU JUEGO — el último paso que nadie enseña:
   que lo que hiciste tenga una dirección web propia.
   ============================================================ */

const REPO = "https://github.com/CoipoNorte/cronolab";
const SITE = "https://coiponorte.github.io/cronolab/";

type Mode = "facil" | "terminal" | "auto";

const MODES: { id: Mode; label: string; icon: typeof Terminal; desc: string }[] = [
  { id: "facil", label: "Doble clic", icon: MousePointerClick, desc: "Windows, sin tocar la terminal" },
  { id: "terminal", label: "Terminal", icon: Terminal, desc: "cualquier sistema operativo" },
  { id: "auto", label: "Automático", icon: GitBranch, desc: "se publica solo en cada push" },
];

const SNIPPETS: Record<Mode, { file: string; lang: string; code: string }> = {
  facil: {
    file: "explorador de archivos",
    lang: "bash",
    code: `1. Haz doble clic en  cronolab.bat
2. Elige la opción  [7] TODO: subir + publicar
3. Escribe un mensaje (o pulsa ENTER)
4. Espera a que ponga "PUBLICADO CORRECTAMENTE"

# ¿Primera vez en este ordenador?
# Ejecuta antes:  scripts\\setup.bat
# Comprueba Node.js y git, instala todo
# y deja el proyecto listo para trabajar.`,
  },
  terminal: {
    file: "terminal",
    lang: "bash",
    code: `# 1. Clona el proyecto (solo la primera vez)
git clone ${REPO}.git
cd cronolab
npm install

# 2. Trabaja con recarga automática
npm run dev          # http://localhost:5173

# 3. Publica: subir a main + compilar + desplegar
npm run ship "añadí un enemigo nuevo"

# ...o paso a paso, si prefieres control total:
npm run push "añadí un enemigo nuevo"   # solo git
npm run build                            # solo compilar
npm run deploy                           # solo publicar`,
  },
  auto: {
    file: ".github/workflows/deploy.yml",
    lang: "yaml",
    code: `name: Desplegar CronoLab en GitHub Pages

on:
  push:
    branches: [main]      # cada push a main dispara esto
  workflow_dispatch:      # ...y también el botón manual

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4`,
  },
};

const CHECKS = [
  {
    icon: FolderGit2,
    title: "1. Sube el código",
    body: "Crea el repositorio en GitHub y haz tu primer push a la rama main. Es tu copia de seguridad y tu historial de cambios.",
  },
  {
    icon: Globe,
    title: "2. Activa GitHub Pages",
    body: "En Settings → Pages elige «GitHub Actions» (automático) o la rama gh-pages (manual). Es gratis y no necesitas servidor.",
  },
  {
    icon: Rocket,
    title: "3. Comparte el enlace",
    body: "Tu juego vive en una URL pública. Pásasela a quien quieras: se abre en el móvil, en clase o en casa de tu amigo.",
  },
];

export default function Publish() {
  const [mode, setMode] = useState<Mode>("facil");
  const [copied, setCopied] = useState(false);
  const snippet = SNIPPETS[mode];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* sin portapapeles */ }
  };

  return (
    <section id="publicar" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="07"
          eyebrow="EL PASO QUE NADIE ENSEÑA"
          title="PUBLICA TU JUEGO"
          accent="EN INTERNET, GRATIS"
          blurb="Un juego que solo existe en tu carpeta de Descargas no se lo puedes enseñar a nadie. Aquí tienes las tres formas de poner el tuyo online con una dirección web propia — la misma receta con la que está publicada esta página."
          icon={Globe}
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* --------- selector de método + código --------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-all",
                    mode === m.id
                      ? "border-gold/60 bg-panel2 shadow-[0_0_26px_-12px_rgba(255,210,63,.5)]"
                      : "border-line bg-panel hover:border-viol/50",
                  )}
                >
                  <m.icon className={cn("h-4 w-4", mode === m.id ? "text-gold" : "text-mist")} />
                  <span>
                    <span className={cn("block font-pixel2 text-[13px]", mode === m.id ? "text-snow" : "text-mist")}>
                      {m.label}
                    </span>
                    <span className="block text-[10px] text-mist/60">{m.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-[#0d1126]">
              <div className="flex items-center justify-between border-b border-line bg-panel2/80 px-4 py-2.5">
                <span className="flex items-center gap-2 font-mono text-[11px] text-mist">
                  <span className="h-2 w-2 rounded-full bg-mint/70" />
                  {snippet.file}
                </span>
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[10px] text-mist transition-colors hover:border-gold hover:text-gold"
                >
                  {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                  {copied ? "¡copiado!" : "copiar"}
                </button>
              </div>
              <div className="code-scroll code-block overflow-x-auto py-4">
                <Highlight theme={themes.nightOwl} code={snippet.code} language={snippet.lang}>
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

            <p className="mt-4 flex gap-2.5 rounded-xl border border-cyanx/30 bg-cyanx/5 p-4 text-[13px] leading-relaxed text-mist">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-cyanx" />
              <span>
                <strong className="text-cyanx">Por qué funciona sin configurar nada:</strong> al compilar, todo
                (JavaScript, estilos e imágenes) queda incrustado dentro de un único <code className="font-mono text-snow">index.html</code>.
                Como no pide archivos externos, se puede alojar en cualquier carpeta de cualquier servidor
                — o enviarse por correo y abrirse sin internet.
              </span>
            </p>
          </motion.div>

          {/* --------- los tres pasos + enlaces --------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex flex-col gap-4 lg:col-span-5"
          >
            {CHECKS.map((c) => (
              <div key={c.title} className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="flex items-center gap-2.5 font-pixel2 text-[15px] text-snow">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-void text-cyanx">
                    <c.icon className="h-4 w-4" />
                  </span>
                  {c.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-mist">{c.body}</p>
              </div>
            ))}

            <div className="pixel-corners rounded-2xl border border-gold/35 bg-gradient-to-br from-gold/10 via-panel to-panel p-5 [--pc:#ffd23f]">
              <h3 className="flex items-center gap-2 font-pixel text-[9px] text-gold">
                <Share2 className="h-4 w-4" />
                ESTA WEB, EN VIVO
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-mist">
                CronoLab se publica con estos mismos scripts. El repositorio es público: cópialo,
                rómpelo y haz tu versión.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arcade-btn flex items-center justify-center gap-2 rounded-md bg-panel2 px-4 py-3 font-pixel text-[8px] text-snow"
                >
                  <FolderGit2 className="h-3.5 w-3.5" />
                  VER EL CÓDIGO EN GITHUB
                </a>
                <a
                  href={SITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arcade-btn flex items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 font-pixel text-[8px] text-black"
                >
                  <Globe className="h-3.5 w-3.5" />
                  ABRIR LA WEB PUBLICADA
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --------- tabla de comandos --------- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-8 overflow-hidden rounded-2xl border border-line bg-panel"
        >
          <div className="border-b border-line bg-panel2 px-5 py-3">
            <h3 className="flex items-center gap-2 font-pixel text-[9px] text-snow">
              <Terminal className="h-4 w-4 text-mint" />
              CHULETA DE COMANDOS
            </h3>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["npm run dev", "desarrollar con recarga automática", "#5ce1e6"],
              ["npm run build", "compilar en un solo index.html", "#5ce1e6"],
              ["npm run serve", "previsualizar lo compilado", "#5ce1e6"],
              ["npm run push", "commit + push seguro a main", "#4ade80"],
              ["npm run deploy", "publicar en la rama gh-pages", "#ffd23f"],
              ["npm run ship", "push + build + deploy, todo junto", "#ff5d73"],
            ].map(([cmd, desc, color]) => (
              <div key={cmd} className="bg-panel p-4">
                <code className="font-mono text-[12px] font-semibold" style={{ color }}>{cmd}</code>
                <p className="mt-1 text-[12px] leading-relaxed text-mist">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
