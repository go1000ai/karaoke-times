"use client";

import { useState, useTransition } from "react";
import { togglePromo, deletePromo } from "../actions";

interface Promo {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  venues: { name: string } | null;
}

export function PromosList({ promos: initial }: { promos: Promo[] }) {
  const [promos, setPromos] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "expired">("all");

  const now = new Date().toISOString().slice(0, 10);

  const filtered = promos.filter((p) => {
    if (filter === "active") return p.is_active && (!p.end_date || p.end_date >= now);
    if (filter === "inactive") return !p.is_active;
    if (filter === "expired") return p.end_date && p.end_date < now;
    return true;
  });

  function handleToggle(promoId: string, currentActive: boolean) {
    setProcessingId(promoId);
    startTransition(async () => {
      const result = await togglePromo(promoId, !currentActive);
      if (result.success) {
        setPromos((prev) => prev.map((p) => (p.id === promoId ? { ...p, is_active: !currentActive } : p)));
      }
      setProcessingId(null);
    });
  }

  function handleDelete(promoId: string, title: string) {
    if (!confirm(`Delete promo "${title}"? This cannot be undone.`)) return;
    setProcessingId(promoId);
    startTransition(async () => {
      const result = await deletePromo(promoId);
      if (result.success) {
        setPromos((prev) => prev.filter((p) => p.id !== promoId));
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Promos</h1>
          <p className="text-text-secondary text-sm">{promos.length} total promotions</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-6">
        {(["all", "active", "inactive", "expired"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              filter === f ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((promo) => {
          const isExpired = promo.end_date && promo.end_date < now;
          return (
            <div key={promo.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-bold truncate">{promo.title}</p>
                    {promo.is_active && !isExpired && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Active</span>
                    )}
                    {!promo.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-muted">Inactive</span>
                    )}
                    {isExpired && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Expired</span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted truncate">{promo.venues?.name || "Unknown Venue"}</p>
                  {promo.description && (
                    <p className="text-xs text-text-muted/60 mt-1 line-clamp-2">{promo.description}</p>
                  )}
                  {(promo.start_date || promo.end_date) && (
                    <p className="text-xs text-text-muted/40 mt-1">
                      {promo.start_date && new Date(promo.start_date).toLocaleDateString()}
                      {promo.start_date && promo.end_date && " – "}
                      {promo.end_date && new Date(promo.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(promo.id, promo.is_active)}
                    disabled={isPending && processingId === promo.id}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                      promo.is_active ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-white/5 text-text-muted hover:bg-white/10"
                    }`}
                  >
                    {promo.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id, promo.title)}
                    disabled={isPending && processingId === promo.id}
                    className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <span className="material-icons-round text-red-400 text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">local_offer</span>
            <p className="text-text-secondary text-sm">No promos found</p>
          </div>
        )}
      </div>
    </div>
  );
}
