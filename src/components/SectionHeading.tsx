import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  index: string;
  eyebrow: string;
  title: string;
  accent: string;
  blurb?: string;
  icon: LucideIcon;
}

export default function SectionHeading({ index, eyebrow, title, accent, blurb, icon: Icon }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="mb-12"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-panel">
          <Icon className="h-4 w-4 text-gold" />
        </span>
        <span className="font-pixel2 text-xs tracking-[0.25em] text-mist">
          {index} · {eyebrow}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
      </div>
      <h2 className="mt-5 font-pixel text-[clamp(1.15rem,2.6vw,1.9rem)] leading-[1.6] text-snow">
        {title} <span className="text-gold">{accent}</span>
      </h2>
      {blurb && <p className="mt-4 max-w-2xl leading-relaxed text-mist">{blurb}</p>}
    </motion.div>
  );
}
