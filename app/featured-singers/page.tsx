"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

interface FeaturedSinger {
  id: string;
  highlight_type: string;
  title: string | null;
  song_title: string | null;
  song_artist: string | null;
  video_url: string | null;
  event_date: string;
  created_at: string;
  singer?: { display_name: string | null; avatar_url: string | null };
  venue?: { name: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  singer_of_night: "Singer of the Night",
  weekly_featured: "Weekly Featured",
  monthly_featured: "Monthly Featured",
};

const TYPE_COLORS: Record<string, string> = {
  monthly_featured: "bg-purple-500/10 text-purple-400",
  weekly_featured: "bg-blue-500/10 text-blue-400",
  singer_of_night: "bg-yellow-400/10 text-yellow-400",
};

export default function FeaturedSingersPage() {
  const [highlights, setHighlights] = useState<FeaturedSinger[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("singer_highlights")
      .select(
        "id, highlight_type, title, song_title, song_artist, video_url, event_date, created_at, singer:profiles!singer_user_id(display_name, avatar_url), venue:venues!venue_id(name)"
      )
      .eq("is_active", true)
      .eq("consent_status", "approved")
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setHighlights((data as unknown as FeaturedSinger[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let result = highlights;
    if (filter !== "all") result = result.filter((h) => h.highlight_type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          (h.singer?.display_name || "").toLowerCase().includes(q) ||
          (h.song_title || "").toLowerCase().includes(q) ||
          (h.song_artist || "").toLowerCase().includes(q) ||
          (h.venue?.name || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [highlights, filter, search]);

  const filterButtons = [
    { key: "all", label: "All" },
    { key: "singer_of_night", label: "Singer of the Night" },
    { key: "weekly_featured", label: "Weekly" },
    { key: "monthly_featured", label: "Monthly" },
  ];

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* Hero */}
      <div className="bg-gradient-to-b from-yellow-400/5 to-transparent border-b border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <Link
            href="/"
            className="text-text-muted text-sm hover:text-white transition-colors inline-flex items-center gap-1 mb-6"
          >
            <span className="material-icons-round text-sm">arrow_back</span>
            Home
          </Link>
          <p
            className="text-yellow-400 text-2xl mb-2"
            style={{ fontFamily: "var(--font-script)", textShadow: "0 0 20px rgba(250,204,21,0.3)" }}
          >
            Shining Stars
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight mb-4">
            Featured Singers
          </h1>
          <p className="text-text-secondary leading-relaxed max-w-lg">
            Outstanding performers recognized by KJs at karaoke venues across NYC.
            Watch their performances and celebrate the talent.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                  filter === btn.key
                    ? "bg-primary text-black"
                    : "bg-white/5 text-text-muted hover:text-white hover:bg-white/10"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search singers, songs, venues..."
              className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-icons-round text-4xl text-text-muted mb-3 block">search_off</span>
            <p className="text-text-secondary">
              {search ? `No results for "${search}"` : "No featured singers yet. Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((h) => {
              const videoId = h.video_url ? extractYouTubeVideoId(h.video_url) : null;
              return (
                <div
                  key={h.id}
                  className="glass-card rounded-2xl overflow-hidden hover:border-yellow-400/20 transition-all group cursor-pointer"
                  onClick={() => videoId && setPlayingVideoId(videoId)}
                >
                  {/* Video thumbnail or placeholder */}
                  {videoId ? (
                    <div className="relative aspect-video bg-black">
                      <img
                        src={getYouTubeThumbnail(videoId, "hq")}
                        alt={h.song_title || "Performance"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                        <span className="material-icons-round text-white text-5xl drop-shadow-lg">
                          play_circle_filled
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                        <span className="material-icons-round text-xs">play_arrow</span>
                        YouTube
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-yellow-400/5 to-primary/5 flex items-center justify-center">
                      <span className="material-icons-round text-yellow-400/40 text-6xl">star</span>
                    </div>
                  )}

                  {/* Card info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[h.highlight_type] || "bg-white/5 text-text-muted"}`}>
                        {TYPE_LABELS[h.highlight_type] || h.highlight_type}
                      </span>
                    </div>
                    <p className="text-white font-bold truncate">
                      {h.singer?.display_name || "Featured Singer"}
                    </p>
                    {h.song_title && (
                      <p className="text-accent text-sm font-semibold truncate mt-0.5">
                        &ldquo;{h.song_title}&rdquo;
                        {h.song_artist && (
                          <span className="text-text-muted font-normal"> by {h.song_artist}</span>
                        )}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {h.venue?.name && (
                        <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                          <span className="material-icons-round text-xs">location_on</span>
                          {h.venue.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video lightbox */}
      {playingVideoId && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPlayingVideoId(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPlayingVideoId(null)}
              className="absolute -top-12 right-0 text-white hover:text-primary transition-colors flex items-center gap-1 text-sm font-semibold"
            >
              <span className="material-icons-round">close</span>
              Close
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-2xl"
            />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
