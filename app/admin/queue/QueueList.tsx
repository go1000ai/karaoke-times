"use client";

import { useState, useTransition } from "react";
import { updateQueueStatus, removeFromQueue } from "../actions";

interface QueueEntry {
  id: string;
  venue_id: string;
  song_title: string;
  artist: string;
  status: string;
  position: number;
  requested_at: string;
  venues: { name: string } | null;
  profiles: { display_name: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-white/5 text-text-muted",
  up_next: "bg-yellow-500/10 text-yellow-400",
  now_singing: "bg-green-500/10 text-green-400",
};

export function QueueList({ entries: initial, venues }: { entries: QueueEntry[]; venues: { id: string; name: string }[] }) {
  const [entries, setEntries] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = entries.filter((e) => {
    if (venueFilter && e.venue_id !== venueFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  function handleStatusChange(songId: string, newStatus: string) {
    setProcessingId(songId);
    startTransition(async () => {
      const result = await updateQueueStatus(songId, newStatus);
      if (result.success) {
        if (newStatus === "completed" || newStatus === "skipped") {
          setEntries((prev) => prev.filter((e) => e.id !== songId));
        } else {
          setEntries((prev) => prev.map((e) => (e.id === songId ? { ...e, status: newStatus } : e)));
        }
      }
      setProcessingId(null);
    });
  }

  function handleRemove(songId: string, title: string) {
    if (!confirm(`Remove "${title}" from the queue?`)) return;
    setProcessingId(songId);
    startTransition(async () => {
      const result = await removeFromQueue(songId);
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== songId));
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Queue Monitor</h1>
          <p className="text-text-secondary text-sm">{entries.length} active queue entries</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer">
          <option value="">All Status</option>
          <option value="waiting">Waiting</option>
          <option value="up_next">Up Next</option>
          <option value="now_singing">Now Singing</option>
        </select>
        <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer flex-1">
          <option value="">All Venues</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((entry) => (
          <div key={entry.id} className="glass-card rounded-2xl p-5">
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full font-mono">#{entry.position}</span>
                  <p className="text-white font-bold truncate">{entry.song_title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status] || "bg-white/5 text-text-muted"}`}>
                    {entry.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-text-muted truncate">{entry.artist} — {entry.profiles?.display_name || "Unknown Singer"}</p>
                <p className="text-xs text-text-muted/60 mt-1">{entry.venues?.name || "Unknown Venue"} — {new Date(entry.requested_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={entry.status}
                  onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                  disabled={isPending && processingId === entry.id}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer disabled:opacity-50 ${STATUS_COLORS[entry.status] || "bg-white/5 text-text-muted"}`}
                >
                  <option value="waiting">waiting</option>
                  <option value="up_next">up_next</option>
                  <option value="now_singing">now_singing</option>
                  <option value="completed">completed</option>
                  <option value="skipped">skipped</option>
                </select>
                <button onClick={() => handleRemove(entry.id, entry.song_title)} disabled={isPending && processingId === entry.id} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50">
                  <span className="material-icons-round text-red-400 text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">queue_music</span>
            <p className="text-text-secondary text-sm">No active queue entries</p>
          </div>
        )}
      </div>
    </div>
  );
}
