"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FAVORITES_KEY = "kt-favorites";

export function FavoritesStatCard() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        setCount(Array.isArray(arr) ? arr.length : 0);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <Link
      href="/dashboard/favorites"
      className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all"
    >
      <span className="material-icons-round text-3xl text-primary mb-2">favorite</span>
      <p className="text-2xl font-extrabold text-white">{count}</p>
      <p className="text-xs text-text-muted mt-1">Favorites</p>
    </Link>
  );
}
