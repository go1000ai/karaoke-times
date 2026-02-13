"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const SAVED_SONGS_KEY = "kt-saved-songs";

interface SavedSong {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  savedAt: string;
}

interface SongResult {
  trackName: string;
  artistName: string;
  artworkUrl100: string;
}

interface QueueEntry {
  id: string;
  venue_id: string;
  song_title: string;
  artist: string;
  status: string;
  position: number;
  requested_at: string;
  venues?: { name: string } | null;
}

const statusConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  now_singing: { label: "Singing Now", icon: "mic", color: "text-accent", bg: "bg-accent/10" },
  up_next: { label: "Up Next", icon: "front_hand", color: "text-primary", bg: "bg-primary/10" },
  waiting: { label: "In Line", icon: "schedule", color: "text-blue-400", bg: "bg-blue-400/10" },
  completed: { label: "Completed", icon: "check_circle", color: "text-green-400", bg: "bg-green-500/10" },
  skipped: { label: "Skipped", icon: "skip_next", color: "text-text-muted", bg: "bg-white/5" },
};

function loadSavedSongs(): SavedSong[] {
  try {
    const raw = localStorage.getItem(SAVED_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSongs(songs: SavedSong[]) {
  localStorage.setItem(SAVED_SONGS_KEY, JSON.stringify(songs));
}

export default function MySongsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"library" | "activity">("library");
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Add song form
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queue activity
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  useEffect(() => {
    setSongs(loadSavedSongs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function fetchQueue() {
      const { data } = await supabase
        .from("song_queue")
        .select("id, venue_id, song_title, artist, status, position, requested_at, venues(name)")
        .eq("user_id", user!.id)
        .order("requested_at", { ascending: false })
        .limit(50);
      setQueueEntries((data as unknown as QueueEntry[]) ?? []);
      setQueueLoading(false);
    }

    fetchQueue();

    const channel = supabase
      .channel("my-songs-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "song_queue", filter: `user_id=eq.${user.id}` }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Song search
  const searchSongs = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=8`);
      const data = await res.json();
      setResults(data.results || []);
    } catch { setResults([]); }
    setSearching(false);
  }, []);

  const handleSearchInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSongs(value), 350);
  };

  const addSong = (title: string, artist: string, artwork?: string) => {
    const newSong: SavedSong = {
      id: crypto.randomUUID(),
      title,
      artist,
      artwork,
      savedAt: new Date().toISOString(),
    };
    const updated = [newSong, ...songs];
    setSongs(updated);
    saveSongs(updated);

    // Reset add form
    setQuery("");
    setResults([]);
    setManualTitle("");
    setManualArtist("");
    setShowAdd(false);
  };

  const removeSong = (songId: string) => {
    const updated = songs.filter((s) => s.id !== songId);
    setSongs(updated);
    saveSongs(updated);
  };

  const activeQueue = queueEntries.filter((e) => ["waiting", "up_next", "now_singing"].includes(e.status));
  const pastQueue = queueEntries.filter((e) => ["completed", "skipped"].includes(e.status));

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold text-white">My Favorite Songs</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-black font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          <span className="material-icons-round text-lg">{showAdd ? "close" : "add"}</span>
          {showAdd ? "Cancel" : "Add Song"}
        </button>
      </div>
      <p className="text-text-secondary text-sm mb-5">
        Save your favorite songs and request them at any venue when you&apos;re ready to sing!
      </p>

      {/* Add Song Panel */}
      {showAdd && (
        <div className="glass-card rounded-2xl p-5 mb-6 border-primary/20">
          <h3 className="text-white font-bold mb-4">Add a Song</h3>

          {/* Mode Toggle */}
          <div className="flex gap-1 bg-card-dark rounded-xl p-1 mb-4">
            <button
              onClick={() => setMode("search")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${mode === "search" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-white"}`}
            >
              Search Songs
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${mode === "manual" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-white"}`}
            >
              Type Manually
            </button>
          </div>

          {mode === "search" && (
            <div>
              <div className="relative mb-3">
                <span className="material-icons-round text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">search</span>
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
              {results.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {results.map((song, i) => {
                    const alreadySaved = songs.some(
                      (s) => s.title.toLowerCase() === song.trackName.toLowerCase() && s.artist.toLowerCase() === song.artistName.toLowerCase()
                    );
                    return (
                      <button
                        key={`${song.trackName}-${song.artistName}-${i}`}
                        onClick={() => !alreadySaved && addSong(song.trackName, song.artistName, song.artworkUrl100)}
                        disabled={alreadySaved}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${alreadySaved ? "opacity-50" : "hover:bg-white/5"}`}
                      >
                        <img src={song.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-semibold truncate">{song.trackName}</p>
                          <p className="text-text-muted text-xs truncate">{song.artistName}</p>
                        </div>
                        {alreadySaved ? (
                          <span className="text-primary text-xs font-bold flex-shrink-0">Saved</span>
                        ) : (
                          <span className="material-icons-round text-primary/50 text-lg flex-shrink-0">add_circle</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-text-muted text-sm">No results found</p>
                  <button onClick={() => { setManualTitle(query); setMode("manual"); }} className="text-primary text-xs font-bold mt-2">
                    Type it manually instead
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "manual" && (
            <div className="space-y-3">
              <input
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Song title *"
                autoFocus
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />
              <input
                value={manualArtist}
                onChange={(e) => setManualArtist(e.target.value)}
                placeholder="Artist"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />
              <button
                onClick={() => manualTitle.trim() && addSong(manualTitle.trim(), manualArtist.trim())}
                disabled={!manualTitle.trim()}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-icons-round text-lg">library_add</span>
                Save to Favorites
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-card-dark rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("library")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            tab === "library" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-white"
          }`}
        >
          <span className="material-icons-round text-sm">library_music</span>
          Songbook ({songs.length})
        </button>
        <button
          onClick={() => setTab("activity")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            tab === "activity" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-white"
          }`}
        >
          <span className="material-icons-round text-sm">history</span>
          Queue History
          {activeQueue.length > 0 && (
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* SONGBOOK TAB */}
      {tab === "library" && (
        <>
          {songs.length > 0 ? (
            <div className="space-y-2">
              {songs.map((song) => (
                <div key={song.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  {/* Artwork */}
                  {song.artwork ? (
                    <img src={song.artwork} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-primary text-xl">music_note</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate">{song.title}</p>
                    <p className="text-text-muted text-xs truncate">{song.artist || "Unknown Artist"}</p>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/dashboard/request-song?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`}
                    className="bg-accent text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 hover:shadow-lg hover:shadow-accent/20 transition-all flex-shrink-0"
                  >
                    <span className="material-icons-round text-sm">queue_music</span>
                    Request
                  </Link>
                  <button
                    onClick={() => removeSong(song.id)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 hover:bg-red-500/10 transition-colors group"
                    title="Remove from songbook"
                  >
                    <span className="material-icons-round text-text-muted text-sm group-hover:text-red-400">close</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 text-center">
              <span className="material-icons-round text-5xl text-border mb-4">library_music</span>
              <h2 className="text-base font-bold text-white mb-1">Your songbook is empty</h2>
              <p className="text-text-secondary text-sm mb-4">
                Search and save songs you want to sing. When you&apos;re at a bar, just tap Request!
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                <span className="material-icons-round text-lg">add</span>
                Add Your First Song
              </button>
            </div>
          )}
        </>
      )}

      {/* QUEUE HISTORY TAB */}
      {tab === "activity" && (
        <>
          {/* Active */}
          {activeQueue.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                Active ({activeQueue.length})
              </p>
              <div className="space-y-2">
                {activeQueue.map((entry) => {
                  const config = statusConfig[entry.status] || statusConfig.waiting;
                  return (
                    <div key={entry.id} className={`glass-card rounded-xl p-4 flex items-center gap-3 ${entry.status === "now_singing" ? "border-accent/30" : entry.status === "up_next" ? "border-primary/30" : ""}`}>
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className={`material-icons-round ${config.color} text-lg`}>{config.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm truncate">{entry.song_title}</p>
                        <p className="text-text-muted text-xs truncate">{entry.artist} &bull; {entry.venues?.name || "Venue"}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.color} flex-shrink-0`}>
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past */}
          {pastQueue.length > 0 && (
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Past Songs</p>
              <div className="space-y-2">
                {pastQueue.map((entry) => {
                  const config = statusConfig[entry.status] || statusConfig.completed;
                  const date = new Date(entry.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={entry.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className={`material-icons-round ${config.color} text-lg`}>{config.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm truncate">{entry.song_title}</p>
                        <p className="text-text-muted text-xs truncate">{entry.artist} &bull; {entry.venues?.name || "Venue"}</p>
                      </div>
                      <p className="text-text-muted text-[10px] flex-shrink-0">{date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {queueLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!queueLoading && queueEntries.length === 0 && (
            <div className="glass-card rounded-2xl p-10 text-center">
              <span className="material-icons-round text-5xl text-border mb-4">history</span>
              <h2 className="text-base font-bold text-white mb-1">No queue history yet</h2>
              <p className="text-text-secondary text-sm">
                When you request songs at venues, your history will appear here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
