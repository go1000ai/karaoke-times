"use client";

import { useState, useTransition } from "react";
import { sendAnnouncement } from "../actions";

interface PastAnnouncement {
  title: string;
  message: string;
  created_at: string;
  audience: string;
  total: number;
  read: number;
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All Users",
  venue_owner: "Venue Owners",
  kj: "KJs",
  user: "Singers",
};

export function AnnouncementForm({ pastAnnouncements }: { pastAnnouncements: PastAnnouncement[] }) {
  const [isPending, startTransition] = useTransition();
  const [audience, setAudience] = useState<"all" | "venue_owner" | "kj" | "user">("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSend() {
    if (!title.trim() || !message.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await sendAnnouncement({ audience, title: title.trim(), message: message.trim() });
      if (result.success) {
        setFeedback({ type: "success", text: `Sent to ${result.count} user${(result.count ?? 0) !== 1 ? "s" : ""}!` });
        setTitle("");
        setMessage("");
      } else {
        setFeedback({ type: "error", text: result.error || "Failed to send" });
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Announcements</h1>
      <p className="text-text-secondary text-sm mb-8">Send notifications to users across the platform.</p>

      {/* Send Form */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">New Announcement</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Audience</label>
            <div className="flex gap-2">
              {(Object.entries(AUDIENCE_LABELS) as [string, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setAudience(value as typeof audience)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    audience === value
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted resize-none"
            />
          </div>

          {feedback && (
            <div className={`rounded-xl p-3 text-sm ${feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {feedback.text}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={isPending || !title.trim() || !message.trim()}
            className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send Announcement"}
          </button>
        </div>
      </div>

      {/* Past Announcements */}
      <h2 className="text-lg font-bold text-white mb-4">Past Announcements</h2>
      <div className="space-y-3">
        {pastAnnouncements.map((a, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold truncate">{a.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                    {AUDIENCE_LABELS[a.audience] || a.audience}
                  </span>
                </div>
                <p className="text-sm text-text-muted line-clamp-2">{a.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted/60">
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  <span>Sent to {a.total} users</span>
                  <span>{a.read} read</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {pastAnnouncements.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">campaign</span>
            <p className="text-text-secondary text-sm">No announcements sent yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
