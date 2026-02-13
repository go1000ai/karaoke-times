"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { updateSongStatus } from "@/lib/data/queue";

const CONFIRM_TIMEOUT_SEC = 5 * 60; // 5 minutes

interface QueueEntry {
  id: string;
  venue_id: string;
  song_title: string;
  artist: string;
  status: string;
  position: number;
  requested_at: string;
  user_id: string;
  venues?: { name: string } | null;
  profiles?: { display_name: string | null } | null;
}

export default function MyQueuePage() {
  const { user } = useAuth();
  const [myEntries, setMyEntries] = useState<QueueEntry[]>([]);
  const [venueQueues, setVenueQueues] = useState<Record<string, QueueEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  // Track when each entry first became "next" (entry.id → timestamp)
  const nextSinceRef = useRef<Record<string, number>>({});
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // 1. Get my active queue entries
      const { data: mine } = await supabase
        .from("song_queue")
        .select("id, venue_id, song_title, artist, status, position, requested_at, user_id, venues(name)")
        .eq("user_id", user.id)
        .in("status", ["waiting", "up_next", "now_singing"])
        .order("requested_at", { ascending: false });

      const myData = (mine as unknown as QueueEntry[]) ?? [];
      setMyEntries(myData);

      // 2. For each venue I'm in, fetch the full active queue to count ahead
      const venueIds = [...new Set(myData.map((e) => e.venue_id))];
      const queues: Record<string, QueueEntry[]> = {};

      for (const vid of venueIds) {
        const { data: venueQueue } = await supabase
          .from("song_queue")
          .select("id, venue_id, song_title, artist, status, position, requested_at, user_id, profiles(display_name)")
          .eq("venue_id", vid)
          .in("status", ["waiting", "up_next", "now_singing"])
          .order("position", { ascending: true });

        queues[vid] = (venueQueue as unknown as QueueEntry[]) ?? [];
      }

      setVenueQueues(queues);
      setLoading(false);
    };

    fetchData();

    // Real-time — listen to all song_queue changes (covers status updates by KJ too)
    const channel = supabase
      .channel("my-queue-live")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "song_queue",
      }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  // Helpers
  const getAheadCount = (entry: QueueEntry): number => {
    const queue = venueQueues[entry.venue_id] || [];
    return queue.filter(
      (q) =>
        q.position < entry.position &&
        q.status !== "completed" &&
        q.status !== "skipped" &&
        q.status !== "now_singing"
    ).length;
  };

  const getNowSinging = (venueId: string): QueueEntry | undefined => {
    const queue = venueQueues[venueId] || [];
    return queue.find((q) => q.status === "now_singing");
  };

  const nowSinging = myEntries.filter((e) => e.status === "now_singing");
  const upNext = myEntries.filter((e) => e.status === "up_next");
  const waiting = myEntries.filter((e) => e.status === "waiting");

  // Find which waiting entries are "next" (ahead === 0)
  const getNextEntryIds = useCallback((): string[] => {
    return waiting
      .filter((e) => getAheadCount(e) === 0)
      .map((e) => e.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEntries, venueQueues]);

  // Countdown timer: track when entries become "next" and tick every second
  useEffect(() => {
    const nextIds = getNextEntryIds();

    // Record timestamps for newly-next entries
    for (const id of nextIds) {
      if (!nextSinceRef.current[id]) {
        nextSinceRef.current[id] = Date.now();
      }
    }
    // Clean up entries that are no longer next
    for (const id of Object.keys(nextSinceRef.current)) {
      if (!nextIds.includes(id)) {
        delete nextSinceRef.current[id];
      }
    }

    if (nextIds.length === 0) {
      setCountdowns({});
      return;
    }

    const tick = () => {
      const now = Date.now();
      const updated: Record<string, number> = {};
      for (const id of nextIds) {
        const since = nextSinceRef.current[id] || now;
        const elapsed = Math.floor((now - since) / 1000);
        const remaining = Math.max(0, CONFIRM_TIMEOUT_SEC - elapsed);
        updated[id] = remaining;

        // Auto-cancel when timer hits 0
        if (remaining === 0) {
          updateSongStatus(id, "skipped");
        }
      }
      setCountdowns(updated);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [getNextEntryIds]);

  const handleConfirm = async (entryId: string) => {
    setActingOn(entryId);
    await updateSongStatus(entryId, "up_next");
    setActingOn(null);
  };

  const handleCancel = async (entryId: string) => {
    setActingOn(entryId);
    await updateSongStatus(entryId, "skipped");
    setActingOn(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">My Queue</h1>
      <p className="text-text-secondary text-sm mb-6">
        {myEntries.length > 0
          ? `You have ${myEntries.length} active song${myEntries.length === 1 ? "" : "s"} in the queue.`
          : "You\u2019re not in any queues right now."}
      </p>

      {myEntries.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-icons-round text-5xl text-border mb-4">queue_music</span>
          <h2 className="text-base font-bold text-white mb-1">Not in any queue</h2>
          <p className="text-text-secondary text-sm mb-4">
            Request a song at a venue to get in line!
          </p>
          <Link
            href="/dashboard/request-song"
            className="inline-flex items-center gap-1.5 bg-accent text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:shadow-lg hover:shadow-accent/20 transition-all"
          >
            <span className="material-icons-round text-lg">queue_music</span>
            Request a Song
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* NOW SINGING */}
          {nowSinging.map((entry) => (
            <div key={entry.id} className="glass-card rounded-2xl p-5 border-accent/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons-round text-accent text-lg animate-pulse">mic</span>
                <p className="text-accent text-xs font-extrabold uppercase tracking-[0.15em]">You&apos;re On!</p>
              </div>
              <h3 className="text-white font-extrabold text-xl mb-1">{entry.song_title}</h3>
              <p className="text-text-secondary">{entry.artist}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="material-icons-round text-text-muted text-sm">location_on</span>
                <p className="text-white text-sm font-semibold">{entry.venues?.name || "Venue"}</p>
              </div>
            </div>
          ))}

          {/* UP NEXT */}
          {upNext.map((entry) => (
            <div key={entry.id} className="glass-card rounded-2xl p-5 border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons-round text-primary text-lg">front_hand</span>
                <p className="text-primary text-xs font-extrabold uppercase tracking-[0.15em]">Up Next &mdash; Get Ready!</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-primary text-2xl">music_note</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold truncate">{entry.song_title}</p>
                  <p className="text-text-muted text-xs truncate">{entry.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="material-icons-round text-text-muted text-sm">location_on</span>
                <p className="text-white text-sm font-semibold">{entry.venues?.name || "Venue"}</p>
              </div>
              {(() => {
                const current = getNowSinging(entry.venue_id);
                return current ? (
                  <div className="mt-3 bg-accent/5 rounded-lg p-2.5 flex items-center gap-2">
                    <span className="material-icons-round text-accent text-sm">mic</span>
                    <p className="text-text-secondary text-xs">
                      Currently singing: <span className="text-white font-semibold">{current.song_title}</span>
                      {current.profiles?.display_name && (
                        <span className="text-text-muted"> &mdash; {current.profiles.display_name}</span>
                      )}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          ))}

          {/* WAITING */}
          {waiting.length > 0 && (
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                In Line ({waiting.length})
              </p>
              <div className="space-y-3">
                {waiting.map((entry) => {
                  const ahead = getAheadCount(entry);
                  const currentSinger = getNowSinging(entry.venue_id);

                  return (
                    <div key={entry.id} className="glass-card rounded-2xl p-4">
                      {/* Main row: Song left, Venue + Position right (stacks on mobile) */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Song info */}
                        <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                          <div className="w-11 h-11 rounded-xl bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-icons-round text-blue-400 text-xl">music_note</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-bold text-sm truncate">{entry.song_title}</p>
                            <p className="text-text-muted text-xs truncate">{entry.artist}</p>
                          </div>
                        </div>

                        {/* Venue + Queue position (right side on desktop, bottom on mobile) */}
                        <div className="flex items-center gap-3 sm:flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="material-icons-round text-text-muted text-sm">location_on</span>
                            <p className="text-white text-sm font-semibold whitespace-nowrap">{entry.venues?.name || "Venue"}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                            <span className="material-icons-round text-blue-400 text-base">group</span>
                            <p className="text-white text-sm whitespace-nowrap">
                              {ahead === 0 ? (
                                <span className="text-primary font-bold">You&apos;re next!</span>
                              ) : (
                                <>
                                  <span className="font-bold">{ahead}</span>
                                  <span className="text-text-muted"> ahead</span>
                                </>
                              )}
                            </p>
                            <span className="text-blue-400 text-xs font-bold bg-blue-400/10 px-2 py-0.5 rounded-full">
                              #{entry.position}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Who's singing now */}
                      {currentSinger && (
                        <div className="mt-2 flex items-center gap-2 text-text-muted text-xs px-1">
                          <span className="material-icons-round text-accent text-xs">mic</span>
                          <p>
                            Now: <span className="text-white">{currentSinger.song_title}</span>
                            {currentSinger.profiles?.display_name && (
                              <span> &mdash; {currentSinger.profiles.display_name}</span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Confirm / Cancel when you're next */}
                      {ahead === 0 && (() => {
                        const remaining = countdowns[entry.id] ?? CONFIRM_TIMEOUT_SEC;
                        const mins = Math.floor(remaining / 60);
                        const secs = remaining % 60;
                        const urgent = remaining <= 60;

                        return (
                          <div className="mt-3 border-t border-white/5 pt-3">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-text-muted text-xs">
                                Confirm within{" "}
                                <span className={`font-bold ${urgent ? "text-red-400" : "text-primary"}`}>
                                  {mins}:{secs.toString().padStart(2, "0")}
                                </span>
                              </p>
                              {/* Timer bar */}
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-400" : "bg-primary"}`}
                                  style={{ width: `${(remaining / CONFIRM_TIMEOUT_SEC) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleConfirm(entry.id)}
                                disabled={actingOn === entry.id}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white font-bold py-2.5 rounded-xl text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                              >
                                <span className="material-icons-round text-base">check_circle</span>
                                {actingOn === entry.id ? "Confirming..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => handleCancel(entry.id)}
                                disabled={actingOn === entry.id}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 text-text-muted font-bold py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                              >
                                <span className="material-icons-round text-base">cancel</span>
                                {actingOn === entry.id ? "Cancelling..." : "Cancel"}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action */}
          <div className="pt-2">
            <Link
              href="/dashboard/request-song"
              className="w-full flex items-center justify-center gap-2 bg-accent text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-accent/20 transition-all"
            >
              <span className="material-icons-round text-lg">add</span>
              Request Another Song
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
