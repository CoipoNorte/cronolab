import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import GameLab from "./components/GameLab";
import CodePanel from "./components/CodePanel";
import SpriteEditor from "./components/SpriteEditor";
import MoreGames from "./components/MoreGames";
import UnityBridge from "./components/UnityBridge";
import Downloads from "./components/Downloads";
import Publish from "./components/Publish";
import Concepts from "./components/Concepts";
import Footer from "./components/Footer";
import TutorialPage from "./components/TutorialPage";

/** Cinta marquee con el vocabulario del tutorial */
function Marquee() {
  const WORDS = [
    "GAME LOOP",
    "DELTA TIME",
    "SPRITES",
    "PARALLAX 2.5D",
    "GRAVEDAD",
    "TILEMAP",
    "NPC DIALOGUES",
    "QUEST STATES",
    "AUTO SAVE",
    "AABB",
    "EVENT TRIGGERS",
    "COMBO CHAINS",
    "CÁMARA LERP",
    "LEVEL EDITOR",
    "ATB BATTLE",
    "UNITY READY",
    "DESCARGAS",
  ];
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative z-10 overflow-hidden border-y border-black/40 bg-gold py-2.5">
      <div className="lab-marquee flex w-max items-center gap-6 whitespace-nowrap">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-6 font-pixel2 text-sm font-bold tracking-wide text-black">
            {w}
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-black/70" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  /* enrutado mínimo por hash: #/tutorial abre el proyecto guiado */
  const [route, setRoute] = useState(() => window.location.hash);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route.startsWith("#/tutorial")) return <TutorialPage />;

  return (
    <div className="relative min-h-screen bg-void text-snow antialiased">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <GameLab />
        <CodePanel />
        <SpriteEditor />
        <MoreGames />
        <UnityBridge />
        <Downloads />
        <Publish />
        <Concepts />
      </main>
      <Footer />
    </div>
  );
}
