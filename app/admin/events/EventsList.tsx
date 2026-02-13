"use client";

import { useState, useTransition } from "react";
import { toggleEvent, deleteEvent } from "../actions";

interface VenueEvent {
  id: string;
  venue_id: string;
  day_of_week: string;
  event_name: string;
  dj: string | null;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  notes: string | null;
  venues: { name: string } | null;
}

interface Props {
  groupedEvents: Record<string, VenueEvent[]>;
  venues: { id: string; name: string }[];
  totalActive: number;
  totalVenues: number;
  dayOrder: string[];
}

export function EventsList({ groupedEvents: initial, venues, totalActive, totalVenues, dayOrder }: Props) {
  const [grouped, setGrouped] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (day: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  function handleToggle(eventId: string, currentActive: boolean) {
    setProcessingId(eventId);
    startTransition(async () => {
      const result = await toggleEvent(eventId, !currentActive);
      if (result.success) {
        setGrouped((prev) => {
          const next = { ...prev };
          for (const day of Object.keys(next)) {
            next[day] = next[day].map((e) =>
              e.id === eventId ? { ...e, is_active: !currentActive } : e
            );
          }
          return next;
        });
      }
      setProcessingId(null);
    });
  }

  function handleDelete(eventId: string, name: string) {
    if (!confirm(`Delete event "${name}"? This cannot be undone.`)) return;
    setProcessingId(eventId);
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (result.success) {
        setGrouped((prev) => {
          const next = { ...prev };
          for (const day of Object.keys(next)) {
            next[day] = next[day].filter((e) => e.id !== eventId);
          }
          return next;
        });
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Events</h1>
          <p className="text-text-secondary text-sm">
            {totalActive} active events across {totalVenues} venues
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
        >
          <option value="">All Days</option>
          {dayOrder.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer flex-1"
        >
          <option value="">All Venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Grouped by Day */}
      <div className="space-y-4">
        {dayOrder.map((day) => {
          if (dayFilter && dayFilter !== day) return null;
          let events = grouped[day] || [];
          if (venueFilter) events = events.filter((e) => e.venue_id === venueFilter);
          if (events.length === 0 && !dayFilter) return null;

          const isCollapsed = collapsed.has(day);

          return (
            <div key={day} className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleCollapse(day)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-icons-round text-primary text-lg">event</span>
                  <h2 className="text-white font-bold">{day}</h2>
                  <span className="text-xs text-text-muted bg-white/5 px-2.5 py-0.5 rounded-full">
                    {events.length}
                  </span>
                </div>
                <span className={`material-icons-round text-text-muted transition-transform ${isCollapsed ? "" : "rotate-180"}`}>
                  expand_more
                </span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-border/20">
                  {events.length > 0 ? events.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between px-5 py-3 border-b border-border/10 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white font-semibold truncate">{event.event_name}</p>
                          {event.is_active === false && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate">
                          {event.venues?.name || "Unknown Venue"}
                          {event.dj && ` — ${event.dj}`}
                          {event.start_time && ` — ${event.start_time}`}
                          {event.end_time && `–${event.end_time}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(event.id, event.is_active !== false)}
                          disabled={isPending && processingId === event.id}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
                            event.is_active !== false
                              ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                              : "bg-white/5 text-text-muted hover:bg-white/10"
                          }`}
                        >
                          {event.is_active !== false ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => handleDelete(event.id, event.event_name)}
                          disabled={isPending && processingId === event.id}
                          className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <span className="material-icons-round text-red-400 text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  )) : (
                    <p className="px-5 py-4 text-text-muted text-sm">No events on {day}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
