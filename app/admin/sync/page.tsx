"use client";

import { useRef, useState, useEffect } from "react";

interface VenueEventEntry {
  id: string;
  day_of_week: string;
  flyer_url: string | null;
  venueName: string;
}

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
  const [importing, setImporting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupDetails, setCleanupDetails] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState<string | null>(null);
  const [venueEvents, setVenueEvents] = useState<VenueEventEntry[]>([]);
  const [venueEventsLoading, setVenueEventsLoading] = useState(false);
  const [venueSearch, setVenueSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [regeneratingSelected, setRegeneratingSelected] = useState(false);
  const [regenerateProgress, setRegenerateProgress] = useState<string | null>(null);

  async function handleCleanupDuplicates() {
    if (!confirm("This will remove duplicate events (same venue + day), keeping the best version. Continue?")) return;
    setCleaning(true);
    setResult(null);
    setCleanupDetails([]);
    try {
      const res = await fetch("/api/admin/cleanup-duplicates", { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.details) setCleanupDetails(data.details);
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setCleaning(false);
    }
  }

  async function handleImportMockData() {
    if (!confirm("This will import all mock data venues and events into the database. Existing records will be skipped. Continue?")) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/import-mock-data", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setImporting(false);
    }
  }

  async function handleAutoGenerateFlyers() {
    if (!confirm("This will generate AI flyers for every event AND every private-room / open-format venue that doesn't have one. This may take several minutes. Continue?")) return;
    setGenerating(true);
    setResult(null);
    setGenerateProgress("Finding events and venues without flyers...");
    try {
      const res = await fetch("/api/admin/auto-generate-flyers", { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.errors && data.errors.length > 0) {
        setGenerateProgress(`Done. ${data.generated} generated, ${data.failed} failed.`);
      } else {
        setGenerateProgress(null);
      }
    } catch {
      setResult({ success: false, message: "Network error or timeout. The generation may still be running on the server." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleForceRegenerateFlyers() {
    if (!confirm("This will REPLACE all AI-generated flyers with new ones (removes old flyers with dates or incorrect content). This may take several minutes. Continue?")) return;
    setGenerating(true);
    setResult(null);
    setGenerateProgress("Replacing all AI-generated flyers...");
    try {
      const res = await fetch("/api/admin/auto-generate-flyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate: true }),
      });
      const data = await res.json();
      setResult(data);
      setGenerateProgress(`Done. ${data.generated} regenerated, ${data.failed ?? 0} failed.`);
    } catch {
      setResult({ success: false, message: "Network error or timeout. The generation may still be running on the server." });
    } finally {
      setGenerating(false);
    }
  }

  async function loadVenueEvents() {
    setVenueEventsLoading(true);
    try {
      const res = await fetch("/api/admin/list-venue-events");
      const data = await res.json();
      if (data.events) setVenueEvents(data.events);
    } catch {
      // ignore
    } finally {
      setVenueEventsLoading(false);
    }
  }

  async function handleRegenerateSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Regenerate AI flyers for ${selectedIds.size} selected event(s)?`)) return;
    setRegeneratingSelected(true);
    setRegenerateProgress("Generating...");
    try {
      const res = await fetch("/api/admin/auto-generate-flyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueEventIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      setRegenerateProgress(`Done. ${data.generated} regenerated${data.failed ? `, ${data.failed} failed` : ""}.`);
      setSelectedIds(new Set());
      loadVenueEvents(); // refresh the list
    } catch {
      setRegenerateProgress("Error — please try again.");
    } finally {
      setRegeneratingSelected(false);
    }
  }

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

      {/* Import Mock Data */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <span className="material-icons-round text-yellow-400 text-2xl">inventory</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Import Mock Data to Database</h3>
            <p className="text-xs text-text-muted">
              Import all ~200 hardcoded NYC karaoke events into the database so they become editable in the admin panel (flyers, details, etc.)
            </p>
          </div>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-yellow-400">
            <span className="font-bold">Safe to run multiple times</span> — existing venues and events will be skipped, only new ones are created.
          </p>
        </div>

        <button
          onClick={handleImportMockData}
          disabled={importing}
          className="w-full bg-yellow-500 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-500/30 transition-all disabled:opacity-50"
        >
          {importing ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <span className="material-icons-round">database</span>
              Import Mock Data Events
            </>
          )}
        </button>
      </div>

      {/* Cleanup Duplicates */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center">
            <span className="material-icons-round text-red-400 text-2xl">cleaning_services</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Cleanup Duplicate Events</h3>
            <p className="text-xs text-text-muted">
              Remove duplicate events where the same venue has multiple entries for the same day. Keeps the best version (with flyer, oldest).
            </p>
          </div>
        </div>

        <button
          onClick={handleCleanupDuplicates}
          disabled={cleaning}
          className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
        >
          {cleaning ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <span className="material-icons-round">delete_sweep</span>
              Find &amp; Remove Duplicates
            </>
          )}
        </button>

        {cleanupDetails.length > 0 && (
          <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
            {cleanupDetails.map((d, i) => (
              <p key={i} className="text-xs text-text-muted">
                <span className="text-red-400">Removed:</span> {d}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Generate Flyers */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center">
            <span className="material-icons-round text-purple-400 text-2xl">auto_awesome</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Auto-Generate Flyers</h3>
            <p className="text-xs text-text-muted">
              Uses the n8n AI flyer generator to create flyers for all events that don&apos;t have one. Each flyer is auto-saved to the event.
            </p>
          </div>
        </div>

        <button
          onClick={handleAutoGenerateFlyers}
          disabled={generating}
          className="w-full bg-purple-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating flyers...
            </>
          ) : (
            <>
              <span className="material-icons-round">auto_awesome</span>
              Generate Missing Flyers
            </>
          )}
        </button>

        <button
          onClick={handleForceRegenerateFlyers}
          disabled={generating}
          className="w-full mt-3 bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/30 transition-all disabled:opacity-50"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <span className="material-icons-round text-sm">refresh</span>
              Force Regenerate All AI Flyers (Replaces Flyers with Dates)
            </>
          )}
        </button>

        {generateProgress && (
          <p className="text-xs text-purple-400 mt-3">{generateProgress}</p>
        )}
      </div>

      {/* Regenerate Individual Flyers */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center">
            <span className="material-icons-round text-cyan-400 text-2xl">image_search</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Regenerate Individual Flyers</h3>
            <p className="text-xs text-text-muted">Select specific venues to regenerate their AI flyer</p>
          </div>
          <button
            onClick={loadVenueEvents}
            disabled={venueEventsLoading}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-icons-round text-sm">{venueEventsLoading ? "hourglass_empty" : "refresh"}</span>
            {venueEvents.length === 0 ? "Load Events" : "Refresh"}
          </button>
        </div>

        {venueEvents.length > 0 && (
          <>
            <input
              type="text"
              value={venueSearch}
              onChange={(e) => setVenueSearch(e.target.value)}
              placeholder="Search venues..."
              className="w-full bg-card-dark border border-border rounded-xl py-2.5 px-4 text-sm text-white mb-3 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 placeholder:text-text-muted"
            />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "None selected"}
              </span>
              <button
                onClick={() => {
                  const filtered = venueEvents.filter((e) =>
                    `${e.venueName} ${e.day_of_week}`.toLowerCase().includes(venueSearch.toLowerCase())
                  );
                  if (selectedIds.size === filtered.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(filtered.map((e) => e.id)));
                  }
                }}
                className="text-xs text-text-muted hover:text-white transition-colors"
              >
                Select all / none
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {venueEvents
                .filter((e) =>
                  `${e.venueName} ${e.day_of_week}`.toLowerCase().includes(venueSearch.toLowerCase())
                )
                .map((e) => {
                  const hasAI = e.flyer_url?.includes("auto-flyers/");
                  const hasKJ = e.flyer_url && !hasAI;
                  const isSelected = selectedIds.has(e.id);
                  return (
                    <label
                      key={e.id}
                      className={`flex flex-col gap-1 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                        isSelected
                          ? "bg-cyan-400/10 border-cyan-400/30"
                          : "border-transparent hover:bg-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(e.id)) next.delete(e.id);
                            else next.add(e.id);
                            setSelectedIds(next);
                          }}
                          className="accent-cyan-400 mt-0.5 flex-shrink-0"
                        />
                        <span className="text-xs text-white font-medium leading-tight line-clamp-2">{e.venueName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 pl-4">
                        <span className="text-xs text-text-muted truncate">{e.day_of_week}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                          hasKJ ? "bg-yellow-500/15 text-yellow-400" :
                          hasAI ? "bg-purple-500/15 text-purple-400" :
                          "bg-white/5 text-text-muted"
                        }`}>
                          {hasKJ ? "KJ" : hasAI ? "AI" : "—"}
                        </span>
                      </div>
                    </label>
                  );
                })}
            </div>

            <button
              onClick={handleRegenerateSelected}
              disabled={regeneratingSelected || selectedIds.size === 0}
              className="w-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
            >
              {regeneratingSelected ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-icons-round text-sm">auto_awesome</span>
                  Regenerate Selected ({selectedIds.size})
                </>
              )}
            </button>

            {regenerateProgress && (
              <p className="text-xs text-cyan-400 mt-2">{regenerateProgress}</p>
            )}
          </>
        )}
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
