"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface SongRequestModalProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
}

interface SongResult {
  trackName: string;
  artistName: string;
  artworkUrl100: string;
}

export default function SongRequestModal({ venueId, venueName, onClose }: SongRequestModalProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"search" | "manual">("search");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const searchSongs = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=8`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, []);

  const handleSearchInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSongs(value), 350);
  };

  const selectSong = (song: SongResult) => {
    setSongTitle(song.trackName);
    setArtist(song.artistName);
    setQuery("");
    setResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !songTitle.trim()) return;

    setSubmitting(true);
    setError("");

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
      <div className="relative glass-card rounded-3xl p-6 max-w-md w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-white">Request a Song</h2>
            <p className="text-text-muted text-xs mt-0.5">{venueName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 bg-card-dark rounded-xl p-1 mb-4">
          <button
            onClick={() => setMode("search")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === "search"
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:text-white"
            }`}
          >
            Search Songs
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              mode === "manual"
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:text-white"
            }`}
          >
            Type Manually
          </button>
        </div>

        {/* Search Mode */}
        {mode === "search" && (
          <div className="mb-4 flex-1 min-h-0 flex flex-col">
            <div className="relative mb-3">
              <span className="material-icons-round text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">
                search
              </span>
              <input
                value={query}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search by song or artist..."
                autoFocus
                className="w-full bg-card-dark border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
                {results.map((song, i) => (
                  <button
                    key={`${song.trackName}-${song.artistName}-${i}`}
                    onClick={() => selectSong(song)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <img
                      src={song.artworkUrl100}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">{song.trackName}</p>
                      <p className="text-text-muted text-xs truncate">{song.artistName}</p>
                    </div>
                    <span className="material-icons-round text-primary/50 text-lg flex-shrink-0">
                      add_circle
                    </span>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <div className="text-center py-6">
                <p className="text-text-muted text-sm">No results found</p>
                <button
                  onClick={() => {
                    setSongTitle(query);
                    setMode("manual");
                  }}
                  className="text-primary text-xs font-bold mt-2"
                >
                  Type it manually instead
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected Song / Manual Mode */}
        {(mode === "manual" || songTitle) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {songTitle && mode === "search" && (
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                <span className="material-icons-round text-primary">music_note</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold truncate">{songTitle}</p>
                  <p className="text-text-muted text-xs truncate">{artist}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSongTitle("");
                    setArtist("");
                  }}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <span className="material-icons-round text-lg">close</span>
                </button>
              </div>
            )}

            {mode === "manual" && (
              <>
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
              </>
            )}

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
        )}
      </div>
    </div>
  );
}
