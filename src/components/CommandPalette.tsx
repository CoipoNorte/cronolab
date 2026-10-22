import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  Blocks,
  BookOpen,
  Bug,
  Code2,
  Download,
  Dices,
  FlaskConical,
  Gamepad2,
  Globe,
  Languages,
  MessageSquareText,
  Paintbrush,
  Rocket,
  Search,
  SlidersHorizontal,
  Swords,
  Terminal,
  Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";

interface Destination {
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
  icon: LucideIcon;
  group: "Aprender" | "Crear" | "Sistemas" | "Llevarte el proyecto";
}

const DESTINATIONS: Destination[] = [
  { title: "Juego principal", subtitle: "Pradera, físicas y parallax", href: "#juego", keywords: "hero gravedad salto canvas", icon: Gamepad2, group: "Aprender" },
  { title: "Código explicado", subtitle: "Seis funciones fundamentales", href: "#codigo", keywords: "loop sprites colisiones sonido", icon: Code2, group: "Aprender" },
  { title: "Crono Jump", subtitle: "Tutorial completo de 14 pasos", href: "#/tutorial", keywords: "mario meteoritos paso a paso", icon: Rocket, group: "Aprender" },
  { title: "Editor de sprites", subtitle: "Personajes, objetos y escenario", href: "#sprites", keywords: "pixel art pintar paleta", icon: Paintbrush, group: "Crear" },
  { title: "Juegos y editor de niveles", subtitle: "Tilemap, NPC, arena, ATB y RPG", href: "#ejemplos", keywords: "plataformas diálogo combate niveles", icon: Swords, group: "Crear" },
  { title: "Mecánicas de game feel", subtitle: "13 comparaciones con y sin técnica", href: "#mecanicas", keywords: "coyote dash hitstop cámara pooling", icon: FlaskConical, group: "Aprender" },
  { title: "Narrativa ramificada", subtitle: "Editor de nodos, condiciones y efectos", href: "#narrativa", keywords: "dialogo json grafo elecciones", icon: MessageSquareText, group: "Crear" },
  { title: "Laboratorio de depuración", subtitle: "Hitboxes, vectores y breakpoints", href: "#debug", keywords: "debug pausa frame eventos inspector", icon: Bug, group: "Sistemas" },
  { title: "Sistemas de producción", subtitle: "Audio, saves, logros, idiomas y acceso", href: "#produccion", keywords: "mezclador ranuras localización accesibilidad", icon: SlidersHorizontal, group: "Sistemas" },
  { title: "Generación procedural", subtitle: "Semillas y ruta garantizada", href: "#avanzado", keywords: "random semilla roguelike nivel", icon: Dices, group: "Sistemas" },
  { title: "Reasignar controles", subtitle: "Acciones, teclado y gamepad", href: "#avanzado", keywords: "input bindings mando teclas", icon: Gamepad2, group: "Sistemas" },
  { title: "Inventario y crafting", subtitle: "Peso, recetas y tienda", href: "#avanzado", keywords: "economia objetos fabricar comprar", icon: BookOpen, group: "Sistemas" },
  { title: "Replay y telemetría", subtitle: "Fantasma y mapa de peligro", href: "#avanzado", keywords: "grabar ghost analytics heatmap", icon: Terminal, group: "Sistemas" },
  { title: "Combate y balance", subtitle: "Daño, estados, jefes y botín", href: "#combate", keywords: "formula critico elementos poison loot simulacion", icon: Swords, group: "Sistemas" },
  { title: "Puente a Unity", subtitle: "Diccionario web a C#", href: "#unity", keywords: "rigidbody collider csharp", icon: Blocks, group: "Llevarte el proyecto" },
  { title: "Instalar Unity o Godot", subtitle: "Guía completa de instalación", href: "#/instalar", keywords: "motor godot grok descargar", icon: Download, group: "Llevarte el proyecto" },
  { title: "ZIPs de Unity", subtitle: "Proyecto, RPG y producción", href: "#unity-zips", keywords: "descarga unity zip", icon: Blocks, group: "Llevarte el proyecto" },
  { title: "ZIPs de Godot", subtitle: "Proyecto, RPG y producción", href: "#godot-zips", keywords: "descarga godot grok zip gdscript", icon: Rocket, group: "Llevarte el proyecto" },
  { title: "Centro de descargas", subtitle: "Fuentes y 64 lecciones", href: "#descargas", keywords: "zip código lecciones", icon: Download, group: "Llevarte el proyecto" },
  { title: "Publicar en GitHub Pages", subtitle: "Push, deploy y Actions", href: "#publicar", keywords: "github web internet npm ship", icon: Globe, group: "Llevarte el proyecto" },
  { title: "Audio 8-bit", subtitle: "Mezclador y diseñador de sonidos", href: "#produccion", keywords: "webaudio volumen sfx música", icon: Volume2, group: "Sistemas" },
  { title: "Localización", subtitle: "Español, inglés y portugués", href: "#produccion", keywords: "idiomas traducción plural", icon: Languages, group: "Sistemas" },
  { title: "Accesibilidad", subtitle: "Movimiento, contraste y color", href: "#produccion", keywords: "subtitulos daltonismo reduced motion", icon: Accessibility, group: "Sistemas" },
];

const norm = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) return DESTINATIONS;
    return DESTINATIONS.filter((item) => {
      const haystack = norm(`${item.title} ${item.subtitle} ${item.keywords} ${item.group}`);
      return words.every((word) => haystack.includes(word));
    });
  }, [query]);

  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setOpen(true); }
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((i) => Math.min(results.length - 1, i + 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((i) => Math.max(0, i - 1)); }
      if (e.key === "Enter" && results[selected]) { e.preventDefault(); go(results[selected]); }
    };
    const custom = () => setOpen(true);
    window.addEventListener("keydown", key);
    window.addEventListener("cronolab:search", custom);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("cronolab:search", custom); };
  }, [open, results, selected]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); else setQuery(""); }, [open]);

  const go = (item: Destination) => {
    setOpen(false);
    window.location.hash = item.href.slice(1);
    if (!item.href.startsWith("#/")) requestAnimationFrame(() => document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: "smooth" }));
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-void/80 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-viol/50 bg-panel shadow-[0_30px_100px_rgba(0,0,0,.65)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-5 w-5 text-viol" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar juego, sistema, concepto o descarga…" className="min-w-0 flex-1 bg-transparent text-base text-snow outline-none placeholder:text-mist/50" />
          <span className="kbd">ESC</span>
        </div>
        <div className="max-h-[62vh] overflow-auto p-2">
          {results.length ? results.map((item, i) => (
            <button key={`${item.title}-${i}`} onMouseEnter={() => setSelected(i)} onClick={() => go(item)} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left", selected === i ? "border-gold/50 bg-gold/8" : "border-transparent hover:bg-panel2")}>
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", selected === i ? "border-gold/40 bg-gold/10 text-gold" : "border-line bg-void text-mist")}><item.icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block font-pixel2 text-[14px] text-snow">{item.title}</span><span className="mt-0.5 block truncate text-[11px] text-mist">{item.subtitle}</span></span>
              <span className="hidden rounded bg-void px-2 py-1 font-pixel2 text-[9px] text-mist sm:block">{item.group}</span>
            </button>
          )) : <div className="py-12 text-center"><Search className="mx-auto h-7 w-7 text-mist/30" /><p className="mt-3 font-pixel2 text-sm text-mist">No encontré nada con “{query}”</p></div>}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-void/40 px-4 py-2 font-mono text-[9px] text-mist"><span>↑ ↓ navegar · ENTER abrir</span><span>{results.length} destinos</span></div>
      </div>
    </div>
  );
}