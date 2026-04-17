"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    increment();
  }, []);

  async function increment() {
    setLoading(true);
    const res = await fetch("/api/count", { method: "POST" });
    const data = await res.json();
    setCount(data.count);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-widest text-gray-400 font-mono">
          Total Visits
        </p>
        <div className="text-8xl font-bold tabular-nums transition-all duration-300">
          {count === null ? "—" : count.toLocaleString()}
        </div>
        <p className="text-xs text-gray-500 font-mono">
          stored in Redis · persists across sessions
        </p>
      </div>

      <button
        onClick={increment}
        disabled={loading}
        className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-colors"
      >
        {loading ? "Counting…" : "Click to Increment"}
      </button>

      <p className="text-xs text-gray-600 max-w-xs text-center">
        Refresh the page — the count stays. Backed by Redis.
      </p>
    </main>
  );
}
