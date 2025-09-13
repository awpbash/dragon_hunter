// lib/leaderboard.ts
export type Leader = { name: string; image?: string; time_ms: number };

export async function pushResult(name: string, timeMs: number, image?: string) {
  const res = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, timeMs, image }),
  });
  if (!res.ok) throw new Error("Failed to submit score");
}

export async function fetchLeaderboard(): Promise<Leader[]> {
  const res = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load leaderboard");
  return res.json();
}
