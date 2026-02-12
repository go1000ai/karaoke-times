"use client";

import { useState, useTransition } from "react";
import { createEvent, updateEvent, toggleEvent, deleteEvent } from "../actions";

interface VenueEvent {
  id: string;
  day_of_week: string;
  event_name: string | null;
  dj: string | null;
  start_time: string;
  end_time: string;
  notes: string | null;
  is_active: boolean;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const dayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "Bi-Monthly Sundays",
];

export function EventsList({
  events,
  isOwner,
}: {
  events: VenueEvent[];
  isOwner: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedEvents = [...events].sort(
    (a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
  );

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createEvent(formData);
      if (!result?.error) {
        setShowForm(false);
      }
    });
  }

  function handleUpdate(eventId: string, formData: FormData) {
    startTransition(async () => {
      const result = await updateEvent(eventId, formData);
      if (!result?.error) {
        setEditingId(null);
      }
    });
  }

  function handleToggle(eventId: string, isActive: boolean) {
    startTransition(async () => {
      await toggleEvent(eventId, isActive);
    });
  }

  function handleDelete(eventId: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteEvent(eventId);
    });
  }

  return (
    <div>
      {/* Add Event Button */}
      {isOwner && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <span className="material-icons-round text-xl">add</span>
          Add Event
        </button>
      )}

      {/* Add Event Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-6 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">New Event</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-text-muted hover:text-white transition-colors"
            >
              <span className="material-icons-round">close</span>
            </button>
          </div>
          <EventForm
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Add Event"
          />
        </div>
      )}

      {/* Events List */}
      {sortedEvents.length === 0 && !showForm ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">
            event
          </span>
          <p className="text-text-secondary">No events scheduled yet.</p>
          {isOwner && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary font-bold text-sm hover:underline"
            >
              Add your first event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <div key={event.id}>
              {editingId === event.id ? (
                <div className="glass-card rounded-2xl p-6 border border-primary/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold">Edit Event</h3>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-text-muted hover:text-white transition-colors"
                    >
                      <span className="material-icons-round">close</span>
                    </button>
                  </div>
                  <EventForm
                    event={event}
                    onSubmit={(fd) => handleUpdate(event.id, fd)}
                    isPending={isPending}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                          {event.day_of_week}
                        </span>
                        {event.is_active ? (
                          <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-bold">
                        {event.event_name || "Karaoke Night"}
                      </h3>
                      <p className="text-text-secondary text-sm mt-1">
                        {event.start_time} — {event.end_time}
                      </p>
                      {event.dj && (
                        <p className="text-text-muted text-xs mt-1">
                          <span className="material-icons-round text-xs align-middle mr-1">
                            headphones
                          </span>
                          {event.dj}
                        </p>
                      )}
                      {event.notes && (
                        <p className="text-text-muted text-xs mt-1">
                          {event.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons — Owner Only */}
                    {isOwner && (
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => setEditingId(event.id)}
                          className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-round text-lg">edit</span>
                        </button>
                        <button
                          onClick={() =>
                            handleToggle(event.id, !event.is_active)
                          }
                          disabled={isPending}
                          className="p-2 rounded-lg text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                          title={
                            event.is_active ? "Deactivate" : "Activate"
                          }
                        >
                          <span className="material-icons-round text-lg">
                            {event.is_active
                              ? "visibility_off"
                              : "visibility"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={isPending}
                          className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete"
                        >
                          <span className="material-icons-round text-lg">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventForm({
  event,
  onSubmit,
  isPending,
  submitLabel,
}: {
  event?: VenueEvent;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Day of Week */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
            Day of Week *
          </label>
          <select
            name="day_of_week"
            defaultValue={event?.day_of_week || ""}
            required
            className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="" disabled>
              Select day...
            </option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* Event Name */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
            Event Name
          </label>
          <input
            name="event_name"
            type="text"
            defaultValue={event?.event_name || ""}
            placeholder="Karaoke Night"
            className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
            Start Time *
          </label>
          <input
            name="start_time"
            type="text"
            defaultValue={event?.start_time || ""}
            placeholder="9:00 PM"
            required
            className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
            End Time *
          </label>
          <input
            name="end_time"
            type="text"
            defaultValue={event?.end_time || ""}
            placeholder="2:00 AM"
            required
            className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* KJ / DJ */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
            KJ / DJ
          </label>
          <input
            name="dj"
            type="text"
            defaultValue={event?.dj || ""}
            placeholder="DJ name (optional)"
            className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
          Notes
        </label>
        <textarea
          name="notes"
          defaultValue={event?.notes || ""}
          placeholder="Any extra details (happy hour, drink specials, etc.)"
          rows={2}
          className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {isPending && (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
