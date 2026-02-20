"use client";

import { useRef, useState } from "react";

// Matches the actual Google Sheet column order (A–P)
const DEFAULT_COLUMNS = [
  "Day Of The Week",
  "Event Name",
  "Event Location",
  "Event Address",
  "City",
  "State",
  "Zip Code",
  "Neighborhood",
  "Cross Street",
  "Reservations",
  "Music By/DJ",
  "Start Time",
  "End Time",
  "Notes",
  "Website",
  "Flyer",
];

function columnLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode(65 + (n % 26)) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1Hjvo1uMhxtvTcnHNzHaCH9Qq-lbIqRV3Kag5vzSukFk/edit";

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [showColumnEditor, setShowColumnEditor] = useState(false);

  async function handleSync() {
    if (!sheetUrl.trim()) return;
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim(), columns }),
      });
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
      formData.append("columns", JSON.stringify(columns));
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

  function moveColumn(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= columns.length) return;
    const next = [...columns];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setColumns(next);
  }

  function updateColumnName(index: number, value: string) {
    const next = [...columns];
    next[index] = value;
    setColumns(next);
  }

  function removeColumn(index: number) {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  }

  function addColumn() {
    setColumns((prev) => [...prev, `Column ${prev.length + 1}`]);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Sync Data</h1>
      <p className="text-text-secondary text-sm mb-8">
        Import karaoke event data from a Google Sheet URL or upload a CSV file.
      </p>

      {/* CSV Column Mapping */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <button
          onClick={() => setShowColumnEditor(!showColumnEditor)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
              <span className="material-icons-round text-purple-400 text-xl">view_column</span>
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-sm">CSV Column Mapping</h3>
              <p className="text-xs text-text-muted">{columns.length} columns — click to edit order & names</p>
            </div>
          </div>
          <span className="material-icons-round text-text-muted">
            {showColumnEditor ? "expand_less" : "expand_more"}
          </span>
        </button>

        {showColumnEditor && (
          <div className="mt-4 space-y-2">
            {columns.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-6 text-right flex-shrink-0 font-mono">{columnLetter(i)}</span>
                <input
                  type="text"
                  value={col}
                  onChange={(e) => updateColumnName(i, e.target.value)}
                  className="flex-1 bg-card-dark border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                />
                <button
                  onClick={() => moveColumn(i, -1)}
                  disabled={i === 0}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted hover:text-white disabled:opacity-30 transition-colors"
                >
                  <span className="material-icons-round text-sm">arrow_upward</span>
                </button>
                <button
                  onClick={() => moveColumn(i, 1)}
                  disabled={i === columns.length - 1}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted hover:text-white disabled:opacity-30 transition-colors"
                >
                  <span className="material-icons-round text-sm">arrow_downward</span>
                </button>
                <button
                  onClick={() => removeColumn(i)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <span className="material-icons-round text-sm">close</span>
                </button>
              </div>
            ))}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/20">
              <button
                onClick={addColumn}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors font-semibold"
              >
                <span className="material-icons-round text-sm">add_circle</span>
                Add Column
              </button>
              <button
                onClick={() => setColumns(DEFAULT_COLUMNS)}
                className="text-xs text-text-muted hover:text-white transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sync from Google Sheet */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons-round text-primary text-2xl">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Sync from Google Sheet</h3>
            <p className="text-xs text-text-muted">
              Paste a Google Sheet URL to fetch the latest data
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
            Google Sheet URL
          </label>
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-text-muted"
          />
        </div>

        <button
          onClick={handleSync}
          disabled={syncing || !sheetUrl.trim()}
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
                <p className="text-text-muted text-xs mt-1">.csv files only</p>
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
