"use client";
import { useState } from "react";
import { detectAndCrop } from "@/lib/face";
import { newRun } from "@/lib/run";
import { useRouter } from "next/navigation";

/** Turn a Blob into a data URL for preview + lightweight persistence */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
}

export default function Register() {
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null); // data URL
  const [busy, setBusy] = useState(false);
  const r = useRouter();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      // crop & normalize (512px, 0.3 face padding)
      const blob = await detectAndCrop(f, 512, 0.3);
      const dataUrl = await blobToDataURL(blob);
      setPreview(dataUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to process image. Try another photo?");
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    const playerName = name.trim();
    if (!playerName) return alert("Enter your name");
    if (!preview) return alert("Please upload a face photo");
    if (busy) return;

    setBusy(true);
    try {
      // ----- TIMER STARTS & SESSION CREATED HERE -----
      const run = newRun(playerName, preview); // writes to localStorage + sessionStorage

      // Optional: immediately persist the session start on your backend
      // await fetch("/api/leaderboard/start", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     sessionId: run.sessionId,
      //     name: run.playerName,
      //     startedAt: run.startedAt,
      //     // For production, upload the image and send a URL instead of a data URL
      //     // faceUrl: run.faceUrl,
      //   }),
      // });

      r.push("/rps"); // first game
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh w-screen grid place-items-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">📝 Registration</h1>

        <div className="panel space-y-3 p-4">
          <label className="block text-sm">Name</label>
          <input
            className="panel w-full text-black px-3 py-2 rounded-md"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="block text-sm mt-2">Selfie / Image (for your knight)</label>
          <input type="file" accept="image/*" onChange={onFile} />

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="face"
              className="w-32 h-32 rounded-full border-2 border-black object-cover mt-3"
            />
          )}
        </div>

        <button className="btn disabled:opacity-60" disabled={busy} onClick={start}>
          {busy ? "Processing..." : "Start Quest →"}
        </button>
      </div>
    </main>
  );
}
