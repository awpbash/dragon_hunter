import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  await sql`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT,
      time_ms INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}

export async function GET() {
  await ensureTable(); // <-- ensure once
  const { rows } = await sql`
    SELECT name, image, time_ms
    FROM leaderboard
    ORDER BY time_ms ASC
    LIMIT 20
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await ensureTable(); // <-- ensure once
  const { name, image, timeMs } = await req.json();
  if (!name || typeof timeMs !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await sql`
    INSERT INTO leaderboard (name, image, time_ms)
    VALUES (${name}, ${image || null}, ${timeMs})
  `;
  return NextResponse.json({ ok: true });
}
