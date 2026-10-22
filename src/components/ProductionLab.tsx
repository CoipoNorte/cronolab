import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Accessibility,
  CloudDownload,
  CloudUpload,
  Coins,
  Gamepad2,
  Heart,
  Languages,
  LockKeyhole,
  Medal,
  Music2,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import CodeCard from "./CodeCard";
import { PRODUCTION_LESSONS } from "../game/productionSnippets";
import {
  COLOR_FILTERS,
  DEFAULT_ACCESSIBILITY,
  DEFAULT_MIXER,
  SOUND_LIBRARY,
  channelGain,
  createAchievementState,
  deleteSlot,
  effectiveMotion,
  exportSaves,
  importSaves,
  listSlots,
  makeSave,
  missingTranslationKeys,
  processAchievementEvent,
  sanitizeAccessibility,
  saveSlot,
  translate,
} from "../game/production";
import type {
  AccessibilitySettings,
  AchievementProgress,
  ColorMode,
  GameEvent,
  GameSave,
  Locale,
  MixerState,
  ToneSpec,
} from "../game/production";
import { cn } from "../utils/cn";

type Tab = "audio" | "saves" | "achievements" | "localization" | "accessibility";

const TABS: { id: Tab; label: string; icon: typeof Volume2; color: string }[] = [
  { id: "audio", label: "Audio", icon: Volume2, color: "#ffd23f" },
  { id: "saves", label: "Guardado", icon: Save, color: "#5ce1e6" },
  { id: "achievements", label: "Logros", icon: Trophy, color: "#4ade80" },
  { id: "localization", label: "Idiomas", icon: Languages, color: "#7c6bff" },
  { id: "accessibility", label: "Accesibilidad", icon: Accessibility, color: "#ff7ad9" },
];

const storage = (): Storage | null => {
  try { return window.localStorage; } catch { return null; }
};

function saveText(name: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/* ---------------- Audio ---------------- */

let audioContext: AudioContext | null = null;

function ensureAudio(): AudioContext | null {
  try {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    return audioContext;
  } catch { return null; }
}

function playTone(spec: ToneSpec, mixer: MixerState, customGain = 1) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const gainValue = channelGain(mixer, spec.channel) * customGain * 0.11;
  if (gainValue <= 0) return;
  const start = ctx.currentTime + (spec.delay ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.frequency, start);
  if (spec.endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(1, spec.endFrequency), start + spec.duration);
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start); osc.stop(start + spec.duration + 0.02);
}

function AudioLab() {
  const [mixer, setMixer] = useState<MixerState>(() => {
    try { return { ...DEFAULT_MIXER, ...JSON.parse(localStorage.getItem("cronolab-mixer") ?? "{}") }; } catch { return DEFAULT_MIXER; }
  });
  const [freq, setFreq] = useState(440);
  const [duration, setDuration] = useState(0.18);
  const [wave, setWave] = useState<OscillatorType>("square");

  useEffect(() => { try { localStorage.setItem("cronolab-mixer", JSON.stringify(mixer)); } catch { /* no-op */ } }, [mixer]);
  const setChannel = (key: keyof MixerState, value: number | boolean) => setMixer((m) => ({ ...m, [key]: value }));

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-pixel text-[9px] text-gold"><Music2 className="h-4 w-4" /> MEZCLADOR</h3>
          <button onClick={() => setChannel("muted", !mixer.muted)} className={cn("rounded-md border p-2", mixer.muted ? "border-rose bg-rose/10 text-rose" : "border-line text-mist")}>
            {mixer.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-mist">El volumen audible es master × canal. Los cambios se guardan automáticamente.</p>
        <div className="mt-5 space-y-4">
          {(["master", "music", "sfx", "ui"] as const).map((key) => (
            <label key={key} className="block">
              <span className="flex items-center justify-between font-pixel2 text-[12px] text-snow">
                {key.toUpperCase()}
                <span className="font-mono text-[10px] text-gold">{Math.round(mixer[key] * 100)}%</span>
              </span>
              <input className="lab-range mt-1" type="range" min="0" max="1" step="0.01" value={mixer[key]} onChange={(e) => setChannel(key, Number(e.target.value))} />
              {key !== "master" && <span className="block text-right font-mono text-[9px] text-mist/60">salida real: {Math.round(channelGain(mixer, key) * 100)}%</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-5 lg:col-span-7">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="font-pixel text-[9px] text-cyanx">BIBLIOTECA 8-BIT</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(SOUND_LIBRARY).map(([name, tones]) => (
              <button key={name} onClick={() => tones.forEach((tone) => playTone(tone, mixer))} className="arcade-btn rounded-md border border-line bg-panel2 px-3 py-3 font-pixel2 text-[12px] text-snow hover:border-gold">
                {name}
                <span className="mt-1 block font-mono text-[9px] text-mist">{tones[0].channel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="font-pixel text-[9px] text-viol">DISEÑA TU SONIDO</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="font-pixel2 text-[11px] text-mist">Frecuencia
              <input className="lab-range mt-2" type="range" min="80" max="1400" step="10" value={freq} onChange={(e) => setFreq(Number(e.target.value))} />
              <span className="font-mono text-gold">{freq} Hz</span>
            </label>
            <label className="font-pixel2 text-[11px] text-mist">Duración
              <input className="lab-range mt-2" type="range" min="0.04" max="0.8" step="0.01" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              <span className="font-mono text-gold">{duration.toFixed(2)} s</span>
            </label>
            <label className="font-pixel2 text-[11px] text-mist">Onda
              <select value={wave} onChange={(e) => setWave(e.target.value as OscillatorType)} className="mt-2 w-full rounded-md border border-line bg-void px-2 py-2 font-mono text-[11px] text-snow">
                <option value="square">square · retro</option><option value="triangle">triangle · suave</option><option value="sawtooth">sawtooth · áspera</option><option value="sine">sine · limpia</option>
              </select>
            </label>
          </div>
          <button onClick={() => playTone({ frequency: freq, duration, type: wave, channel: "sfx" }, mixer)} className="arcade-btn mt-5 flex items-center gap-2 rounded-md bg-viol px-5 py-3 font-pixel text-[9px] text-white">
            <Volume2 className="h-4 w-4" /> REPRODUCIR
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Saves ---------------- */

function SaveLab() {
  const [slots, setSlots] = useState<Array<GameSave | null>>(() => storage() ? listSlots(storage()!) : [null, null, null]);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = () => setSlots(storage() ? listSlots(storage()!) : [null, null, null]);

  const create = (slot: number) => {
    const s = storage(); if (!s) return;
    saveSlot(s, makeSave(slot, { player: ["CRONO", "MARLE", "LUCCA"][slot - 1], level: slot * 2, coins: slot * 37, location: ["Pradera", "Ruinas", "Castillo"][slot - 1], playSeconds: slot * 1240 }));
    setMessage(`Ranura ${slot} guardada`); refresh();
  };

  const importFile = async (file?: File) => {
    if (!file || !storage()) return;
    try { const n = importSaves(storage()!, await file.text()); setMessage(`${n} ranura(s) importada(s)`); refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Error de importación"); }
  };

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        {slots.map((slot, i) => (
          <div key={i} className={cn("rounded-2xl border p-5", slot ? "border-cyanx/30 bg-cyanx/5" : "border-line bg-panel")}>
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[9px] text-cyanx">RANURA {i + 1}</span>
              {slot && <span className="font-mono text-[9px] text-mist">v{slot.version}</span>}
            </div>
            {slot ? (
              <>
                <p className="mt-4 font-pixel2 text-xl text-snow">{slot.player}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-mist">
                  <span>nivel <b className="text-gold">{slot.level}</b></span><span>monedas <b className="text-gold">{slot.coins}</b></span>
                  <span className="col-span-2">{slot.location}</span>
                  <span className="col-span-2">{Math.floor(slot.playSeconds / 60)} min jugados</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => create(i + 1)} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-cyanx px-3 py-2 font-pixel text-[8px] text-black"><Save className="h-3 w-3" /> SOBRESCRIBIR</button>
                  <button onClick={() => { const s = storage(); if (s) { deleteSlot(s, i + 1); refresh(); } }} className="rounded-md border border-line p-2 text-mist hover:text-rose"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center">
                <Save className="h-7 w-7 text-mist/35" /><p className="mt-3 font-pixel2 text-sm text-mist">vacía</p>
                <button onClick={() => create(i + 1)} className="arcade-btn mt-4 rounded-md bg-gold px-4 py-2 font-pixel text-[8px] text-black">CREAR PARTIDA</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel p-4">
        <button onClick={() => { const s = storage(); if (s) saveText("cronolab-partidas.json", exportSaves(s)); }} className="arcade-btn flex items-center gap-2 rounded-md bg-mint px-4 py-2.5 font-pixel text-[8px] text-black"><CloudDownload className="h-4 w-4" /> EXPORTAR TODO</button>
        <button onClick={() => inputRef.current?.click()} className="arcade-btn flex items-center gap-2 rounded-md border-2 border-viol bg-panel2 px-4 py-2 font-pixel text-[8px] text-snow"><CloudUpload className="h-4 w-4 text-viol" /> IMPORTAR</button>
        <input ref={inputRef} className="hidden" type="file" accept=".json,application/json" onChange={(e) => void importFile(e.target.files?.[0])} />
        {message && <span className="font-mono text-[11px] text-mint">✓ {message}</span>}
      </div>
    </div>
  );
}

/* ---------------- Achievements ---------------- */

function AchievementLab() {
  const [state, setState] = useState<AchievementProgress[]>(() => createAchievementState());
  const [toast, setToast] = useState<AchievementProgress | null>(null);
  const [damage, setDamage] = useState(0);

  const emit = (event: GameEvent) => {
    if (event.type === "damage_taken") setDamage((d) => d + Number(event.amount ?? 1));
    setState((current) => {
      const result = processAchievementEvent(current, event, { damageThisLevel: damage });
      if (result.unlocked[0]) { setToast(result.unlocked[0]); setTimeout(() => setToast(null), 2600); }
      return result.state;
    });
    if (event.type === "level_completed") setDamage(0);
  };

  return (
    <div className="relative grid gap-5 lg:grid-cols-12">
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-4">
        <h3 className="font-pixel text-[9px] text-gold">EMITIR EVENTOS</h3>
        <p className="mt-2 text-xs leading-relaxed text-mist">Simula lo que anunciarían las monedas, los enemigos y el final de nivel.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => emit({ type: "coin_collected", amount: 1 })} className="arcade-btn rounded-md bg-gold px-3 py-3 font-pixel2 text-[12px] text-black"><Coins className="mx-auto mb-1 h-4 w-4" /> +1 moneda</button>
          <button onClick={() => emit({ type: "coin_collected", amount: 5 })} className="arcade-btn rounded-md bg-panel2 px-3 py-3 font-pixel2 text-[12px] text-snow"><Coins className="mx-auto mb-1 h-4 w-4 text-gold" /> +5 monedas</button>
          <button onClick={() => emit({ type: "enemy_stomped", amount: 1 })} className="arcade-btn rounded-md bg-mint px-3 py-3 font-pixel2 text-[12px] text-black"><Gamepad2 className="mx-auto mb-1 h-4 w-4" /> pisotón</button>
          <button onClick={() => emit({ type: "powerup_collected", kind: "escudo" })} className="arcade-btn rounded-md bg-cyanx px-3 py-3 font-pixel2 text-[12px] text-black"><Shield className="mx-auto mb-1 h-4 w-4" /> power-up</button>
          <button onClick={() => emit({ type: "damage_taken", amount: 1 })} className="arcade-btn rounded-md bg-rose px-3 py-3 font-pixel2 text-[12px] text-white"><Heart className="mx-auto mb-1 h-4 w-4" /> recibir daño</button>
          <button onClick={() => emit({ type: "level_completed", level: 1 })} className="arcade-btn rounded-md bg-viol px-3 py-3 font-pixel2 text-[12px] text-white"><Medal className="mx-auto mb-1 h-4 w-4" /> nivel completo</button>
        </div>
        <button onClick={() => { setState(createAchievementState()); setDamage(0); }} className="mt-4 flex items-center gap-1.5 font-mono text-[10px] text-mist hover:text-rose"><RotateCcw className="h-3 w-3" /> reiniciar progreso</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
        {state.map((item) => (
          <div key={item.id} className={cn("rounded-xl border p-4", item.unlocked ? "border-mint/45 bg-mint/8" : "border-line bg-panel")}>
            <div className="flex items-start gap-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", item.unlocked ? "border-mint bg-mint/15 text-mint" : "border-line bg-void text-mist")}>
                {item.hidden && !item.unlocked ? <LockKeyhole className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-pixel2 text-[14px] text-snow">{item.hidden && !item.unlocked ? "Logro oculto" : item.title}</h4>
                <p className="mt-1 text-[11px] text-mist">{item.hidden && !item.unlocked ? "Cumple una condición especial" : item.description}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-void">
                  <motion.div className="h-full bg-mint" animate={{ width: `${(item.progress / item.target) * 100}%` }} />
                </div>
                <p className="mt-1 text-right font-mono text-[9px] text-mist">{item.progress}/{item.target}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-xl border border-mint/50 bg-panel2 p-4 shadow-2xl">
          <Trophy className="h-6 w-6 text-gold" />
          <div><p className="font-pixel text-[8px] text-mint">LOGRO DESBLOQUEADO</p><p className="mt-1 font-pixel2 text-base text-snow">{toast.title}</p></div>
        </motion.div>
      )}
    </div>
  );
}

/* ---------------- Localization ---------------- */

function LocalizationLab() {
  const [locale, setLocale] = useState<Locale>("es");
  const [coins, setCoins] = useState(1);
  const [player, setPlayer] = useState("CRONO");
  const missing = missingTranslationKeys(locale);
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-4">
        <h3 className="font-pixel text-[9px] text-viol">PARÁMETROS</h3>
        <label className="mt-4 block font-pixel2 text-[11px] text-mist">Idioma
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["es", "en", "pt"] as Locale[]).map((l) => <button key={l} onClick={() => setLocale(l)} className={cn("rounded-md border py-2 font-pixel text-[9px]", locale === l ? "border-viol bg-viol/15 text-viol" : "border-line text-mist")}>{l.toUpperCase()}</button>)}
          </div>
        </label>
        <label className="mt-4 block font-pixel2 text-[11px] text-mist">Nombre del jugador
          <input value={player} onChange={(e) => setPlayer(e.target.value.toUpperCase())} className="mt-2 w-full rounded-md border border-line bg-void px-3 py-2 font-mono text-sm text-snow" />
        </label>
        <label className="mt-4 block font-pixel2 text-[11px] text-mist">Cantidad
          <input className="lab-range mt-2" type="range" min="0" max="12" value={coins} onChange={(e) => setCoins(Number(e.target.value))} />
          <span className="font-mono text-gold">{coins}</span>
        </label>
        <p className="mt-4 font-mono text-[10px] text-mist">claves faltantes: <span className={missing.length ? "text-rose" : "text-mint"}>{missing.length}</span></p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-[#0d1126] lg:col-span-8">
        <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5"><span className="font-pixel text-[8px] text-snow">VISTA PREVIA · {locale.toUpperCase()}</span><Languages className="h-4 w-4 text-viol" /></div>
        <div className="grid gap-5 p-6 sm:grid-cols-[1fr_1.4fr]">
          <div className="space-y-2">
            {["menu.play", "menu.options", "menu.exit"].map((key, i) => <button key={key} className={cn("block w-full rounded-md border px-4 py-3 text-left font-pixel text-[9px]", i === 0 ? "border-gold bg-gold/10 text-gold" : "border-line text-snow")}>{translate(locale, key)}</button>)}
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-gold/15 px-3 py-2 font-pixel2 text-[13px] text-gold">{translate(locale, "hud.coins", { count: coins })}</span>
              <span className="rounded-md bg-rose/15 px-3 py-2 font-pixel2 text-[13px] text-rose">{translate(locale, "hud.hearts", { count: 3 })}</span>
            </div>
            <div className="mt-4 rounded-xl border border-viol/40 bg-viol/10 p-4">
              <p className="font-pixel text-[8px] text-viol">MIRA</p>
              <p className="mt-3 text-sm leading-relaxed text-snow">{translate(locale, "dialogue.welcome", { player })}</p>
            </div>
            <p className="mt-4 font-mono text-[11px] text-mint">✓ {translate(locale, "status.saved")}</p>
            <p className="mt-2 font-mono text-[10px] text-mist">fallback visible: {translate(locale, "clave.que.no.existe")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Accessibility ---------------- */

function AccessibilityPreview({ settings }: { settings: AccessibilitySettings }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => {
    const canvas = ref.current!; canvas.width = 480; canvas.height = 220;
    const ctx = canvas.getContext("2d")!; let raf = 0; let shake = 0;
    const loop = (now: number) => {
      const t = now / 1000, s = settingsRef.current, motion = effectiveMotion(s);
      if (Math.floor(t * 1.2) !== Math.floor((t - 1 / 60) * 1.2)) shake = 8 * motion.shakeMultiplier;
      shake = Math.max(0, shake - 0.22);
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
      ctx.fillStyle = s.highContrast ? "#05050a" : "#344b7d"; ctx.fillRect(-10, -10, 500, 240);
      ctx.fillStyle = s.highContrast ? "#ffffff" : "#4c9455"; ctx.fillRect(0, 165, 480, 55);
      const x = s.reducedMotion ? 90 : 90 + Math.sin(t * 1.8) * 45;
      ctx.fillStyle = "#ffd23f"; ctx.fillRect(x - 9, 137, 18, 28);
      ctx.fillStyle = "#5ce1e6"; ctx.fillRect(280, 124, 26, 41);
      ctx.fillStyle = "#ff5d73"; ctx.beginPath(); ctx.arc(390, 145, 17, 0, Math.PI * 2); ctx.fill();
      // formas redundantes: el color nunca es la única pista
      ctx.fillStyle = "#05050a"; ctx.fillRect(289, 132, 8, 8);
      ctx.beginPath(); ctx.moveTo(383, 151); ctx.lineTo(390, 137); ctx.lineTo(397, 151); ctx.fill();
      const particles = Math.round(18 * motion.particleMultiplier);
      for (let i = 0; i < particles; i++) { ctx.fillStyle = i % 2 ? "#ffd23f" : "#ffffff"; ctx.fillRect(390 + Math.cos(i) * (24 + i), 145 + Math.sin(i) * (12 + i / 2), 2, 2); }
      ctx.restore();

      if (s.subtitles) { ctx.fillStyle = "rgba(7,9,18,.88)"; ctx.fillRect(105, 184, 270, 25); ctx.fillStyle = "#ffffff"; ctx.font = `${Math.round(11 * s.textScale)}px monospace`; ctx.textAlign = "center"; ctx.fillText("[IMPACTO]  ¡El portal se está abriendo!", 240, 201); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="pixelated block w-full" style={{ filter: COLOR_FILTERS[settings.colorMode] }} />;
}

function AccessLab() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const set = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => setSettings((s) => sanitizeAccessibility({ ...s, [key]: value }));
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* Matrices aproximadas para simular cómo se separan los colores. */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="deuteranopia"><feColorMatrix values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" /></filter>
          <filter id="protanopia"><feColorMatrix values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" /></filter>
          <filter id="tritanopia"><feColorMatrix values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" /></filter>
        </defs>
      </svg>
      <div className="rounded-2xl border border-line bg-panel p-5 lg:col-span-5">
        <h3 className="font-pixel text-[9px] text-rose">OPCIONES DEL JUGADOR</h3>
        <div className="mt-4 space-y-2.5">
          {([
            ["reducedMotion", "movimiento reducido"], ["highContrast", "alto contraste"], ["flashes", "flashes de pantalla"], ["subtitles", "subtítulos descriptivos"], ["holdToRun", "mantener para correr"],
          ] as [keyof AccessibilitySettings, string][]).map(([key, label]) => (
            <button key={key} onClick={() => set(key, !settings[key] as never)} className="flex w-full items-center justify-between rounded-lg border border-line bg-void/40 px-3 py-2.5">
              <span className="font-pixel2 text-[12px] text-snow">{label}</span><span className="lab-toggle scale-75" data-on={Boolean(settings[key])} />
            </button>
          ))}
        </div>
        <label className="mt-4 block font-pixel2 text-[11px] text-mist">Fuerza del temblor: {Math.round(settings.shake * 100)}%
          <input className="lab-range mt-1" type="range" min="0" max="1" step="0.05" value={settings.shake} onChange={(e) => set("shake", Number(e.target.value))} />
        </label>
        <label className="mt-3 block font-pixel2 text-[11px] text-mist">Tamaño de texto: {Math.round(settings.textScale * 100)}%
          <input className="lab-range mt-1" type="range" min="0.8" max="1.6" step="0.1" value={settings.textScale} onChange={(e) => set("textScale", Number(e.target.value))} />
        </label>
        <label className="mt-3 block font-pixel2 text-[11px] text-mist">Visión de color
          <select value={settings.colorMode} onChange={(e) => set("colorMode", e.target.value as ColorMode)} className="mt-2 w-full rounded-md border border-line bg-void px-3 py-2 font-mono text-[11px] text-snow">
            <option value="normal">normal</option><option value="deuteranopia">deuteranopia</option><option value="protanopia">protanopia</option><option value="tritanopia">tritanopia</option><option value="monochrome">monocromo</option>
          </select>
        </label>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-panel lg:col-span-7">
        <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5"><span className="font-pixel text-[8px] text-snow">COMPARACIÓN EN VIVO</span><Accessibility className="h-4 w-4 text-rose" /></div>
        <AccessibilityPreview settings={settings} />
        <div className="border-t border-line p-4">
          <p className="text-[12px] leading-relaxed text-mist">Movimiento efectivo: partículas ×{effectiveMotion(settings).particleMultiplier} · temblor ×{effectiveMotion(settings).shakeMultiplier} · transición {effectiveMotion(settings).transitionSeconds}s.</p>
          <p className="mt-2 text-[12px] leading-relaxed text-snow">Las formas dentro del cuadrado y el círculo siguen diferenciando objetivos aunque el filtro elimine su color.</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductionLab() {
  const [tab, setTab] = useState<Tab>("audio");
  const active = TABS.find((item) => item.id === tab)!;
  return (
    <section id="produccion" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="08"
          eyebrow="DE PROTOTIPO A JUEGO PUBLICABLE"
          title="SISTEMAS DE"
          accent="PRODUCCIÓN"
          blurb="Un juego real también necesita respetar el volumen elegido, sobrevivir a actualizaciones, traducirse, recordar logros y adaptarse a distintas personas. Cinco laboratorios conectan esas necesidades con código que puedes reutilizar."
          icon={Sparkles}
        />

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {TABS.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={cn("flex min-w-max items-center gap-2 rounded-xl border px-4 py-3 transition-all", tab === item.id ? "border-gold bg-panel2" : "border-line bg-panel text-mist")}>
              <item.icon className="h-4 w-4" style={{ color: item.color }} /><span className="font-pixel2 text-[13px]">{item.label}</span>
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === "audio" && <AudioLab />}
          {tab === "saves" && <SaveLab />}
          {tab === "achievements" && <AchievementLab />}
          {tab === "localization" && <LocalizationLab />}
          {tab === "accessibility" && <AccessLab />}
        </motion.div>

        <div className="mt-6">
          <CodeCard lesson={PRODUCTION_LESSONS[TABS.findIndex((item) => item.id === tab)]} accent={active.color} />
        </div>
      </div>
    </section>
  );
}