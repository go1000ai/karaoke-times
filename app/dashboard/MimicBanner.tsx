"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MimicBanner({ mimicRole }: { mimicRole: "kj" | "owner" }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const exitMimic = async () => {
    setExiting(true);
    await fetch("/api/admin/mimic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: null }),
    });
    router.push("/admin");
  };

  const isKJ = mimicRole === "kj";
  const label = isKJ ? "KJ" : "Venue Owner";
  const icon = isKJ ? "headphones" : "store";

  return (
    <div className={
      isKJ
        ? "bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6 flex items-center justify-between"
        : "bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-center justify-between"
    }>
      <div className="flex items-center gap-3">
        <span className={`material-icons-round ${isKJ ? "text-amber-400" : "text-red-400"}`}>
          {icon}
        </span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isKJ ? "text-amber-400" : "text-red-400"}`}>
            Mimic Mode: {label}
          </p>
          <p className="text-xs text-text-muted">
            You are viewing the dashboard as a {label}
          </p>
        </div>
      </div>
      <button
        onClick={exitMimic}
        disabled={exiting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
      >
        <span className="material-icons-round text-sm">close</span>
        {exiting ? "Exiting..." : "Exit Mimic"}
      </button>
    </div>
  );
}
