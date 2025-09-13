// lib/face.ts
// Face detect & crop using face-api.js (UMD) loaded at runtime from CDN.
// Works fully client-side and compiles in Next.js.

declare global {
  interface Window {
    faceapi?: any;
  }
}

const CDN = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.10";
const MODEL_URL = `${CDN}/model`; // hosts tiny_face_detector model files

async function ensureFaceApi() {
  if (window.faceapi) return window.faceapi;

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${CDN}/dist/face-api.min.js`;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load face-api script"));
    document.head.appendChild(s);
  });

  const faceapi = window.faceapi!;
  // load the tiny face detector model
  // (the model files are requested relative to MODEL_URL)
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  return faceapi;
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Detects the largest face, applies padding, and returns a square PNG Blob.
 * Falls back to center-crop if no face found.
 */
export async function detectAndCrop(
  file: File,
  outSize = 512,
  pad = 0.3
): Promise<Blob> {
  const faceapi = await ensureFaceApi();
  const img = await fileToImage(file);

  // Detect faces
  const options = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5, inputSize: 256 });
  const detections = await faceapi.detectAllFaces(img, options);

  let x = 0, y = 0, size = Math.min(img.width, img.height);

  if (detections && detections.length) {
    // pick largest
    detections.sort(
      (a: any, b: any) =>
        b.box.width * b.box.height - a.box.width * a.box.height
    );
    const bb = detections[0].box; // { x, y, width, height }
    const cx = bb.x + bb.width / 2;
    const cy = bb.y + bb.height / 2;
    const half = Math.max(bb.width, bb.height) * (1 + pad) / 2;

    const sx = Math.max(0, Math.floor(cx - half));
    const sy = Math.max(0, Math.floor(cy - half));
    const s = Math.floor(
      Math.min(img.width - sx, img.height - sy, half * 2)
    );

    x = sx; y = sy; size = s;
  }

  // Draw to canvas and export
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = outSize;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, x, y, size, size, 0, 0, outSize, outSize);

  return await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), "image/png", 0.92)
  );
}
