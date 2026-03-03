"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MimicButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const startMimic = async (role: "kj" | "owner") => {
    setLoading(role);
    try {
      await fetch("/api/admin/mimic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.push("/dashboard");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-3 pb-2">
      <div className="border-t border-border pt-3">
        <p className="text-[10px] text-text-muted/60 uppercase tracking-widest font-bold px-4 mb-2">
          Mimic Mode
        </p>
        <button
          onClick={() => startMimic("kj")}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
        >
          <span className="material-icons-round text-lg">headphones</span>
          {loading === "kj" ? "Switching..." : "Mimic as KJ"}
        </button>
        <button
          onClick={() => startMimic("owner")}
          disabled={loading !== null}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <span className="material-icons-round text-lg">store</span>
          {loading === "owner" ? "Switching..." : "Mimic as Owner"}
        </button>
        <a
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="material-icons-round text-lg">dashboard</span>
          Venue Dashboard
        </a>
      </div>
    </div>
  );
}
