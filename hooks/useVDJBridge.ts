"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type VDJConfig,
  type VDJNowPlaying,
  testConnection,
  getNowPlaying,
  searchAndLoad,
  muteVocals,
  unmuteVocals,
  isTrackFinished,
  DEFAULT_CONFIG,
} from "@/lib/vdj-api";

interface QueueEntry {
  id: string;
  user_id: string;
  song_title: string;
  artist: string;
  status: string;
  position: number;
  profiles?: { display_name: string | null };
}

interface VDJBridgeState {
  connected: boolean;
  version: string | null;
  nowPlaying: VDJNowPlaying | null;
  vocalsRemoved: boolean;
  autoAdvance: boolean;
  autoMuteVocals: boolean;
  loading: boolean;
  error: string | null;
  queue: QueueEntry[];
  currentSong: QueueEntry | null;
}

interface VDJBridgeActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  loadCurrentSong: () => Promise<boolean>;
  toggleVocals: () => Promise<void>;
  setAutoAdvance: (on: boolean) => void;
  setAutoMuteVocals: (on: boolean) => void;
  skipSong: () => Promise<void>;
}

const POLL_INTERVAL = 2000; // 2 seconds

export function useVDJBridge(
  venueId: string | null,
  config: VDJConfig = DEFAULT_CONFIG
): VDJBridgeState & VDJBridgeActions {
  const [connected, setConnected] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<VDJNowPlaying | null>(null);
  const [vocalsRemoved, setVocalsRemoved] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [autoMuteVocals, setAutoMuteVocals] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configRef = useRef(config);
  const autoAdvanceRef = useRef(autoAdvance);
  const autoMuteVocalsRef = useRef(autoMuteVocals);
  const lastLoadedSongRef = useRef<string | null>(null);
  const broadcastRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  configRef.current = config;
  autoAdvanceRef.current = autoAdvance;
  autoMuteVocalsRef.current = autoMuteVocals;

  const supabase = createClient();

  // Current "now singing" entry from the queue
  const currentSong = queue.find((q) => q.status === "now_singing") || null;

  // ─── Broadcast VDJ status to TV display ───
  const broadcastStatus = useCallback(
    (np: VDJNowPlaying | null, singer?: string | null) => {
      broadcastRef.current?.send({
        type: "broadcast",
        event: "vdj-status",
        payload: {
          nowPlaying: np,
          singer: singer || null,
          vocalsRemoved,
        },
      });
    },
    [vocalsRemoved]
  );

  // ─── Connect to VirtualDJ ───
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await testConnection(configRef.current);
    if (result.success) {
      setConnected(true);
      setVersion(result.version || null);
      setError(null);
    } else {
      setConnected(false);
      setError(result.error || "Could not connect to VirtualDJ");
    }
    setLoading(false);
  }, []);

  // ─── Disconnect ───
  const disconnect = useCallback(() => {
    setConnected(false);
    setNowPlaying(null);
    setVersion(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── Load current song into VDJ ───
  const loadCurrentSong = useCallback(async (): Promise<boolean> => {
    if (!currentSong || !connected) return false;

    const loaded = await searchAndLoad(
      configRef.current,
      currentSong.song_title,
      currentSong.artist
    );

    if (loaded) {
      lastLoadedSongRef.current = currentSong.id;
      // Mark in DB that we loaded this song into VDJ
      await supabase
        .from("song_queue")
        .update({ vdj_loaded_at: new Date().toISOString() })
        .eq("id", currentSong.id);

      // Auto-mute vocals if enabled
      if (autoMuteVocalsRef.current) {
        await muteVocals(configRef.current);
        setVocalsRemoved(true);
      }
    }

    return loaded;
  }, [currentSong, connected, supabase]);

  // ─── Toggle vocals ───
  const toggleVocals = useCallback(async () => {
    if (!connected) return;
    if (vocalsRemoved) {
      await unmuteVocals(configRef.current);
      setVocalsRemoved(false);
    } else {
      await muteVocals(configRef.current);
      setVocalsRemoved(true);
    }
  }, [connected, vocalsRemoved]);

  // ─── Skip current song ───
  const skipSong = useCallback(async () => {
    if (!currentSong) return;
    await supabase
      .from("song_queue")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", currentSong.id);
  }, [currentSong, supabase]);

  // ─── Subscribe to queue changes ───
  useEffect(() => {
    if (!venueId) return;

    const fetchQueue = async () => {
      const { data } = await supabase
        .from("song_queue")
        .select("id, user_id, song_title, artist, status, position, profiles(display_name)")
        .eq("venue_id", venueId)
        .in("status", ["waiting", "up_next", "now_singing"])
        .order("position");

      setQueue((data as unknown as QueueEntry[]) ?? []);
    };

    fetchQueue();

    const channel = supabase
      .channel(`vdj-queue:${venueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "song_queue",
          filter: `venue_id=eq.${venueId}`,
        },
        () => fetchQueue()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [venueId, supabase]);

  // ─── Set up broadcast channel for TV display ───
  useEffect(() => {
    if (!venueId) return;
    const channel = supabase.channel(`vdj-sync:${venueId}`);
    channel.subscribe();
    broadcastRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      broadcastRef.current = null;
    };
  }, [venueId, supabase]);

  // ─── Auto-load when song becomes "now_singing" ───
  useEffect(() => {
    if (!connected || !currentSong || !autoAdvance) return;
    if (lastLoadedSongRef.current === currentSong.id) return; // Already loaded

    loadCurrentSong();
  }, [connected, currentSong, autoAdvance, loadCurrentSong]);

  // ─── Poll VDJ for now-playing status ───
  useEffect(() => {
    if (!connected) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const poll = async () => {
      const np = await getNowPlaying(configRef.current);
      setNowPlaying(np);

      // Broadcast to TV
      const singerName = currentSong?.profiles?.display_name || null;
      broadcastStatus(np, singerName);

      // Auto-advance: if track finished and auto-advance is on
      if (np && isTrackFinished(np) && autoAdvanceRef.current && currentSong) {
        // Mark current song as completed
        await supabase
          .from("song_queue")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", currentSong.id);

        lastLoadedSongRef.current = null;
        setVocalsRemoved(false);
      }

      // If VDJ stops responding, mark disconnected
      if (np === null) {
        const check = await testConnection(configRef.current);
        if (!check.success) {
          setConnected(false);
          setError("VirtualDJ connection lost");
        }
      }
    };

    poll(); // Initial poll
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connected, currentSong, supabase, broadcastStatus]);

  return {
    connected,
    version,
    nowPlaying,
    vocalsRemoved,
    autoAdvance,
    autoMuteVocals,
    loading,
    error,
    queue,
    currentSong,
    connect,
    disconnect,
    loadCurrentSong,
    toggleVocals,
    setAutoAdvance,
    setAutoMuteVocals,
    skipSong,
  };
}
