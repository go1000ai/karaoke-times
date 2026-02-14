"use client";

import { useState, useEffect } from "react";

interface SavedFlyer {
  id: string;
  event_name: string;
  venue_name: string;
  event_date: string | null;
  theme: string | null;
  image_path: string;
  imageUrl: string;
  copy_data: {
    headline?: string;
    tagline?: string;
    socialCaption?: string;
    hashtags?: string[];
  } | null;
  created_at: string;
}

export default function SavedFlyers() {
  const [flyers, setFlyers] = useState<SavedFlyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlyer, setSelectedFlyer] = useState<SavedFlyer | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchFlyers();
  }, []);

  async function fetchFlyers() {
    try {
      const res = await fetch("/api/flyers");
      const data = await res.json();
      setFlyers(data.flyers || []);
    } catch {
      console.error("Failed to fetch flyers");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this flyer? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch("/api/flyers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setFlyers((prev) => prev.filter((f) => f.id !== id));
      if (selectedFlyer?.id === id) setSelectedFlyer(null);
    } catch {
      console.error("Failed to delete flyer");
    } finally {
      setDeleting(null);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (flyers.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <span className="material-icons-round text-5xl text-text-muted mb-3 block">
          collections
        </span>
        <h3 className="text-white font-bold text-lg mb-1">No saved flyers yet</h3>
        <p className="text-text-muted text-sm">
          Generated flyers will appear here automatically.
        </p>
      </div>
    );
  }

  // Detail view for selected flyer
  if (selectedFlyer) {
    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <button
          onClick={() => setSelectedFlyer(null)}
          className="flex items-center gap-1 text-text-muted hover:text-white text-sm transition-colors"
        >
          <span className="material-icons-round text-lg">arrow_back</span>
          Back to all flyers
        </button>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-lg">
                {selectedFlyer.event_name}
              </h2>
              <p className="text-text-muted text-sm">
                {selectedFlyer.venue_name}
                {selectedFlyer.event_date && ` \u2022 ${selectedFlyer.event_date}`}
              </p>
            </div>
            {selectedFlyer.theme && (
              <span className="text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {selectedFlyer.theme}
              </span>
            )}
          </div>

          <div className="rounded-xl overflow-hidden border border-border bg-black/30">
            <img
              src={selectedFlyer.imageUrl}
              alt={`${selectedFlyer.event_name} flyer`}
              className="w-full max-h-[700px] object-contain"
            />
          </div>
        </div>

        {/* Copy data */}
        {selectedFlyer.copy_data && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <span className="material-icons-round text-accent">edit_note</span>
              Saved Copy
            </h3>
            {selectedFlyer.copy_data.headline && (
              <p className="text-white font-bold text-lg">
                {selectedFlyer.copy_data.headline}
              </p>
            )}
            {selectedFlyer.copy_data.tagline && (
              <p className="text-text-secondary text-sm">
                {selectedFlyer.copy_data.tagline}
              </p>
            )}
            {selectedFlyer.copy_data.socialCaption && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                    Social Caption
                  </label>
                  <button
                    onClick={() =>
                      copyToClipboard(selectedFlyer.copy_data!.socialCaption!, "caption")
                    }
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="material-icons-round text-sm">
                      {copiedField === "caption" ? "check" : "content_copy"}
                    </span>
                    {copiedField === "caption" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-text-secondary text-sm bg-white/5 rounded-xl px-4 py-3 border border-border">
                  {selectedFlyer.copy_data.socialCaption}
                </p>
              </div>
            )}
            {selectedFlyer.copy_data.hashtags &&
              selectedFlyer.copy_data.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                      Hashtags
                    </label>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          selectedFlyer.copy_data!.hashtags!.map((h) => `#${h}`).join(" "),
                          "hashtags"
                        )
                      }
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <span className="material-icons-round text-sm">
                        {copiedField === "hashtags" ? "check" : "content_copy"}
                      </span>
                      {copiedField === "hashtags" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFlyer.copy_data.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <a
            href={selectedFlyer.imageUrl}
            download={`${selectedFlyer.event_name.replace(/\s+/g, "-").toLowerCase()}-flyer.webp`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl transition-colors"
          >
            <span className="material-icons-round text-lg">download</span>
            Download
          </a>
          <button
            onClick={() => handleDelete(selectedFlyer.id)}
            disabled={deleting === selectedFlyer.id}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-6 py-2.5 rounded-xl transition-colors border border-red-500/20"
          >
            <span className="material-icons-round text-lg">delete</span>
            {deleting === selectedFlyer.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {flyers.map((flyer) => (
        <button
          key={flyer.id}
          onClick={() => setSelectedFlyer(flyer)}
          className="group glass-card rounded-2xl overflow-hidden text-left hover:ring-2 hover:ring-primary/50 transition-all"
        >
          <div className="aspect-[9/16] bg-black/30 overflow-hidden">
            <img
              src={flyer.imageUrl}
              alt={flyer.event_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-3">
            <p className="text-white font-bold text-sm truncate">
              {flyer.event_name}
            </p>
            <p className="text-text-muted text-xs truncate">
              {flyer.venue_name}
            </p>
            <p className="text-text-muted text-xs mt-1">
              {formatDate(flyer.created_at)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
