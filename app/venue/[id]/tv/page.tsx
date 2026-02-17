"use client";

import { use, useEffect, useState, useMemo, useRef } from "react";
import { useQueueSubscriptionById, type QueueEntry } from "@/hooks/useQueueSubscriptionById";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import YouTubePlayer, { type YouTubePlayerHandle } from "@/components/YouTubePlayer";

/* ── Types ─────────────────────────────────────────────── */

interface VenueInfo {
  name: string;
  dj: string | null;
  eventName: string | null;
  startTime: string | null;
  endTime: string | null;
  eventNotes: string | null;
}

interface Special {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string;
  image_url: string | null;
}

interface Promo {
  id: string;
  title: string;
  description: string | null;
}

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

interface SingerHighlight {
  id: string;
  title: string | null;
  song_title: string | null;
  song_artist: string | null;
  highlight_type: string;
  singer?: { display_name: string | null };
}

interface TVSettings {
  show_specials: boolean;
  show_promos: boolean;
  show_media: boolean;
  show_event: boolean;
  show_queue: boolean;
  show_qr: boolean;
  slide_interval: number;
}

const DEFAULT_SETTINGS: TVSettings = {
  show_specials: true,
  show_promos: true,
  show_media: true,
  show_event: true,
  show_queue: true,
  show_qr: true,
  slide_interval: 8,
};

type Slide =
  | { kind: "specials"; items: Special[] }
  | { kind: "promo"; promo: Promo }
  | { kind: "media"; media: MediaItem }
  | { kind: "event"; venue: VenueInfo }
  | { kind: "singer_highlight"; highlight: SingerHighlight };

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ── Page Component ────────────────────────────────────── */

export default function TVDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { queue, loading } = useQueueSubscriptionById(id);

  const [venueInfo, setVenueInfo] = useState<VenueInfo | null>(null);
  const [clock, setClock] = useState("");
  const [specials, setSpecials] = useState<Special[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [singerHighlights, setSingerHighlights] = useState<SingerHighlight[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [tvSettings, setTvSettings] = useState<TVSettings>(DEFAULT_SETTINGS);

  /* ── YouTube on TV (controlled by KJ) ─────────────── */
  const [tvVideoId, setTvVideoId] = useState<string | null>(null);
  const tvYtRef = useRef<YouTubePlayerHandle>(null);

  /* ── VirtualDJ now-playing (broadcast from KJ's bridge) ── */
  const [vdjNowPlaying, setVdjNowPlaying] = useState<{
    title: string;
    artist: string;
    position: number;
    length: number;
    isPlaying: boolean;
  } | null>(null);
  const [vdjSinger, setVdjSinger] = useState<string | null>(null);

  // Subscribe to the KJ's broadcast channel for TV mode + playback sync
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`youtube-sync:${id}`);

    channel
      .on("broadcast", { event: "tv-mode" }, ({ payload }) => {
        if (payload?.show && payload?.videoId) {
          setTvVideoId(payload.videoId);
        } else {
          setTvVideoId(null);
        }
      })
      .on("broadcast", { event: "playback" }, ({ payload }) => {
        if (!tvYtRef.current) return;
        if (payload?.resync && payload?.time !== undefined) {
          // KJ hit resync — seek to their current time
          tvYtRef.current.seekTo(payload.time);
          tvYtRef.current.play();
        } else if (payload?.playing === false) {
          tvYtRef.current.pause();
        } else if (payload?.playing === true) {
          tvYtRef.current.play();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Subscribe to VDJ bridge broadcast for now-playing info
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`vdj-sync:${id}`);

    channel
      .on("broadcast", { event: "vdj-status" }, ({ payload }) => {
        if (payload?.nowPlaying) {
          setVdjNowPlaying(payload.nowPlaying);
          setVdjSinger(payload.singer || null);
        } else {
          setVdjNowPlaying(null);
          setVdjSinger(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  /* ── Live clock ─────────────────────────────────────── */
  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    tick();
    const interval = setInterval(tick, 10_000);
    return () => clearInterval(interval);
  }, []);

  /* ── Fetch venue info + today's event ───────────────── */
  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    supabase
      .from("venues")
      .select("name, tv_display_settings, venue_events(dj, event_name, start_time, end_time, notes)")
      .eq("id", id)
      .eq("venue_events.day_of_week", today)
      .eq("venue_events.is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.tv_display_settings) {
            setTvSettings({ ...DEFAULT_SETTINGS, ...(data.tv_display_settings as Partial<TVSettings>) });
          }
          const events = data.venue_events as {
            dj: string;
            event_name: string;
            start_time: string;
            end_time: string;
            notes: string;
          }[] | null;
          const ev = events?.[0] || null;
          setVenueInfo({
            name: data.name,
            dj: ev?.dj || null,
            eventName: ev?.event_name || null,
            startTime: ev?.start_time || null,
            endTime: ev?.end_time || null,
            eventNotes: ev?.notes || null,
          });
        }
      });
  }, [id]);

  /* ── Fetch featured specials ────────────────────────── */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("pos_menu_items")
      .select("id, name, description, price, category, image_url")
      .eq("venue_id", id)
      .eq("is_featured", true)
      .eq("is_available", true)
      .order("category")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setSpecials(data as Special[]);
      });
  }, [id]);

  /* ── Fetch active promos ────────────────────────────── */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("venue_promos")
      .select("id, title, description")
      .eq("venue_id", id)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setPromos(data as Promo[]);
      });
  }, [id]);

  /* ── Fetch venue media (only items marked for TV) ───── */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("venue_media")
      .select("id, url, type, sort_order")
      .eq("venue_id", id)
      .eq("show_on_tv", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setMedia(data as MediaItem[]);
      });
  }, [id]);

  /* ── Fetch singer highlights for venue ───────────────── */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("singer_highlights")
      .select("id, title, song_title, song_artist, highlight_type, singer:profiles!singer_user_id(display_name)")
      .eq("venue_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setSingerHighlights(data as unknown as SingerHighlight[]);
      });
  }, [id]);

  /* ── Build slides array from available data + settings ── */
  const slides: Slide[] = useMemo(() => {
    const s: Slide[] = [];
    if (tvSettings.show_specials && specials.length > 0) {
      // Group specials by category — one slide per category
      const grouped = new Map<string, Special[]>();
      for (const item of specials) {
        const cat = item.category || "Specials";
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(item);
      }
      for (const [, items] of grouped) {
        s.push({ kind: "specials", items });
      }
    }
    if (tvSettings.show_promos) {
      for (const promo of promos) {
        s.push({ kind: "promo", promo });
      }
    }
    if (tvSettings.show_media) {
      for (const m of media) {
        s.push({ kind: "media", media: m });
      }
    }
    if (tvSettings.show_event && venueInfo?.eventName) {
      s.push({ kind: "event", venue: venueInfo });
    }
    // Singer highlights always show when available
    for (const h of singerHighlights) {
      s.push({ kind: "singer_highlight", highlight: h });
    }
    return s;
  }, [specials, promos, media, venueInfo, tvSettings, singerHighlights]);

  /* ── Auto-rotate slides ─────────────────────────────── */
  useEffect(() => {
    if (slides.length <= 1) return;
    const ms = (tvSettings.slide_interval || 8) * 1000;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, ms);
    return () => clearInterval(interval);
  }, [slides.length, tvSettings.slide_interval]);

  // Reset index if slides change length
  useEffect(() => {
    setSlideIndex(0);
  }, [slides.length]);

  /* ── Queue breakdown ────────────────────────────────── */
  const nowSinging = queue.find((q) => q.status === "now_singing");
  const upNext = queue.find((q) => q.status === "up_next");
  const waiting = queue.filter((q) => q.status === "waiting");

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const queueUrl = `https://karaoke-times.vercel.app/venue/${id}/queue`;
  const currentSlide = slides[slideIndex % Math.max(slides.length, 1)] ?? null;

  return (
    <div className="h-screen bg-black text-white overflow-hidden select-none flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-bg-dark via-black to-bg-dark border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Karaoke Times"
            className="h-14 w-auto"
            style={{
              filter:
                "drop-shadow(0 0 4px rgba(212,160,23,0.8)) drop-shadow(0 0 12px rgba(212,160,23,0.4))",
            }}
          />
          <div>
            <h1 className="text-xl font-extrabold text-white leading-tight">
              {venueInfo?.name || "Karaoke Night"}
            </h1>
            {venueInfo?.dj && (
              <p className="text-primary text-sm font-bold neon-glow-green">
                KJ {venueInfo.dj}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-white tabular-nums">{clock}</p>
          <p className="text-xs text-text-muted uppercase tracking-widest">Tonight</p>
        </div>
      </div>

      {/* ── Main Content — 2 Column Layout ──────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left Column — YouTube / VDJ / Rotating Content ── */}
        <div className="flex-1 relative overflow-hidden">
          {tvVideoId ? (
            /* ── YouTube Video from KJ ──────────────────── */
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <div className="w-full h-full">
                <YouTubePlayer
                  ref={tvYtRef}
                  videoId={tvVideoId}
                  muted
                />
              </div>
              {/* "Now Playing" indicator */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  Now Playing
                </span>
              </div>
            </div>
          ) : vdjNowPlaying?.isPlaying ? (
            /* ── VirtualDJ Now Playing overlay ───────────── */
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              {/* Ambient background glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[30%] left-[20%] w-[50%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[15%] w-[40%] h-[30%] bg-accent/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
              </div>

              <div className="relative text-center px-12 max-w-2xl">
                {/* VDJ badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-purple-400 text-xs font-extrabold uppercase tracking-[0.2em]">
                    Now Playing via VirtualDJ
                  </span>
                </div>

                {/* Song info */}
                <div className="animate-tv-textReveal">
                  <span className="material-icons-round text-purple-400/30 text-[100px] mb-2">music_note</span>
                  <h2 className="text-5xl font-extrabold text-white leading-tight mb-3">
                    {vdjNowPlaying.title}
                  </h2>
                  <p className="text-2xl text-purple-300 font-bold mb-2">{vdjNowPlaying.artist}</p>
                  {vdjSinger && (
                    <p className="text-accent text-lg font-semibold neon-glow-pink mt-1">
                      <span className="material-icons-round text-sm align-middle mr-1">mic</span>
                      {vdjSinger}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                {vdjNowPlaying.length > 0 && (
                  <div className="mt-8 w-full max-w-md mx-auto">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-accent rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, (vdjNowPlaying.position / vdjNowPlaying.length) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-text-muted font-mono">
                      <span>{formatSeconds(vdjNowPlaying.position)}</span>
                      <span>{formatSeconds(vdjNowPlaying.length)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Slides (promos, specials, etc.) ────────── */
            <>
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] left-[10%] w-[60%] h-[40%] bg-accent/8 blur-[100px] rounded-full" />
                <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[30%] bg-primary/8 blur-[80px] rounded-full" />
              </div>

              {/* Current slide — absolute fill so nothing clips */}
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                {currentSlide ? (
                  <div
                    key={`${currentSlide.kind}-${slideIndex}`}
                    className="w-full h-full flex items-center justify-center animate-tv-slideIn"
                  >
                    {currentSlide.kind === "specials" && (
                      <SpecialsSlide items={currentSlide.items} />
                    )}
                    {currentSlide.kind === "promo" && (
                      <PromoSlide promo={currentSlide.promo} />
                    )}
                    {currentSlide.kind === "media" && (
                      <MediaSlide media={currentSlide.media} />
                    )}
                    {currentSlide.kind === "event" && (
                      <EventSlide venue={currentSlide.venue} />
                    )}
                    {currentSlide.kind === "singer_highlight" && (
                      <SingerHighlightSlide highlight={currentSlide.highlight} />
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="material-icons-round text-primary/20 text-[120px] mb-4">
                      mic
                    </span>
                    <p className="text-2xl font-bold text-white/40">Karaoke Night</p>
                    <p className="text-text-muted mt-2">Scan the QR code to request a song!</p>
                  </div>
                )}
              </div>

              {/* Slide indicators — absolute so they don't reduce content space */}
              {slides.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2">
                  {slides.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        i === slideIndex % slides.length
                          ? "bg-primary w-6"
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right Column — Queue + QR ─────────────────── */}
        {(tvSettings.show_queue || tvSettings.show_qr) && (
          <div className="w-[380px] bg-white/[0.02] border-l border-border/20 flex flex-col">
            {/* Now Singing */}
            {nowSinging && tvSettings.show_queue && (
              <div className="p-4 border-b border-border/20 bg-accent/5 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-accent text-lg animate-pulse">mic</span>
                  <p className="text-accent text-xs font-extrabold uppercase tracking-[0.15em] neon-glow-pink">
                    Now Singing
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-accent text-2xl">music_note</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-lg truncate">{nowSinging.song_title}</p>
                    <p className="text-text-secondary text-sm truncate">{nowSinging.artist}</p>
                    <p className="text-accent text-xs font-semibold mt-0.5">
                      {nowSinging.profiles?.display_name || "Singer"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Up Next */}
            {upNext && tvSettings.show_queue && (
              <div className="p-4 border-b border-border/20 bg-primary/5 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <p className="text-primary text-xs font-extrabold uppercase tracking-[0.15em]">
                    Up Next
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-primary text-xl">music_note</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold truncate">{upNext.song_title}</p>
                    <p className="text-text-secondary text-xs truncate">
                      {upNext.artist}
                      <span className="text-white/30 mx-1.5">—</span>
                      <span className="text-primary font-semibold">
                        {upNext.profiles?.display_name || "Singer"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Queue Header + List */}
            {tvSettings.show_queue && (
              <>
                <div className="px-5 py-3 flex items-center justify-between border-b border-border/10 flex-shrink-0">
                  <p className="text-xs font-extrabold text-text-muted uppercase tracking-widest">
                    In Line
                  </p>
                  <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">
                    {waiting.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  {waiting.length === 0 && !upNext && !nowSinging ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                      <span className="material-icons-round text-4xl text-text-muted mb-2">queue_music</span>
                      <p className="text-text-muted text-sm">No songs in queue</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-1.5">
                      {waiting.map((entry, index) => (
                        <QueueRow key={entry.id} entry={entry} position={index + 1} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* QR Code + Scan Prompt */}
            {tvSettings.show_qr && (
              <div className="flex-shrink-0 border-t border-border/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-white rounded-xl p-2.5">
                    <QRCodeSVG
                      value={queueUrl}
                      size={120}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-snug">
                      Scan to request a song
                    </p>
                    <p className="text-text-muted text-xs leading-snug mt-1 break-words">
                      Join the queue at{" "}
                      <span className="text-primary font-semibold">
                        karaoke-times.vercel.app
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Slide Components ──────────────────────────────────── */

function SpecialsSlide({ items }: { items: Special[] }) {
  const category = items[0]?.category || "Specials";
  const label =
    category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  return (
    <div className="w-full max-w-xl">
      {/* Header with glow */}
      <div className="flex items-center gap-3 mb-6 animate-tv-textReveal">
        <div className="relative">
          <span className="material-icons-round text-orange-400 text-4xl animate-tv-float">local_bar</span>
          <div className="absolute inset-0 bg-orange-400/30 blur-xl rounded-full" />
        </div>
        <h2 className="text-3xl font-extrabold text-orange-400 uppercase tracking-wider">
          {label}
        </h2>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-2xl p-4 border border-white/10 relative overflow-hidden animate-tv-glow"
            style={{
              animationDelay: `${i * 0.15}s`,
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,165,0,0.03) 100%)",
            }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 animate-tv-shimmer"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            </div>
            {item.image_url && (
              <img
                src={item.image_url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-1 ring-orange-400/20"
              />
            )}
            <div className="flex-1 min-w-0 relative">
              <p className="text-white text-xl font-bold truncate">{item.name}</p>
              {item.description && (
                <p className="text-text-muted text-sm mt-0.5 line-clamp-1">
                  {item.description}
                </p>
              )}
            </div>
            {item.price != null && (
              <div className="flex-shrink-0 relative">
                <p className="text-orange-400 text-2xl font-extrabold">
                  ${item.price.toFixed(2)}
                </p>
                <div className="absolute inset-0 bg-orange-400/20 blur-lg rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PromoSlide({ promo }: { promo: Promo }) {
  return (
    <div className="w-full max-w-lg text-center px-8 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] animate-pulse" />

      {/* Sparkle decorations */}
      <div className="absolute top-4 right-8 w-2 h-2 bg-primary rounded-full animate-tv-float" style={{ animationDelay: "0s" }} />
      <div className="absolute top-16 left-12 w-1.5 h-1.5 bg-accent rounded-full animate-tv-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-16 right-16 w-1 h-1 bg-primary rounded-full animate-tv-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-8 left-20 w-2 h-2 bg-orange-400 rounded-full animate-tv-float" style={{ animationDelay: "0.5s" }} />

      <div className="relative">
        <div className="inline-block animate-tv-float">
          <span className="material-icons-round text-primary text-6xl">local_offer</span>
        </div>
        <h2 className="text-5xl font-extrabold text-white leading-tight mb-4 animate-tv-textReveal mt-4">
          {promo.title}
        </h2>
        {promo.description && (
          <p
            className="text-text-secondary text-xl leading-relaxed animate-tv-textReveal"
            style={{ animationDelay: "0.2s" }}
          >
            {promo.description}
          </p>
        )}
      </div>
    </div>
  );
}

function MediaSlide({ media }: { media: MediaItem }) {
  if (media.type === "video") {
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl animate-tv-glow relative">
        <video
          src={media.url}
          className="max-w-full max-h-full object-contain rounded-2xl"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Subtle vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-2xl animate-tv-glow relative">
      <img
        src={media.url}
        alt=""
        className="max-w-full max-h-full object-contain rounded-2xl animate-tv-kenBurns"
      />
      {/* Shimmer sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
        <div
          className="absolute inset-0 animate-tv-shimmer"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          }}
        />
      </div>
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </div>
  );
}

function EventSlide({ venue }: { venue: VenueInfo }) {
  const formatTime = (t: string | null) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <div className="w-full max-w-lg text-center px-8 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-accent/10 rounded-full blur-[80px] animate-pulse" />

      <div className="relative">
        <div className="inline-block animate-tv-float">
          <span className="material-icons-round text-primary text-6xl">event</span>
        </div>
        <h2 className="text-5xl font-extrabold text-white leading-tight mb-3 animate-tv-textReveal mt-4">
          {venue.eventName}
        </h2>
        {venue.dj && (
          <p
            className="text-primary text-xl font-bold mb-3 neon-glow-green animate-tv-textReveal"
            style={{ animationDelay: "0.15s" }}
          >
            Hosted by KJ {venue.dj}
          </p>
        )}
        {(venue.startTime || venue.endTime) && (
          <p
            className="text-text-secondary text-lg animate-tv-textReveal"
            style={{ animationDelay: "0.3s" }}
          >
            {formatTime(venue.startTime)}
            {venue.startTime && venue.endTime && " — "}
            {formatTime(venue.endTime)}
          </p>
        )}
        {venue.eventNotes && (
          <p
            className="text-text-muted text-base mt-4 leading-relaxed animate-tv-textReveal"
            style={{ animationDelay: "0.45s" }}
          >
            {venue.eventNotes}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Singer Highlight Slide ────────────────────────────── */

function SingerHighlightSlide({ highlight }: { highlight: SingerHighlight }) {
  const typeLabel =
    highlight.highlight_type === "singer_of_night"
      ? "Singer of the Night"
      : highlight.highlight_type === "weekly_featured"
      ? "Featured Singer of the Week"
      : "Featured Singer of the Month";

  return (
    <div className="w-full max-w-lg text-center px-8 relative">
      {/* Celebratory background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-yellow-400/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute top-[30%] left-[20%] w-[100px] h-[100px] bg-accent/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: "0.5s" }} />

      {/* Sparkle decorations */}
      <div className="absolute top-8 right-12 w-3 h-3 bg-yellow-400 rounded-full animate-tv-float opacity-60" style={{ animationDelay: "0s" }} />
      <div className="absolute top-20 left-8 w-2 h-2 bg-accent rounded-full animate-tv-float opacity-60" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-20 right-20 w-2 h-2 bg-primary rounded-full animate-tv-float opacity-60" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-12 left-16 w-3 h-3 bg-yellow-400 rounded-full animate-tv-float opacity-60" style={{ animationDelay: "0.5s" }} />

      <div className="relative">
        {/* Star icon */}
        <div className="inline-block animate-tv-float">
          <span className="material-icons-round text-yellow-400 text-7xl" style={{ filter: "drop-shadow(0 0 20px rgba(250,204,21,0.5))" }}>
            star
          </span>
        </div>

        {/* Type label */}
        <p className="text-yellow-400 text-sm font-extrabold uppercase tracking-[0.2em] mt-2 animate-tv-textReveal">
          {typeLabel}
        </p>

        {/* Singer name */}
        <h2 className="text-5xl font-extrabold text-white leading-tight mt-4 mb-3 animate-tv-textReveal" style={{ animationDelay: "0.15s" }}>
          {highlight.title || highlight.singer?.display_name || "Amazing Singer"}
        </h2>

        {/* Song info */}
        {highlight.song_title && (
          <div className="animate-tv-textReveal" style={{ animationDelay: "0.3s" }}>
            <p className="text-2xl text-accent font-bold">
              &ldquo;{highlight.song_title}&rdquo;
            </p>
            {highlight.song_artist && (
              <p className="text-text-secondary text-lg mt-1">
                by {highlight.song_artist}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Queue Row ─────────────────────────────────────────── */

function QueueRow({ entry, position }: { entry: QueueEntry; position: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <span className="text-text-muted font-bold text-sm w-7 text-center flex-shrink-0">
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-white font-semibold text-sm truncate">{entry.song_title}</p>
        <p className="text-text-muted text-xs truncate">
          {entry.artist} — {entry.profiles?.display_name || "Singer"}
        </p>
      </div>
    </div>
  );
}
