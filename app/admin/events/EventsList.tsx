"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { toggleEvent, deleteEvent, updateEvent, updateEventVenueFields, skipEventWeek, removeEventSkip } from "../actions";
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
  website?: string | null;
  venues: { name: string } | null;
}

const RECURRENCE_BADGES: Record<string, { label: string; cls: string }> = {
  biweekly: { label: "Bi-weekly", cls: "bg-blue-500/10 text-blue-400" },
  monthly: { label: "Monthly", cls: "bg-purple-500/10 text-purple-400" },
  one_time: { label: "One-time", cls: "bg-white/5 text-text-muted" },
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SPECIAL_SCHEDULES = [
  "Every 3rd Monday",
  "1st And 3rd Mondays",
  "1st & 3rd Mondays",
  "Every 1st & 3rd Saturdays",
  "Every 1st And 3rd Saturdays",
  "Bi-Monthly Sundays",
  "Monthly Fridays",
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [skips, setSkips] = useState<EventSkip[]>(initialSkips);
  const [skipModal, setSkipModal] = useState<{ eventId: string; eventName: string; dayOfWeek: string } | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipReasonType, setSkipReasonType] = useState("custom");
  const [skipStartDate, setSkipStartDate] = useState<string | null>(null);
  const [skipEndDate, setSkipEndDate] = useState<string | null>(null);
  const [skipCalendarMonth, setSkipCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
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

  function handleSkipRange(eventId: string, startDate: string, endDate: string, dayOfWeek: string, reason?: string) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetIdx = days.indexOf(dayOfWeek);

    // Collect all occurrences of dayOfWeek between startDate and endDate
    const dates: string[] = [];
    const current = new Date(startDate + "T12:00:00");
    const end = new Date(endDate + "T12:00:00");

    // Move to the first matching day of week
    while (current.getDay() !== targetIdx && current <= end) {
      current.setDate(current.getDate() + 1);
    }
    // Collect all matching dates
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 7);
    }

    if (dates.length === 0) return;

    startTransition(async () => {
      for (const skipDate of dates) {
        const result = await skipEventWeek(eventId, skipDate, reason);
        if (result?.success) {
          setSkips((prev) => [...prev, { id: crypto.randomUUID(), event_id: eventId, skip_date: skipDate, reason: reason || null, created_by: null }]);
        }
      }
    });
    setSkipModal(null);
    setSkipReason("");
    setSkipReasonType("custom");
    setSkipStartDate(null);
    setSkipEndDate(null);
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
      website: (fd.get("website") as string) || null,
      is_active: editEvent.is_active !== false,
      flyer_url: flyerUrl,
    };

    const result = await updateEvent(editEvent.id, params as any);

    // Also update venue-level fields (menu, instagram, facebook)
    const venueId = (fd.get("venue_id") as string) || editEvent.venue_id;
    const venueMenuUrl = (fd.get("venue_menu_url") as string) || null;
    const venueInstagram = (fd.get("venue_instagram") as string) || null;
    const venueFacebook = (fd.get("venue_facebook") as string) || null;
    await updateEventVenueFields(venueId, {
      menu_url: venueMenuUrl,
      instagram: venueInstagram,
      facebook: venueFacebook,
    });

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
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="bg-card-dark border border-border rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
        >
          <option value="">All Days</option>
          {dayOrder.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          className="bg-card-dark border border-border rounded-lg px-3 py-2 text-xs text-white cursor-pointer max-w-[180px]"
        >
          <option value="">All Venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <span className="material-icons-round text-text-muted absolute left-3 top-1/2 -translate-y-1/2 text-base">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, venues, or KJs..."
            className="w-full bg-card-dark border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
            >
              <span className="material-icons-round text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Grouped by Day */}
      <div className="space-y-4">
        {dayOrder.map((day) => {
          if (dayFilter && dayFilter !== day) return null;
          let events = grouped[day] || [];
          if (venueFilter) events = events.filter((e) => e.venue_id === venueFilter);
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            events = events.filter((e) =>
              e.event_name.toLowerCase().includes(q) ||
              (e.venues?.name || "").toLowerCase().includes(q) ||
              (e.dj || "").toLowerCase().includes(q)
            );
          }
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
                      {/* Flyer thumbnail */}
                      <div className="flex-shrink-0 mr-4">
                        {event.flyer_url ? (
                          <img
                            src={event.flyer_url}
                            alt={`${event.event_name} flyer`}
                            className="w-16 h-16 rounded-xl object-cover border border-border/50 cursor-pointer hover:opacity-80 hover:scale-105 transition-all shadow-md"
                            onClick={() => openEdit(event)}
                            title="Click to edit"
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors"
                            onClick={() => openEdit(event)}
                            title="No flyer — click to add"
                          >
                            <span className="material-icons-round text-amber-400/60 text-lg">image</span>
                            <span className="text-[8px] text-amber-400/50 font-bold mt-0.5">ADD</span>
                          </div>
                        )}
                      </div>
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
                          {!DAY_ORDER.includes(event.day_of_week) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400" title="Special schedule">
                              {event.day_of_week}
                            </span>
                          )}
                          {event.flyer_url && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Flyer</span>
                          )}
                          {!event.flyer_url && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">No Flyer</span>
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
                    <optgroup label="Standard">
                      {DAY_ORDER.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Special Schedules">
                      {SPECIAL_SCHEDULES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </optgroup>
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

              {/* Website */}
              <div>
                <label className={labelClass}>Website / Booking URL</label>
                <input
                  type="url"
                  name="website"
                  defaultValue={editEvent.website || ""}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>

              {/* ── Venue Social & Menu Links ── */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="material-icons-round text-base text-primary">link</span>
                  Venue Links
                  <span className="text-[10px] text-text-muted font-normal">(saved to venue)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Menu URL</label>
                    <input
                      type="url"
                      name="venue_menu_url"
                      defaultValue={(editEvent as any)._venueMenuUrl || ""}
                      placeholder="https://venue.com/menu"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Instagram</label>
                    <input
                      type="text"
                      name="venue_instagram"
                      defaultValue={(editEvent as any)._venueInstagram || ""}
                      placeholder="https://instagram.com/venue or @handle"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={labelClass}>Facebook</label>
                  <input
                    type="url"
                    name="venue_facebook"
                    defaultValue={(editEvent as any)._venueFacebook || ""}
                    placeholder="https://facebook.com/venue"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Active / Inactive */}
              <div className="flex items-center justify-between glass-card rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">Event Status</p>
                  <p className="text-xs text-text-muted mt-0.5">Inactive events are hidden from the public site</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditEvent((prev) => prev ? { ...prev, is_active: !prev.is_active } : prev)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    editEvent.is_active !== false
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  }`}
                >
                  {editEvent.is_active !== false ? "Active" : "Inactive"}
                </button>
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

      {/* ═══ Skip Event Modal with Calendar ═══ */}
      {skipModal && (() => {
        const { year, month } = skipCalendarMonth;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const today = new Date().toISOString().split("T")[0];
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const targetDayIdx = days.indexOf(skipModal.dayOfWeek);

        // Count occurrences in selected range
        const selectedDates: string[] = [];
        if (skipStartDate && skipEndDate) {
          const cur = new Date(skipStartDate + "T12:00:00");
          const end = new Date(skipEndDate + "T12:00:00");
          while (cur.getDay() !== targetDayIdx && cur <= end) cur.setDate(cur.getDate() + 1);
          while (cur <= end) {
            selectedDates.push(cur.toISOString().split("T")[0]);
            cur.setDate(cur.getDate() + 7);
          }
        }

        const skipReasonOptions = [
          { value: "KJ unavailable", label: "KJ unavailable" },
          { value: "Holiday", label: "Holiday" },
          { value: "Private event", label: "Private event" },
          { value: "Venue closed", label: "Venue closed" },
          { value: "Weather/emergency", label: "Weather / emergency" },
          { value: "Renovation/maintenance", label: "Renovation / maintenance" },
          { value: "custom", label: "Custom reason..." },
        ];

        const finalReason = skipReasonType === "custom" ? skipReason : skipReasonType;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSkipModal(null); setSkipReason(""); setSkipReasonType("custom"); setSkipStartDate(null); setSkipEndDate(null); }} />
            <div className="relative bg-card-dark border border-border rounded-2xl p-5 w-full max-w-md z-10 mx-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons-round text-amber-400">event_busy</span>
                <h3 className="text-white font-bold">Skip Event</h3>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Select dates to skip <strong className="text-white">{skipModal.eventName}</strong> ({skipModal.dayOfWeek}s)
              </p>

              {/* Calendar */}
              <div className="bg-white/5 rounded-xl p-3 mb-4">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setSkipCalendarMonth((prev) => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <span className="material-icons-round text-white text-sm">chevron_left</span>
                  </button>
                  <span className="text-white text-sm font-bold">{monthName}</span>
                  <button
                    onClick={() => setSkipCalendarMonth((prev) => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <span className="material-icons-round text-white text-sm">chevron_right</span>
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center text-[10px] text-text-muted font-bold py-1">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isPast = dateStr < today;
                    const isStart = skipStartDate === dateStr;
                    const isEnd = skipEndDate === dateStr;
                    const isInRange = skipStartDate && skipEndDate && dateStr >= skipStartDate && dateStr <= skipEndDate;
                    const isMatchingDay = selectedDates.includes(dateStr);

                    return (
                      <button
                        key={day}
                        disabled={isPast}
                        onClick={() => {
                          if (!skipStartDate || (skipStartDate && skipEndDate)) {
                            // Start new selection
                            setSkipStartDate(dateStr);
                            setSkipEndDate(null);
                          } else {
                            // Set end date
                            if (dateStr < skipStartDate) {
                              setSkipEndDate(skipStartDate);
                              setSkipStartDate(dateStr);
                            } else {
                              setSkipEndDate(dateStr);
                            }
                          }
                        }}
                        className={`w-full aspect-square rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${
                          isPast
                            ? "text-text-muted/30 cursor-not-allowed"
                            : isStart || isEnd
                              ? "bg-amber-500 text-black"
                              : isMatchingDay
                                ? "bg-amber-500/40 text-amber-200 ring-1 ring-amber-500"
                                : isInRange
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "text-white hover:bg-white/10"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selection summary */}
              {skipStartDate && (
                <div className="mb-4 bg-amber-500/10 rounded-xl px-3 py-2">
                  <p className="text-amber-300 text-xs font-semibold">
                    {!skipEndDate ? (
                      <>From: {new Date(skipStartDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — click an end date</>
                    ) : (
                      <>
                        {new Date(skipStartDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(skipEndDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        <span className="text-amber-400 ml-2">({selectedDates.length} {skipModal.dayOfWeek}{selectedDates.length !== 1 ? "s" : ""} will be skipped)</span>
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Reason dropdown */}
              <div className="mb-3">
                <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Reason</label>
                <select
                  value={skipReasonType}
                  onChange={(e) => { setSkipReasonType(e.target.value); if (e.target.value !== "custom") setSkipReason(""); }}
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 cursor-pointer"
                >
                  {skipReasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom reason input */}
              {skipReasonType === "custom" && (
                <div className="mb-4">
                  <input
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    placeholder="Enter your reason..."
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (skipStartDate && skipEndDate) {
                      handleSkipRange(skipModal.eventId, skipStartDate, skipEndDate, skipModal.dayOfWeek, finalReason || undefined);
                    }
                  }}
                  disabled={!skipStartDate || !skipEndDate || selectedDates.length === 0}
                  className="flex-1 bg-amber-500 text-black font-bold text-sm py-2.5 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedDates.length > 0 ? `Skip ${selectedDates.length} ${skipModal.dayOfWeek}${selectedDates.length !== 1 ? "s" : ""}` : "Select dates"}
                </button>
                <button
                  onClick={() => { setSkipModal(null); setSkipReason(""); setSkipReasonType("custom"); setSkipStartDate(null); setSkipEndDate(null); }}
                  className="px-4 py-2.5 bg-white/5 text-text-secondary font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
