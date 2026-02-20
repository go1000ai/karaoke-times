"use client";

import { useState, useEffect } from "react";
import { useVDJBridge } from "@/hooks/useVDJBridge";
import { type VDJConfig, DEFAULT_CONFIG } from "@/lib/vdj-api";

const STORAGE_KEY = "vdj-config";

function loadConfig(): VDJConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: VDJConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function VDJBridge({
  venueId,
  venueName,
}: {
  venueId: string;
  venueName: string | null;
}) {
  const [config, setConfig] = useState<VDJConfig>(loadConfig);
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(String(config.port));
  const [password, setPassword] = useState(config.password || "");
  const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);

  const bridge = useVDJBridge(venueId, config);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, msg }, ...prev.slice(0, 49)]);
  };

  // Log connection changes
  useEffect(() => {
    if (bridge.connected) addLog(`Connected to VirtualDJ ${bridge.version || ""}`);
  }, [bridge.connected, bridge.version]);

  useEffect(() => {
    if (bridge.error) addLog(`Error: ${bridge.error}`);
  }, [bridge.error]);

  useEffect(() => {
    if (bridge.currentSong)
      addLog(`Current song: "${bridge.currentSong.song_title}" by ${bridge.currentSong.artist}`);
  }, [bridge.currentSong?.id]);

  const handleConnect = async () => {
    const newConfig: VDJConfig = {
      host: host || "127.0.0.1",
      port: parseInt(port) || 80,
      password: password || undefined,
    };
    setConfig(newConfig);
    saveConfig(newConfig);
    // Small delay to let config propagate, then connect
    setTimeout(() => bridge.connect(), 50);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = bridge.nowPlaying
    ? bridge.nowPlaying.length > 0
      ? (bridge.nowPlaying.position / bridge.nowPlaying.length) * 100
      : 0
    : 0;

  const nowSinging = bridge.currentSong;
  const upNext = bridge.queue.filter((q) => q.status === "waiting").slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">VirtualDJ Bridge</h1>
          <p className="text-text-secondary text-sm">
            {venueName && <span className="text-white font-semibold">{venueName}</span>}
            {venueName && " — "}
            Connect your queue to VirtualDJ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              bridge.connected
                ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse"
                : "bg-red-400"
            }`}
          />
          <span className={`text-sm font-bold ${bridge.connected ? "text-green-400" : "text-red-400"}`}>
            {bridge.connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Connection Panel */}
      {!bridge.connected && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary">settings_ethernet</span>
            Connect to VirtualDJ
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            Make sure VirtualDJ is running with the Network Control Plugin enabled
            (Settings → Extensions → Network Control).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">
                Host
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="127.0.0.1"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">
                Port
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="80"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Optional"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-text-muted"
              />
            </div>
          </div>
          {bridge.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm">{bridge.error}</p>
            </div>
          )}
          <button
            onClick={handleConnect}
            disabled={bridge.loading}
            className="px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {bridge.loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      )}

      {/* Connected State */}
      {bridge.connected && (
        <>
          {/* VDJ Info Bar */}
          <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons-round text-primary text-2xl">album</span>
              <div>
                <p className="text-white font-bold text-sm">VirtualDJ {bridge.version}</p>
                <p className="text-text-muted text-xs">Network Control Plugin active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bridge.disconnect()}
                className="text-xs text-text-muted hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Settings Toggles */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => bridge.setAutoAdvance(!bridge.autoAdvance)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                bridge.autoAdvance
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-white/5 text-text-muted border-border hover:text-white"
              }`}
            >
              <span className="material-icons-round text-base">
                {bridge.autoAdvance ? "sync" : "sync_disabled"}
              </span>
              Auto-Advance
            </button>
            <button
              onClick={() => bridge.setAutoMuteVocals(!bridge.autoMuteVocals)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                bridge.autoMuteVocals
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-white/5 text-text-muted border-border hover:text-white"
              }`}
            >
              <span className="material-icons-round text-base">
                {bridge.autoMuteVocals ? "music_off" : "music_note"}
              </span>
              Auto-Remove Vocals
            </button>
          </div>

          {/* Now Playing from VDJ */}
          <div className="mb-6">
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2 neon-glow-pink">
              Now Playing in VirtualDJ
            </p>
            {bridge.nowPlaying ? (
              <div className="glass-card rounded-2xl p-5 border-accent/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold text-lg">{bridge.nowPlaying.title}</h3>
                    <p className="text-text-secondary text-sm">{bridge.nowPlaying.artist}</p>
                    {nowSinging && (
                      <p className="text-accent text-xs mt-1">
                        Singer: {nowSinging.profiles?.display_name || "Anonymous"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-text-muted text-xs">
                    {bridge.nowPlaying.bpm > 0 && (
                      <span>{Math.round(bridge.nowPlaying.bpm)} BPM</span>
                    )}
                    {bridge.nowPlaying.key && <span>Key: {bridge.nowPlaying.key}</span>}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-text-muted">
                    <span>{formatTime(bridge.nowPlaying.position)}</span>
                    <span>{formatTime(bridge.nowPlaying.length)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={bridge.toggleVocals}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      bridge.vocalsRemoved
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-white/5 text-text-muted border-border hover:text-white"
                    }`}
                  >
                    <span className="material-icons-round text-base">
                      {bridge.vocalsRemoved ? "music_off" : "music_note"}
                    </span>
                    {bridge.vocalsRemoved ? "Vocals Removed" : "Remove Vocals"}
                  </button>
                  <button
                    onClick={bridge.skipSong}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-text-muted border border-border hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="material-icons-round text-base">skip_next</span>
                    Skip
                  </button>
                  {!bridge.autoAdvance && (
                    <button
                      onClick={bridge.loadCurrentSong}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-icons-round text-base">file_download</span>
                      Load Current Song
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center">
                <span className="material-icons-round text-4xl text-text-muted mb-2">album</span>
                <p className="text-text-secondary text-sm">No track loaded in VirtualDJ</p>
                {nowSinging && (
                  <button
                    onClick={bridge.loadCurrentSong}
                    className="mt-3 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    Load &quot;{nowSinging.song_title}&quot;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Queue from Web App */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="material-icons-round text-primary">queue_music</span>
              Queue ({bridge.queue.length})
            </h2>
            {nowSinging && (
              <div className="glass-card rounded-xl p-4 mb-2 border-accent/20 flex items-center gap-3">
                <span className="material-icons-round text-accent text-lg animate-pulse">mic</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{nowSinging.song_title}</p>
                  <p className="text-text-muted text-xs truncate">
                    {nowSinging.artist} — {nowSinging.profiles?.display_name || "Anonymous"}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  NOW SINGING
                </span>
              </div>
            )}
            {upNext.length > 0 ? (
              <div className="space-y-2">
                {upNext.map((entry, i) => (
                  <div key={entry.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-text-muted text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{entry.song_title}</p>
                      <p className="text-text-muted text-xs truncate">
                        {entry.artist} — {entry.profiles?.display_name || "Anonymous"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                      WAITING
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              !nowSinging && (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <span className="material-icons-round text-4xl text-text-muted mb-2">queue_music</span>
                  <p className="text-text-secondary text-sm">Queue is empty</p>
                </div>
              )
            )}
          </div>

          {/* Activity Log */}
          <div>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="material-icons-round text-text-muted">history</span>
              Activity Log
            </h2>
            <div className="glass-card rounded-2xl p-4 max-h-48 overflow-y-auto">
              {logs.length > 0 ? (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <p key={i} className="text-xs text-text-muted">
                      <span className="text-text-muted/40">{log.time}</span>{" "}
                      <span className="text-text-secondary">{log.msg}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-4">No activity yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
