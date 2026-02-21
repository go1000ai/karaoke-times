"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const FAVORITES_KEY = "kt-favorites";

export function FavoritesStatCard() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let localCount = 0;
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        localCount = Array.isArray(arr) ? arr.length : 0;
      }
    } catch {
      // ignore
    }

    if (user) {
      // Also count Supabase favorites
      const supabase = createClient();
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count: dbCount }) => {
          setCount(localCount + (dbCount || 0));
        });
    } else {
      setCount(localCount);
    }
  }, [user]);

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
