"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube";

interface SingerHighlight {
  id: string;
  singer_user_id: string;
  highlight_type: string;
  title: string | null;
  notes: string | null;
  song_title: string | null;
  song_artist: string | null;
  video_url: string | null;
  consent_status: string;
  event_date: string;
  is_active: boolean;
  created_at: string;
  singer?: { display_name: string | null };
}

interface SingerResult {
  id: string;
  display_name: string | null;
}

export default function FeaturedSingersPage() {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<SingerHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Singer search
  const [singerQuery, setSingerQuery] = useState("");
  const [singerResults, setSingerResults] = useState<SingerResult[]>([]);
  const [selectedSinger, setSelectedSinger] = useState<SingerResult | null>(null);
  const [showSingerDropdown, setShowSingerDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const videoId = extractYouTubeVideoId(videoUrl);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const activeVenueId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("active_venue="))
        ?.split("=")[1];

      if (activeVenueId) {
        setVenueId(activeVenueId);
        const { data } = await supabase
          .from("singer_highlights")
          .select("*, singer:profiles!singer_user_id(display_name)")
          .eq("venue_id", activeVenueId)
          .eq("highlighted_by", user!.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setHighlights((data as unknown as SingerHighlight[]) || []);
      }
      setLoading(false);
    }

    load();
  }, [user, supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSingerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Singer search with debounce
  function handleSingerSearch(query: string) {
    setSingerQuery(query);
    setSelectedSinger(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length < 2) {
      setSingerResults([]);
      setShowSingerDropdown(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", `%${query}%`)
        .limit(8);
      setSingerResults(data || []);
      setShowSingerDropdown(true);
    }, 300);
  }

  function selectSinger(singer: SingerResult) {
    setSelectedSinger(singer);
    setSingerQuery(singer.display_name || "");
    setShowSingerDropdown(false);
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!venueId || !user || !selectedSinger) return;
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("singer_highlights").insert({
      venue_id: venueId,
      singer_user_id: selectedSinger.id,
      highlighted_by: user.id,
      highlight_type: form.get("highlight_type") as string,
      title: (form.get("title") as string) || null,
      song_title: (form.get("song_title") as string) || null,
      song_artist: (form.get("song_artist") as string) || null,
      notes: (form.get("notes") as string) || null,
      video_url: videoUrl || null,
      // consent_status defaults to 'pending' in DB
    });

    if (!error) {
      setShowForm(false);
      setVideoUrl("");
      setSingerQuery("");
      setSelectedSinger(null);
      // Reload
      const { data } = await supabase
        .from("singer_highlights")
        .select("*, singer:profiles!singer_user_id(display_name)")
        .eq("venue_id", venueId)
        .eq("highlighted_by", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setHighlights((data as unknown as SingerHighlight[]) || []);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const consentColor = (status: string) => {
    if (status === "approved") return "bg-green-500/10 text-green-400";
    if (status === "declined") return "bg-red-500/10 text-red-400";
    return "bg-yellow-500/10 text-yellow-400";
  };
  const consentLabel = (status: string) => {
    if (status === "approved") return "Approved";
    if (status === "declined") return "Declined";
    return "Pending Consent";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Featured Singers</h1>
          <p className="text-text-secondary text-sm">
            Highlight standout performers and share their YouTube videos.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-1.5"
        >
          <span className="material-icons-round text-lg">add</span>
          Feature Singer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card rounded-2xl p-6 mb-8 space-y-4">
          <h3 className="text-sm font-bold text-white">New Singer Feature</h3>

          {/* Singer search */}
          <div ref={dropdownRef} className="relative">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Singer Name *
            </label>
            <input
              type="text"
              value={singerQuery}
              onChange={(e) => handleSingerSearch(e.target.value)}
              placeholder="Search for a singer by name..."
              required
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {selectedSinger && (
              <div className="absolute right-3 top-[38px] flex items-center gap-1">
                <span className="text-green-400 text-xs font-semibold">Selected</span>
                <span className="material-icons-round text-green-400 text-sm">check_circle</span>
              </div>
            )}
            {showSingerDropdown && singerResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-card-dark border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {singerResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSinger(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-primary/10 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {s.display_name || "Unknown Singer"}
                  </button>
                ))}
              </div>
            )}
            {showSingerDropdown && singerQuery.length >= 2 && singerResults.length === 0 && (
              <div className="absolute z-20 w-full mt-1 bg-card-dark border border-border rounded-xl shadow-xl px-4 py-3 text-sm text-text-muted">
                No singers found matching &ldquo;{singerQuery}&rdquo;
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Highlight Type
              </label>
              <select
                name="highlight_type"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer"
              >
                <option value="singer_of_night">Singer of the Night</option>
                <option value="weekly_featured">Weekly Featured</option>
                <option value="monthly_featured">Monthly Featured</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Custom Title
              </label>
              <input
                name="title"
                type="text"
                placeholder="e.g. Best Performance"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Song Title
              </label>
              <input
                name="song_title"
                type="text"
                placeholder="Song they performed"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Song Artist
              </label>
              <input
                name="song_artist"
                type="text"
                placeholder="Original artist"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* YouTube URL */}
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              YouTube Video URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {videoId && (
              <div className="mt-3 relative w-48 aspect-video rounded-lg overflow-hidden bg-black">
                <img
                  src={getYouTubeThumbnail(videoId)}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="material-icons-round text-white text-3xl">play_circle_filled</span>
                </div>
                <div className="absolute bottom-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <span className="material-icons-round text-xs">play_arrow</span>
                  YouTube
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Why are you highlighting this singer?"
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <p className="text-text-muted text-xs flex items-center gap-1">
            <span className="material-icons-round text-sm">info</span>
            The singer will be notified and must approve before their feature goes public.
          </p>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !selectedSinger}
              className="bg-primary text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Feature"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setVideoUrl("");
                setSingerQuery("");
                setSelectedSinger(null);
              }}
              className="text-text-muted font-semibold text-sm px-6 py-2.5 rounded-xl hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {highlights.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <span className="material-icons-round text-4xl text-text-muted mb-3 block">star_border</span>
          <p className="text-text-secondary text-sm">
            No featured singers yet. Highlight a standout performer from your next event!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {highlights.map((h) => {
            const hVideoId = h.video_url ? extractYouTubeVideoId(h.video_url) : null;
            return (
              <div key={h.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                {/* Video thumbnail or star icon */}
                {hVideoId ? (
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 relative">
                    <img
                      src={getYouTubeThumbnail(hVideoId, "default")}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="material-icons-round text-white text-lg">play_arrow</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-primary">
                      {h.highlight_type === "singer_of_night" ? "star" : "emoji_events"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      {h.singer?.display_name || h.title || "Featured Singer"}
                    </span>
                    <span className="text-[10px] font-semibold text-text-muted bg-card-dark px-2 py-0.5 rounded-full">
                      {h.highlight_type.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${consentColor(h.consent_status)}`}>
                      {consentLabel(h.consent_status)}
                    </span>
                  </div>
                  {h.song_title && (
                    <p className="text-xs text-text-secondary mt-0.5">
                      &ldquo;{h.song_title}&rdquo; {h.song_artist && `by ${h.song_artist}`}
                    </p>
                  )}
                  <p className="text-[10px] text-text-muted mt-1">
                    {new Date(h.event_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
