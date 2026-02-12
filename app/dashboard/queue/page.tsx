"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface QueueEntry {
  id: string;
  song_title: string;
  artist: string;
  status: string;
  position: number;
  requested_at: string;
  profiles?: { display_name: string | null };
}

export default function QueuePage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Get venue ID — check owned venue first, then staff venue (via cookie)
  useEffect(() => {
    if (!user) return;

    const findVenue = async () => {
      // Check if user owns a venue
      const { data: owned } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (owned) {
        setVenueId(owned.id);
        return;
      }

      // KJ: get the active venue from cookie via API
      const res = await fetch("/api/active-venue");
      const { venueId: activeId } = await res.json();
      if (activeId) {
        setVenueId(activeId);
        return;
      }

      // Fallback: first connected venue
      const { data: staffRecords } = await supabase
        .from("venue_staff")
        .select("venue_id")
        .eq("user_id", user.id)
        .not("accepted_at", "is", null)
        .limit(1);

      if (staffRecords?.[0]) {
        setVenueId(staffRecords[0].venue_id);
      }
    };

    findVenue();
  }, [user, supabase]);

  // Fetch and subscribe to queue
  useEffect(() => {
    if (!venueId) return;

    const fetchQueue = async () => {
      const { data } = await supabase
        .from("song_queue")
        .select("*, profiles(display_name)")
        .eq("venue_id", venueId)
        .in("status", ["waiting", "up_next", "now_singing"])
        .order("position");

      setQueue((data as unknown as QueueEntry[]) ?? []);
      setLoading(false);
    };

    fetchQueue();

    const channel = supabase
      .channel(`kj-queue:${venueId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "song_queue",
        filter: `venue_id=eq.${venueId}`,
      }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [venueId, supabase]);

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === "completed" || status === "skipped") {
      updates.completed_at = new Date().toISOString();
    }
    await supabase.from("song_queue").update(updates).eq("id", id);
  };

  const nowSinging = queue.find((q) => q.status === "now_singing");
  const upNext = queue.find((q) => q.status === "up_next");
  const waiting = queue.filter((q) => q.status === "waiting");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Song Queue</h1>
          <p className="text-text-secondary text-sm">
            Manage your live song queue. Updates in real-time.
            <span className="inline-flex items-center gap-1 ml-2 text-primary">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Live
            </span>
          </p>
        </div>
        {venueId && (
          <a
            href={`/venue/${venueId}/tv`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-accent/10 text-accent font-bold text-xs px-4 py-2.5 rounded-xl border border-accent/20 hover:bg-accent/20 transition-colors flex-shrink-0"
          >
            <span className="material-icons-round text-base">tv</span>
            Open TV Display
          </a>
        )}
      </div>

      {/* Now Singing */}
      {nowSinging && (
        <div className="mb-6">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2 neon-glow-pink">Now Singing</p>
          <div className="glass-card rounded-2xl p-5 border-accent/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{nowSinging.song_title}</h3>
                <p className="text-text-secondary text-sm">{nowSinging.artist}</p>
                <p className="text-text-muted text-xs mt-1">
                  {nowSinging.profiles?.display_name || "Anonymous"}
                </p>
              </div>
              <button
                onClick={() => updateStatus(nowSinging.id, "completed")}
                className="bg-primary text-black font-bold text-sm px-4 py-2 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Up Next */}
      {upNext && (
        <div className="mb-6">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 neon-glow-green">Up Next</p>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">{upNext.song_title}</h3>
                <p className="text-text-secondary text-sm">{upNext.artist}</p>
                <p className="text-text-muted text-xs">{upNext.profiles?.display_name || "Anonymous"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(upNext.id, "now_singing")}
                  className="bg-accent/10 text-accent font-bold text-xs px-3 py-2 rounded-lg"
                >
                  Start
                </button>
                <button
                  onClick={() => updateStatus(upNext.id, "skipped")}
                  className="bg-white/5 text-text-muted font-bold text-xs px-3 py-2 rounded-lg"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waiting */}
      <div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          Waiting ({waiting.length})
        </p>
        {waiting.length === 0 && !nowSinging && !upNext ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <span className="material-icons-round text-5xl text-text-muted mb-3">queue_music</span>
            <p className="text-white font-semibold mb-1">Queue is Empty</p>
            <p className="text-text-secondary text-sm">Waiting for song requests from customers.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {waiting.map((entry, index) => (
              <div key={entry.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-text-muted font-bold text-sm w-6">#{index + 1}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{entry.song_title}</p>
                    <p className="text-text-muted text-xs">{entry.artist} — {entry.profiles?.display_name || "Anonymous"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(entry.id, "up_next")}
                    className="text-primary text-xs font-bold px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                  >
                    Up Next
                  </button>
                  <button
                    onClick={() => updateStatus(entry.id, "skipped")}
                    className="text-text-muted text-xs font-bold px-2 py-1 rounded hover:bg-white/5 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
