"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useQueueSubscriptionById, type QueueEntry } from "@/hooks/useQueueSubscriptionById";
import { createClient } from "@/lib/supabase/client";
import LyricsDisplay from "@/components/LyricsDisplay";
import YouTubePlayer, { type YouTubePlayerHandle } from "@/components/YouTubePlayer";
import { QRCodeSVG } from "qrcode.react";

interface FeaturedSpecial {
  id: string;
  name: string;
  price: number | null;
  category: string;
}

interface VenueInfo {
  name: string;
  dj: string | null;
}

export default function TVDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { queue, loading } = useQueueSubscriptionById(id);
  const [venueInfo, setVenueInfo] = useState<VenueInfo | null>(null);
  const [clock, setClock] = useState("");
  const [promoIndex, setPromoIndex] = useState(0);
  const [specials, setSpecials] = useState<FeaturedSpecial[]>([]);
  const [singStartedAt, setSingStartedAt] = useState<number | null>(null);
  const [showLyrics, setShowLyrics] = useState(true);
  const [ytCurrentTime, setYtCurrentTime] = useState<number | undefined>(undefined);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [broadcastTime, setBroadcastTime] = useState<number | undefined>(undefined);
  const [hasBroadcast, setHasBroadcast] = useState(false);
  const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ytRef = useRef<YouTubePlayerHandle>(null);

  // Subscribe to KJ's YouTube playback sync via broadcast
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`youtube-sync:${id}`);

    channel.on("broadcast", { event: "playback" }, ({ payload }) => {
      setHasBroadcast(true);
      if (payload.time !== undefined) {
        setBroadcastTime(payload.time);
      }
      // Reset fallback timeout — if no broadcast for 5s, fall back to local player
      if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
      broadcastTimeoutRef.current = setTimeout(() => {
        setHasBroadcast(false);
      }, 5000);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
    };
  }, [id]);

  // Unlock audio on first user interaction anywhere on the page
  useEffect(() => {
    if (audioUnlocked) return;
    const unlock = () => setAudioUnlocked(true);
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, [audioUnlocked]);

  const handleYTTimeUpdate = useCallback((seconds: number) => {
    setYtCurrentTime(seconds);
  }, []);

  const handleYTStateChange = useCallback((playing: boolean) => {
    setYtPlaying(playing);
  }, []);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      );
    };
    tick();
    const interval = setInterval(tick, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch venue info + current event DJ from Supabase
  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    supabase
      .from("venues")
      .select("name, venue_events(dj)")
      .eq("id", id)
      .eq("venue_events.day_of_week", today)
      .single()
      .then(({ data }) => {
        if (data) {
          const events = data.venue_events as { dj: string }[] | null;
          const dj = events?.[0]?.dj || null;
          setVenueInfo({ name: data.name, dj });
        }
      });
  }, [id]);

  // Fetch featured specials from POS
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("pos_menu_items")
      .select("id, name, price, category")
      .eq("venue_id", id)
      .eq("is_featured", true)
      .eq("is_available", true)
      .order("category")
      .then(({ data }) => {
        if (data) setSpecials(data as FeaturedSpecial[]);
      });
  }, [id]);

  // Rotate promos every 8 seconds (QR section handles the scan/URL text)
  const promos = [
    venueInfo?.dj ? `Tonight's KJ: ${venueInfo.dj}` : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [promos.length]);

  const nowSinging = queue.find((q) => q.status === "now_singing");
  const upNext = queue.find((q) => q.status === "up_next");
  const waiting = queue.filter((q) => q.status === "waiting");

  // Reset lyrics timer and YouTube state when singer changes
  useEffect(() => {
    if (nowSinging) {
      setSingStartedAt(Date.now());
    } else {
      setSingStartedAt(null);
    }
    setYtCurrentTime(undefined);
    setYtPlaying(false);
    setBroadcastTime(undefined);
    setHasBroadcast(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowSinging?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const queueUrl = `https://karaoke-times.vercel.app/venue/${id}/queue`;

  return (
    <div className="h-screen bg-black text-white overflow-hidden select-none flex flex-col">
      {/* Top Bar — Logo + KJ + Clock */}
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
          <p className="text-xs text-text-muted uppercase tracking-widest">
            Tonight
          </p>
        </div>
      </div>

      {/* Main Content — 2 Column Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left — Now Singing + Lyrics */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[20%] left-[10%] w-[60%] h-[40%] bg-accent/8 blur-[100px] rounded-full" />
            <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[30%] bg-primary/8 blur-[80px] rounded-full" />
          </div>

          {nowSinging ? (
            <div className="relative z-10 w-full flex flex-col h-full">
              {/* Song info — pinned to top, compact */}
              <div className="flex-shrink-0 text-center pt-5 pb-3 px-8">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="material-icons-round text-accent text-xl animate-pulse">mic</span>
                  <p className="text-accent text-xs font-extrabold uppercase tracking-[0.2em] neon-glow-pink">
                    Now Singing
                  </p>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                  {nowSinging.song_title}
                </h2>
                <p className="text-sm text-text-secondary font-medium">
                  {nowSinging.artist}
                  <span className="text-white/30 mx-2">—</span>
                  <span className="text-white/70">{nowSinging.profiles?.display_name || "Singer"}</span>
                </p>
                {/* YouTube status */}
                {nowSinging.youtube_video_id && (
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-text-muted">
                    <span className="material-icons-round text-red-500 text-sm">play_circle</span>
                    <span>{ytPlaying ? "Karaoke track playing" : "Loading karaoke track..."}</span>
                  </div>
                )}
              </div>

              {/* YouTube Player — muted, hidden, just for lyrics time sync */}
              {/* The KJ plays audio from their device; TV only tracks time */}
              {nowSinging.youtube_video_id && (
                <YouTubePlayer
                  ref={ytRef}
                  videoId={nowSinging.youtube_video_id}
                  onTimeUpdate={handleYTTimeUpdate}
                  onStateChange={handleYTStateChange}
                  hidden
                  muted
                />
              )}

              {/* Lyrics — fills remaining space, synced to YouTube when available */}
              {/* Offset lyrics ahead by 2s so they appear before the singer needs them */}
              {showLyrics && singStartedAt && (
                <div className="flex-1 min-h-0 flex items-center">
                  <LyricsDisplay
                    songTitle={nowSinging.song_title}
                    artist={nowSinging.artist}
                    startedAt={singStartedAt}
                    currentTime={
                      hasBroadcast && broadcastTime !== undefined
                        ? broadcastTime + 2
                        : ytPlaying && ytCurrentTime !== undefined
                          ? ytCurrentTime + 2
                          : undefined
                    }
                  />
                </div>
              )}

              {/* Lyrics toggle — pinned bottom */}
              <div className="flex-shrink-0 flex justify-center pb-3">
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1 opacity-30 hover:opacity-100"
                >
                  <span className="material-icons-round text-sm">lyrics</span>
                  {showLyrics ? "Hide Lyrics" : "Show Lyrics"}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center flex-1 flex flex-col items-center justify-center">
              <span className="material-icons-round text-primary/20 text-[120px] mb-4">mic</span>
              <p className="text-2xl font-bold text-white/40">Stage is Open</p>
              <p className="text-text-muted mt-2">Request a song to get started!</p>
              {!audioUnlocked && (
                <p className="text-primary/60 text-xs mt-6 animate-pulse">Tap anywhere to enable audio</p>
              )}
            </div>
          )}
        </div>

        {/* Right — Queue List */}
        <div className="w-[380px] bg-white/[0.02] border-l border-border/20 flex flex-col">
          {/* Up Next */}
          {upNext && (
            <div className="p-5 border-b border-border/20 bg-primary/5 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <p className="text-primary text-xs font-extrabold uppercase tracking-[0.15em]">
                  Up Next
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-primary text-2xl">music_note</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-lg truncate">{upNext.song_title}</p>
                  <p className="text-text-secondary text-sm truncate">{upNext.artist}</p>
                  <p className="text-primary text-xs font-semibold mt-0.5">
                    {upNext.profiles?.display_name || "Singer"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Queue Header */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-border/10 flex-shrink-0">
            <p className="text-xs font-extrabold text-text-muted uppercase tracking-widest">
              In Line
            </p>
            <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">
              {waiting.length}
            </span>
          </div>

          {/* Queue List */}
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

          {/* Featured Specials from POS */}
          {specials.length > 0 && (
            <div className="p-4 border-t border-border/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-icons-round text-orange-400 text-sm">local_bar</span>
                <p className="text-[10px] font-extrabold text-orange-400 uppercase tracking-[0.15em]">
                  Specials
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {specials.slice(0, 6).map((s) => (
                  <div key={s.id} className="bg-white/5 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                    <span className="text-white text-xs font-semibold">{s.name}</span>
                    {s.price && (
                      <span className="text-orange-400 text-xs font-bold">${s.price.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code + Promo */}
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
                {promos.length > 0 && (
                  <p
                    className="text-xs text-white/50 font-medium leading-snug mt-2 break-words transition-opacity duration-500"
                    key={promoIndex}
                  >
                    {promos[promoIndex]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
