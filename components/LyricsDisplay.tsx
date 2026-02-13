"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface LyricLine {
  time: number; // seconds
  text: string;
}

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split("\n")) {
    const match = raw.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, "0"), 10);
      const time = mins * 60 + secs + ms / 1000;
      const text = match[4].trim();
      if (text) lines.push({ time, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

function parsePlain(plain: string): LyricLine[] {
  const lines = plain.split("\n").filter((l) => l.trim());
  // Estimate ~4 seconds per line for plain lyrics
  return lines.map((text, i) => ({ time: i * 4, text: text.trim() }));
}

export default function LyricsDisplay({
  songTitle,
  artist,
  startedAt,
}: {
  songTitle: string;
  artist: string;
  startedAt?: number; // timestamp when now_singing started
}) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeLine, setActiveLine] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<number>(startedAt || Date.now());

  // Fetch lyrics
  useEffect(() => {
    setLoading(true);
    setActiveLine(0);
    originRef.current = startedAt || Date.now();

    fetch(`/api/lyrics?title=${encodeURIComponent(songTitle)}&artist=${encodeURIComponent(artist)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.synced) {
          const parsed = parseLRC(data.synced);
          setLyrics(parsed);
          setIsSynced(true);
        } else if (data.plain) {
          setLyrics(parsePlain(data.plain));
          setIsSynced(false);
        } else {
          setLyrics([]);
          setIsSynced(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setLyrics([]);
        setLoading(false);
      });
  }, [songTitle, artist, startedAt]);

  // Auto-scroll synced lyrics based on elapsed time
  const tick = useCallback(() => {
    if (!isSynced || lyrics.length === 0) return;
    const elapsed = (Date.now() - originRef.current) / 1000;
    let current = 0;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (elapsed >= lyrics[i].time) {
        current = i;
        break;
      }
    }
    setActiveLine(current);
  }, [isSynced, lyrics]);

  useEffect(() => {
    if (!isSynced) return;
    const interval = setInterval(tick, 200);
    tick();
    return () => clearInterval(interval);
  }, [isSynced, tick]);

  // Auto-scroll for plain lyrics (advance every 4 seconds)
  useEffect(() => {
    if (isSynced || lyrics.length === 0) return;
    const interval = setInterval(() => {
      setActiveLine((prev) => Math.min(prev + 1, lyrics.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isSynced, lyrics.length]);

  // Scroll active line into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeLine]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading lyrics...</span>
        </div>
      </div>
    );
  }

  if (lyrics.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="w-full max-h-[45vh] overflow-y-auto px-4 py-6 hide-scrollbar"
      style={{
        maskImage: "linear-gradient(transparent, black 15%, black 85%, transparent)",
        WebkitMaskImage: "linear-gradient(transparent, black 15%, black 85%, transparent)",
      }}
    >
      <div className="space-y-3 text-center">
        {lyrics.map((line, i) => {
          const isActive = i === activeLine;
          const isPast = i < activeLine;
          const isFuture = i > activeLine;
          return (
            <p
              key={`${i}-${line.time}`}
              data-active={isActive}
              className={`transition-all duration-500 leading-relaxed ${
                isActive
                  ? "text-3xl md:text-4xl font-extrabold text-white scale-105"
                  : isPast
                    ? "text-lg md:text-xl font-medium text-white/20"
                    : isFuture
                      ? "text-lg md:text-xl font-medium text-white/40"
                      : ""
              }`}
              style={isActive ? {
                textShadow: "0 0 20px rgba(212,160,23,0.6), 0 0 40px rgba(212,160,23,0.3)",
              } : undefined}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
