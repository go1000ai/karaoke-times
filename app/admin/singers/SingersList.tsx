"use client";

import { useState, useTransition } from "react";
import { updateUserRole, deleteUser } from "../actions";

interface Singer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  songCount: number;
  bookingCount: number;
  favoriteCount: number;
}

export function SingersList({ singers: initial }: { singers: Singer[] }) {
  const [singers, setSingers] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "active" | "alpha">("newest");

  const filtered = singers
    .filter((s) =>
      (s.display_name || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "active") return b.songCount - a.songCount;
      if (sort === "alpha") return (a.display_name || "").localeCompare(b.display_name || "");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  function handleRoleChange(userId: string, newRole: string) {
    setProcessingId(userId);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setSingers((prev) => prev.filter((s) => s.id !== userId));
      }
      setProcessingId(null);
    });
  }

  function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete singer "${name}"? This cannot be undone.`)) return;
    setProcessingId(userId);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        setSingers((prev) => prev.filter((s) => s.id !== userId));
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Singers</h1>
          <p className="text-text-secondary text-sm">{singers.length} registered singers</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search singers by name..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="active">Most Active</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>

      {/* Singers List */}
      <div className="space-y-3">
        {filtered.map((singer) => (
          <div key={singer.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {singer.avatar_url ? (
                    <img src={singer.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-primary">person</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">
                    {singer.display_name || "Unnamed Singer"}
                  </p>
                  <p className="text-xs text-text-muted">
                    Joined {new Date(singer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={singer.role}
                  onChange={(e) => handleRoleChange(singer.id, e.target.value)}
                  disabled={isPending && processingId === singer.id}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 text-text-muted border-0 cursor-pointer disabled:opacity-50"
                >
                  <option value="user">user</option>
                  <option value="venue_owner">venue_owner</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  onClick={() => handleDelete(singer.id, singer.display_name || "singer")}
                  disabled={isPending && processingId === singer.id}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-round text-red-400 text-sm">delete</span>
                </button>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-border/20">
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-primary/60 text-sm">queue_music</span>
                <span className="text-xs text-text-muted">{singer.songCount} songs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-blue-400/60 text-sm">book_online</span>
                <span className="text-xs text-text-muted">{singer.bookingCount} bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-accent/60 text-sm">favorite</span>
                <span className="text-xs text-text-muted">{singer.favoriteCount} favorites</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No singers match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
