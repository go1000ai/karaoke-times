"use client";

import { useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string | null } | null;
  lastMessage: { message: string; is_admin: boolean; created_at: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  resolved: "bg-green-500/10 text-green-400",
  closed: "bg-white/5 text-text-muted",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-white/5 text-text-muted",
  normal: "bg-blue-500/10 text-blue-400",
  high: "bg-orange-500/10 text-orange-400",
  urgent: "bg-red-500/10 text-red-400",
};

export function TicketsList({ tickets, openCount, thisWeekCount }: { tickets: Ticket[]; openCount: number; thisWeekCount: number }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filtered = tickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Support Tickets</h1>
          <p className="text-text-secondary text-sm">{tickets.length} total tickets</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
            <span className="material-icons-round text-blue-400">inbox</span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white">{openCount}</p>
            <p className="text-xs text-text-muted">Open Tickets</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
            <span className="material-icons-round text-green-400">trending_up</span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white">{thisWeekCount}</p>
            <p className="text-xs text-text-muted">This Week</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {filtered.map((ticket) => (
          <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="block glass-card rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-white font-bold truncate">{ticket.subject}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.normal}`}>
                    {ticket.priority}
                  </span>
                  {ticket.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                      {ticket.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted">
                  {ticket.profiles?.display_name || "Unknown User"} — {new Date(ticket.created_at).toLocaleDateString()}
                </p>
                {ticket.lastMessage && (
                  <p className="text-xs text-text-muted/60 mt-1 truncate">
                    {ticket.lastMessage.is_admin ? "Admin: " : "User: "}
                    {ticket.lastMessage.message}
                  </p>
                )}
              </div>
              <span className="material-icons-round text-text-muted/40 flex-shrink-0">chevron_right</span>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">support_agent</span>
            <p className="text-text-secondary text-sm">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
