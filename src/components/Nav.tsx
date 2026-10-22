import { useEffect, useState } from "react";
import { Gamepad2, Code2, Rocket, Hourglass, Paintbrush, Swords, Blocks, FolderDown, Globe, FlaskConical, GitBranch, Download, SlidersHorizontal, Dices, Search } from "lucide-react";
import { cn } from "../utils/cn";

const LINKS = [
  { href: "#juego", label: "El juego", icon: Gamepad2 },
  { href: "#codigo", label: "El código", icon: Code2 },
  { href: "#sprites", label: "Editor", icon: Paintbrush },
  { href: "#ejemplos", label: "Ejemplos", icon: Swords },
  { href: "#mecanicas", label: "Mecánicas", icon: FlaskConical },
  { href: "#narrativa", label: "Sistemas", icon: GitBranch },
  { href: "#produccion", label: "Producción", icon: SlidersHorizontal },
  { href: "#avanzado", label: "Avanzado", icon: Dices },
  { href: "#combate", label: "Balance", icon: Swords },
  { href: "#unity", label: "Unity", icon: Blocks },
  { href: "#descargas", label: "Descargas", icon: FolderDown },
  { href: "#publicar", label: "Publicar", icon: Globe },
  { href: "#/instalar", label: "Instalar", icon: Download },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, window.scrollY / max * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-void/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="group flex items-center gap-3">
          <span className="grid grid-cols-2 gap-[2px] transition-transform duration-300 group-hover:rotate-90">
            <span className="h-[7px] w-[7px] bg-gold" />
            <span className="h-[7px] w-[7px] bg-viol" />
            <span className="h-[7px] w-[7px] bg-mint" />
            <span className="h-[7px] w-[7px] bg-rose" />
          </span>
          <span className="font-pixel text-[11px] tracking-tight text-snow">
            CRONO<span className="text-gold">LAB</span>
          </span>
        </a>

        <nav className="hidden items-center gap-0.5 xl:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-2 font-pixel2 text-[13px] text-mist transition-colors hover:bg-panel hover:text-snow"
            >
              <l.icon className="h-3.5 w-3.5" />
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => window.dispatchEvent(new Event("cronolab:search"))} className="flex items-center gap-2 rounded-md border border-line bg-panel/80 px-3 py-2 text-mist transition-colors hover:border-viol hover:text-snow" aria-label="Buscar en CronoLab">
            <Search className="h-3.5 w-3.5" /><span className="hidden font-pixel2 text-[11px] sm:inline">buscar</span><span className="kbd hidden lg:inline-flex">Ctrl K</span>
          </button>
          <a href="#/tutorial" className="arcade-btn flex items-center gap-2 rounded-md bg-gold px-4 py-2 font-pixel text-[9px] text-black">
            <Rocket className="h-3 w-3" /><span className="hidden sm:inline">TUTORIAL</span>
          </a>
        </div>
      </div>
      {/* pequeño nod al tema temporal */}
      <div className="pointer-events-none absolute right-4 top-[68px] hidden items-center gap-2 text-mist/40 lg:flex">
        <Hourglass className="h-3 w-3" />
        <span className="font-pixel2 text-[10px]">día 1 de tu aventura</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-line/50"><div className="h-full bg-gradient-to-r from-viol via-cyanx to-gold transition-[width] duration-100" style={{ width: `${progress}%` }} /></div>
    </header>
  );
}
