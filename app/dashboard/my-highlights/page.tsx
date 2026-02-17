"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube";
import {
  approveFeaturedHighlight,
  declineFeaturedHighlight,
} from "@/app/dashboard/featured-singers/actions";

interface HighlightRequest {
  id: string;
  highlight_type: string;
  title: string | null;
  song_title: string | null;
  song_artist: string | null;
  video_url: string | null;
  notes: string | null;
  consent_status: string;
  event_date: string;
  created_at: string;
  highlighter?: { display_name: string | null };
  venue?: { name: string | null };
}

export default function MyHighlightsPage() {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<HighlightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    supabase
      .from("singer_highlights")
      .select(
        "id, highlight_type, title, song_title, song_artist, video_url, notes, consent_status, event_date, created_at, highlighter:profiles!highlighted_by(display_name), venue:venues!venue_id(name)"
      )
      .eq("singer_user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setHighlights((data as unknown as HighlightRequest[]) || []);
        setLoading(false);
      });
  }, [user]);

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveFeaturedHighlight(id);
      if (result.success) {
        setHighlights((prev) =>
          prev.map((h) => (h.id === id ? { ...h, consent_status: "approved" } : h))
        );
      }
    });
  }

  function handleDecline(id: string) {
    startTransition(async () => {
      const result = await declineFeaturedHighlight(id);
      if (result.success) {
        setHighlights((prev) =>
          prev.map((h) => (h.id === id ? { ...h, consent_status: "declined" } : h))
        );
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = highlights.filter((h) => h.consent_status === "pending");
  const approved = highlights.filter((h) => h.consent_status === "approved");
  const declined = highlights.filter((h) => h.consent_status === "declined");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">My Highlights</h1>
      <p className="text-text-secondary text-sm mb-8">
        KJs have featured you! Approve to go public or decline to stay private.
      </p>

      {highlights.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <span className="material-icons-round text-4xl text-text-muted mb-3 block">stars</span>
          <p className="text-text-secondary text-sm">
            No highlights yet. Keep singing and a KJ might feature you!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Requests */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-icons-round text-base">pending</span>
                Pending Approval ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((h) => (
                  <HighlightCard
                    key={h.id}
                    highlight={h}
                    onApprove={() => handleApprove(h.id)}
                    onDecline={() => handleDecline(h.id)}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved */}
          {approved.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-icons-round text-base">check_circle</span>
                Approved ({approved.length})
              </h2>
              <div className="space-y-3">
                {approved.map((h) => (
                  <HighlightCard key={h.id} highlight={h} />
                ))}
              </div>
            </div>
          )}

          {/* Declined */}
          {declined.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-icons-round text-base">block</span>
                Declined ({declined.length})
              </h2>
              <div className="space-y-3 opacity-50">
                {declined.map((h) => (
                  <HighlightCard
                    key={h.id}
                    highlight={h}
                    onApprove={() => handleApprove(h.id)}
                    isPending={isPending}
                    showReapprove
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HighlightCard({
  highlight: h,
  onApprove,
  onDecline,
  isPending,
  showReapprove,
}: {
  highlight: HighlightRequest;
  onApprove?: () => void;
  onDecline?: () => void;
  isPending?: boolean;
  showReapprove?: boolean;
}) {
  const videoId = h.video_url ? extractYouTubeVideoId(h.video_url) : null;

  const typeColors: Record<string, string> = {
    monthly_featured: "bg-purple-500/10 text-purple-400",
    weekly_featured: "bg-blue-500/10 text-blue-400",
    singer_of_night: "bg-yellow-400/10 text-yellow-400",
  };
  const typeLabels: Record<string, string> = {
    monthly_featured: "Monthly Featured",
    weekly_featured: "Weekly Featured",
    singer_of_night: "Singer of the Night",
  };

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${h.consent_status === "pending" ? "border border-yellow-400/20" : ""}`}>
      <div className="p-5">
        <div className="flex gap-4">
          {/* Video thumbnail */}
          {videoId ? (
            <div className="w-28 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
              <img
                src={getYouTubeThumbnail(videoId)}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="material-icons-round text-white text-2xl">play_circle_filled</span>
              </div>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-yellow-400 text-2xl">star</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[h.highlight_type] || "bg-white/5 text-text-muted"}`}>
                {typeLabels[h.highlight_type] || h.highlight_type}
              </span>
              {h.venue?.name && (
                <span className="text-[10px] text-text-muted">
                  at {h.venue.name}
                </span>
              )}
            </div>
            <p className="text-white font-bold text-sm">
              {h.title || typeLabels[h.highlight_type] || "Featured"}
            </p>
            {h.song_title && (
              <p className="text-accent text-xs font-semibold mt-0.5">
                &ldquo;{h.song_title}&rdquo;
                {h.song_artist && <span className="text-text-muted"> by {h.song_artist}</span>}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {h.highlighter?.display_name && (
                <span className="text-[10px] text-text-muted">
                  Featured by {h.highlighter.display_name}
                </span>
              )}
              <span className="text-[10px] text-text-muted">
                {new Date(h.created_at).toLocaleDateString()}
              </span>
            </div>
            {h.notes && (
              <p className="text-text-muted text-xs mt-2 italic">&ldquo;{h.notes}&rdquo;</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {(h.consent_status === "pending" || showReapprove) && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            {onApprove && (
              <button
                onClick={onApprove}
                disabled={isPending}
                className="flex items-center gap-1.5 bg-green-500/10 text-green-400 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                <span className="material-icons-round text-sm">check</span>
                {showReapprove ? "Re-approve" : "Approve"}
              </button>
            )}
            {onDecline && h.consent_status === "pending" && (
              <button
                onClick={onDecline}
                disabled={isPending}
                className="flex items-center gap-1.5 bg-red-500/10 text-red-400 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <span className="material-icons-round text-sm">close</span>
                Decline
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
