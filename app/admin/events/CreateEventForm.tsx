"use client";

import { useState, useTransition } from "react";
import { createEvent } from "../actions";

interface Venue {
  id: string;
  name: string;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const RECURRENCE_OPTIONS = [
  { value: "weekly", label: "Every Week" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "one_time", label: "One-Time Event" },
];

export function CreateEventForm({ venues }: { venues: Venue[] }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [venueId, setVenueId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [eventName, setEventName] = useState("");
  const [dj, setDj] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("weekly");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit() {
    if (!venueId || !dayOfWeek) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await createEvent({
        venue_id: venueId,
        day_of_week: dayOfWeek,
        event_name: eventName.trim(),
        dj: dj.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        notes: notes.trim(),
        recurrence_type: recurrenceType,
      });
      if (result.success) {
        setFeedback({ type: "success", text: "Event created!" });
        setVenueId("");
        setDayOfWeek("");
        setEventName("");
        setDj("");
        setStartTime("");
        setEndTime("");
        setNotes("");
        setRecurrenceType("weekly");
      } else {
        setFeedback({ type: "error", text: result.error || "Failed to create event" });
      }
    });
  }

  return (
    <div className="glass-card rounded-2xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-icons-round text-red-400">add_circle</span>
          <h2 className="text-lg font-bold text-white">Create New Event</h2>
        </div>
        <span className={`material-icons-round text-text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="border-t border-border/20 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Venue *</label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer"
              >
                <option value="">Select venue...</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Day of Week *</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer"
              >
                <option value="">Select day...</option>
                {DAY_ORDER.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Karaoke Night"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">KJ / DJ</label>
              <input
                type="text"
                value={dj}
                onChange={(e) => setDj(e.target.value)}
                placeholder="e.g. DJ Mike"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Start Time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 9:00 PM"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">End Time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 2:00 AM"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Recurrence</label>
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value)}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer"
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special details, drink specials, etc."
              rows={2}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted resize-none"
            />
          </div>

          {feedback && (
            <div className={`rounded-xl p-3 text-sm ${feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {feedback.text}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending || !venueId || !dayOfWeek}
            className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Event"}
          </button>
        </div>
      )}
    </div>
  );
}
