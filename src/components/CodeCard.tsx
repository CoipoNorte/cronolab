import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Copy, Check, Lightbulb, CirclePlay } from "lucide-react";
import type { Lesson } from "../game/moreSnippets";

/** Tarjeta compacta de lección de código (para los bloques de ejemplos y Unity) */
export default function CodeCard({ lesson, accent = "#5ce1e6" }: { lesson: Lesson; accent?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lesson.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* sin portapapeles */ }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0d1126]">
      <div className="flex items-center justify-between border-b border-line bg-panel2/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-void"
            style={{ color: accent }}
          >
            <lesson.icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-pixel2 text-[13px] text-snow">{lesson.title}</p>
            <p className="truncate font-mono text-[10px] text-mist/70">{lesson.file}</p>
          </div>
        </div>
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[10px] text-mist transition-colors hover:border-gold hover:text-gold"
        >
          {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
          {copied ? "¡copiado!" : "copiar"}
        </button>
      </div>

      <div className="code-scroll code-block max-h-[340px] overflow-y-auto overflow-x-auto py-3">
        <Highlight theme={themes.nightOwl} code={lesson.code} language={lesson.file.endsWith(".cs") ? "csharp" : "tsx"}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="!m-0 bg-transparent !text-[11.5px]">
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
        <h4 className="flex items-center gap-2 font-pixel text-[8px]" style={{ color: accent }}>
          <Lightbulb className="h-3.5 w-3.5" />
          EN HUMANO
        </h4>
        <ul className="mt-2.5 space-y-2">
          {lesson.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-mist">
              <span className="mt-[7px] h-1 w-1 shrink-0" style={{ background: accent }} />
              {b}
            </li>
          ))}
        </ul>
        {lesson.tryIt && (
          <p className="mt-3 flex gap-2 rounded-lg border border-viol/40 bg-viol/10 p-3 text-[12px] leading-relaxed text-snow/85">
            <CirclePlay className="mt-0.5 h-4 w-4 shrink-0 text-viol" />
            {lesson.tryIt}
          </p>
        )}
        {lesson.apps.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            <span className="font-pixel text-[7px] text-mist/60">VISTO EN</span>
            {lesson.apps.map((a) => (
              <span key={a} className="rounded border border-line bg-void px-1.5 py-0.5 font-pixel2 text-[9px] text-mist">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
