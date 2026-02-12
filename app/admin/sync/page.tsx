"use client";

import { useState } from "react";

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync-sheet", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Sync Google Sheet</h1>
      <p className="text-text-secondary text-sm mb-8">
        Pull the latest karaoke event data from the master Google Sheet.
      </p>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons-round text-primary text-2xl">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Google Sheets CSV</h3>
            <p className="text-xs text-text-muted">
              Source: Published Google Sheet
            </p>
          </div>
        </div>

        <div className="bg-card-dark border border-border rounded-xl p-4 mb-6">
          <p className="text-xs text-text-muted mb-1">What this does:</p>
          <ul className="text-sm text-text-secondary space-y-1">
            <li className="flex items-center gap-2">
              <span className="material-icons-round text-xs text-primary">check</span>
              Fetches latest CSV from the Google Sheet
            </li>
            <li className="flex items-center gap-2">
              <span className="material-icons-round text-xs text-primary">check</span>
              Updates the local mock-data.ts with new events
            </li>
            <li className="flex items-center gap-2">
              <span className="material-icons-round text-xs text-primary">check</span>
              Requires a redeploy to take effect on production
            </li>
          </ul>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full bg-primary text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
        >
          {syncing ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <span className="material-icons-round">sync</span>
              Sync from Google Sheet
            </>
          )}
        </button>

        {result && (
          <div
            className={`mt-4 p-4 rounded-xl ${
              result.success
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`material-icons-round ${
                  result.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.success ? "check_circle" : "error"}
              </span>
              <p
                className={`text-sm font-semibold ${
                  result.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Instructions */}
      <div className="glass-card rounded-2xl p-5 mt-6">
        <h3 className="text-white font-bold mb-3">Manual Sync (Terminal)</h3>
        <p className="text-xs text-text-muted mb-3">
          You can also run the sync script directly from the terminal:
        </p>
        <div className="bg-black/50 rounded-xl p-4 font-mono text-sm text-primary">
          npx tsx scripts/sync-sheet.ts
        </div>
      </div>
    </div>
  );
}
