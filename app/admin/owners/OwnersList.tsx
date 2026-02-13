"use client";

import { useState, useTransition } from "react";
import { updateUserRole, deleteUser } from "../actions";

interface Owner {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  venueCount: number;
  venueNames: string[];
  kjCount: number;
}

export function OwnersList({ owners: initial }: { owners: Owner[] }) {
  const [owners, setOwners] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = owners.filter(
    (o) =>
      (o.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      o.venueNames.some((n) => n.toLowerCase().includes(search.toLowerCase()))
  );

  function handleRoleChange(userId: string, newRole: string) {
    setProcessingId(userId);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setOwners((prev) => prev.filter((o) => o.id !== userId));
      }
      setProcessingId(null);
    });
  }

  function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete venue owner "${name}"? Their venues will become unassigned. This cannot be undone.`)) return;
    setProcessingId(userId);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        setOwners((prev) => prev.filter((o) => o.id !== userId));
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Venue Owners</h1>
          <p className="text-text-secondary text-sm">{owners.length} venue owners</p>
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

      {/* Owners List */}
      <div className="space-y-3">
        {filtered.map((owner) => (
          <div key={owner.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {owner.avatar_url ? (
                    <img src={owner.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-primary">store</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">
                    {owner.display_name || "Unnamed Owner"}
                  </p>
                  <p className="text-xs text-text-muted">
                    Joined {new Date(owner.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={owner.role}
                  onChange={(e) => handleRoleChange(owner.id, e.target.value)}
                  disabled={isPending && processingId === owner.id}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary border-0 cursor-pointer disabled:opacity-50"
                >
                  <option value="user">user</option>
                  <option value="venue_owner">venue_owner</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  onClick={() => handleDelete(owner.id, owner.display_name || "owner")}
                  disabled={isPending && processingId === owner.id}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-round text-red-400 text-sm">delete</span>
                </button>
              </div>
            </div>

            {/* Venue Info */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-border/20">
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-primary/60 text-sm">storefront</span>
                <span className="text-xs text-text-muted">{owner.venueCount} venue{owner.venueCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-purple-400/60 text-sm">headphones</span>
                <span className="text-xs text-text-muted">{owner.kjCount} KJ{owner.kjCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {owner.venueNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {owner.venueNames.map((name) => (
                  <span key={name} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-text-muted">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No venue owners match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
