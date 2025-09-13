"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRun } from "@/lib/run"; // your session util

type SpriteImages = {
  background?: HTMLImageElement;
  face?: HTMLImageElement;
};

type GameState = {
  x: number;
  y: number;
  vy: number;
  jumping: boolean;
  ducking: boolean;
  duckKeyHeld: boolean;
  speed: number;
  spawnEvery: number; // frames
  spawnTick: number;
  sc: number;
  t: number;
  obs: { x: number; y: number; w: number; h: number; v: number; kind: "cactus" | "bird"; flap?: number }[];
  clouds: { x: number; y: number; v: number }[];
  raf: number;
  dead: boolean;
  w: number;
  h: number;
  sprites: SpriteImages;
};

export default function Dino() {
  const cv = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const unmutedOnce = useRef(false);

  const game = useRef<GameState | null>(null);
  const router = useRouter();

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [alive, setAlive] = useState(true);
  const [passed, setPassed] = useState(false);
  const [duckBtnHeld, setDuckBtnHeld] = useState(false);
  const [showdeath, setShowdeath] = useState(false);

  useEffect(() => {
    const c = cv.current!;
    const ctx = c.getContext("2d")!;
    const parent = c.parentElement!;

    if (!game.current) {
      game.current = {
        x: 0, y: 0, vy: 0,
        jumping: false,
        ducking: false,
        duckKeyHeld: false,
        speed: 4,
        spawnEvery: 100,
        spawnTick: 0,
        sc: 0,
        t: 0,
        obs: [],
        clouds: [],
        raf: 0,
        dead: false,
        w: 0,
        h: 0,
        sprites: {},
      };
    }

    const fit = () => {
      if (!game.current) return;
      game.current.w = parent.clientWidth;
      game.current.h = parent.clientHeight;
      c.width = game.current.w;
      c.height = game.current.h;
      game.current.y = game.current.h * 0.7;
    };
    fit();
    window.addEventListener("resize", fit);

    // ---- constants ----
    const GROUND_R = 0.7;
    const ground = () => Math.floor(game.current!.h * GROUND_R);
    const GRAVITY = 0.7;
    const JUMP_VY = -16;
    const DUCK_SCALE = 0.58;
    const PASS_SCORE = 4000;

    // image loaders
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image();
        if (/^https?:\/\//i.test(src)) img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });

    const tryLoad = async (src?: string) => {
      if (!src) return undefined;
      try { return await loadImg(src); } catch { return undefined; }
    };

    // ----- audio helpers -----
    const unmuteAudio = () => {
      if (unmutedOnce.current || !audioRef.current) return;
      // softer volume
      audioRef.current.volume = 0.55;
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {
        // if still blocked, user can try again with another interaction
      });
      unmutedOnce.current = true;
    };

    // controls
    const jump = () => {
      const g = game.current!;
      if (!g.jumping && !g.ducking) {
        g.vy = JUMP_VY;
        g.jumping = true;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const g = game.current!;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        unmuteAudio();      // 🔊 unmute on first jump key
        jump();
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        g.duckKeyHeld = true;
        unmuteAudio();      // also unmute if they press down first
      }
      if (!alive && e.code === "KeyR") location.reload();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const g = game.current!;
      if (e.code === "ArrowDown") g.duckKeyHeld = false;
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        unmuteAudio();      // 🔊 unmute on first tap
        jump();
      }
    };
    const onFirstClick = () => unmuteAudio(); // desktop click fallback
    window.addEventListener("click", onFirstClick, { once: true });

    // clouds
    const spawnCloud = () => {
      const g = game.current!;
      g.clouds.push({
        x: g.w + Math.random() * g.w,
        y: 40 + Math.random() * (g.h * 0.35),
        v: 0.5 + Math.random() * 0.6,
      });
    };

    // obstacles
    const spawnObstacle = () => {
      const g = game.current!;
      const isBird = Math.random() < 0.35;
      if (isBird) {
        const lanes = [ground() - 40, ground() - 80, ground() - 130];
        const laneY = lanes[Math.floor(Math.random() * lanes.length)];
        const bw = 34 + Math.random() * 22;
        const bh = 24;
        g.obs.push({ x: g.w + 30, y: laneY - bh, w: bw, h: bh, v: g.speed + 0.5, kind: "bird", flap: 0 });
      } else {
        const pieces = 1 + Math.floor(Math.random() * 3);
        const gap = 8;
        let startX = g.w + 30;
        for (let i = 0; i < pieces; i++) {
          const segW = 16 + Math.random() * 18;
          const segH = 22 + Math.random() * 28;
          g.obs.push({ x: startX, y: ground() - segH, w: segW, h: segH, v: g.speed, kind: "cactus" });
          startX += segW + gap;
        }
      }
    };

    // draw helpers
    const drawClouds = () => {
      const g = game.current!;
      ctx.fillStyle = "#e3f2fd";
      g.clouds.forEach(cl => {
        cl.x -= cl.v;
        if (cl.x < -60) {
          cl.x = g.w + Math.random() * g.w;
          cl.y = 40 + Math.random() * (g.h * 0.35);
        }
        ctx.beginPath();
        ctx.arc(cl.x, cl.y, 16, 0, Math.PI * 2);
        ctx.arc(cl.x + 18, cl.y + 4, 14, 0, Math.PI * 2);
        ctx.arc(cl.x - 16, cl.y + 6, 12, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawGround = () => {
      const g = game.current!;
      if (g.sprites.background) {
        ctx.drawImage(g.sprites.background, 0, 0, g.w, g.h);
      } else {
        ctx.fillStyle = "#fafafa";
        ctx.fillRect(0, 0, g.w, g.h);
      }
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(0, ground() + 18, g.w, 4);
      ctx.fillStyle = "#4caf50";
      for (let i = 0; i < g.w; i += 32)
        ctx.fillRect((i - (g.t * g.speed) % 32), ground() + 10, 22, 2);
    };

    // runner with face
    const drawRunner = () => {
      const g = game.current!;
      const baseW = 36, baseH = 44;
      const rh = g.ducking ? Math.floor(baseH * DUCK_SCALE) : baseH;
      const rw = g.ducking ? Math.floor(baseW * 1.25) : baseW;
      const rx = g.x - Math.floor(rw * 0.5);
      const ry = g.y - rh;

      // torso
      ctx.fillStyle = "#1f2937";
      const torsoH = Math.floor(rh * 0.48);
      ctx.fillRect(rx + Math.floor(rw * 0.35), ry + Math.floor(rh * 0.2), Math.floor(rw * 0.3), torsoH);

      // head with face
      const headR = Math.floor(rh * 0.18);
      const headCx = rx + Math.floor(rw * 0.5);
      const headCy = ry + Math.floor(rh * 0.12) + headR;
      if (g.sprites.face) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(g.sprites.face, headCx - headR, headCy - headR, headR * 2, headR * 2);
        ctx.restore();
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#fcd34d";
        ctx.beginPath();
        ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
        ctx.fill();
      }

      // arms + legs
      const swing = Math.sin(g.t * 0.25) * (g.ducking ? 3 : 6);
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rx + rw * 0.38, ry + rh * 0.35);
      ctx.lineTo(rx + rw * 0.25, ry + rh * 0.5 + swing);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx + rw * 0.62, ry + rh * 0.35);
      ctx.lineTo(rx + rw * 0.75, ry + rh * 0.5 - swing);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.beginPath();
      const leg = Math.sin(g.t * 0.25);
      ctx.moveTo(rx + rw * 0.48, g.y - 6);
      ctx.lineTo(rx + rw * (0.48 - 0.18 * leg), g.y + 10);
      ctx.moveTo(rx + rw * 0.52, g.y - 6);
      ctx.lineTo(rx + rw * (0.52 + 0.18 * leg), g.y + 10);
      ctx.stroke();
    };

    // draw an obstacle
    const drawObstacle = (o: any) => {
      if (o.kind === "bird") {
        o.flap! += 0.25;
        const flapY = Math.sin(o.flap!) * 4;
        ctx.fillStyle = "#37474f";
        ctx.fillRect(o.x, o.y + flapY, o.w, o.h);
        ctx.fillStyle = "#212121";
        ctx.fillRect(o.x + 4, o.y + flapY + 6, o.w - 8, 3);
      } else {
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = "#3e2e26";
        ctx.fillRect(o.x + 3, o.y + 3, Math.max(2, o.w - 6), Math.max(2, o.h - 6));
      }
    };

    // collision
    const hit = (o: any) => {
      const g = game.current!;
      const baseW = 28, baseH = 20;
      const rh = g.ducking ? Math.floor(baseH * DUCK_SCALE) : baseH;
      const rw = g.ducking ? Math.floor(baseW * 1.25) : baseW;
      const rx = g.x - Math.floor(rw * 0.5);
      const ry = g.y - rh;
      const pad = 4;
      const ax1 = rx + pad, ay1 = ry + pad, ax2 = rx + rw - pad, ay2 = ry + rh - pad;
      const bx1 = o.x + 2, by1 = o.y + 2, bx2 = o.x + o.w - 2, by2 = o.y + o.h - 2;
      return !(ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2);
    };

    async function start() {
      const run = getRun();
      const faceUrl = run?.faceUrl || undefined;
      const [bg, face] = await Promise.all([
        tryLoad("/dino-bg.svg"), // file in /public
        tryLoad(faceUrl),
      ]);
      game.current!.sprites.background = bg;
      game.current!.sprites.face = face;

      // initialize
      game.current!.x = Math.max(30, Math.floor(game.current!.w * 0.06));
      game.current!.y = ground();
      game.current!.obs = [];
      game.current!.clouds = [];
      for (let i = 0; i < 4; i++) spawnCloud();

      // listeners
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      c.addEventListener("touchstart", onTouchStart, { passive: false });

      const step = () => {
        const g = game.current!;
        ctx.clearRect(0, 0, g.w, g.h);
        drawGround();
        drawClouds();

        // physics
        g.vy += GRAVITY;
        g.y += g.vy;
        if (g.y >= ground()) { g.y = ground(); g.vy = 0; g.jumping = false; }
        g.ducking = (g.duckKeyHeld || duckBtnHeld) && g.y >= ground();

        // runner
        drawRunner();

        // obstacles
        g.spawnTick++;
        if (g.spawnTick >= g.spawnEvery) {
          spawnObstacle();
          g.spawnTick = 0;
          g.spawnEvery = Math.max(36, g.spawnEvery - 1);
        }
        g.obs.forEach(o => { o.x -= Math.max(o.v, g.speed); drawObstacle(o); });
        g.obs = g.obs.filter(o => o.x > -120);

        // collisions
        const behindMargin = 6;
        for (const o of g.obs) {
          if (o.x + o.w < g.x - behindMargin) continue;
          else if (hit(o)) { g.dead = true; break; }
        }

        // score / difficulty
        g.sc++;
        setScore(g.sc);
        if (g.sc % 250 === 0) g.speed = Math.min(14, g.speed + 0.3);

        // end states
        if (g.dead && alive) {
          setAlive(false);
          setShowdeath(true);
          setBest(b => Math.max(b, g.sc));
          cancelAnimationFrame(g.raf);
          return;
        }
        if (g.sc >= PASS_SCORE && alive) {
          setPassed(true);
          setBest(b => Math.max(b, g.sc));
          cancelAnimationFrame(g.raf);
          return;
        }

        g.t++;
        g.raf = requestAnimationFrame(step);
      };

      step();
    }

    start().catch(() => {
      if (game.current) {
        game.current.sprites.face = undefined;
        game.current.sprites.background = undefined;
      }
    });

    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("click", onFirstClick);
      c.removeEventListener("touchstart", onTouchStart as any);
      if (game.current) cancelAnimationFrame(game.current.raf);
    };
  }, [duckBtnHeld, alive]);

  return (
    <main className="w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Score 4000 points to advance!</h1>

      {/* Autoplays muted; we unmute on first key/tap/click */}
      <audio ref={audioRef} src="/nyan.mp3" autoPlay loop muted />

      <div className="panel flex items-center justify-between text-sm">
        <div>Score: <b>{score}</b> / 4000 &nbsp; | &nbsp; Best: <b>{best}</b></div>
        <div className="hidden md:block text-xs opacity-80">Space/↑ jump, hold ↓ to duck</div>
      </div>

      <div className="panel relative w-full overflow-hidden select-none" style={{ height: "60vh" }}>
        <canvas ref={cv} className="w-full h-full block" />

        {/* Mobile DUCK button */}
        <div
          className="absolute right-3 bottom-3 w-20 h-20 rounded-xl border-2 border-black bg-white/70 backdrop-blur-sm flex items-center justify-center text-sm font-bold"
          onTouchStart={(e) => { e.preventDefault(); setDuckBtnHeld(true); }}
          onTouchEnd={() => setDuckBtnHeld(false)}
          onMouseDown={() => setDuckBtnHeld(true)}
          onMouseUp={() => setDuckBtnHeld(false)}
          onMouseLeave={() => setDuckBtnHeld(false)}
        >
          DUCK
        </div>

        {/* Overlays */}
        {showdeath && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 text-white">
            <div className="text-2xl font-extrabold">Oof! You crashed.</div>
            <div>Noob.</div>
            <button className="btn" onClick={() => location.reload()}>Restart</button>
          </div>
        )}
        {passed && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 text-white">
            <div className="text-2xl font-extrabold">Nice! You cleared 4000.</div>
            <button className="btn" onClick={() => router.push("/memory")}>Continue</button>
          </div>
        )}
      </div>

      <div className="panel text-xs md:text-sm">
        Controls: <b>Space/↑</b> to jump, hold <b>↓</b> to duck. On mobile: tap to jump, hold the <b>DUCK</b> button.
      </div>
    </main>
  );
}
