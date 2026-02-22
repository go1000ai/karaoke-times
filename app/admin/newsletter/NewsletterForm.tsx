"use client";

import { useState } from "react";

interface PastNewsletter {
  id: string;
  subject: string;
  body_html: string;
  recipient_count: number;
  source?: string;
  created_at: string;
}

export function NewsletterForm({
  pastNewsletters,
  totalUsers,
}: {
  pastNewsletters: PastNewsletter[];
  totalUsers: number;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminContext, setAdminContext] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/generate-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminContext: adminContext.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubject(data.subject);
        // Convert HTML back to plain text for the textarea
        const plainText = data.bodyHtml
          .replace(/<p[^>]*>/g, "")
          .replace(/<\/p>/g, "\n\n")
          .replace(/<br\s*\/?>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&rsquo;/g, "'")
          .replace(/&mdash;/g, "\u2014")
          .replace(/&ndash;/g, "\u2013")
          .replace(/&amp;/g, "&")
          .trim();
        setBody(plainText);
        setFeedback({
          type: "success",
          text: "Newsletter generated! Review and edit before sending.",
        });
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to generate" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Send this newsletter to ${totalUsers} users? This cannot be undone.`)) return;

    setSending(true);
    setFeedback(null);

    try {
      const bodyHtml = body
        .split("\n\n")
        .map((p) => `<p style="margin: 0 0 12px;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), bodyHtml, source: "manual" }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `Newsletter sent to ${data.count} users!` });
        setSubject("");
        setBody("");
        setAdminContext("");
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to send" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error" });
    } finally {
      setSending(false);
    }
  }

  const SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
    ai_auto: { label: "AI Auto", cls: "bg-purple-500/10 text-purple-400" },
    ai_generated: { label: "AI Generated", cls: "bg-purple-500/10 text-purple-400" },
    manual: { label: "Manual", cls: "bg-white/5 text-text-muted" },
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Newsletter</h1>
      <p className="text-text-secondary text-sm mb-8">
        Send monthly emails to all {totalUsers} registered users.
      </p>

      {/* Compose */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Compose Newsletter</h2>

        <div className="space-y-4">
          {/* AI Assistant */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-round text-purple-400 text-lg">auto_awesome</span>
              <label className="text-xs text-purple-300 uppercase tracking-wider font-bold">AI Assistant</label>
            </div>
            <textarea
              value={adminContext}
              onChange={(e) => setAdminContext(e.target.value)}
              placeholder="Optional context for the AI (e.g., 'mention the new venue opening in Brooklyn', 'focus on weekend events', 'it's Lunar New Year this month')"
              rows={3}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 placeholder:text-text-muted resize-none mb-3"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-icons-round text-base">
                {generating ? "hourglass_top" : "auto_awesome"}
              </span>
              {generating ? "Generating..." : "Generate with AI"}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-text-muted">or write manually</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. March 2026 — What's Coming to NYC Karaoke"
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">
              Body <span className="normal-case font-normal">(plain text — line breaks become paragraphs)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hey karaoke fam!\n\nHere's what's happening this month...\n\nNew venues added:\n- Venue A in Brooklyn\n- Venue B in Manhattan\n\nSee you on stage!"}
              rows={10}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted resize-none"
            />
          </div>

          {feedback && (
            <div
              className={`rounded-xl p-3 text-sm ${
                feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : `Send Newsletter to ${totalUsers} Users`}
          </button>
        </div>
      </div>

      {/* Past Newsletters */}
      <h2 className="text-lg font-bold text-white mb-4">Past Newsletters</h2>
      <div className="space-y-3">
        {pastNewsletters.map((n) => (
          <div key={n.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold truncate">{n.subject}</p>
                  {n.source && SOURCE_LABELS[n.source] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${SOURCE_LABELS[n.source].cls}`}>
                      {SOURCE_LABELS[n.source].label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted/60">
                  <span>{new Date(n.created_at).toLocaleDateString()}</span>
                  <span>Sent to {n.recipient_count} users</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {pastNewsletters.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">newspaper</span>
            <p className="text-text-secondary text-sm">No newsletters sent yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
