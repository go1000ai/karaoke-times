"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const CONFIRM_TIMEOUT_SEC = 5 * 60; // 5 minutes

interface QueueEntry {
  id: string;
  song_title: string;
  artist: string;
  status: string;
  position: number;
  requested_at: string;
  completed_at: string | null;
  profiles?: { display_name: string | null };
}

export default function QueuePage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [skippedQueue, setSkippedQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paused, setPaused] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  // Timer for the next-up singer waiting for confirmation
  const nextUpSinceRef = useRef<{ id: string; since: number } | null>(null);
  const [nextUpCountdown, setNextUpCountdown] = useState<number | null>(null);
  const [nextUpTimedOut, setNextUpTimedOut] = useState(false);
  const supabase = createClient();

  // Get venue ID — check owned venue first, then staff venue (via cookie)
  useEffect(() => {
    if (!user) return;

    const findVenue = async () => {
      // Check if user owns a venue
      const { data: owned } = await supabase
        .from("venues")
        .select("id, queue_paused")
        .eq("owner_id", user.id)
        .single();

      if (owned) {
        setVenueId(owned.id);
        setPaused(owned.queue_paused);
        return;
      }

      // KJ: get the active venue from cookie via API
      const res = await fetch("/api/active-venue");
      const { venueId: activeId } = await res.json();
      if (activeId) {
        const { data: venue } = await supabase
          .from("venues")
          .select("queue_paused")
          .eq("id", activeId)
          .single();
        setVenueId(activeId);
        if (venue) setPaused(venue.queue_paused);
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
        const vid = staffRecords[0].venue_id;
        const { data: venue } = await supabase
          .from("venues")
          .select("queue_paused")
          .eq("id", vid)
          .single();
        setVenueId(vid);
        if (venue) setPaused(venue.queue_paused);
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

    const fetchSkipped = async () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("song_queue")
        .select("*, profiles(display_name)")
        .eq("venue_id", venueId)
        .eq("status", "skipped")
        .gte("completed_at", thirtyMinAgo)
        .order("completed_at", { ascending: false });

      setSkippedQueue((data as unknown as QueueEntry[]) ?? []);
    };

    fetchQueue();
    fetchSkipped();

    const channel = supabase
      .channel(`kj-queue:${venueId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "song_queue",
        filter: `venue_id=eq.${venueId}`,
      }, () => {
        fetchQueue();
        fetchSkipped();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [venueId, supabase]);

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === "completed" || status === "skipped") {
      updates.completed_at = new Date().toISOString();
    }
    if (status === "waiting") {
      // Undo skip — place at end of queue
      const maxPos = Math.max(0, ...queue.map((q) => q.position));
      updates.position = maxPos + 1;
      updates.completed_at = null;
    }
    await supabase.from("song_queue").update(updates).eq("id", id);
  };

  // Swap positions of two queue entries
  const swapPositions = async (entryA: QueueEntry, entryB: QueueEntry) => {
    await Promise.all([
      supabase.from("song_queue").update({ position: entryB.position }).eq("id", entryA.id),
      supabase.from("song_queue").update({ position: entryA.position }).eq("id", entryB.id),
    ]);
  };

  // Toggle queue pause via RPC
  const togglePause = async () => {
    if (!venueId) return;
    setTogglingPause(true);
    const { data, error } = await supabase.rpc("toggle_queue_pause", {
      p_venue_id: venueId,
    });
    if (!error && data !== null) {
      setPaused(data as boolean);
    }
    setTogglingPause(false);
  };

  // Move a singer back to the end of the queue
  const getBackInLine = async (id: string) => {
    const maxPos = Math.max(0, ...queue.map((q) => q.position));
    await supabase.from("song_queue").update({ position: maxPos + 1 }).eq("id", id);
    // Reset timer for when they come up again
    nextUpSinceRef.current = null;
    setNextUpTimedOut(false);
  };

  const nowSinging = queue.find((q) => q.status === "now_singing");
  const upNext = queue.find((q) => q.status === "up_next");
  const waiting = queue.filter((q) => q.status === "waiting");

  // Search / filter waiting list
  const filteredWaiting = useMemo(() => {
    if (!searchTerm.trim()) return waiting;
    const term = searchTerm.toLowerCase();
    return waiting.filter(
      (e) =>
        e.song_title.toLowerCase().includes(term) ||
        e.artist.toLowerCase().includes(term) ||
        (e.profiles?.display_name || "").toLowerCase().includes(term)
    );
  }, [waiting, searchTerm]);

  // Countdown timer for the first person in the waiting list (they're "next")
  const nextInLine = waiting[0] ?? null;

  useEffect(() => {
    if (!nextInLine) {
      nextUpSinceRef.current = null;
      setNextUpCountdown(null);
      return;
    }

    // If new singer became next, reset the timer and timed-out flag
    if (!nextUpSinceRef.current || nextUpSinceRef.current.id !== nextInLine.id) {
      nextUpSinceRef.current = { id: nextInLine.id, since: Date.now() };
      setNextUpTimedOut(false);
    }

    const tick = () => {
      if (!nextUpSinceRef.current) return;
      const elapsed = Math.floor((Date.now() - nextUpSinceRef.current.since) / 1000);
      const remaining = Math.max(0, CONFIRM_TIMEOUT_SEC - elapsed);
      setNextUpCountdown(remaining);

      // Mark as timed out (don't auto-skip — let KJ decide)
      if (remaining === 0) {
        setNextUpTimedOut(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextInLine?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Pause / Resume toggle */}
          <button
            onClick={togglePause}
            disabled={togglingPause}
            className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl border transition-colors disabled:opacity-50 ${
              paused
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                : "bg-white/5 text-text-muted border-border hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="material-icons-round text-base">
              {paused ? "play_arrow" : "pause"}
            </span>
            {paused ? "Resume" : "Pause"}
          </button>

          {/* TV Display link */}
          {venueId && (
            <a
              href={`/venue/${venueId}/tv`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-accent/10 text-accent font-bold text-xs px-4 py-2.5 rounded-xl border border-accent/20 hover:bg-accent/20 transition-colors"
            >
              <span className="material-icons-round text-base">tv</span>
              TV
            </a>
          )}
        </div>
      </div>

      {/* Pause Banner */}
      {paused && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-icons-round text-amber-400 text-2xl">pause_circle</span>
          <div>
            <p className="text-amber-400 font-bold text-sm">Queue is Paused</p>
            <p className="text-text-secondary text-xs">New song requests are blocked. Click Resume to reopen.</p>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Waiting ({waiting.length})
          </p>
        </div>

        {/* Search Bar */}
        {waiting.length > 0 && (
          <div className="relative mb-3">
            <span className="material-icons-round text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">
              search
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search songs, artists, or singers..."
              className="w-full bg-card-dark border border-border rounded-xl py-2.5 pl-11 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              >
                <span className="material-icons-round text-lg">close</span>
              </button>
            )}
          </div>
        )}

        {searchTerm && (
          <p className="text-text-muted text-xs mb-2">
            {filteredWaiting.length} result{filteredWaiting.length !== 1 ? "s" : ""} for &ldquo;{searchTerm}&rdquo;
          </p>
        )}

        {waiting.length === 0 && !nowSinging && !upNext ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <span className="material-icons-round text-5xl text-text-muted mb-3">queue_music</span>
            <p className="text-white font-semibold mb-1">Queue is Empty</p>
            <p className="text-text-secondary text-sm">Waiting for song requests from customers.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWaiting.map((entry, index) => {
              // Find actual index in the full waiting list (for move logic)
              const actualIndex = waiting.findIndex((w) => w.id === entry.id);
              const isFirst = actualIndex === 0;
              const isLast = actualIndex === waiting.length - 1;
              const isNextUp = actualIndex === 0 && !searchTerm;

              // Timer values for the next-up singer
              const remaining = isNextUp ? (nextUpCountdown ?? CONFIRM_TIMEOUT_SEC) : 0;
              const mins = Math.floor(remaining / 60);
              const secs = remaining % 60;
              const urgent = remaining <= 60;

              return (
                <div key={entry.id} className={`glass-card rounded-xl p-4 ${isNextUp ? (nextUpTimedOut ? "border-red-400/30" : "border-primary/30") : ""}`}>
                  {/* Next-up banner — timer or timed-out state */}
                  {isNextUp && !nextUpTimedOut && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="material-icons-round text-primary text-lg">front_hand</span>
                        <p className="text-primary text-xs font-extrabold uppercase tracking-wider">Next Up — Awaiting Confirmation</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${urgent ? "text-red-400" : "text-primary"}`}>
                          {mins}:{secs.toString().padStart(2, "0")}
                        </span>
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-400" : "bg-primary"}`}
                            style={{ width: `${(remaining / CONFIRM_TIMEOUT_SEC) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {isNextUp && nextUpTimedOut && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                      <span className="material-icons-round text-red-400 text-lg">timer_off</span>
                      <p className="text-red-400 text-xs font-extrabold uppercase tracking-wider">Skipped — No Response</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-text-muted font-bold text-sm w-6 flex-shrink-0">#{actualIndex + 1}</span>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{entry.song_title}</p>
                        <p className="text-text-muted text-xs truncate">{entry.artist} — {entry.profiles?.display_name || "Anonymous"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Reorder buttons */}
                      {!searchTerm && (
                        <>
                          <button
                            onClick={() => swapPositions(entry, waiting[actualIndex - 1])}
                            disabled={isFirst}
                            className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <span className="material-icons-round text-lg">keyboard_arrow_up</span>
                          </button>
                          <button
                            onClick={() => swapPositions(entry, waiting[actualIndex + 1])}
                            disabled={isLast}
                            className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <span className="material-icons-round text-lg">keyboard_arrow_down</span>
                          </button>
                        </>
                      )}
                      {!isNextUp && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>

                  {/* Confirm / Skip buttons for next-up singer (timer still running) */}
                  {isNextUp && !nextUpTimedOut && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                      <button
                        onClick={() => updateStatus(entry.id, "up_next")}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white font-bold py-2.5 rounded-xl text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
                      >
                        <span className="material-icons-round text-base">check_circle</span>
                        Confirm Singer
                      </button>
                      <button
                        onClick={() => updateStatus(entry.id, "skipped")}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 text-text-muted font-bold py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all"
                      >
                        <span className="material-icons-round text-base">cancel</span>
                        Skip
                      </button>
                    </div>
                  )}

                  {/* Timed out — Get Back in Line or Cancel */}
                  {isNextUp && nextUpTimedOut && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                      <button
                        onClick={() => getBackInLine(entry.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                      >
                        <span className="material-icons-round text-base">undo</span>
                        Get Back in Line
                      </button>
                      <button
                        onClick={() => updateStatus(entry.id, "skipped")}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 font-bold py-2.5 rounded-xl text-sm hover:bg-red-500/20 transition-all"
                      >
                        <span className="material-icons-round text-base">cancel</span>
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Skipped */}
      {skippedQueue.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowSkipped(!showSkipped)}
            className="flex items-center gap-2 w-full text-left mb-2"
          >
            <span className="material-icons-round text-text-muted text-lg">
              {showSkipped ? "expand_less" : "expand_more"}
            </span>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Recently Skipped ({skippedQueue.length})
            </p>
          </button>

          {showSkipped && (
            <div className="space-y-2">
              {skippedQueue.map((entry) => (
                <div key={entry.id} className="glass-card rounded-xl p-4 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="material-icons-round text-text-muted text-lg flex-shrink-0">person_off</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{entry.song_title}</p>
                      <p className="text-text-muted text-xs truncate">
                        {entry.artist} — {entry.profiles?.display_name || "Anonymous"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateStatus(entry.id, "waiting")}
                    className="text-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    <span className="material-icons-round text-sm">undo</span>
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
