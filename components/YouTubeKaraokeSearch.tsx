"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string | null;
  duration: string;
  channel: string;
}

interface CachedTrack {
  youtube_video_id: string;
  track_type: string;
}

export default function YouTubeKaraokeSearch({
  songTitle,
  artist,
  onSelect,
  onClose,
}: {
  songTitle: string;
  artist: string;
  onSelect: (videoId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(`${songTitle} ${artist} karaoke instrumental`);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cached, setCached] = useState<CachedTrack | null>(null);
  const [checkingCache, setCheckingCache] = useState(true);

  // Check cache first
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("karaoke_tracks")
      .select("youtube_video_id, track_type")
      .ilike("song_title", songTitle.trim())
      .ilike("artist", artist.trim())
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setCached(data[0] as CachedTrack);
        }
        setCheckingCache(false);
      });
  }, [songTitle, artist]);

  // Auto-search on mount (after cache check)
  useEffect(() => {
    if (!checkingCache) {
      search(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingCache]);

  const search = async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.videos || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleSelect = async (videoId: string) => {
    // Save to cache
    const supabase = createClient();
    await supabase.from("karaoke_tracks").upsert(
      {
        song_title: songTitle.trim(),
        artist: artist.trim(),
        youtube_video_id: videoId,
        track_type: "instrumental",
      },
      { onConflict: "song_title,artist,track_type" }
    );
    onSelect(videoId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card-dark border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Play Karaoke Track</h3>
            <p className="text-text-muted text-xs mt-0.5">Search YouTube for instrumental versions</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* Cached track */}
        {cached && (
          <div className="p-4 border-b border-border/50 bg-primary/5">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Previously Used</p>
            <button
              onClick={() => handleSelect(cached.youtube_video_id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-left"
            >
              <span className="material-icons-round text-primary text-2xl">play_circle</span>
              <div>
                <p className="text-white text-sm font-semibold">Use saved track</p>
                <p className="text-text-muted text-xs">{cached.track_type} version</p>
              </div>
            </button>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-border/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-icons-round text-text-muted absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search karaoke tracks..."
                className="w-full bg-bg-dark border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-black font-bold text-sm px-4 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && !searched && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="text-center py-12">
              <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
              <p className="text-text-muted text-sm">No results found. Try a different search.</p>
            </div>
          )}

          {results.map((video) => (
            <button
              key={video.id}
              onClick={() => handleSelect(video.id)}
              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              {/* Thumbnail */}
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-bg-dark flex-shrink-0 relative">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-icons-round text-text-muted">videocam</span>
                  </div>
                )}
                {video.duration && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <span className="material-icons-round text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    play_circle
                  </span>
                </div>
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">
                  {video.title}
                </p>
                <p className="text-text-muted text-xs mt-1">{video.channel}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <p className="text-text-muted text-[10px] text-center">
            Selected tracks are saved for future use
          </p>
        </div>
      </div>
    </div>
  );
}
