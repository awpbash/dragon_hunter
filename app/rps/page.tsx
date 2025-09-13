"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Pacman.module.css";
import { getRun } from "@/lib/run"; // ✅ pull faceUrl from your session

/**
 * Maze rules:
 *  - 1 = wall
 *  - 0 = floor
 *  - 5 = START (player spawn)
 *  - 6 = EXIT (reach to win)
 *  - 7 = TRAP (triggers jumpscare overlay once)
 */
export default function MazeGrid() {
  const r = useRouter();
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<"playing" | "won" | "dead">("playing");
  const [steps, setSteps] = useState(0);
  const [showScare, setShowScare] = useState(false);
  const [version, setVersion] = useState(0); // restart bump

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
    // Complex maze layout (28 cols × 31 rows)
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

    // Helper: apply/remove the face styling on the current player cell
    const applyPlayerStyle = (el: HTMLDivElement) => {
      el.classList.add(CL.player);
      if (faceUrl) {
        el.style.backgroundImage = `url("${faceUrl}")`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 0 2px #000 inset, 0 0 12px rgba(0,0,0,.35)";
      } else {
        // fallback to default Pac-Man token from CSS module
        el.style.backgroundImage = "";
        el.style.borderRadius = "";
        el.style.boxShadow = "";
      }
    };
    const clearPlayerStyle = (el: HTMLDivElement) => {
      el.classList.remove(CL.player);
      // clear inline overrides so the cell looks like a normal floor after moving away
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
      el.style.borderRadius = "";
      el.style.boxShadow = "";
    };

    // Spawn player at START
    let startIndex = layout.findIndex(v => v === 5);
    if (startIndex < 0) startIndex = 1 * width + 1; // fallback
    let playerIndex = startIndex;
    applyPlayerStyle(squares[playerIndex]);

    const exitIndex = layout.findIndex(v => v === 6);

    const canWalk = (idx: number) =>
      idx >= 0 &&
      idx < layout.length &&
      !squares[idx].classList.contains(CL.wall);

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
      if (status !== "playing" || showScare) return;

      let next = playerIndex;
      if (e.key === "ArrowLeft"  && playerIndex % width !== 0) next = playerIndex - 1;
      if (e.key === "ArrowRight" && playerIndex % width !== width - 1) next = playerIndex + 1;
      if (e.key === "ArrowUp")   next = playerIndex - width;
      if (e.key === "ArrowDown") next = playerIndex + width;

      if (!canWalk(next)) return;

      // move: remove from old, add to new (and re-apply face)
      clearPlayerStyle(squares[playerIndex]);
      playerIndex = next;
      applyPlayerStyle(squares[playerIndex]);
      setSteps(s => s + 1);

      // TRAP -> jumpscare (once)
      if (squares[playerIndex].classList.contains(CL.trap)) {
        squares[playerIndex].classList.remove(CL.trap);
        setShowScare(true);
      }

      // EXIT -> win
      if (playerIndex === exitIndex) {
        setStatus("won");
      }
    };

    document.addEventListener("keydown", onKey, { passive: false });
    return () => document.removeEventListener("keydown", onKey as any);
  }, [r, version]);

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
          {/* keep it compact; remove styles.sm for full size */}
          <div ref={gridRef} className={`${styles.grid} ${styles.sm}`} />
        </div>

        <div className={styles.cmdPanel}>
          {status === "playing" && <p>Use ← ↑ → ↓ to reach <b>EXIT</b>. Watch for traps 👀</p>}

          {status !== "playing" && (
            <div className={styles.endRow}>
              <button className={styles.btn} onClick={() => { setSteps(0); setVersion(v => v + 1); }}>
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
