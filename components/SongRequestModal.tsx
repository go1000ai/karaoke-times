"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface SongRequestModalProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
}

export default function SongRequestModal({ venueId, venueName, onClose }: SongRequestModalProps) {
  const { user } = useAuth();
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !songTitle.trim()) return;

    setSubmitting(true);
    setError("");

    // Get next position
    const { data: lastInQueue } = await supabase
      .from("song_queue")
      .select("position")
      .eq("venue_id", venueId)
      .in("status", ["waiting", "up_next", "now_singing"])
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = ((lastInQueue?.position as number) ?? 0) + 1;

    const { error: insertError } = await supabase.from("song_queue").insert({
      venue_id: venueId,
      user_id: user.id,
      song_title: songTitle.trim(),
      artist: artist.trim(),
      position: nextPosition,
      status: "waiting",
    });

    setSubmitting(false);

    if (insertError) {
      setError("Failed to submit. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-round text-primary text-3xl">check_circle</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">You&apos;re In!</h2>
          <p className="text-text-secondary text-sm mb-6">
            Your song request has been submitted. Check the queue to see your position!
          </p>
          <button
            onClick={onClose}
            className="bg-primary text-black font-bold px-8 py-3 rounded-xl"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">Request a Song</h2>
            <p className="text-text-muted text-xs mt-0.5">{venueName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Song Title *
            </label>
            <input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Enter song name..."
              required
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Artist
            </label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Who sings it?"
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !songTitle.trim()}
            className="w-full bg-primary text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-icons-round text-xl">queue_music</span>
                Submit Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
