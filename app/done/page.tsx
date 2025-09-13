"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getRun, clearRun } from "@/lib/run";
import { pushResult } from "@/lib/leaderboard";

export default function Done() {
  const sp = useSearchParams();
  const r = useRouter();

  // Final time (ms) passed from Battle: /done?ms=12345
  const ms = Number(sp.get("ms") || 0);
  const nice = useMemo(() => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const m3 = ms % 1000;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(m3).padStart(3, "0")}`;
  }, [ms]);

  const run = getRun(); // { sessionId, playerName, faceUrl, startedAt } or null
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  // Submit once (guarded) when we land here
  useEffect(() => {
    if (!run || !ms) return; // nothing to submit (still show the page)
    const guardKey = `lb_submitted_${run.sessionId}`;

    // prevent double submit on refresh/back
    if (sessionStorage.getItem(guardKey)) {
      setStatus("ok");
      // still clear local run to avoid stale face/name on next session
      clearRun();
      return;
    }

    (async () => {
      try {
        setStatus("submitting");
        await pushResult(run.playerName || "Player", ms, run.faceUrl || undefined);
        sessionStorage.setItem(guardKey, "1");
        setStatus("ok");
      } catch (e: any) {
        setErr(e?.message || "Failed to submit score");
        setStatus("error");
      } finally {
        // Clear local run after submission attempt (prevents reuse)
        clearRun();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);

  return (
    <main className="min-h-dvh w-screen bg-gray-900 text-white grid place-items-center p-6">
      <div className="w-full max-w-3xl space-y-6 text-center">
        <h1 className="text-3xl font-bold">🏁 Quest Complete!</h1>

        {/* Player badge */}
        <div className="flex items-center justify-center gap-3">
          {run?.faceUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={run.faceUrl} alt={run.playerName} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10" />
          )}
          <div className="text-left">
            <div className="font-semibold">{run?.playerName || "Player"}</div>
            <div className="text-xs text-white/60">Your final time</div>
          </div>
        </div>

        <div className="panel text-2xl">
          Time: <b className="font-mono">{nice}</b>
        </div>

        <div
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-lg text-white shadow-sm"
>
  <span className="opacity-80">If you are Xinyun, the password is:</span>
  <b className="font-mono text-base bg-black/30 px-2 py-0.5 rounded-md tracking-wider">
    8921
  </b>
</div>

        {/* Submit status */}
        <div className="text-sm">
          {status === "submitting" && <span className="opacity-80">Submitting to leaderboard…</span>}
          {status === "ok" && <span className="text-emerald-400">Submitted!</span>}
          {status === "error" && (
            <div className="text-red-400">
              {err}
              <div className="mt-2">
                {/* <button
                  className="btn"
                  onClick={async () => {
                    try {
                      setStatus("submitting");
                      await pushResult(run?.playerName || "Player", ms, run?.faceUrl || undefined);
                      setStatus("ok");
                    } catch (e: any) {
                      setErr(e?.message || "Failed to submit score");
                      setStatus("error");
                    }
                  }}
                >
                  Retry submit
                </button> */}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button className="btn" onClick={() => r.push("/leaderboard")}>
            View Leaderboard
          </button>
          <button className="btn" onClick={() => r.push("/")}>
            Home
          </button>
        </div>
      </div>
    </main>
  );
}
