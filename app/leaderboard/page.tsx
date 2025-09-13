// app/leaderboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchLeaderboard, type Leader } from "@/lib/leaderboard";

export default function LeaderboardPage() {
  const r = useRouter();
  const [rows, setRows] = useState<Leader[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchLeaderboard();
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.time_ms - b.time_ms),
    [rows]
  );
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const fmt = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  if (loading)
    return (
      <main className="min-h-dvh w-screen grid place-items-center bg-gray-900 text-white">
        Loading…
      </main>
    );

  if (err)
    return (
      <main className="min-h-dvh w-screen grid place-items-center bg-gray-900 text-white p-4">
        <div className="panel max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold">Leaderboard Error</h1>
          <p className="mt-2 text-red-400">{err}</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button className="btn" onClick={() => location.reload()}>Retry</button>
            <button className="btn" onClick={() => r.push("/")}>Home</button>
          </div>
        </div>
      </main>
    );

  return (
    <main className="min-h-dvh w-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* top bar */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 py-4">
        <button
          className="px-4 py-2 rounded-xl border-2 border-black bg-white text-gray-900 font-bold shadow-[0_4px_0_#000] active:translate-y-[2px]"
          onClick={() => r.push("/")}
        >
          ← Home
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold">🏆 Leaderboard</h1>
        <div className="w-[96px]" />
      </div>

      {/* podium */}
      <section className="px-4 sm:px-6 mt-2">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-6xl mx-auto">
          <Podium rank={2} entry={top3[1]} className="h-48 sm:h-56" />
          <Podium rank={1} entry={top3[0]} className="h-60 sm:h-72" highlight />
          <Podium rank={3} entry={top3[2]} className="h-40 sm:h-48" />
        </div>
      </section>

      {/* full-width list */}
      <section className="px-4 sm:px-6 mt-8 pb-12">
        <div className="max-w-6xl mx-auto overflow-hidden rounded-2xl border-2 border-black bg-white/5 backdrop-blur">
          <div className="grid grid-cols-12 px-4 py-2 text-xs sm:text-sm text-gray-300 border-b border-white/10">
            <div className="col-span-1 text-right pr-2">#</div>
            <div className="col-span-2 sm:col-span-1">Avatar</div>
            <div className="col-span-6 sm:col-span-8">Name</div>
            <div className="col-span-3 sm:col-span-2 text-right">Time</div>
          </div>
          <ul>
            {rest.map((r, i) => (
              <li
                key={`${r.name}-${r.time_ms}-${i}`}
                className="grid grid-cols-12 items-center px-4 py-3 border-b border-white/10 hover:bg-white/[0.06] transition-colors"
              >
                <div className="col-span-1 text-right pr-2 text-gray-400">{i + 4}</div>
                <div className="col-span-2 sm:col-span-1">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-black shadow-[0_2px_0_#000]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-black" />
                  )}
                </div>
                <div className="col-span-6 sm:col-span-8 font-semibold truncate">{r.name}</div>
                <div className="col-span-3 sm:col-span-2 text-right font-mono">{fmt(r.time_ms)}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Podium({
  rank,
  entry,
  className = "",
  highlight = false,
}: {
  rank: 1 | 2 | 3;
  entry?: Leader;
  className?: string;
  highlight?: boolean;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const ring =
    rank === 1 ? "ring-4 ring-yellow-300"
      : rank === 2 ? "ring-4 ring-gray-300"
      : "ring-4 ring-amber-700";

  if (!entry) return <div className={className} />;

  return (
    <div
      className={[
        "relative flex flex-col items-center justify-end",
        "rounded-2xl border-2 border-black shadow-[0_8px_0_#000]",
        highlight ? "bg-gradient-to-b from-yellow-300 to-amber-300 text-black" : "bg-white/10 text-white",
        className,
      ].join(" ")}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border-2 border-black bg-white text-black text-sm font-extrabold shadow-[0_3px_0_#000]">
        {medal} #{rank}
      </div>
      <div className="mb-4 flex flex-col items-center">
        {entry.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.image}
            alt={entry.name}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-black ${ring} shadow-[0_4px_0_#000]`}
          />
        ) : (
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 border-2 border-black ${ring}`} />
        )}
        <div className="mt-2 text-center">
          <div className={`font-extrabold ${highlight ? "text-black" : "text-white"}`}>{entry.name}</div>
          <div className={`font-mono text-sm ${highlight ? "text-gray-800" : "text-gray-300"}`}>
            {(entry.time_ms / 1000).toFixed(2)}s
          </div>
        </div>
      </div>
      <div
        className={[
          "w-full rounded-b-2xl border-t-2 border-black",
          highlight ? "bg-amber-500" : "bg-white/15",
        ].join(" ")}
        style={{ height: rank === 1 ? 56 : rank === 2 ? 40 : 32 }}
      />
    </div>
  );
}
