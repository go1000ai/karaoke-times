"use client";

import { useEffect, useState } from "react";
import { useQueueSubscription } from "@/hooks/useQueueSubscription";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface QueueStatusProps {
  venueId: string;
}

export default function QueueStatus({ venueId }: QueueStatusProps) {
  const { queue, loading } = useQueueSubscription(venueId);
  const { user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);

  if (loading) return null;
  if (queue.length === 0) return null;

  const nowSinging = queue.find((q) => q.status === "now_singing");
  const userEntry = user
    ? queue.find((q) => q.user_id === user.id && (q.status === "waiting" || q.status === "up_next"))
    : null;
  const isUpNext = user
    ? queue.some((q) => q.user_id === user.id && q.status === "up_next")
    : false;
  const ahead = userEntry
    ? queue.filter(
        (q) =>
          q.position < userEntry.position &&
          q.status !== "now_singing" &&
          q.status !== "completed" &&
          q.status !== "skipped"
      ).length
    : null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <p className="text-xs font-bold text-primary uppercase tracking-wider">Live Queue</p>
        <span className="text-text-muted text-xs ml-auto">{queue.length} in queue</span>
      </div>

      {nowSinging && (
        <div className="flex items-center gap-3 mb-3 bg-accent/5 rounded-xl p-3 border border-accent/20">
          <span className="material-icons-round text-accent text-2xl">mic</span>
          <div>
            <p className="text-xs text-accent font-bold uppercase">Now Singing</p>
            <p className="text-white font-semibold text-sm">{nowSinging.song_title}</p>
            <p className="text-text-muted text-xs">{nowSinging.artist}</p>
          </div>
        </div>
      )}

      {/* User is UP NEXT — show confirm/cancel with 3-min countdown */}
      {isUpNext && userEntry && !confirmed && (
        <UpNextBanner
          entryId={userEntry.id}
          songTitle={userEntry.song_title}
          onConfirm={() => setConfirmed(true)}
        />
      )}

      {isUpNext && confirmed && (
        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-primary">check_circle</span>
            <div>
              <p className="text-primary font-bold text-sm">Confirmed!</p>
              <p className="text-text-secondary text-xs">Get ready — you&apos;re singing next!</p>
            </div>
          </div>
        </div>
      )}

      {/* User is waiting (not up next) */}
      {userEntry && !isUpNext && ahead !== null && (
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
          <p className="text-primary font-bold text-sm">
            You&apos;re #{userEntry.position}
          </p>
          <p className="text-text-secondary text-xs">
            {ahead === 0 ? "You're up next!" : `${ahead} singer${ahead > 1 ? "s" : ""} ahead of you`}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {userEntry.song_title} {userEntry.artist && `— ${userEntry.artist}`}
          </p>
        </div>
      )}
    </div>
  );
}

function UpNextBanner({
  entryId,
  songTitle,
  onConfirm,
}: {
  entryId: string;
  songTitle: string;
  onConfirm: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const supabase = createClient();

  const handleCancel = async () => {
    await supabase
      .from("song_queue")
      .update({ status: "skipped", completed_at: new Date().toISOString() })
      .eq("id", entryId);
  };

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-4 border border-accent/30 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <span className="material-icons-round text-accent text-2xl">front_hand</span>
        <div className="flex-1">
          <p className="text-accent font-extrabold text-sm">You&apos;re Up Next!</p>
          <p className="text-text-secondary text-xs">&ldquo;{songTitle}&rdquo;</p>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-lg tabular-nums">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          <p className="text-text-muted text-[10px]">to confirm</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          <span className="material-icons-round text-lg">check</span>
          I&apos;m Ready!
        </button>
        <button
          onClick={handleCancel}
          className="px-5 bg-white/5 text-text-muted font-bold py-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
