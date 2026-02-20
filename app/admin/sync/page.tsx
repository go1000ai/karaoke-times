"use client";

import { useRef, useState } from "react";

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleUpload() {
    if (!file) return;
    setSyncing(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/sync-sheet", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
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
        Pull the latest karaoke event data from the master Google Sheet or upload a CSV file.
      </p>

      {/* Sync from Google Sheet */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons-round text-primary text-2xl">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Sync from Google Sheet</h3>
            <p className="text-xs text-text-muted">
              Auto-fetch from the published Google Sheet
            </p>
          </div>
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
      </div>

      {/* Upload CSV */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <span className="material-icons-round text-accent text-2xl">upload_file</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Upload CSV File</h3>
            <p className="text-xs text-text-muted">
              Upload a CSV file with karaoke event data
            </p>
          </div>
        </div>

        <div className="bg-card-dark border border-border rounded-xl p-4 mb-4">
          <p className="text-xs text-text-muted mb-2">CSV columns (in order):</p>
          <p className="text-xs text-text-secondary font-mono leading-relaxed">
            Day of Week, Event Name, Venue Name, Address, City, State, Neighborhood, Cross Street, Phone, DJ, Start Time, End Time, Notes, Website
          </p>
        </div>

        <label className="block mb-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              file
                ? "border-accent/50 bg-accent/5"
                : "border-border hover:border-accent/30 hover:bg-white/[0.02]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <span className="material-icons-round text-accent text-2xl">description</span>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">{file.name}</p>
                  <p className="text-text-muted text-xs">
                    {(file.size / 1024).toFixed(1)} KB — Click to change
                  </p>
                </div>
              </div>
            ) : (
              <>
                <span className="material-icons-round text-text-muted text-3xl mb-2 block">cloud_upload</span>
                <p className="text-text-secondary text-sm font-semibold">Click to select a CSV file</p>
                <p className="text-text-muted text-xs mt-1">or drag and drop</p>
              </>
            )}
          </div>
        </label>

        <button
          onClick={handleUpload}
          disabled={syncing || !file}
          className="w-full bg-accent text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50"
        >
          {syncing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <span className="material-icons-round">publish</span>
              Submit CSV
            </>
          )}
        </button>
      </div>

      {/* Result message */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-xl ${
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
  );
}
