"use client";

import { useState, useTransition } from "react";
import {
  updateContactMessageStatus,
  deleteContactMessage,
} from "@/app/admin/actions";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  ip_address: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-red-500/10 text-red-400",
  read: "bg-blue-500/10 text-blue-400",
  archived: "bg-white/5 text-text-muted",
};

export function MessagesList({
  messages,
  newCount,
  thisWeekCount,
}: {
  messages: ContactMessage[];
  newCount: number;
  thisWeekCount: number;
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = messages.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  function setStatus(id: string, status: "new" | "read" | "archived") {
    setPendingId(id);
    startTransition(async () => {
      await updateContactMessageStatus(id, status);
      setPendingId(null);
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    setPendingId(id);
    startTransition(async () => {
      await deleteContactMessage(id);
      setPendingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">
            Contact Messages
          </h1>
          <p className="text-text-secondary text-sm">
            {messages.length} total message{messages.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
            <span className="material-icons-round text-red-400">
              mark_email_unread
            </span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white">{newCount}</p>
            <p className="text-xs text-text-muted">New</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
            <span className="material-icons-round text-green-400">
              trending_up
            </span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white">{thisWeekCount}</p>
            <p className="text-xs text-text-muted">This Week</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {filtered.map((msg) => {
          const isOpen = expandedId === msg.id;
          const isPending = pendingId === msg.id;
          return (
            <div
              key={msg.id}
              className="glass-card rounded-2xl p-5 transition-colors"
            >
              <button
                onClick={() => {
                  setExpandedId(isOpen ? null : msg.id);
                  if (!isOpen && msg.status === "new") {
                    setStatus(msg.id, "read");
                  }
                }}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-white font-bold truncate">
                        {msg.subject}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[msg.status] || STATUS_COLORS.new
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">
                      {msg.name} — {new Date(msg.created_at).toLocaleString()}
                    </p>
                    {!isOpen && (
                      <p className="text-xs text-text-muted/60 mt-1 truncate">
                        {msg.message}
                      </p>
                    )}
                  </div>
                  <span className="material-icons-round text-text-muted/40 flex-shrink-0">
                    {isOpen ? "expand_less" : "expand_more"}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">
                        From
                      </p>
                      <p className="text-sm text-white">{msg.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">
                        Email
                      </p>
                      <a
                        href={`mailto:${msg.email}?subject=${encodeURIComponent(
                          "Re: " + msg.subject
                        )}`}
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {msg.email}
                      </a>
                    </div>
                  </div>

                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">
                    Message
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap bg-card-dark border border-border rounded-xl p-4 mb-4">
                    {msg.message}
                  </p>

                  {msg.ip_address && (
                    <p className="text-[10px] text-text-muted/60 mb-4">
                      IP: {msg.ip_address}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=${encodeURIComponent(
                        "Re: " + msg.subject
                      )}`}
                      className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-icons-round text-sm">
                        reply
                      </span>
                      Reply
                    </a>
                    {msg.status !== "read" && (
                      <button
                        disabled={isPending}
                        onClick={() => setStatus(msg.id, "read")}
                        className="flex items-center gap-1.5 bg-white/5 border border-border text-text-secondary text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        <span className="material-icons-round text-sm">
                          drafts
                        </span>
                        Mark Read
                      </button>
                    )}
                    {msg.status !== "archived" && (
                      <button
                        disabled={isPending}
                        onClick={() => setStatus(msg.id, "archived")}
                        className="flex items-center gap-1.5 bg-white/5 border border-border text-text-secondary text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        <span className="material-icons-round text-sm">
                          archive
                        </span>
                        Archive
                      </button>
                    )}
                    {msg.status === "archived" && (
                      <button
                        disabled={isPending}
                        onClick={() => setStatus(msg.id, "new")}
                        className="flex items-center gap-1.5 bg-white/5 border border-border text-text-secondary text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        <span className="material-icons-round text-sm">
                          unarchive
                        </span>
                        Restore
                      </button>
                    )}
                    <button
                      disabled={isPending}
                      onClick={() => remove(msg.id)}
                      className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 ml-auto"
                    >
                      <span className="material-icons-round text-sm">
                        delete
                      </span>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">
              inbox
            </span>
            <p className="text-text-secondary text-sm">No messages found</p>
          </div>
        )}
      </div>
    </div>
  );
}
