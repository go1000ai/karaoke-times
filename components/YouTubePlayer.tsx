"use client";

import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from "react";

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  restart: () => void;
  getCurrentTime: () => number;
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (seconds: number) => void;
  onStateChange?: (playing: boolean) => void;
  hidden?: boolean;
  muted?: boolean;
}

/**
 * YouTube player using a direct iframe + postMessage.
 * Bypasses the external YouTube IFrame API script (often blocked by ad blockers).
 * Uses the embed's built-in postMessage support via `enablejsapi=1`.
 */
const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer({ videoId, onTimeUpdate, onStateChange, hidden = false, muted = false }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastTimeRef = useRef(0);
    const listeningRef = useRef(false);
    const [ready, setReady] = useState(false);

    // Use refs for callbacks to avoid stale closures in the message handler
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    // Post a command to the YouTube iframe (uses "*" like the official API)
    const postCommand = useCallback((func: string, args?: unknown[]) => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func, args: args || [] }),
          "*"
        );
      } catch {
        // iframe might not be ready
      }
    }, []);

    // Send the "listening" handshake to activate the event stream
    const sendListening = useCallback(() => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "listening" }),
          "*"
        );
      } catch {
        // iframe might not be ready
      }
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => postCommand("playVideo"),
      pause: () => postCommand("pauseVideo"),
      restart: () => {
        postCommand("seekTo", [0, true]);
        postCommand("playVideo");
      },
      getCurrentTime: () => lastTimeRef.current,
    }));

    // Listen for postMessage events from the YouTube iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== "https://www.youtube.com") return;
        if (event.source !== iframeRef.current?.contentWindow) return;

        let data;
        try {
          data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        } catch {
          return;
        }

        // Re-send listening on first message if we haven't yet (handshake)
        if (!listeningRef.current) {
          listeningRef.current = true;
          sendListening();
        }

        if (data.event === "onReady") {
          setReady(true);
        }

        if (data.event === "onStateChange" && data.info !== undefined) {
          const playing = data.info === 1;
          onStateChangeRef.current?.(playing);
        }

        if (data.event === "infoDelivery" && data.info?.currentTime !== undefined) {
          lastTimeRef.current = data.info.currentTime;
          onTimeUpdateRef.current?.(data.info.currentTime);
        }
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, [sendListening]);

    // When iframe loads, send "listening" to activate the event stream
    const handleIframeLoad = useCallback(() => {
      listeningRef.current = false;
      sendListening();
      // Retry after a short delay — the player inside may not be ready yet
      const retry = setTimeout(sendListening, 1000);
      return () => clearTimeout(retry);
    }, [sendListening]);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      enablejsapi: "1",
      autoplay: "1",
      controls: hidden ? "0" : "1",
      modestbranding: "1",
      rel: "0",
      showinfo: "0",
      fs: "0",
      iv_load_policy: "3",
      playsinline: "1",
      origin,
      ...(muted ? { mute: "1" } : {}),
    });
    const src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

    if (hidden) {
      return (
        <iframe
          ref={iframeRef}
          src={src}
          onLoad={handleIframeLoad}
          className="fixed bottom-0 left-0 w-[320px] h-[180px] opacity-[0.01] pointer-events-none z-[-1]"
          allow="autoplay; encrypted-media"
          style={{ border: "none" }}
        />
      );
    }

    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          ref={iframeRef}
          src={src}
          onLoad={handleIframeLoad}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ border: "none" }}
        />
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 z-10 pointer-events-none">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Loading karaoke track...</p>
          </div>
        )}
      </div>
    );
  }
);

export default YouTubePlayer;
