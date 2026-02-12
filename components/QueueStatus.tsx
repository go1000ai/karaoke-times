"use client";

import { useQueueSubscription } from "@/hooks/useQueueSubscription";
import { useAuth } from "@/components/AuthProvider";

interface QueueStatusProps {
  venueId: string;
}

export default function QueueStatus({ venueId }: QueueStatusProps) {
  const { queue, loading } = useQueueSubscription(venueId);
  const { user } = useAuth();

  if (loading) return null;
  if (queue.length === 0) return null;

  const nowSinging = queue.find((q) => q.status === "now_singing");
  const userEntry = user ? queue.find((q) => q.user_id === user.id && q.status === "waiting") : null;
  const ahead = userEntry
    ? queue.filter((q) => q.position < userEntry.position && q.status !== "now_singing").length
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

      {userEntry && ahead !== null && (
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
