"use client";

import { useState } from "react";

interface LogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

const ACTION_ICONS: Record<string, string> = {
  user_role_changed: "manage_accounts",
  user_deleted: "person_remove",
  venue_deleted: "store_mall_directory",
  venue_owner_assigned: "assignment_ind",
  event_toggled: "event",
  event_deleted: "event_busy",
  booking_updated: "book_online",
  queue_updated: "queue_music",
  queue_removed: "remove_from_queue",
  review_deleted: "rate_review",
  promo_toggled: "local_offer",
  promo_deleted: "remove_circle",
  connection_removed: "link_off",
  ticket_updated: "support_agent",
  ticket_replied: "reply",
  announcement_sent: "campaign",
};

export function ActivityLog({ logs }: { logs: LogEntry[] }) {
  const [actionFilter, setActionFilter] = useState("");

  const actionTypes = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((l) => {
    if (actionFilter && l.action !== actionFilter) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Activity Log</h1>
      <p className="text-text-secondary text-sm mb-8">Admin actions audit trail.</p>

      {/* Filter */}
      {actionTypes.length > 0 && (
        <div className="mb-6">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
          >
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      )}

      {/* Log Entries */}
      <div className="space-y-2">
        {filtered.map((log) => (
          <div key={log.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-text-muted text-lg">
                {ACTION_ICONS[log.action] || "history"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white">
                <span className="font-bold">{log.profiles?.display_name || "Admin"}</span>
                {" "}
                <span className="text-text-muted">{log.action.replace(/_/g, " ")}</span>
                {log.target_type && (
                  <span className="text-text-muted/60"> on {log.target_type}</span>
                )}
              </p>
              {log.details && Object.keys(log.details).length > 0 && (
                <p className="text-xs text-text-muted/40 truncate">
                  {JSON.stringify(log.details)}
                </p>
              )}
            </div>
            <p className="text-xs text-text-muted/40 flex-shrink-0">
              {new Date(log.created_at).toLocaleString()}
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">history</span>
            <p className="text-text-secondary text-sm">No activity logged yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
