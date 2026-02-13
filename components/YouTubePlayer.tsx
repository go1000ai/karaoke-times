"use client";

import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getPlayerState: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (seconds: number) => void;
  onStateChange?: (playing: boolean) => void;
  hidden?: boolean;
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiReady) {
      resolve();
      return;
    }

    readyCallbacks.push(resolve);

    if (!apiLoaded) {
      apiLoaded = true;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        apiReady = true;
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks.length = 0;
      };
    }
  });
}

export default function YouTubePlayer({
  videoId,
  onTimeUpdate,
  onStateChange,
  hidden = false,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  const startTimeUpdates = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (playerRef.current && onTimeUpdate) {
        try {
          const time = playerRef.current.getCurrentTime();
          onTimeUpdate(time);
        } catch {
          // Player may not be ready
        }
      }
    }, 200);
  }, [onTimeUpdate]);

  const stopTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      await loadYouTubeAPI();
      if (destroyed || !containerRef.current) return;

      // Create a div for the player
      const playerDiv = document.createElement("div");
      playerDiv.id = `yt-player-${videoId}`;
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerDiv, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: hidden ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (!destroyed) {
              setReady(true);
              e.target.playVideo();
              startTimeUpdates();
            }
          },
          onStateChange: (e) => {
            if (destroyed) return;
            const playing = e.data === window.YT.PlayerState.PLAYING;
            onStateChange?.(playing);
            if (playing) {
              startTimeUpdates();
            } else {
              stopTimeUpdates();
            }
          },
        },
      });
    };

    init();

    return () => {
      destroyed = true;
      stopTimeUpdates();
      try {
        playerRef.current?.destroy();
      } catch {
        // Ignore destroy errors
      }
      playerRef.current = null;
    };
  }, [videoId, hidden, onStateChange, startTimeUpdates, stopTimeUpdates]);

  return (
    <div
      ref={containerRef}
      className={hidden ? "absolute w-0 h-0 overflow-hidden opacity-0" : "w-full aspect-video rounded-xl overflow-hidden"}
    />
  );
}

export type { YTPlayer };
