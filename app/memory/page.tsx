"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getRun } from "@/lib/run";

type Card = { id: number; label: string; src: string };

const IMAGES: Array<Pick<Card, "label" | "src">> = [
  { label: "dragon",  src: "dragon_1.png" },
  { label: "wizard",  src: "dragon_2.png" },
  { label: "sword",   src: "dragon_3.png" },
  { label: "shield",  src: "dragon_4.png" },
  { label: "potion",  src: "dragon_5.png" },
  { label: "fire",    src: "dragon_6.png" },
  { label: "diamond", src: "dragon-attack.png" },
  { label: "wand",    src: "dragon_8.png" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const r = (typeof crypto !== "undefined" && crypto.getRandomValues)
      ? crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
      : Math.random();
    const j = Math.floor(r * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const router = useRouter();
  const [deck, setDeck] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<"game" | "battle">("game");

  useEffect(() => {
    const run = getRun();
    const faceUrl = run?.faceUrl || null;

    // Build pairs (two of each label)
    const basePairs: Array<Pick<Card, "label" | "src">> = [...IMAGES, ...IMAGES];

    // If we have a face, choose a random label and replace BOTH of that label's cards with faceUrl
    let withFace = basePairs;
    if (faceUrl) {
      const chosen = IMAGES[Math.floor(Math.random() * IMAGES.length)].label;
      withFace = basePairs.map(c => (c.label === chosen ? { ...c, src: faceUrl } : c));
    }

    // Shuffle and assign unique ids
    const shuffled = shuffle(withFace).map((c, id) => ({ ...c, id }));
    setDeck(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setCurrentPage("game");
  }, []);

  useEffect(() => {
    if (deck.length > 0 && matched.length === deck.length) {
      setTimeout(() => setCurrentPage("battle"), 500);
    }
  }, [matched, deck]);

  function onFlip(index: number) {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [i1, i2] = newFlipped;
      if (deck[i1].label === deck[i2].label) {
        setMatched(prev => [...prev, i1, i2]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }

  const performance = useMemo(() => {
    if (moves < 10) return { title: "You're a Cheater!", message: "Stop inspecting source code bruh" };
    if (moves <= 14) return { title: "Lucker Dog!", message: "Anyhow anyhow click also win" };
    if (moves <= 20) return { title: "Not bad", message: "You are normal, get good" };
    return { title: "Lousy", message: "Welcome to dementia club" };
  }, [moves]);

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="flex flex-col flex-1 w-full h-full p-4 sm:p-6 lg:p-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold font-sans text-white">Card Matcher</h1>
          <p className="text-lg text-gray-400">Match the pairs to open the dragon&apos;s dungeon</p>
        </div>

        {currentPage === "game" ? (
          <>
            <div className="flex justify-center text-xl font-bold text-gray-300 my-2">
              Moves: {moves}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {deck.map((card, index) => {
                const isFlipped = flipped.includes(index) || matched.includes(index);
                return (
                  <button
                    key={card.id}
                    onClick={() => onFlip(index)}
                    className="relative aspect-square overflow-hidden rounded-xl hover:scale-105 transform transition-all duration-300"
                    disabled={isFlipped || flipped.length === 2}
                    style={{
                      transition: "transform 0.4s",
                      transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Back */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center rounded-xl bg-gray-700 text-gray-400 backface-hidden transition-opacity duration-300 ${
                        isFlipped ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      <img src="/draco.jpg" alt="Card Back" className="w-full h-full object-cover rounded-xl" />
                    </div>

                    {/* Front */}
                    <div
                      className={`absolute inset-0 rounded-xl flex items-center justify-center frontface-hidden transition-opacity duration-300 ${
                        isFlipped ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <img src={card.src} alt={card.label} className="w-full h-full object-cover rounded-xl" />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <h2 className="text-3xl font-extrabold text-white">{performance.title}</h2>
            <p className="text-xl text-gray-400">{performance.message}</p>
            <p className="text-md text-gray-500">
              You finished in just <span className="font-bold text-white">{moves}</span> moves.
            </p>
            <button
              onClick={() => router.push("/battle")}
              className="px-6 py-3 bg-white text-gray-800 font-bold rounded-full shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              Go Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
