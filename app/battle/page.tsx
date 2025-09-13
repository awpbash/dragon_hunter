"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRun, getElapsedMs, clearRun } from "@/lib/run";
import { pushResult } from "@/lib/leaderboard";
import { useRouter } from "next/navigation";

export default function Battle() {
  const r = useRouter();
  const run = getRun();

  // Avoid hydration mismatch
  const [clientName, setClientName] = useState<string>("KNIGHT");
  useEffect(() => {
    if (!run) { r.replace("/"); return; }
    setClientName((run.playerName || "Knight").toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Easy-to-tune positions & sizes (px + clamp for smooth scaling) ===
  const POS = {
    hudEnemy:  { top: 70, right: 600, width: "min(70%, 360px)" },   // Dragon HUD
    hudPlayer: { bottom: 250, left: 540, width: "min(60%, 360px)" },// Knight HUD
    dragon:    { top: 40, right: 48, size: "clamp(220px, 42vw, 340px)" },
    knight:    { bottom: 120, left: 36, size: "clamp(180px, 40vw, 300px)" },
  };

  // battle state
  const [p, setP] = useState(100);
  const [e, setE] = useState(150);
  const [msg, setMsg] = useState("The dragon appeared!");
  const [menu, setMenu] = useState<"root" | "moves">("root");
  const [pp, setPP] = useState({ SLASH: 5, FIREBALL: 5, GUARD: 8, BUBBLETEA: 5 });
  const [locked, setLocked] = useState(false);

  // animation flags
  const [enemyHit, setEnemyHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [playerAct, setPlayerAct] = useState(false);

  // dragon pose + projectile
  const [dragonPose, setDragonPose] = useState<"idle" | "attack">("idle");
  const arenaRef = useRef<HTMLDivElement>(null);
  const dragonRef = useRef<HTMLDivElement>(null);
  const knightRef = useRef<HTMLDivElement>(null);
  const [proj, setProj] = useState<{visible: boolean; x: number; y: number}>({
    visible: false, x: 0, y: 0
  });
  const [projFlying, setProjFlying] = useState(false); // triggers CSS transition

  const color = (n: number) => (n > 50 ? "bg-emerald-500" : n > 20 ? "bg-amber-500" : "bg-red-500");

  // ---- Enemy turn with sprite swap + projectile flight ----
  function enemyTurn(guard = false) {
    // damage calc
    const dmg = Math.floor((Math.random() * 13) + 6);
    console.log(dmg);
    const dealt = guard ? Math.floor(dmg * 0.5) : dmg;

    // set up
    setLocked(true);
    setMsg("Dragon used FIRE BREATH!");
    setDragonPose("attack");

    // compute projectile start (dragon mouth-ish) and end (knight center)
    const arena = arenaRef.current?.getBoundingClientRect();
    const d = dragonRef.current?.getBoundingClientRect();
    const k = knightRef.current?.getBoundingClientRect();
    if (arena && d && k) {
      const startX = d.left - arena.left + d.width * 0.15; // a bit from the left of dragon image
      const startY = d.top - arena.top + d.height * 0.35;  // upper third (mouth-ish)
      const endX   = k.left - arena.left + k.width * 0.50; // center of knight
      const endY   = k.top - arena.top + k.height * 0.45;  // slightly below center

      // place projectile at start, make visible
      setProj({ visible: true, x: startX, y: startY });

      // next tick, send it to end (CSS transition handles motion)
      requestAnimationFrame(() => {
        setProjFlying(true);
        // use a tiny timeout to ensure style application order in React
        setTimeout(() => setProj({ visible: true, x: endX, y: endY }), 10);
      });

      // when it "arrives", apply hit, hide projectile, restore pose
      const flightMs = 520; // must match CSS transition duration below
      setTimeout(() => {
        setProjFlying(false);
        setProj({ visible: false, x: endX, y: endY });
        setPlayerHit(true);
        setTimeout(() => setPlayerHit(false), 360);

        setP(hp => Math.max(0, hp - dealt));
        setDragonPose("idle");
        setLocked(false);
        setMsg("What will you do?");
      }, flightMs);
    } else {
      // Fallback: no refs (shouldn't happen)
      setTimeout(() => {
        setPlayerHit(true);
        setTimeout(() => setPlayerHit(false), 360);
        setP(hp => Math.max(0, hp - dealt));
        setDragonPose("idle");
        setLocked(false);
        setMsg("What will you do?");
      }, 520);
    }
  }

  function win() {
  setLocked(true);
  setMsg("You defeated the dragon!");

  const total = getElapsedMs();
  const time = Math.max(0, Math.floor(total)); // ms

  // no pushResult, no clearRun here
  setTimeout(() => r.push(`/done?ms=${time}`), 600);
}

  function actRoot(a: string) {
    if (a === "FIGHT") { setMenu("moves"); setMsg("Choose a move!"); return; }
    if (a === "BAG") { setMsg("You used a potion! +35"); setP(p => Math.min(100, p + 35)); return setTimeout(() => enemyTurn(), 600); }
    if (a === "CRY") { setMsg("Boo Hoo cry baby 😭"); return; }
    if (a === "RUN") { setMsg("Can't run from a boss!"); }
  }
function restartBattle() {
  // reset everything back to the start
  setP(100);
  setE(150);
  setMsg("The dragon appeared!");
  setMenu("root");
  setPP({ SLASH: 5, FIREBALL: 5, GUARD: 8, BUBBLETEA: 5 });
  setLocked(false);

  // clear animations/projectile/poses
  setEnemyHit(false);
  setPlayerHit(false);
  setPlayerAct(false);
  setDragonPose("idle");
  setProj({ visible: false, x: 0, y: 0 });
  setProjFlying(false);
}
useEffect(() => {
  if (p <= 0) {
    setLocked(true);
    setMsg("WTF so noob got rekt! Restarting…");
    // optional: play a defeat sound here
    setTimeout(() => restartBattle(), 2500);
  }
}, [p]); // eslint-disable-line react-hooks/exhaustive-deps
  function actMove(k: "SLASH" | "FIREBALL" | "GUARD" | "BUBBLETEA") {
    if (locked || pp[k] <= 0) return;
    setPP(prev => ({ ...prev, [k]: prev[k] - 1 }));
    setLocked(true);

    if (k === "SLASH" || k === "FIREBALL") {
      const base = k === "SLASH" ? 18 : 26;
      const dmg = Math.floor(base - 6 + Math.random() * 10);
      setMsg(`You used ${k}!`);

      // player hop & enemy shake/flash
      setPlayerAct(true); setTimeout(() => setPlayerAct(false), 220);
      setTimeout(() => setEnemyHit(true), 180);
      setTimeout(() => setEnemyHit(false), 520);

      setTimeout(() => {
        setE(cur => {
          const nx = Math.max(0, cur - dmg);
          if (nx <= 0) { win(); return 0; }
          setLocked(false); setMenu("root"); setTimeout(() => enemyTurn(), 450);
          return nx;
        });
      }, 240);
    } else if (k === "GUARD") {
      setMsg("You brace for impact!");
      setTimeout(() => { setLocked(false); setMenu("root"); enemyTurn(true); }, 420);
    } else if (k === "BUBBLETEA") {
      setMsg("You drank bubble tea! +18");
      setP(cur => Math.min(100, cur + 18));
      setTimeout(() => { setLocked(false); setMenu("root"); enemyTurn(false); }, 480);
    }
  }

  // Knight sprite with face
  const knightSVG = useMemo(() => {
    const face = run?.faceUrl || "";
    const faceTag = face
      ? `<image href="${encodeURI(face)}" x="118" y="78" width="84" height="84" preserveAspectRatio="xMidYMid slice" clip-path="url(#face-hole)"/>`
      : `<text x="160" y="128" text-anchor="middle" font-size="36">🛡️</text>`;
    const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'>
  <defs><clipPath id='face-hole'><circle cx='160' cy='120' r='42'/></clipPath></defs>
  <path d='M80 190 C 40 220, 40 260, 110 290 L 210 290 C 280 260, 280 220, 240 190 Z' fill='#8b5cf6' stroke='#3b0764' stroke-width='4'/>
  <rect x='110' y='150' width='100' height='80' rx='14' fill='#d1d5db' stroke='#111827' stroke-width='4'/>
  <rect x='130' y='168' width='60' height='24' fill='#6b7280'/>
  <circle cx='160' cy='120' r='50' fill='#9ca3af' stroke='#111827' stroke-width='4'/>
  ${faceTag}
  <ellipse cx='115' cy='160' rx='24' ry='16' fill='#9ca3af' stroke='#111827' stroke-width='4'/>
  <ellipse cx='205' cy='160' rx='24' ry='16' fill='#9ca3af' stroke='#111827' stroke-width='4'/>
  <path d='M238 176 q30 16 30 44 q0 28-30 44 q-30-16-30-44 q0-28 30-44z' fill='#eab308' stroke='#713f12' stroke-width='4'/>
  <ellipse cx='130' cy='280' rx='70' ry='18' fill='#000' opacity='.15'/>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [run?.faceUrl]);

  const dragonSrc = dragonPose === "attack" ? "/dragon-attack.png" : "/dragon.png";

  return (
    <main className="w-full max-w-5xl">
      <div
        ref={arenaRef}
        className="relative w-full rounded-xl border-2 border-black shadow-[0_0_0_6px_#000] overflow-hidden"
        style={{
          imageRendering: "pixelated",
          aspectRatio: "4 / 3",
          background: "linear-gradient(#b8e0ff 58%, #9be29b 58%)",
        }}
      >
        {/* HUD — on top & click-through */}
        <div className="absolute z-50 pointer-events-none" style={{ top: POS.hudEnemy.top, right: POS.hudEnemy.right, width: POS.hudEnemy.width }}>
          <HudCard name="Dragon" level={50} hpPct={(e / 150) * 100} hpText={`${e}/150`} />
        </div>
        <div className="absolute z-50 pointer-events-none" style={{ bottom: POS.hudPlayer.bottom, left: POS.hudPlayer.left, width: POS.hudPlayer.width }}>
          <HudCard name={clientName} level={35} hpPct={p} hpText={`${p}/100`} suppressHydrationWarning />
        </div>

        {/* Sprites */}
        <div
          ref={dragonRef}
          className={`absolute z-20 anim-float ${enemyHit ? "anim-shake anim-hit" : ""}`}
          style={{ top: POS.dragon.top, right: POS.dragon.right, width: POS.dragon.size, height: POS.dragon.size }}
        >
          <Image src={dragonSrc} alt="Dragon" fill sizes="(max-width:768px) 50vw, 340px" className="object-contain transition-transform duration-150" priority />
        </div>

        <div
          ref={knightRef}
          className={`absolute z-20 anim-float ${playerHit ? "anim-shake anim-hit" : ""} ${playerAct ? "scale-[1.06]" : "scale-100"} transition-transform`}
          style={{ bottom: POS.knight.bottom, left: POS.knight.left, width: POS.knight.size, height: POS.knight.size }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={knightSVG} alt="Knight" className="w-full h-full object-contain" />
        </div>

        {/* Fireball projectile */}
        {proj.visible && (
          <div
            className="absolute z-30"
            style={{
              left: proj.x,
              top: proj.y,
              width: 22,
              height: 22,
              borderRadius: "9999px",
              background:
                "radial-gradient(circle at 30% 30%, #fff 0%, #ffd27a 35%, #ff7a00 65%, #b91c1c 100%)",
              boxShadow:
                "0 0 10px 2px rgba(255,122,0,0.8), 0 0 22px 6px rgba(255,200,0,0.5)",
              transition: projFlying ? "left 0.52s linear, top 0.52s linear" : "none",
            }}
          />
        )}
        /* pew sound */
        <audio key={proj.visible ? "on" : "off"} autoPlay={!!proj.visible} src="pew.mp3" />

        {/* Bottom UI region */}
        <div className="absolute left-3 right-3 bottom-3 z-40 grid grid-cols-[1fr_220px] gap-3">
          {/* message box */}
          <div className="panel h-24 flex items-center px-4 text-sm md:text-base">{msg}</div>

          {/* menu / moves */}
          {menu === "root" ? (
            <div className="panel h-[208px] p-2 grid grid-rows-4 gap-2">
              <MenuButton disabled={locked} onClick={() => actRoot("FIGHT")} color="bg-rose-300">FIGHT</MenuButton>
              <MenuButton disabled={locked} onClick={() => actRoot("BAG")} color="bg-amber-200">BAG</MenuButton>
              <MenuButton disabled={locked} onClick={() => actRoot("CRY")} color="bg-emerald-200">CRY</MenuButton>
              <MenuButton disabled={locked} onClick={() => actRoot("RUN")} color="bg-sky-200">RUN</MenuButton>
            </div>
          ) : (
            <div className="col-span-2 panel p-3">
              <div className="grid grid-cols-2 gap-3">
                <MoveButton disabled={locked || pp.SLASH<=0} onClick={()=>actMove("SLASH")}>SLASH {pp.SLASH}/5</MoveButton>
                <MoveButton disabled={locked || pp.FIREBALL<=0} onClick={()=>actMove("FIREBALL")}>FIREBALL {pp.FIREBALL}/5</MoveButton>
                <MoveButton disabled={locked || pp.GUARD<=0} onClick={()=>actMove("GUARD")}>GUARD {pp.GUARD}/8</MoveButton>
                <MoveButton disabled={locked || pp.BUBBLETEA<=0} onClick={()=>actMove("BUBBLETEA")}>BUBBLE TEA {pp.BUBBLETEA}/5</MoveButton>
              </div>
              <button className="mt-2 text-xs underline float-right" onClick={() => setMenu("root")}>back</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------- UI bits ---------- */
function HudCard({
  name, level, hpPct, hpText, suppressHydrationWarning = false
}: {
  name: string; level: number; hpPct: number; hpText: string; suppressHydrationWarning?: boolean;
}) {
  const barColor = (n: number) => (n > 50 ? "bg-emerald-500" : n > 20 ? "bg-amber-500" : "bg-red-500");
  return (
    <div className="panel p-2 text-[11px] md:text-sm shadow-[0_6px_0_#000]">
      <div className="flex justify-between font-bold">
        <span suppressHydrationWarning={suppressHydrationWarning}>{name}</span>
        <span>Lv {level}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-bold">HP</span>
        <div className="flex-1 h-2 border-2 border-black bg-[#223]">
          <div
            className={`h-full ${barColor(hpPct)} transition-[width] duration-300`}
            style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
          />
        </div>
      </div>
      <div className="text-right mt-1">{hpText}</div>
    </div>
  );
}

function MenuButton({ children, onClick, disabled, color }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`panel ${color} text-black font-bold h-full flex items-center justify-center hover:brightness-105 active:translate-y-[2px]`}
      style={{ boxShadow: "0 4px 0 #000" }}
    >
      {children}
    </button>
  );
}

function MoveButton({ children, onClick, disabled }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="panel bg-white font-bold hover:brightness-105 active:translate-y-[2px]"
      style={{ boxShadow: "0 4px 0 #000" }}
    >
      {children}
    </button>
  );
}
