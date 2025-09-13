"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type GameKey = "memory" | "dino" | "rps" | "board" | "battle" | "done";

type User = {
  name: string;
  photoDataUrl: string; // data:image/png;base64,...
};

type GameState = {
  user: User | null;
  setUser: (u: User) => void;
  clearUser: () => void;

  // timer across pages
  running: boolean;
  startTs: number | null;      // epoch ms when started (if running)
  elapsedMs: number;           // accumulated elapsed when not running
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;

  // track which games finished
  completed: Record<GameKey, boolean>;
  markCompleted: (g: GameKey) => void;
};

const STORAGE_KEY = "game_state_v1";

const Ctx = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [running, setRunning] = useState(false);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completed, setCompleted] = useState<Record<GameKey, boolean>>({
    memory: false, dino: false, rps: false, board: false, battle: false, done: false,
  });

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.user) setUserState(data.user);
      if (typeof data.elapsedMs === "number") setElapsedMs(data.elapsedMs);
      if (data.running) {
        // resume timing from stored startTs
        if (typeof data.startTs === "number") {
          setRunning(true);
          setStartTs(data.startTs);
        }
      }
      if (data.completed) setCompleted(data.completed);
    } catch {}
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    const snapshot = { user, running, startTs, elapsedMs, completed };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [user, running, startTs, elapsedMs, completed]);

  // public API
  const setUser = (u: User) => setUserState(u);
  const clearUser = () => setUserState(null);

  const startTimer = () => {
    if (running) return;
    setRunning(true);
    setStartTs(Date.now());
  };
  const stopTimer = () => {
    if (!running || !startTs) return;
    const now = Date.now();
    setElapsedMs((e) => e + (now - startTs));
    setRunning(false);
    setStartTs(null);
  };
  const resetTimer = () => {
    setRunning(false);
    setStartTs(null);
    setElapsedMs(0);
  };

  const markCompleted = (g: GameKey) =>
    setCompleted((c) => ({ ...c, [g]: true }));

  const value = useMemo<GameState>(() => ({
    user, setUser, clearUser,
    running, startTs, elapsedMs, startTimer, stopTimer, resetTimer,
    completed, markCompleted,
  }), [user, running, startTs, elapsedMs, completed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
