"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useQueueSubscription } from "@/hooks/useQueueSubscription";
import { useQueueSubscriptionById } from "@/hooks/useQueueSubscriptionById";
import { useAuth } from "@/components/AuthProvider";
import SongRequestModal from "@/components/SongRequestModal";
import { karaokeEvents } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

/**
 * Simple UUID v4 check — the [id] param is either a mock-data slug
 * (e.g. "fusion-east-monday") or a Supabase UUID.
 */
function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export default function PublicQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  // Determine whether the [id] is a mock-data slug or a Supabase UUID
  const isVenueUUID = isUUID(id);
  const event = !isVenueUUID ? karaokeEvents.find((e) => e.id === id) : null;

  // When [id] is a UUID, fetch the venue name from Supabase
  const [supabaseVenueName, setSupabaseVenueName] = useState<string | null>(null);
  useEffect(() => {
    if (!isVenueUUID) return;
    const supabase = createClient();
    supabase
      .from("venues")
      .select("name")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setSupabaseVenueName(data.name);
      });
  }, [id, isVenueUUID]);

  // Use the correct subscription hook based on id type
  const byNameResult = useQueueSubscription(event?.venueName || "");
  const byIdResult = useQueueSubscriptionById(isVenueUUID ? id : "");

  const queue = isVenueUUID ? byIdResult.queue : byNameResult.queue;
  const loading = isVenueUUID ? byIdResult.loading : byNameResult.loading;

  const displayName = event?.venueName || supabaseVenueName || "Live Queue";
  const displayEventName = event?.eventName || null;
  const displayDj = event?.dj || null;

  const [showRequest, setShowRequest] = useState(false);

  const nowSinging = queue.find((q) => q.status === "now_singing");
  const upNext = queue.find((q) => q.status === "up_next");
  const waiting = queue.filter((q) => q.status === "waiting");

  // Find user's spot in line
  const userEntry = user
    ? queue.find((q) => q.user_id === user.id && (q.status === "waiting" || q.status === "up_next"))
    : null;
  const userPosition = userEntry
    ? queue.filter(
        (q) =>
          q.position < userEntry.position &&
          q.status !== "now_singing" &&
          q.status !== "completed" &&
          q.status !== "skipped"
      ).length
    : null;

  // Check if user is up next or now singing
  const isUserUpNext = user
    ? queue.some((q) => q.user_id === user.id && q.status === "up_next")
    : false;
  const isUserSinging = user
    ? queue.some((q) => q.user_id === user.id && q.status === "now_singing")
    : false;

  return (
    <div className="min-h-screen bg-bg-dark pt-20 pb-32">
      <div className="max-w-lg mx-auto px-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/venue/${id}`}
            className="w-9 h-9 rounded-full glass-card flex items-center justify-center flex-shrink-0"
          >
            <span className="material-icons-round text-white text-lg">arrow_back</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-white truncate">
              {displayName}
            </h1>
            {displayEventName && (
              <p className="text-accent text-xs font-bold uppercase tracking-wider truncate">
                {displayEventName}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-primary">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase">Live</span>
          </div>
        </div>

        {displayDj && displayDj !== "Open" && (
          <p className="text-text-secondary text-sm mb-6 ml-12">
            KJ: <span className="text-primary font-semibold">{displayDj}</span>
          </p>
        )}

        {/* User Status Banner */}
        {isUserSinging && (
          <div className="mb-5 bg-accent/10 border border-accent/30 rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="material-icons-round text-accent text-3xl">mic</span>
              <div>
                <p className="text-accent font-extrabold text-lg">You&apos;re On!</p>
                <p className="text-text-secondary text-sm">Get up there and sing!</p>
              </div>
            </div>
          </div>
        )}

        {isUserUpNext && !isUserSinging && (
          <div className="mb-5 bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className="material-icons-round text-primary text-3xl">front_hand</span>
              <div>
                <p className="text-primary font-extrabold text-lg">You&apos;re Up Next!</p>
                <p className="text-text-secondary text-sm">Get ready — you&apos;re about to sing!</p>
              </div>
            </div>
          </div>
        )}

        {userEntry && !isUserUpNext && !isUserSinging && userPosition !== null && (
          <div className="mb-5 glass-card rounded-2xl p-4 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary font-extrabold text-sm">Your Position</p>
                <p className="text-white text-2xl font-extrabold">
                  #{userPosition + 1}
                  <span className="text-text-muted text-sm font-normal ml-2">
                    {userPosition === 0
                      ? "You're next after the current singer!"
                      : `${userPosition} singer${userPosition > 1 ? "s" : ""} ahead`}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-text-muted text-[10px]">Your Song</p>
                <p className="text-white text-sm font-semibold truncate max-w-[140px]">
                  {userEntry.song_title}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Now Singing */}
        {nowSinging ? (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-round text-accent text-lg animate-pulse">mic</span>
              <p className="text-accent text-xs font-extrabold uppercase tracking-[0.15em]">
                Now Singing
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5 border-accent/20">
              <h3 className="text-white font-extrabold text-xl">{nowSinging.song_title}</h3>
              <p className="text-text-secondary mt-1">{nowSinging.artist}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="material-icons-round text-accent text-sm">person</span>
                </div>
                <span className="text-white/80 text-sm font-medium">
                  {nowSinging.profiles?.display_name || "Singer"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5 glass-card rounded-2xl p-6 text-center">
            <span className="material-icons-round text-primary/30 text-5xl mb-2">mic</span>
            <p className="text-white/50 font-semibold">Stage is Open</p>
            <p className="text-text-muted text-xs mt-1">Be the first to request a song!</p>
          </div>
        )}

        {/* Up Next */}
        {upNext && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <p className="text-primary text-xs font-extrabold uppercase tracking-[0.15em]">
                Up Next
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-primary text-xl">music_note</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{upNext.song_title}</p>
                  <p className="text-text-muted text-xs truncate">
                    {upNext.artist} — {upNext.profiles?.display_name || "Singer"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waiting Queue */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-text-muted uppercase tracking-widest">
              In Line
            </p>
            <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">
              {waiting.length} singer{waiting.length !== 1 ? "s" : ""}
            </span>
          </div>

          {waiting.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-text-muted text-sm">No one else in line</p>
            </div>
          ) : (
            <div className="space-y-2">
              {waiting.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`glass-card rounded-xl p-3.5 flex items-center gap-3 ${
                    user && entry.user_id === user.id
                      ? "border-primary/30 bg-primary/5"
                      : ""
                  }`}
                >
                  <span className="text-text-muted font-bold text-sm w-7 text-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{entry.song_title}</p>
                    <p className="text-text-muted text-xs truncate">
                      {entry.artist} — {entry.profiles?.display_name || "Singer"}
                    </p>
                  </div>
                  {user && entry.user_id === user.id && (
                    <span className="text-primary text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom CTA — Request a Song */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 z-40 md:bottom-6">
        {user ? (
          userEntry ? (
            <div className="w-full glass-card text-primary font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border-primary/30">
              <span className="material-icons-round">queue_music</span>
              You&apos;re in the queue — #{(userPosition ?? 0) + 1}
            </div>
          ) : (
            <button
              onClick={() => setShowRequest(true)}
              className="w-full bg-accent text-white font-bold py-4 rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 hover:shadow-accent/40 transition-all"
            >
              <span className="material-icons-round">queue_music</span>
              Request a Song
            </button>
          )
        ) : (
          <Link
            href="/signin"
            className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-primary/40 transition-all"
          >
            <span className="material-icons-round">login</span>
            Login to Request Songs
          </Link>
        )}
      </div>

      {/* Song Request Modal */}
      {showRequest && (
        <SongRequestModal
          venueId={id}
          venueName={displayName}
          onClose={() => setShowRequest(false)}
        />
      )}
    </div>
  );
}
