"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { resolveVenueId } from "@/lib/resolve-venue-id";

const SAVED_SONGS_KEY = "kt-saved-songs";

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

interface SavedSong {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  savedAt: string;
}

function loadSavedSongs(): SavedSong[] {
  try {
    const raw = localStorage.getItem(SAVED_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
  const [mode, setMode] = useState<"favorites" | "search" | "manual">("favorites");
  const [queuePaused, setQueuePaused] = useState<boolean | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Load saved songs and check queue pause on mount
  useEffect(() => {
    setSavedSongs(loadSavedSongs());
    supabase
      .from("venues")
      .select("queue_paused")
      .ilike("name", venueName.trim())
      .limit(1)
      .single()
      .then(({ data }) => {
        setQueuePaused(data?.queue_paused ?? false);
      });
  }, [venueName, supabase]);

  // Default to search if no saved songs
  useEffect(() => {
    if (savedSongs.length === 0 && mode === "favorites") {
      setMode("search");
    }
  }, [savedSongs, mode]);

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

  const selectSong = (title: string, artistName: string) => {
    setSongTitle(title);
    setArtist(artistName);
    setQuery("");
    setResults([]);
    setDuplicateWarning(false);
  };

  const checkDuplicate = async (title: string, resolvedVenueId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("song_queue")
      .select("id")
      .eq("venue_id", resolvedVenueId)
      .in("status", ["waiting", "up_next", "now_singing"])
      .ilike("song_title", title.trim())
      .limit(1);

    return (data?.length ?? 0) > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !songTitle.trim()) return;

    setSubmitting(true);
    setError("");

    // Resolve venue name to Supabase UUID
    const supabaseVenueId = await resolveVenueId(venueName);
    if (!supabaseVenueId) {
      setError("Venue not found. Please try again.");
      setSubmitting(false);
      return;
    }

    // Check for duplicates (unless user already dismissed the warning)
    if (!duplicateWarning) {
      const isDupe = await checkDuplicate(songTitle, supabaseVenueId);
      if (isDupe) {
        setDuplicateWarning(true);
        setSubmitting(false);
        return;
      }
    }

    const { data: lastInQueue } = await supabase
      .from("song_queue")
      .select("position")
      .eq("venue_id", supabaseVenueId)
      .in("status", ["waiting", "up_next", "now_singing"])
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = ((lastInQueue?.position as number) ?? 0) + 1;

    const { error: insertError } = await supabase.from("song_queue").insert({
      venue_id: supabaseVenueId,
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

  // Loading state while checking pause status
  if (queuePaused === null) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-3xl p-8 max-w-md w-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Queue is paused
  if (queuePaused) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-round text-amber-400 text-3xl">pause_circle</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Queue is Paused</h2>
          <p className="text-text-secondary text-sm mb-6">
            The KJ has temporarily paused song requests. Check back in a few minutes!
          </p>
          <button
            onClick={onClose}
            className="bg-white/10 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/20 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

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
          {savedSongs.length > 0 && (
            <button
              onClick={() => setMode("favorites")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                mode === "favorites"
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-white"
              }`}
            >
              <span className="material-icons-round text-xs">library_music</span>
              My Favorites
            </button>
          )}
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

        {/* Favorites Mode */}
        {mode === "favorites" && (
          <div className="mb-4 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
              {savedSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => selectSong(song.title, song.artist)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  {song.artwork ? (
                    <img src={song.artwork} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-primary text-lg">music_note</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-semibold truncate">{song.title}</p>
                    <p className="text-text-muted text-xs truncate">{song.artist || "Unknown Artist"}</p>
                  </div>
                  <span className="material-icons-round text-primary/50 text-lg flex-shrink-0">
                    add_circle
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                    onClick={() => selectSong(song.trackName, song.artistName)}
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
            {songTitle && mode !== "manual" && (
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
                    setDuplicateWarning(false);
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
                    onChange={(e) => {
                      setSongTitle(e.target.value);
                      setDuplicateWarning(false);
                    }}
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

            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                <span className="material-icons-round text-amber-400 text-lg mt-0.5 flex-shrink-0">warning</span>
                <div>
                  <p className="text-amber-400 text-sm font-bold">Already in Queue</p>
                  <p className="text-text-secondary text-xs mt-0.5">
                    This song is already in the queue. Submit anyway?
                  </p>
                </div>
              </div>
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
                  {duplicateWarning ? "Submit Anyway" : "Submit Request"}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
