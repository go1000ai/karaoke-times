"use client";

/**
 * Small VirtualDJ connection status indicator.
 * Shows a green/red dot with optional label text.
 */
export function VDJStatusBadge({
  connected,
  compact = false,
}: {
  connected: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span
        className={`w-2.5 h-2.5 rounded-full inline-block ${
          connected
            ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)] animate-pulse"
            : "bg-red-400/50"
        }`}
        title={connected ? "VirtualDJ Connected" : "VirtualDJ Disconnected"}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
        connected
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-white/5 text-text-muted border border-border"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-green-400 animate-pulse" : "bg-text-muted/40"
        }`}
      />
      VDJ {connected ? "Live" : "Off"}
    </span>
  );
}
