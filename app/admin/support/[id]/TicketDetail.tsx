"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateTicketStatus, updateTicketPriority, addTicketMessage } from "../../actions";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  resolved: "bg-green-500/10 text-green-400",
  closed: "bg-white/5 text-text-muted",
};

export function TicketDetail({ ticket: initial, messages: initialMessages }: { ticket: Ticket; messages: Message[] }) {
  const [ticket, setTicket] = useState(initial);
  const [messages, setMessages] = useState(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [reply, setReply] = useState("");

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateTicketStatus(ticket.id, newStatus);
      if (result.success) {
        setTicket((prev) => ({ ...prev, status: newStatus }));
      }
    });
  }

  function handlePriorityChange(newPriority: string) {
    startTransition(async () => {
      const result = await updateTicketPriority(ticket.id, newPriority);
      if (result.success) {
        setTicket((prev) => ({ ...prev, priority: newPriority }));
      }
    });
  }

  function handleReply() {
    if (!reply.trim()) return;
    const msg = reply.trim();
    setReply("");
    startTransition(async () => {
      const result = await addTicketMessage(ticket.id, msg);
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender_id: "",
            message: msg,
            is_admin: true,
            created_at: new Date().toISOString(),
            profiles: { display_name: "Admin" },
          },
        ]);
        setTicket((prev) => ({
          ...prev,
          status: prev.status === "open" ? "in_progress" : prev.status,
        }));
      }
    });
  }

  return (
    <div>
      {/* Back link */}
      <Link href="/admin/support" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-white transition-colors mb-6">
        <span className="material-icons-round text-lg">arrow_back</span>
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-white mb-2">{ticket.subject}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                {ticket.status.replace("_", " ")}
              </span>
              {ticket.category && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-muted">{ticket.category}</span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-text-muted mb-4">{ticket.description}</p>

        <div className="flex items-center gap-4 text-xs text-text-muted/60">
          <span>By {ticket.profiles?.display_name || "Unknown User"}</span>
          <span>Created {new Date(ticket.created_at).toLocaleString()}</span>
          {ticket.resolved_at && <span>Resolved {new Date(ticket.resolved_at).toLocaleString()}</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/20">
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isPending}
            className="bg-card-dark border border-border rounded-xl px-3 py-2 text-sm text-white cursor-pointer disabled:opacity-50"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            disabled={isPending}
            className="bg-card-dark border border-border rounded-xl px-3 py-2 text-sm text-white cursor-pointer disabled:opacity-50"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {ticket.status !== "resolved" && (
            <button
              onClick={() => handleStatusChange("resolved")}
              disabled={isPending}
              className="ml-auto text-sm font-bold px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              Resolve
            </button>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Conversation</h2>

        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.is_admin
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-white/5 border border-border/20"
                }`}>
                  <p className="text-xs font-bold text-text-muted mb-1">
                    {msg.is_admin ? "Admin" : msg.profiles?.display_name || "User"}
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-[10px] text-text-muted/40 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">No messages yet.</p>
        )}
      </div>

      {/* Reply Form */}
      {ticket.status !== "closed" && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-3">Reply</h3>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="w-full bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleReply}
              disabled={isPending || !reply.trim()}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
