
"use client";
import { useEffect, useState } from "react";
import { loadBoard, fmt } from "@/lib/leaderboard";

type Row = { name: string; timeMs: number; ts: string; faceUrl?: string };

export default function Board(){
  const [rows,setRows]=useState<Row[]>([]);
  useEffect(()=>{ setRows(loadBoard()); },[]);
  return (
    <main className="w-full max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">🏆 Leaderboard (Local)</h1>
      <div className="panel overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr><th className="p-2">#</th><th className="p-2">Player</th><th className="p-2">Time</th></tr></thead>
          <tbody>
          {rows.map((r,i)=>(
            <tr key={i} className="border-t border-black/20">
              <td className="p-2">{i+1}</td>
              <td className="p-2 flex items-center gap-2">
                {r.faceUrl && <img src={r.faceUrl} className="w-8 h-8 rounded-full border-2 border-black" alt="" />}
                {r.name}
              </td>
              <td className="p-2">{fmt(r.timeMs)}</td>
            </tr>
          ))}
          {rows.length===0 && <tr><td className="p-2" colSpan={3}>No runs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
