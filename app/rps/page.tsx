"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Pacman.module.css";
import { getRun } from "@/lib/run";

type Status = "playing" | "won" | "dead";

export default function MazeGrid() {
  const r = useRouter();
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<Status>("playing");
  const [steps, setSteps] = useState(0);
  const [showScare, setShowScare] = useState(false);
  const [version, setVersion] = useState(0); // restart bump

  // Keep references usable by handlers
  const stateRef = useRef({
    width: 28,
    layout: [] as number[],
    squares: [] as HTMLDivElement[],
    playerIndex: 0,
    exitIndex: 0,
    canWalk: (idx: number) => false as boolean,
    applyPlayerStyle: (el: HTMLDivElement) => {},
    clearPlayerStyle: (el: HTMLDivElement) => {},
  });

  useEffect(() => {
    if (!gridRef.current) return;

    const width = 28;

    // CSS module tokens
    const CL = {
      wall: styles.wall,
      floor: styles.floor ?? styles.empty,
      start: styles.start,
      exit: styles.exit,
      trap: styles.trap,
      player: styles.pacMan, // we'll override its background via inline style
    } as const;

    // Pull faceUrl (data URL or remote URL). If none, we keep default Pac-Man.
    const faceUrl = getRun()?.faceUrl || null;

    // ──────────────────
    // Maze layout (28 cols × 31 rows)
    // ──────────────────
    const layout = [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,5,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,1,0,0,0,1,0,0,0,7,0,1,
      1,1,1,0,1,0,1,0,1,0,1,1,0,1,1,0,1,1,0,1,0,1,0,1,0,1,0,1,
      1,0,0,0,1,0,1,0,0,0,1,0,0,1,1,0,0,1,0,1,0,0,0,1,0,1,0,1,
      1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,
      1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,7,0,1,0,0,0,1,0,0,0,1,0,1,
      1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,0,1,1,1,0,1,1,1,0,1,0,1,
      1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1,
      1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,1,0,1,
      1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,1,0,0,0,1,0,0,0,1,0,1,
      1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,1,0,1,0,1,
      1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,7,0,1,0,1,
      1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,0,1,1,1,0,1,0,1,
      1,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,0,1,0,0,0,1,
      1,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,
      1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,7,0,1,0,0,0,1,0,0,0,1,
      1,0,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,
      1,0,1,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,
      1,0,1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,
      1,0,0,0,0,1,0,0,0,1,0,0,0,7,0,0,0,0,0,1,0,0,0,1,0,0,0,1,
      1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,
      1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,
      1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,
      1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,
      1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,
      1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,
      1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,6,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ];

    // Build board
    const grid = gridRef.current!;
    grid.innerHTML = "";
    const squares: HTMLDivElement[] = [];
    for (let i = 0; i < layout.length; i++) {
      const sq = document.createElement("div");
      grid.appendChild(sq);
      squares.push(sq);
      const v = layout[i];
      if (v === 1) sq.classList.add(CL.wall);
      if (v === 0) sq.classList.add(CL.floor);
      if (v === 5) sq.classList.add(CL.start, CL.floor);
      if (v === 6) sq.classList.add(CL.exit, CL.floor);
      if (v === 7) sq.classList.add(CL.trap, CL.floor);
    }

    // Helpers to style/clear the player cell
    const applyPlayerStyle = (el: HTMLDivElement) => {
      el.classList.add(CL.player);
      if (faceUrl) {
        el.style.backgroundImage = `url("${faceUrl}")`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 0 2px #000 inset, 0 0 12px rgba(0,0,0,.35)";
      } else {
        el.style.backgroundImage = "";
        el.style.borderRadius = "";
        el.style.boxShadow = "";
      }
    };
    const clearPlayerStyle = (el: HTMLDivElement) => {
      el.classList.remove(CL.player);
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
      el.style.borderRadius = "";
      el.style.boxShadow = "";
    };

    // Spawn at START
    let startIndex = layout.findIndex(v => v === 5);
    if (startIndex < 0) startIndex = 1 * width + 1; // fallback
    let playerIndex = startIndex;
    applyPlayerStyle(squares[playerIndex]);

    const exitIndex = layout.findIndex(v => v === 6);

    const canWalk = (idx: number) =>
      idx >= 0 &&
      idx < layout.length &&
      !squares[idx].classList.contains(CL.wall);

    // Expose to handlers via ref
    stateRef.current = {
      width,
      layout,
      squares,
      playerIndex,
      exitIndex,
      canWalk,
      applyPlayerStyle,
      clearPlayerStyle,
    };

    const move = (dir: "left" | "right" | "up" | "down") => {
      if (status !== "playing" || showScare) return;
      const st = stateRef.current;
      let next = st.playerIndex;
      if (dir === "left"  && st.playerIndex % st.width !== 0) next = st.playerIndex - 1;
      if (dir === "right" && st.playerIndex % st.width !== st.width - 1) next = st.playerIndex + 1;
      if (dir === "up")   next = st.playerIndex - st.width;
      if (dir === "down") next = st.playerIndex + st.width;
      if (!st.canWalk(next)) return;

      st.clearPlayerStyle(st.squares[st.playerIndex]);
      st.playerIndex = next;
      st.applyPlayerStyle(st.squares[st.playerIndex]);
      setSteps(s => s + 1);

      if (st.squares[st.playerIndex].classList.contains(CL.trap)) {
        st.squares[st.playerIndex].classList.remove(CL.trap);
        setShowScare(true);
      }
      if (st.playerIndex === st.exitIndex) setStatus("won");
    };

    // Keyboard
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft")  move("left");
      if (e.key === "ArrowRight") move("right");
      if (e.key === "ArrowUp")    move("up");
      if (e.key === "ArrowDown")  move("down");
    };
    document.addEventListener("keydown", onKey, { passive: false });

    // Swipe support
    let touchStartX = 0, touchStartY = 0, moved = false;
    const SWIPE_MIN = 24; // px
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      moved = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      // prevent page scroll while interacting with the maze
      e.preventDefault();
      moved = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (!moved) return;
      if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? "right" : "left");
      } else {
        move(dy > 0 ? "down" : "up");
      }
    };

    // Attach swipe to grid only (not whole page)
    grid.addEventListener("touchstart", onTouchStart, { passive: false });
    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    grid.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("keydown", onKey as any);
      grid.removeEventListener("touchstart", onTouchStart as any);
      grid.removeEventListener("touchmove", onTouchMove as any);
      grid.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [r, version, status, showScare]);

  // On-screen D-pad for mobile
  const handleMove = (dir: "left" | "right" | "up" | "down") => {
    const st = stateRef.current;
    // re-use the same logic as in effect
    const evt = new KeyboardEvent("keydown", {
      key:
        dir === "left" ? "ArrowLeft" :
        dir === "right" ? "ArrowRight" :
        dir === "up" ? "ArrowUp" : "ArrowDown"
    });
    document.dispatchEvent(evt);
  };

  return (
    <main className={styles.page}>
      <div className={styles.hudBar}>
        <div className={styles.hudTitle}>MAZE — Find the Exit</div>
        <div className={styles.hudRight}>
          <span>Steps: {steps}</span>
          {status === "dead" && <span className={styles.bad}>Defeated</span>}
          {status === "won"  && <span className={styles.good}>Cleared!</span>}
        </div>
      </div>

      <div className={styles.frame}>
        <div className={styles.board}>
          {/* TIP: remove styles.sm to make the grid larger on phones */}
          <div ref={gridRef} className={`${styles.grid} ${styles.sm}`} />
        </div>

        <div className={styles.cmdPanel}>
          {status === "playing" && (
            <p>Use ← ↑ → ↓ (or swipe / D-pad) to reach <b>EXIT</b>. Watch for traps 👀</p>
          )}

          {status !== "playing" && (
            <div className={styles.endRow}>
              <button
                className={styles.btn}
                onClick={() => { setSteps(0); setVersion(v => v + 1); setStatus("playing"); }}
              >
                Restart
              </button>
              {status === "won" && (
                <button className={styles.btn} onClick={() => r.push("/dino")}>
                  Continue → Dino
                </button>
              )}
            </div>
          )}
        </div>

        {/* On-screen D-pad (shows on all screens; tweak with responsive classes if desired) */}
        <div className="fixed bottom-4 right-4 grid grid-cols-3 gap-2 select-none touch-manipulation">
          <div />
          <button
            aria-label="Up"
            onClick={() => handleMove("up")}
            className="w-14 h-14 rounded-xl bg-white/80 text-black font-bold border-2 border-black active:translate-y-[1px]"
          >↑</button>
          <div />
          <button
            aria-label="Left"
            onClick={() => handleMove("left")}
            className="w-14 h-14 rounded-xl bg-white/80 text-black font-bold border-2 border-black active:translate-y-[1px]"
          >←</button>
          <button
            aria-label="Down"
            onClick={() => handleMove("down")}
            className="w-14 h-14 rounded-xl bg-white/80 text-black font-bold border-2 border-black active:translate-y-[1px]"
          >↓</button>
          <button
            aria-label="Right"
            onClick={() => handleMove("right")}
            className="w-14 h-14 rounded-xl bg-white/80 text-black font-bold border-2 border-black active:translate-y-[1px]"
          >→</button>
        </div>
      </div>

      {/* Jumpscare overlay (unchanged) */}
      {showScare && (
        <div
          onClick={() => setShowScare(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            zIndex: 9999,
            animation: "flashBg 0.4s alternate infinite",
          }}
        >
          <img
            src="/dragon.png"
            alt="Dragon!"
            style={{
              width: "80%",
              maxWidth: "800px",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 0 30px red) drop-shadow(0 0 60px orange)",
              animation: "scaleIn 0.6s ease-out",
            }}
          />
          <h1
            style={{
              color: "red",
              fontSize: "3rem",
              fontWeight: 900,
              textShadow: "0 0 20px crimson, 0 0 40px darkred",
              marginTop: "1rem",
              animation: "shake 0.3s infinite",
            }}
          >
            You have activated a trap!
          </h1>
          <h2
            style={{
              color: "white",
              fontSize: "2.5rem",
              fontWeight: "bold",
              textShadow: "0 0 25px red, 0 0 50px orange",
              animation: "pulse 1s infinite alternate",
            }}
          >
            RAWRRRRR
          </h2>
          <audio autoPlay src="/dragon-roar.mp3" />
          <button
            onClick={(e) => { e.stopPropagation(); setShowScare(false); }}
            style={{
              marginTop: "2rem",
              padding: "0.8rem 2rem",
              background: "white",
              color: "black",
              border: "none",
              borderRadius: "9999px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "1rem",
              boxShadow: "0 0 20px red, 0 0 40px orange",
              transition: "transform 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
          >
            Back to maze
          </button>

          <style jsx>{`
            @keyframes shake { 0%{transform:translateX(0)}25%{transform:translateX(-5px)}50%{transform:translateX(5px)}75%{transform:translateX(-5px)}100%{transform:translateX(0)} }
            @keyframes pulse { from{transform:scale(1);opacity:1} to{transform:scale(1.2);opacity:.6} }
            @keyframes flashBg { from{background-color:rgba(0,0,0,.95)} to{background-color:rgba(30,0,0,1)} }
            @keyframes scaleIn { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
          `}</style>
        </div>
      )}
    </main>
  );
}
