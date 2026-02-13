"use client";

import { useState, useTransition } from "react";
import { deleteUser, removeConnection } from "../actions";

interface KJ {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  venueCount: number;
  venues: { staffId: string; venueId: string; venueName: string; role: string }[];
}

export function KJsList({ kjs: initial }: { kjs: KJ[] }) {
  const [kjs, setKJs] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = kjs.filter(
    (k) =>
      (k.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      k.venues.some((v) => v.venueName.toLowerCase().includes(search.toLowerCase()))
  );

  function handleRemoveConnection(staffId: string, kjName: string, venueName: string) {
    if (!confirm(`Remove "${kjName}" from "${venueName}"?`)) return;
    setProcessingId(staffId);
    startTransition(async () => {
      const result = await removeConnection(staffId);
      if (result.success) {
        setKJs((prev) =>
          prev
            .map((k) => ({
              ...k,
              venues: k.venues.filter((v) => v.staffId !== staffId),
              venueCount: k.venues.filter((v) => v.staffId !== staffId).length,
            }))
            .filter((k) => k.venues.length > 0)
        );
      }
      setProcessingId(null);
    });
  }

  function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete KJ "${name}"? This removes their account entirely. This cannot be undone.`)) return;
    setProcessingId(userId);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        setKJs((prev) => prev.filter((k) => k.id !== userId));
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">KJs</h1>
          <p className="text-text-secondary text-sm">{kjs.length} karaoke jockeys</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or venue..."
          className="w-full bg-card-dark border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
        />
      </div>

      {/* KJs List */}
      <div className="space-y-3">
        {filtered.map((kj) => (
          <div key={kj.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-purple-400/10 flex items-center justify-center flex-shrink-0">
                  {kj.avatar_url ? (
                    <img src={kj.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-purple-400">headphones</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">
                    {kj.display_name || "Unnamed KJ"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {kj.venueCount} venue{kj.venueCount !== 1 ? "s" : ""} connected
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(kj.id, kj.display_name || "KJ")}
                disabled={isPending && processingId === kj.id}
                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <span className="material-icons-round text-red-400 text-sm">delete</span>
              </button>
            </div>

            {/* Connected Venues */}
            <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
              {kj.venues.map((v) => (
                <div key={v.staffId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-icons-round text-text-muted/40 text-sm">storefront</span>
                    <span className="text-sm text-text-muted truncate">{v.venueName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 font-bold">
                      {v.role}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveConnection(v.staffId, kj.display_name || "KJ", v.venueName)}
                    disabled={isPending && processingId === v.staffId}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No KJs match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
