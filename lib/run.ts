// lib/run.ts
export type Run = {
  sessionId: string;
  playerName: string;
  faceUrl?: string | null;
  startedAt: number;
};

const RUN_KEY = "run";
const RUN_STARTED_KEY = "run_startedAt";
const RUN_SESSION_KEY = "run_sessionId";

function hasWindow() {
  return typeof window !== "undefined";
}

export function newRun(playerName: string, faceUrl?: string | null): Run {
  const sessionId =
    (hasWindow() && globalThis.crypto?.randomUUID && crypto.randomUUID()) ||
    `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();
  const run: Run = { sessionId, playerName, faceUrl: faceUrl ?? null, startedAt };

  if (hasWindow()) {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
    localStorage.setItem(RUN_STARTED_KEY, String(startedAt));
    localStorage.setItem(RUN_SESSION_KEY, sessionId);
    sessionStorage.setItem("run_session", JSON.stringify(run));
  }
  return run;
}

export function getRun(): Run | null {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(RUN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Run; } catch { return null; }
}

export function getElapsedMs(): number {
  if (!hasWindow()) return 0;
  const started = Number(localStorage.getItem(RUN_STARTED_KEY));
  if (!started) return 0;
  return Date.now() - started;
}

export function clearRun() {
  if (!hasWindow()) return;
  localStorage.removeItem(RUN_KEY);
  localStorage.removeItem(RUN_STARTED_KEY);
  localStorage.removeItem(RUN_SESSION_KEY);
  localStorage.removeItem("run_elapsed_final");
  sessionStorage.removeItem("run_session");
}
