"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { toggleEvent, deleteEvent, updateEvent, skipEventWeek, removeEventSkip } from "../actions";
import { createClient } from "@/lib/supabase/client";

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
  recurrence_type?: string;
  event_date?: string | null;
  flyer_url?: string | null;
  happy_hour_details?: string | null;
  age_restriction?: string | null;
  dress_code?: string | null;
  cover_charge?: string | null;
  drink_minimum?: string | null;
  restrictions?: string[] | null;
  venues: { name: string } | null;
}

const RECURRENCE_BADGES: Record<string, { label: string; cls: string }> = {
  biweekly: { label: "Bi-weekly", cls: "bg-blue-500/10 text-blue-400" },
  monthly: { label: "Monthly", cls: "bg-purple-500/10 text-purple-400" },
  one_time: { label: "One-time", cls: "bg-white/5 text-text-muted" },
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const RECURRENCE_OPTIONS = [
  { value: "weekly", label: "Every Week" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "one_time", label: "One-Time Event" },
];

// Generate time options
const TIME_OPTIONS: string[] = [];
for (let h = 12; h <= 23; h++) {
  for (const m of [0, 30]) {
    const hour12 = h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? "PM" : "AM";
    TIME_OPTIONS.push(`${hour12}:${m === 0 ? "00" : "30"} ${ampm}`);
  }
}
for (let h = 0; h <= 4; h++) {
  for (const m of [0, 30]) {
    if (h === 0) {
      TIME_OPTIONS.push(`12:${m === 0 ? "00" : "30"} AM`);
    } else {
      TIME_OPTIONS.push(`${h}:${m === 0 ? "00" : "30"} AM`);
    }
    if (h === 4 && m === 0) break;
  }
}

interface EventSkip {
  id: string;
  event_id: string;
  skip_date: string;
  reason: string | null;
  created_by: string | null;
}

interface Props {
  groupedEvents: Record<string, VenueEvent[]>;
  venues: { id: string; name: string }[];
  totalActive: number;
  totalVenues: number;
  dayOrder: string[];
  skips?: EventSkip[];
}

export function EventsList({ groupedEvents: initial, venues, totalActive, totalVenues, dayOrder, skips: initialSkips = [] }: Props) {
  const [grouped, setGrouped] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [skips, setSkips] = useState<EventSkip[]>(initialSkips);
  const [skipModal, setSkipModal] = useState<{ eventId: string; eventName: string; dayOfWeek: string } | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Edit modal state
  const [editEvent, setEditEvent] = useState<VenueEvent | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editRecurrence, setEditRecurrence] = useState("weekly");

  // Flyer upload in edit modal
  const supabase = createClient();
  const editFlyerRef = useRef<HTMLInputElement>(null);
  const [editFlyerFile, setEditFlyerFile] = useState<File | null>(null);
  const [editFlyerPreview, setEditFlyerPreview] = useState<string | null>(null);
  const [editFlyerUrlInput, setEditFlyerUrlInput] = useState("");

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

  function openEdit(event: VenueEvent) {
    setEditEvent({ ...event });
    setEditRecurrence(event.recurrence_type || "weekly");
    setEditError(null);
    setEditFlyerFile(null);
    setEditFlyerPreview(event.flyer_url || null);
    setEditFlyerUrlInput("");
  }

  function closeEdit() {
    setEditEvent(null);
    setEditError(null);
    setEditFlyerFile(null);
    setEditFlyerPreview(null);
    setEditFlyerUrlInput("");
    if (editFlyerRef.current) editFlyerRef.current.value = "";
  }

  function getNextOccurrence(dayOfWeek: string): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetIdx = days.indexOf(dayOfWeek);
    if (targetIdx === -1) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    }
    const now = new Date();
    const currentIdx = now.getDay();
    let diff = targetIdx - currentIdx;
    if (diff <= 0) diff += 7;
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    return next.toISOString().split("T")[0];
  }

  function getSkipsForEvent(eventId: string) {
    return skips.filter((s) => s.event_id === eventId);
  }

  function handleSkip(eventId: string, skipDate: string, reason?: string) {
    startTransition(async () => {
      const result = await skipEventWeek(eventId, skipDate, reason);
      if (result?.success) {
        setSkips((prev) => [...prev, { id: crypto.randomUUID(), event_id: eventId, skip_date: skipDate, reason: reason || null, created_by: null }]);
      }
    });
    setSkipModal(null);
    setSkipReason("");
  }

  function handleRemoveSkip(skipId: string) {
    startTransition(async () => {
      const result = await removeEventSkip(skipId);
      if (result?.success) {
        setSkips((prev) => prev.filter((s) => s.id !== skipId));
      }
    });
  }

  function handleEditFlyerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setEditError("Flyer image must be under 5MB.");
      return;
    }
    setEditFlyerFile(file);
    setEditFlyerPreview(URL.createObjectURL(file));
  }

  function removeEditFlyer() {
    setEditFlyerFile(null);
    setEditFlyerPreview(null);
    if (editFlyerRef.current) editFlyerRef.current.value = "";
  }

  async function uploadEditFlyer(): Promise<string | null> {
    if (!editFlyerFile) return editFlyerPreview; // keep existing URL if no new file
    const ext = editFlyerFile.name.split(".").pop() || "jpg";
    const fileName = `event-flyers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("flyer-uploads")
      .upload(fileName, editFlyerFile, { contentType: editFlyerFile.type });

    if (uploadError) {
      console.error("Flyer upload error:", uploadError);
      return editEvent?.flyer_url || null;
    }

    const { data } = supabase.storage.from("flyer-uploads").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleEditSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editEvent) return;

    setEditSaving(true);
    setEditError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    // Upload flyer if new file selected, otherwise use pasted URL or keep existing
    let flyerUrl: string | null = null;
    if (editFlyerFile) {
      flyerUrl = await uploadEditFlyer();
    } else if (editFlyerUrlInput.trim()) {
      flyerUrl = editFlyerUrlInput.trim();
    } else {
      flyerUrl = editFlyerPreview; // keep existing or null if removed
    }

    const params: Record<string, unknown> = {
      venue_id: fd.get("venue_id") as string,
      day_of_week: fd.get("day_of_week") as string,
      event_name: (fd.get("event_name") as string) || "Karaoke Night",
      dj: (fd.get("dj") as string) || "",
      start_time: (fd.get("start_time") as string) || "",
      end_time: (fd.get("end_time") as string) || "",
      notes: (fd.get("notes") as string) || "",
      recurrence_type: (fd.get("recurrence_type") as string) || "weekly",
      event_date: (fd.get("event_date") as string) || null,
      happy_hour_details: (fd.get("happy_hour_details") as string) || null,
      dress_code: (fd.get("dress_code") as string) || "casual",
      cover_charge: (fd.get("cover_charge") as string) || "free",
      flyer_url: flyerUrl,
    };

    const result = await updateEvent(editEvent.id, params as any);

    setEditSaving(false);

    if (result.error) {
      setEditError(result.error);
      return;
    }

    // Update local state
    const updatedVenue = venues.find((v) => v.id === params.venue_id);
    setGrouped((prev) => {
      const next: Record<string, VenueEvent[]> = {};
      for (const day of Object.keys(prev)) {
        next[day] = prev[day]
          .filter((ev) => ev.id !== editEvent.id)
          .map((ev) => ({ ...ev }));
      }
      const targetDay = params.day_of_week as string;
      if (!next[targetDay]) next[targetDay] = [];
      next[targetDay].push({
        ...editEvent,
        ...params,
        flyer_url: flyerUrl,
        venues: updatedVenue ? { name: updatedVenue.name } : editEvent.venues,
      } as VenueEvent);
      return next;
    });

    closeEdit();
  }

  const selectClass =
    "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50";
  const inputClass =
    "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted";
  const labelClass = "text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block";

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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
                          {event.recurrence_type && RECURRENCE_BADGES[event.recurrence_type] && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RECURRENCE_BADGES[event.recurrence_type].cls}`}>
                              {RECURRENCE_BADGES[event.recurrence_type].label}
                            </span>
                          )}
                          {event.flyer_url && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">Flyer</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate">
                          {event.venues?.name || "Unknown Venue"}
                          {event.dj && ` — ${event.dj}`}
                          {event.start_time && ` — ${event.start_time}`}
                          {event.end_time && `–${event.end_time}`}
                          {event.event_date && ` — ${new Date(event.event_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                        </p>
                        {/* Skip badges */}
                        {getSkipsForEvent(event.id).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getSkipsForEvent(event.id).map((skip) => (
                              <span key={skip.id} className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <span className="material-icons-round text-[10px]">event_busy</span>
                                Off: {new Date(skip.skip_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                <button
                                  onClick={() => handleRemoveSkip(skip.id)}
                                  className="ml-0.5 hover:text-white transition-colors"
                                  title="Remove skip"
                                >
                                  <span className="material-icons-round text-[10px]">close</span>
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Skip This Week */}
                        <button
                          onClick={() => setSkipModal({ eventId: event.id, eventName: event.event_name || "Karaoke Night", dayOfWeek: event.day_of_week })}
                          className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                          title="Skip This Week"
                        >
                          <span className="material-icons-round text-amber-400 text-sm">event_busy</span>
                        </button>
                        {/* Edit Button */}
                        <button
                          onClick={() => openEdit(event)}
                          className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                          title="Edit Event"
                        >
                          <span className="material-icons-round text-blue-400 text-sm">edit</span>
                        </button>
                        {/* Flyer Link */}
                        <Link
                          href={`/dashboard/flyers?${new URLSearchParams({
                            eventName: event.event_name || "Karaoke Night",
                            startTime: event.start_time || "",
                            endTime: event.end_time || "",
                            ...(event.dj ? { dj: event.dj } : {}),
                            ...(event.notes ? { notes: event.notes } : {}),
                          }).toString()}`}
                          className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors"
                          title="Create Flyer"
                        >
                          <span className="material-icons-round text-accent text-sm">auto_awesome</span>
                        </Link>
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

      {/* ═══ Edit Event Modal ═══ */}
      {editEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-card-dark border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 mx-4">
            {/* Header */}
            <div className="sticky top-0 bg-card-dark border-b border-border/30 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-blue-400 text-xl">edit</span>
                <h2 className="text-lg font-bold text-white">Edit Event</h2>
              </div>
              <button onClick={closeEdit} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <span className="material-icons-round text-text-muted">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              {/* Venue + Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Venue</label>
                  <select
                    name="venue_id"
                    defaultValue={editEvent.venue_id}
                    className={selectClass}
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Day of Week</label>
                  <select
                    name="day_of_week"
                    defaultValue={editEvent.day_of_week}
                    className={selectClass}
                  >
                    {DAY_ORDER.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Name + KJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Event Name</label>
                  <input
                    name="event_name"
                    type="text"
                    defaultValue={editEvent.event_name}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>KJ / DJ</label>
                  <input
                    name="dj"
                    type="text"
                    defaultValue={editEvent.dj || ""}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Times + Recurrence */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Start Time</label>
                  <select
                    name="start_time"
                    defaultValue={editEvent.start_time || ""}
                    className={selectClass}
                  >
                    <option value="">Select time...</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={`s-${t}`} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>End Time</label>
                  <select
                    name="end_time"
                    defaultValue={editEvent.end_time || ""}
                    className={selectClass}
                  >
                    <option value="">Select time...</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={`e-${t}`} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Recurrence</label>
                  <select
                    name="recurrence_type"
                    value={editRecurrence}
                    onChange={(e) => setEditRecurrence(e.target.value)}
                    className={selectClass}
                  >
                    {RECURRENCE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Date — shows for monthly / one-time */}
              {(editRecurrence === "monthly" || editRecurrence === "one_time") && (
                <div>
                  <label className={labelClass}>
                    Event Date {editRecurrence === "one_time" ? "*" : "(next occurrence)"}
                  </label>
                  <input
                    name="event_date"
                    type="date"
                    defaultValue={editEvent.event_date || ""}
                    required={editRecurrence === "one_time"}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
              )}

              {/* Happy Hour + Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Happy Hour</label>
                  <input
                    name="happy_hour_details"
                    type="text"
                    defaultValue={editEvent.happy_hour_details || ""}
                    placeholder="e.g. $3 wells before 9PM"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Dress Code</label>
                  <select
                    name="dress_code"
                    defaultValue={editEvent.dress_code || "casual"}
                    className={selectClass}
                  >
                    <option value="none">No Dress Code</option>
                    <option value="casual">Casual</option>
                    <option value="smart_casual">Smart Casual</option>
                    <option value="no_sneakers">No Sneakers</option>
                    <option value="no_hats">No Hats</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Cover Charge</label>
                <select
                  name="cover_charge"
                  defaultValue={editEvent.cover_charge || "free"}
                  className={selectClass}
                >
                  <option value="free">Free Entry</option>
                  <option value="varies">Varies</option>
                  <option value="$5">$5</option>
                  <option value="$10">$10</option>
                  <option value="$15">$15</option>
                  <option value="$20">$20</option>
                  <option value="$25+">$25+</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editEvent.notes || ""}
                  rows={2}
                  placeholder="Special details, drink specials, etc."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* ── Flyer Upload ── */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="material-icons-round text-base text-accent">image</span>
                  Event Flyer
                </h4>

                {editFlyerPreview ? (
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={editFlyerPreview}
                        alt="Flyer preview"
                        className="max-h-40 rounded-xl border border-border"
                      />
                      <button
                        type="button"
                        onClick={removeEditFlyer}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                      >
                        <span className="material-icons-round text-sm">close</span>
                      </button>
                    </div>
                    <div className="text-text-secondary text-xs">
                      {editFlyerFile ? (
                        <>
                          <p className="font-semibold text-white">{editFlyerFile.name}</p>
                          <p>{(editFlyerFile.size / 1024).toFixed(0)} KB</p>
                          <p className="text-green-400 mt-1 flex items-center gap-1">
                            <span className="material-icons-round text-sm">check_circle</span>
                            New flyer ready to upload
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-white">Current flyer</p>
                          <button
                            type="button"
                            onClick={() => editFlyerRef.current?.click()}
                            className="mt-2 text-accent text-xs font-semibold hover:underline"
                          >
                            Replace with new image
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFlyerRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-colors"
                  >
                    <span className="material-icons-round text-2xl text-text-muted mb-1 block">cloud_upload</span>
                    <p className="text-text-secondary text-sm">Click to upload a flyer</p>
                    <p className="text-text-muted text-xs mt-1">JPEG, PNG, or WebP (max 5MB)</p>
                  </div>
                )}
                {/* Or Paste Poster URL */}
                <div className="mt-3">
                  <p className="text-text-muted text-xs mb-1.5 flex items-center gap-1">
                    <span className="material-icons-round text-xs text-purple-400">link</span>
                    Or paste a poster URL
                  </p>
                  <input
                    type="url"
                    value={editFlyerUrlInput}
                    onChange={(e) => setEditFlyerUrlInput(e.target.value)}
                    placeholder="https://example.com/event-poster.jpg"
                    className="w-full bg-card-dark border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 placeholder:text-text-muted"
                    disabled={!!editFlyerFile}
                  />
                  {editFlyerUrlInput.trim() && !editFlyerFile && (
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={editFlyerUrlInput.trim()}
                        alt="URL preview"
                        className="max-h-20 rounded-lg border border-border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditFlyerUrlInput("")}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <input
                  ref={editFlyerRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditFlyerSelect}
                  className="hidden"
                />
              </div>

              {/* Error */}
              {editError && (
                <div className="rounded-xl p-3 text-sm bg-red-500/10 text-red-400">{editError}</div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-round text-lg">save</span>
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-6 py-3 rounded-xl bg-white/5 text-text-secondary text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Skip This Week Modal ═══ */}
      {skipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSkipModal(null); setSkipReason(""); }} />
          <div className="relative bg-card-dark border border-border rounded-2xl p-5 w-full max-w-sm z-10 mx-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-icons-round text-amber-400">event_busy</span>
              <h3 className="text-white font-bold">Skip This Week</h3>
            </div>
            <p className="text-text-secondary text-sm mb-3">
              Mark <strong className="text-white">{skipModal.eventName}</strong> as off for:
            </p>
            <p className="text-primary font-bold text-lg mb-3">
              {new Date(getNextOccurrence(skipModal.dayOfWeek) + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="mb-4">
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Reason (optional)</label>
              <input
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="e.g. KJ unavailable, holiday..."
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSkip(skipModal.eventId, getNextOccurrence(skipModal.dayOfWeek), skipReason || undefined)}
                className="flex-1 bg-amber-500 text-black font-bold text-sm py-2.5 rounded-xl hover:bg-amber-400 transition-colors"
              >
                Confirm Skip
              </button>
              <button
                onClick={() => { setSkipModal(null); setSkipReason(""); }}
                className="px-4 py-2.5 bg-white/5 text-text-secondary font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
