"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  venueName: string;
  venueId: string;
}

const CATEGORIES = [
  { value: "wrong_info", label: "Wrong Information" },
  { value: "closed_venue", label: "Venue Closed / No Longer Exists" },
  { value: "wrong_hours", label: "Wrong Hours / Times" },
  { value: "wrong_address", label: "Wrong Address" },
  { value: "duplicate", label: "Duplicate Listing" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "other", label: "Other" },
];

export default function ReportProblemModal({ open, onClose, venueName, venueId }: Props) {
  const { user } = useAuth();
  const supabase = createClient();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    if (!user) {
      setError("Please sign in to report a problem.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: `Report: ${venueName}`,
      description: `Venue: ${venueName} (ID: ${venueId})\nCategory: ${CATEGORIES.find((c) => c.value === category)?.label || "Not specified"}\n\n${description}`,
      category: category || "listing_report",
      priority: "normal",
      status: "open",
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
  }

  function handleClose() {
    setCategory("");
    setDescription("");
    setSubmitted(false);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-card-dark border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto z-10 animate-[slideUp_0.3s_ease-out]">
        {/* Header */}
        <div className="sticky top-0 bg-card-dark border-b border-border/30 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-accent text-xl">flag</span>
            <h2 className="text-lg font-bold text-white">Report a Problem</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <span className="material-icons-round text-text-muted">close</span>
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            <div className="text-center py-6">
              <span className="material-icons-round text-green-400 text-4xl mb-3 block">check_circle</span>
              <h3 className="text-lg font-bold text-white mb-2">Report Submitted</h3>
              <p className="text-text-secondary text-sm mb-4">
                Thank you for reporting this issue with <strong className="text-white">{venueName}</strong>.
                Our team will review it shortly.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : !user ? (
            <div className="text-center py-6">
              <span className="material-icons-round text-accent text-4xl mb-3 block">login</span>
              <h3 className="text-lg font-bold text-white mb-2">Sign In Required</h3>
              <p className="text-text-secondary text-sm mb-4">
                Please sign in to report a problem with this listing.
              </p>
              <a
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors"
              >
                <span className="material-icons-round text-lg">login</span>
                Sign In
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-text-secondary text-sm">
                Reporting an issue with <strong className="text-white">{venueName}</strong>
              </p>

              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">
                  What&apos;s wrong?
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50"
                >
                  <option value="" className="text-black bg-white">Select a category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="text-black bg-white">{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">
                  Details *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Please describe the issue..."
                  className="w-full bg-surface-dark border border-border rounded-xl py-3 px-4 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 placeholder:text-text-muted"
                />
              </div>

              {error && (
                <div className="rounded-xl p-3 text-sm bg-red-500/10 text-red-400">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="material-icons-round text-lg animate-spin">refresh</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round text-lg">send</span>
                    Submit Report
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
