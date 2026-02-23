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

interface Draft {
  id: string;
  subject: string;
  body_text: string;
  body_html: string | null;
  admin_context: string | null;
  source: string;
  updated_at: string;
}

export function NewsletterForm({
  pastNewsletters,
  totalUsers,
  initialDrafts,
}: {
  pastNewsletters: PastNewsletter[];
  totalUsers: number;
  initialDrafts: Draft[];
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminContext, setAdminContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Draft state
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAiGenerated = bodyHtml !== null;

  // Build full email HTML preview (mirrors getNewsletterEmailHtml + emailWrapper from server)
  function getEmailPreviewHtml(): string {
    const contentHtml = bodyHtml
      ? bodyHtml
      : body
          .split("\n\n")
          .map((p) => `<p style="margin: 0 0 16px; font-size: 14px;">${p.replace(/\n/g, "<br/>")}</p>`)
          .join("");

    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
    <img src="https://karaoketimes.net/logo.png" alt="Karaoke Times" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 12px;" />
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000;">Karaoke Times</h1>
    <p style="margin: 8px 0 0; font-size: 13px; color: #000; opacity: 0.7;">Monthly Newsletter</p>
  </div>
  <div style="padding: 32px 24px;">
    <h2 style="margin: 0 0 16px; font-size: 20px; color: #ffffff;">${subject}</h2>
    <div style="font-size: 14px; color: #d0d0d0; line-height: 1.7;">
      ${contentHtml}
    </div>
    <div style="margin-top: 24px;">
      <a href="https://karaoketimes.net" style="display: block; background: #d4a017; color: #000; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">
        Browse Events
      </a>
    </div>
  </div>
  <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
    <p style="margin: 0; font-size: 11px; color: #666;">
      Karaoke Times &mdash; New York City Edition<br/>
      <a href="https://karaoketimes.net" style="color: #d4a017; text-decoration: none;">karaoketimes.net</a>
    </p>
  </div>
</div>`;
  }

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
        setBodyHtml(data.bodyHtml);
        const plainText = data.bodyHtml
          .replace(/<table[^>]*>[\s\S]*?<\/table>/g, "[venue image card]")
          .replace(/<img[^>]*>/g, "")
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
        setShowPreview(true);
        setFeedback({
          type: "success",
          text: "Newsletter generated with images! Preview below. Edit the subject or regenerate as needed.",
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

  function handleBodyChange(newBody: string) {
    setBody(newBody);
    setBodyHtml(null);
    setShowPreview(false);
  }

  // ─── Draft Functions ───

  async function handleSaveDraft() {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/newsletter-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeDraftId || undefined,
          subject: subject.trim(),
          bodyText: body,
          bodyHtml: bodyHtml,
          adminContext: adminContext.trim() || null,
          source: isAiGenerated ? "ai_generated" : "manual",
        }),
      });

      const data = await res.json();
      if (data.success) {
        const savedDraft = data.draft;
        setActiveDraftId(savedDraft.id);

        // Update local drafts list
        setDrafts((prev) => {
          const exists = prev.find((d) => d.id === savedDraft.id);
          if (exists) {
            return prev.map((d) => (d.id === savedDraft.id ? savedDraft : d));
          }
          return [savedDraft, ...prev];
        });

        setFeedback({ type: "success", text: "Draft saved!" });
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to save draft" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  function handleLoadDraft(draft: Draft) {
    setSubject(draft.subject);
    setBody(draft.body_text);
    setBodyHtml(draft.body_html);
    setAdminContext(draft.admin_context || "");
    setActiveDraftId(draft.id);
    setShowPreview(!!draft.body_html);
    setFeedback({ type: "success", text: "Draft loaded. Edit and send when ready." });
  }

  async function handleDeleteDraft(draftId: string) {
    if (!confirm("Delete this draft?")) return;

    try {
      const res = await fetch("/api/newsletter-drafts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId }),
      });

      const data = await res.json();
      if (data.success) {
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
        if (activeDraftId === draftId) {
          setActiveDraftId(null);
        }
      }
    } catch {
      // silently fail
    }
  }

  function handleNewDraft() {
    setSubject("");
    setBody("");
    setBodyHtml(null);
    setAdminContext("");
    setActiveDraftId(null);
    setShowPreview(false);
    setFeedback(null);
  }

  // ─── Send ───

  async function handleSend() {
    if (!subject.trim() || (!body.trim() && !bodyHtml)) return;
    if (!confirm(`Send this newsletter to ${totalUsers} users? This cannot be undone.`)) return;

    setSending(true);
    setFeedback(null);

    try {
      const html = bodyHtml
        ? bodyHtml
        : body
            .split("\n\n")
            .map((p) => `<p style="margin: 0 0 16px; font-size: 14px;">${p.replace(/\n/g, "<br/>")}</p>`)
            .join("");

      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          bodyHtml: html,
          source: bodyHtml ? "ai_generated" : "manual",
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Auto-delete the draft after sending
        if (activeDraftId) {
          try {
            await fetch("/api/newsletter-drafts", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: activeDraftId }),
            });
            setDrafts((prev) => prev.filter((d) => d.id !== activeDraftId));
          } catch {
            // non-critical
          }
        }

        setFeedback({ type: "success", text: `Newsletter sent to ${data.count} users!` });
        setSubject("");
        setBody("");
        setBodyHtml(null);
        setAdminContext("");
        setActiveDraftId(null);
        setShowPreview(false);
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

  const hasContent = subject.trim() || body.trim() || bodyHtml;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Newsletter</h1>
      <p className="text-text-secondary text-sm mb-8">
        Send monthly emails to all {totalUsers} registered users.
      </p>

      {/* Compose */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            {activeDraftId ? "Editing Draft" : "Compose Newsletter"}
          </h2>
          {activeDraftId && (
            <button
              onClick={handleNewDraft}
              className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-icons-round text-sm">add</span>
              New
            </button>
          )}
        </div>

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

          {/* AI Preview */}
          {isAiGenerated && showPreview && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-purple-300 uppercase tracking-wider font-bold">
                  AI Preview <span className="normal-case font-normal text-text-muted">(with images)</span>
                </label>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-text-muted hover:text-white transition-colors"
                >
                  Switch to text editor
                </button>
              </div>
              <div
                className="bg-[#1a1a2e] border border-purple-500/20 rounded-xl p-6 text-sm text-[#d0d0d0] leading-relaxed overflow-hidden"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          )}

          {/* Manual Text Editor */}
          {(!isAiGenerated || !showPreview) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-text-muted uppercase tracking-wider font-bold">
                  Body <span className="normal-case font-normal">(plain text — line breaks become paragraphs)</span>
                </label>
                {isAiGenerated && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Show AI preview
                  </button>
                )}
              </div>
              <textarea
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder={"Hey karaoke fam!\n\nHere's what's happening this month...\n\nNew venues added:\n- Venue A in Brooklyn\n- Venue B in Manhattan\n\nSee you on stage!"}
                rows={10}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted resize-none"
              />
              {isAiGenerated && (
                <p className="text-xs text-purple-400 mt-1">
                  Editing will switch to plain text mode (images will be removed).
                </p>
              )}
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-xl p-3 text-sm ${
                feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSaveDraft}
              disabled={saving || !hasContent}
              className="px-5 py-3 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-icons-round text-base">
                {saving ? "hourglass_top" : "save"}
              </span>
              {saving ? "Saving..." : activeDraftId ? "Update Draft" : "Save Draft"}
            </button>
            <button
              onClick={() => setShowEmailPreview(true)}
              disabled={!subject.trim() || (!body.trim() && !bodyHtml)}
              className="px-5 py-3 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-icons-round text-base">visibility</span>
              Preview Email
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || (!body.trim() && !bodyHtml)}
              className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {sending ? "Sending..." : `Send to ${totalUsers} Users`}
            </button>
          </div>
        </div>
      </div>

      {/* Full Email Preview Modal */}
      {showEmailPreview && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto py-8">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowEmailPreview(false)}
          />
          <div className="relative w-full max-w-xl mx-4">
            <div className="bg-card-dark border border-border rounded-t-2xl p-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-primary text-lg">email</span>
                <span className="text-sm font-bold text-white">Email Preview</span>
                <span className="text-xs text-text-muted">&mdash; how users will see it</span>
              </div>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="bg-[#2a2a3e] border-x border-border p-6">
              <div dangerouslySetInnerHTML={{ __html: getEmailPreviewHtml() }} />
            </div>

            <div className="bg-card-dark border border-border rounded-b-2xl p-4 flex items-center justify-between sticky bottom-0 z-10">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors"
              >
                Back to Editor
              </button>
              <button
                onClick={() => {
                  setShowEmailPreview(false);
                  handleSend();
                }}
                disabled={sending}
                className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-icons-round text-base">send</span>
                {sending ? "Sending..." : `Confirm & Send to ${totalUsers} Users`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Drafts */}
      {drafts.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-white mb-4">Saved Drafts</h2>
          <div className="space-y-3 mb-8">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={`glass-card rounded-2xl p-5 transition-colors ${
                  activeDraftId === draft.id ? "ring-1 ring-primary/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold truncate">
                        {draft.subject || "Untitled Draft"}
                      </p>
                      {SOURCE_LABELS[draft.source] && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${SOURCE_LABELS[draft.source].cls}`}>
                          {SOURCE_LABELS[draft.source].label}
                        </span>
                      )}
                      {activeDraftId === draft.id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-primary/10 text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted/60 mt-1">
                      Last edited {new Date(draft.updated_at).toLocaleDateString()} at{" "}
                      {new Date(draft.updated_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleLoadDraft(draft)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
