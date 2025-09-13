"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

  // Camera modal state
  const [camOpen, setCamOpen] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const r = useRouter();

  // ======== helpers ========
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
  }, []);

  useEffect(() => {
    return () => stopStream(); // cleanup on unmount
  }, [stopStream]);

  async function handleBlobInput(blob: Blob) {
    setError(null);
    setBusy(true);
    try {
      const file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
      const cropped = await detectAndCrop(file, 512, 0.3);
      const dataUrl = await blobToDataURL(cropped);
      setPreview(dataUrl);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to process image. Try another photo?");
    } finally {
      setBusy(false);
    }
  }

  // ======== gallery flow ========
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    await handleBlobInput(f);
    // reset input so same file can be chosen again if needed
    e.currentTarget.value = "";
  }

  // ======== camera flow ========
  async function openCamera() {
    setError(null);
    // require HTTPS or localhost for camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // front camera on phones
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      // iOS-friendly
      v.muted = true;
      v.playsInline = true;
      await v.play();
      setCamReady(true);
      setCamOpen(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied. You can choose from gallery instead."
          : "Could not open camera. Try gallery or a different browser."
      );
    }
  }

  async function capturePhoto() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    // Use the actual video size for crisp capture
    const vw = v.videoWidth || 640;
    const vh = v.videoHeight || 480;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(v, 0, 0, vw, vh);

    // Convert canvas -> Blob
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.92)!);
    await handleBlobInput(blob);
    // close camera
    setCamOpen(false);
    stopStream();
  }

  function closeCamera() {
    setCamOpen(false);
    stopStream();
  }

  // ======== start run ========
  async function start() {
    const playerName = name.trim();
    if (!playerName) return alert("Enter your name");
    if (!preview) return alert("Please upload or take a face photo");
    if (busy) return;

    setBusy(true);
    try {
      // TIMER STARTS & SESSION CREATED HERE
      newRun(playerName, preview);
      r.push("/rps"); // first game
    } finally {
      setBusy(false);
    }
  }

  const canUseCamera = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

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
            inputMode="text"
            autoComplete="name"
          />

          <label className="block text-sm mt-2">Selfie / Image (for your knight)</label>

          {/* Buttons for both gallery + camera */}
          <div className="flex flex-wrap gap-2">
            {/* GALLERY */}
            <label className="btn cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile}
              />
              Choose from Gallery
            </label>

            {/* CAMERA — works on HTTPS, PWA, most mobile browsers */}
            {canUseCamera && (
              <button type="button" className="btn" onClick={openCamera}>
                Take a Photo
              </button>
            )}
          </div>

          {/* Optional hint for iOS in-app browsers */}
          {!canUseCamera && (
            <p className="text-xs text-white/60">
              Tip: to take a photo, open this site over HTTPS in Safari/Chrome or install it as an app (Add to Home Screen).
            </p>
          )}

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="face"
              className="w-32 h-32 rounded-full border-2 border-black object-cover mt-3"
            />
          )}

          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>

        <button className="btn disabled:opacity-60" disabled={busy} onClick={start}>
          {busy ? "Processing..." : "Start Quest →"}
        </button>
      </div>

      {/* ===== Camera Modal ===== */}
      {camOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeCamera}
        >
          <div
            className="bg-white rounded-xl p-3 w-full max-w-md text-black shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center font-semibold mb-2">Take a Photo</div>

            <div className="relative w-full rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              {!camReady && (
                <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
                  Initializing camera…
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button className="btn" onClick={closeCamera}>Cancel</button>
              <button className="btn" onClick={capturePhoto} disabled={!camReady}>
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
