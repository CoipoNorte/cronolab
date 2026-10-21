import { Hourglass, Heart, Keyboard } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-line bg-ink px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          <span className="grid grid-cols-2 gap-[2px]">
            <span className="h-[7px] w-[7px] bg-gold" />
            <span className="h-[7px] w-[7px] bg-viol" />
            <span className="h-[7px] w-[7px] bg-mint" />
            <span className="h-[7px] w-[7px] bg-rose" />
          </span>
          <span className="font-pixel text-[11px] text-snow">
            CRONO<span className="text-gold">LAB</span>
          </span>
        </div>

        <p className="max-w-md text-sm leading-relaxed text-mist">
          Siete juegos entran en esta página. Bucles, sprites, diálogos, tilemaps, misiones,
          guardado y combate <strong className="text-snow">funcionan igual en Unity</strong>. Solo cambia el idioma.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-pixel2 text-[11px] text-mist/70">
          <span className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 text-cyanx" /> hecho para aprender
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 fill-rose text-rose" /> inspirado en los JRPG de 16 bits
          </span>
          <span className="flex items-center gap-1.5">
            <Hourglass className="h-3.5 w-3.5 text-gold" /> día 2 desbloqueado · el viaje continúa
          </span>
        </div>
      </div>
    </footer>
  );
}
