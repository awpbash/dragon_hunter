
"use client";
import { useRouter } from "next/navigation";
export default function Home() {
  const r = useRouter();
  return (
    <main className="w-full max-w-3xl space-y-6 text-center">
      <h1 className="text-3xl font-bold">🏰 Enter the Dungeon</h1>
      <p className="text-zinc-300">Prove yourself in trials and slay the DRAAAAAAgon. Your speed will be recorded.</p>
      <p className="text-zinc-100">PLEASE USE LAPTOP OR IPAD I CANNOT DO MOBILE DEV PLS GIVE CHANCE!</p>
      <button className="btn mx-auto" onClick={()=>r.push("/register")}>ENTER</button>
    </main>
  );
}
