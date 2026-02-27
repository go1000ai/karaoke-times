"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createEvent,
  updateEvent,
  toggleEvent,
  deleteEvent,
  createPromo,
  togglePromo,
  deletePromo,
  skipEventWeek,
  removeEventSkip,
} from "../actions";
import {
  AGE_RESTRICTIONS,
  DRESS_CODES,
  COVER_CHARGES,
  DRINK_MINIMUMS,
  RESTRICTION_TAGS,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";

interface ConnectedVenue {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface VenueEvent {
  id: string;
  venue_id: string;
  day_of_week: string;
  event_name: string | null;
  dj: string | null;
  start_time: string;
  end_time: string;
  notes: string | null;
  is_active: boolean;
  kj_user_id?: string | null;
  age_restriction?: string | null;
  dress_code?: string | null;
  cover_charge?: string | null;
  drink_minimum?: string | null;
  restrictions?: string[] | null;
  custom_rules?: string[] | null;
  happy_hour_details?: string | null;
  event_date?: string | null;
  flyer_url?: string | null;
}

interface EventSkip {
  id: string;
  event_id: string;
  skip_date: string;
  reason: string | null;
  created_by: string | null;
}

interface Promo {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  event_id: string | null;
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

// Generate time options in 30-min increments (12:00 PM → 4:00 AM covers karaoke hours)
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
    if (h === 4 && m === 0) break; // stop at 4:00 AM
  }
}

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
  promos: initialPromos,
  skips: initialSkips,
  canEdit,
  currentUserId,
  isKJ,
  venues,
}: {
  events: VenueEvent[];
  promos: Promo[];
  skips: EventSkip[];
  canEdit: boolean;
  currentUserId: string;
  isKJ: boolean;
  venues: ConnectedVenue[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [promos, setPromos] = useState(initialPromos);
  const [formError, setFormError] = useState<string | null>(null);
  const [skips, setSkips] = useState<EventSkip[]>(initialSkips);

  function getSkipsForEvent(eventId: string) {
    return skips.filter((s) => s.event_id === eventId);
  }

  function handleSkip(eventId: string, skipDate: string, reason?: string) {
    startTransition(async () => {
      const result = await skipEventWeek(eventId, skipDate, reason);
      if (result?.success) {
        setSkips((prev) => [...prev, {
          id: crypto.randomUUID(),
          event_id: eventId,
          skip_date: skipDate,
          reason: reason || null,
          created_by: currentUserId,
        }]);
      }
    });
  }

  function handleRemoveSkip(skipId: string) {
    startTransition(async () => {
      await removeEventSkip(skipId);
      setSkips((prev) => prev.filter((s) => s.id !== skipId));
    });
  }

  // Build venue lookup map
  const venueMap = new Map(venues.map((v) => [v.id, v]));

  // For KJs, split into "my events" and "other events"
  const myEvents = isKJ
    ? events.filter((e) => e.kj_user_id === currentUserId)
    : events;
  const otherEvents = isKJ
    ? events.filter((e) => e.kj_user_id !== currentUserId)
    : [];

  const sortedMyEvents = [...myEvents].sort(
    (a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
  );
  const sortedOtherEvents = [...otherEvents].sort(
    (a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
  );

  function getPromosForEvent(eventId: string) {
    return promos.filter((p) => p.event_id === eventId);
  }

  function handleCreate(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = await createEvent(formData);
      if (result?.error) {
        setFormError(result.error);
      } else {
        setShowForm(false);
        setFormError(null);
        router.refresh();
      }
    });
  }

  function handleUpdate(eventId: string, formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = await updateEvent(eventId, formData);
      if (result?.error) {
        setFormError(result.error);
      } else {
        setEditingId(null);
        setFormError(null);
        router.refresh();
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

  function handleCreatePromo(eventId: string, formData: FormData) {
    formData.set("event_id", eventId);
    startTransition(async () => {
      const result = await createPromo(formData);
      if (result?.success) {
        setPromos((prev) => [
          {
            id: crypto.randomUUID(),
            title: formData.get("title") as string,
            description: (formData.get("description") as string) || null,
            is_active: true,
            event_id: eventId,
          },
          ...prev,
        ]);
      }
    });
  }

  function handleTogglePromo(promoId: string, currentActive: boolean) {
    startTransition(async () => {
      await togglePromo(promoId, !currentActive);
      setPromos((prev) =>
        prev.map((p) =>
          p.id === promoId ? { ...p, is_active: !currentActive } : p
        )
      );
    });
  }

  function handleDeletePromo(promoId: string) {
    startTransition(async () => {
      await deletePromo(promoId);
      setPromos((prev) => prev.filter((p) => p.id !== promoId));
    });
  }

  function canEditEvent(event: VenueEvent): boolean {
    if (!canEdit) return false;
    if (!isKJ) return true; // owners can edit all
    return event.kj_user_id === currentUserId; // KJs can only edit their own
  }

  return (
    <div>
      {/* Add Event Button */}
      {canEdit && !showForm && (
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
          {formError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="material-icons-round text-red-400 text-sm">error</span>
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}
          <EventForm
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Add Event"
            venues={venues}
          />
        </div>
      )}

      {/* My Events Section */}
      <EventSection
        title={isKJ ? "My Events" : undefined}
        icon={isKJ ? "person" : undefined}
        events={sortedMyEvents}
        editingId={editingId}
        setEditingId={setEditingId}
        isPending={isPending}
        canEditEvent={canEditEvent}
        handleUpdate={handleUpdate}
        handleToggle={handleToggle}
        handleDelete={handleDelete}
        showForm={showForm}
        setShowForm={setShowForm}
        canEdit={canEdit}
        emptyMessage={
          isKJ
            ? "You haven't created any events yet."
            : "No events scheduled yet."
        }
        getPromosForEvent={getPromosForEvent}
        onCreatePromo={handleCreatePromo}
        onTogglePromo={handleTogglePromo}
        onDeletePromo={handleDeletePromo}
        getSkipsForEvent={getSkipsForEvent}
        onSkip={handleSkip}
        onRemoveSkip={handleRemoveSkip}
        venueMap={venueMap}
        venues={venues}
      />

      {/* Other Events Section (KJ only) */}
      {isKJ && otherEvents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="material-icons-round text-base">groups</span>
            Other Events at Your Venues
          </h2>
          <div className="space-y-3 opacity-75">
            {sortedOtherEvents.map((event) => {
              const v = venueMap.get(event.venue_id);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  canEdit={false}
                  promos={[]}
                  venueName={v?.name}
                  venueAddress={v ? [v.address, v.city].filter(Boolean).join(", ") : ""}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EventSection({
  title,
  icon,
  events,
  editingId,
  setEditingId,
  isPending,
  canEditEvent,
  handleUpdate,
  handleToggle,
  handleDelete,
  showForm,
  setShowForm,
  canEdit,
  emptyMessage,
  getPromosForEvent,
  onCreatePromo,
  onTogglePromo,
  onDeletePromo,
  getSkipsForEvent,
  onSkip,
  onRemoveSkip,
  venueMap,
  venues,
}: {
  title?: string;
  icon?: string;
  events: VenueEvent[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  isPending: boolean;
  canEditEvent: (e: VenueEvent) => boolean;
  handleUpdate: (id: string, fd: FormData) => void;
  handleToggle: (id: string, active: boolean) => void;
  handleDelete: (id: string) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  canEdit: boolean;
  emptyMessage: string;
  getPromosForEvent: (eventId: string) => Promo[];
  onCreatePromo: (eventId: string, fd: FormData) => void;
  onTogglePromo: (promoId: string, currentActive: boolean) => void;
  onDeletePromo: (promoId: string) => void;
  getSkipsForEvent?: (eventId: string) => EventSkip[];
  onSkip?: (eventId: string, skipDate: string, reason?: string) => void;
  onRemoveSkip?: (skipId: string) => void;
  venueMap: Map<string, ConnectedVenue>;
  venues: ConnectedVenue[];
}) {
  return (
    <div>
      {title && (
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          {icon && <span className="material-icons-round text-base">{icon}</span>}
          {title} ({events.length})
        </h2>
      )}

      {events.length === 0 && !showForm ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">
            event
          </span>
          <p className="text-text-secondary">{emptyMessage}</p>
          {canEdit && (
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
          {events.map((event) => {
            const v = venueMap.get(event.venue_id);
            return (
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
                      venues={venues}
                    />
                  </div>
                ) : (
                  <EventCard
                    event={event}
                    canEdit={canEditEvent(event)}
                    onEdit={() => setEditingId(event.id)}
                    onToggle={() => handleToggle(event.id, !event.is_active)}
                    onDelete={() => handleDelete(event.id)}
                    isPending={isPending}
                    promos={getPromosForEvent(event.id)}
                    onCreatePromo={(fd) => onCreatePromo(event.id, fd)}
                    onTogglePromo={onTogglePromo}
                    onDeletePromo={onDeletePromo}
                    skips={getSkipsForEvent?.(event.id) ?? []}
                    onSkip={onSkip ? (date, reason) => onSkip(event.id, date, reason) : undefined}
                    onRemoveSkip={onRemoveSkip}
                    venueName={v?.name}
                    venueAddress={v ? [v.address, v.city].filter(Boolean).join(", ") : ""}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper: get next occurrence date for a day of week
function getNextOccurrence(dayOfWeek: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const targetIdx = days.indexOf(dayOfWeek);
  if (targetIdx === -1) {
    // Unknown day, default to next 7 days
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

function EventCard({
  event,
  canEdit,
  onEdit,
  onToggle,
  onDelete,
  isPending,
  promos,
  onCreatePromo,
  onTogglePromo,
  onDeletePromo,
  skips,
  onSkip,
  onRemoveSkip,
  venueName,
  venueAddress,
}: {
  event: VenueEvent;
  canEdit: boolean;
  onEdit?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
  isPending?: boolean;
  promos: Promo[];
  onCreatePromo?: (fd: FormData) => void;
  onTogglePromo?: (promoId: string, currentActive: boolean) => void;
  onDeletePromo?: (promoId: string) => void;
  skips?: EventSkip[];
  onSkip?: (skipDate: string, reason?: string) => void;
  onRemoveSkip?: (skipId: string) => void;
  venueName?: string;
  venueAddress?: string;
}) {
  const [promosOpen, setPromosOpen] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [flyerPreview, setFlyerPreview] = useState(false);

  const activePromoCount = promos.filter((p) => p.is_active).length;
  const nextDate = getNextOccurrence(event.day_of_week);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Event Info */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Flyer thumbnail */}
            {event.flyer_url && (
              <div className="mb-3">
                <button onClick={() => setFlyerPreview(!flyerPreview)} className="group relative">
                  <img
                    src={event.flyer_url}
                    alt="Event flyer"
                    className="w-16 h-16 rounded-xl object-cover border border-border group-hover:border-primary/50 transition-colors"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-icons-round text-white text-sm">zoom_in</span>
                  </span>
                </button>
                {flyerPreview && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFlyerPreview(false)}>
                    <div className="relative max-w-lg max-h-[80vh]">
                      <img src={event.flyer_url} alt="Event flyer" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
                      <button
                        onClick={() => setFlyerPreview(false)}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/20"
                      >
                        <span className="material-icons-round text-lg">close</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                {event.day_of_week}
              </span>
              {event.event_date && (
                <span className="bg-white/5 text-text-secondary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {new Date(event.event_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {event.flyer_url && (
                <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Flyer
                </span>
              )}
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

            {/* Skip badges */}
            {skips && skips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skips.map((skip) => (
                  <span key={skip.id} className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <span className="material-icons-round text-xs">event_busy</span>
                    Off: {new Date(skip.skip_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {onRemoveSkip && (
                      <button
                        onClick={() => onRemoveSkip(skip.id)}
                        className="ml-1 hover:text-white transition-colors"
                        title="Remove skip"
                      >
                        <span className="material-icons-round text-xs">close</span>
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-white font-bold">
              {event.event_name || "Karaoke Night"}
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              {event.start_time} — {event.end_time}
            </p>
            {(venueName || venueAddress) && (
              <p className="text-text-muted text-xs mt-1 flex items-center">
                <span className="material-icons-round text-sm mr-1 text-primary/60">
                  location_on
                </span>
                {venueName && <span className="text-white/80 font-medium">{venueName}</span>}
                {venueName && venueAddress ? <span className="mx-1">—</span> : null}
                {venueAddress}
              </p>
            )}
            {event.dj && (
              <p className="text-text-muted text-xs mt-1">
                <span className="material-icons-round text-xs align-middle mr-1">
                  headphones
                </span>
                {event.dj}
              </p>
            )}
            {event.notes && (
              <p className="text-text-muted text-xs mt-1">{event.notes}</p>
            )}
            {event.happy_hour_details && (
              <p className="text-accent text-xs mt-1">
                <span className="material-icons-round text-xs align-middle mr-1">local_bar</span>
                {event.happy_hour_details}
              </p>
            )}
            {/* Restriction badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {event.age_restriction && event.age_restriction !== "all_ages" && (
                <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {AGE_RESTRICTIONS.find((a) => a.value === event.age_restriction)?.label || event.age_restriction}
                </span>
              )}
              {event.dress_code && event.dress_code !== "casual" && (
                <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {DRESS_CODES.find((d) => d.value === event.dress_code)?.label || event.dress_code}
                </span>
              )}
              {event.cover_charge && event.cover_charge !== "free" && (
                <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Cover: {COVER_CHARGES.find((c) => c.value === event.cover_charge)?.label || event.cover_charge}
                </span>
              )}
              {event.drink_minimum && event.drink_minimum !== "none" && (
                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {DRINK_MINIMUMS.find((d) => d.value === event.drink_minimum)?.label || event.drink_minimum}
                </span>
              )}
              {Array.isArray(event.restrictions) && event.restrictions.map((r: string) => (
                <span key={r} className="bg-white/5 text-text-secondary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {r}
                </span>
              ))}
            </div>

            {/* Create Flyer Button */}
            {canEdit && (() => {
              const flyerParams: Record<string, string> = {
                eventName: event.event_name || "Karaoke Night",
                startTime: event.start_time || "",
                endTime: event.end_time || "",
              };
              if (event.event_date) flyerParams.eventDate = event.event_date;
              if (event.cover_charge && event.cover_charge !== "free") {
                flyerParams.coverCharge = COVER_CHARGES.find((c) => c.value === event.cover_charge)?.label || event.cover_charge;
              }
              if (event.dress_code && event.dress_code !== "casual") {
                flyerParams.dressCode = DRESS_CODES.find((d) => d.value === event.dress_code)?.label || event.dress_code;
              }
              if (event.happy_hour_details) flyerParams.drinkSpecials = event.happy_hour_details;
              if (event.dj) flyerParams.dj = event.dj;
              if (event.notes) flyerParams.notes = event.notes;
              if (event.age_restriction && event.age_restriction !== "all_ages") {
                flyerParams.ageRestriction = AGE_RESTRICTIONS.find((a) => a.value === event.age_restriction)?.label || event.age_restriction;
              }
              // Include active promos
              const activePromos = promos.filter((p) => p.is_active).map((p) => p.title);
              if (activePromos.length > 0) flyerParams.promos = activePromos.join(", ");

              return (
                <Link
                  href={`/dashboard/flyers?${new URLSearchParams(flyerParams).toString()}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-accent text-xs font-bold hover:text-accent/80 transition-colors"
                >
                  <span className="material-icons-round text-sm">auto_awesome</span>
                  Create Your Flyer
                </Link>
              );
            })()}
          </div>

          {canEdit && (
            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={onEdit}
                className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit"
              >
                <span className="material-icons-round text-lg">edit</span>
              </button>
              {onSkip && (
                <button
                  onClick={() => setShowSkipModal(true)}
                  disabled={isPending}
                  className="p-2 rounded-lg text-text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                  title="Skip This Week"
                >
                  <span className="material-icons-round text-lg">event_busy</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (event.is_active) {
                    setShowCancelConfirm(true);
                  } else {
                    onToggle?.();
                  }
                }}
                disabled={isPending}
                className="p-2 rounded-lg text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                title={event.is_active ? "Cancel / Deactivate" : "Reactivate"}
              >
                <span className="material-icons-round text-lg">
                  {event.is_active ? "visibility_off" : "visibility"}
                </span>
              </button>
              <button
                onClick={onDelete}
                disabled={isPending}
                className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete"
              >
                <span className="material-icons-round text-lg">delete</span>
              </button>
            </div>
          )}

          {/* Skip This Week Modal */}
          {showSkipModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowSkipModal(false)}>
              <div className="bg-card-dark border border-border rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-icons-round text-amber-400">event_busy</span>
                  <h3 className="text-white font-bold">Skip This Week</h3>
                </div>
                <p className="text-text-secondary text-sm mb-3">
                  This will mark <strong className="text-white">{event.event_name || "Karaoke Night"}</strong> as off for:
                </p>
                <p className="text-primary font-bold text-lg mb-3">
                  {new Date(nextDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <div className="mb-4">
                  <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Reason (optional)</label>
                  <input
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    placeholder="e.g. KJ unavailable, holiday..."
                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onSkip?.(nextDate, skipReason || undefined);
                      setShowSkipModal(false);
                      setSkipReason("");
                    }}
                    className="flex-1 bg-amber-500 text-black font-bold text-sm py-2.5 rounded-xl hover:bg-amber-400 transition-colors"
                  >
                    Confirm Skip
                  </button>
                  <button
                    onClick={() => { setShowSkipModal(false); setSkipReason(""); }}
                    className="px-4 py-2.5 bg-white/5 text-text-secondary font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
              <div className="bg-card-dark border border-border rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-icons-round text-red-400">warning</span>
                  <h3 className="text-white font-bold">Cancel This Event?</h3>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  This will deactivate <strong className="text-white">{event.event_name || "Karaoke Night"}</strong> and remove it from public listings. You can reactivate it later.
                </p>
                <p className="text-text-muted text-xs mb-4">
                  Tip: Use "Skip This Week" if you only need to take one week off.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onToggle?.(); setShowCancelConfirm(false); }}
                    className="flex-1 bg-red-500 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-red-400 transition-colors"
                  >
                    Deactivate Event
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-4 py-2.5 bg-white/5 text-text-secondary font-semibold text-sm rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Keep Active
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promos Collapsible */}
      {canEdit && (
        <div className="border-t border-border">
          <button
            onClick={() => setPromosOpen(!promosOpen)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-base text-accent">local_offer</span>
              <span className="text-sm font-semibold text-text-secondary">
                Promos
              </span>
              {promos.length > 0 && (
                <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activePromoCount} active
                </span>
              )}
            </div>
            <span className={`material-icons-round text-text-muted text-lg transition-transform ${promosOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {promosOpen && (
            <div className="px-5 pb-4">
              {/* Existing promos */}
              {promos.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {promos.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            promo.is_active ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {promo.title}
                          </p>
                          {promo.description && (
                            <p className="text-xs text-text-muted truncate">
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button
                          onClick={() => onTogglePromo?.(promo.id, promo.is_active)}
                          title={promo.is_active ? "Deactivate" : "Activate"}
                          className="p-1 rounded-lg text-text-muted hover:text-white transition-colors"
                        >
                          <span className="material-icons-round text-base">
                            {promo.is_active ? "toggle_on" : "toggle_off"}
                          </span>
                        </button>
                        {deleteConfirm === promo.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDeletePromo?.(promo.id);
                                setDeleteConfirm(null);
                              }}
                              className="text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/10"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-text-muted text-[10px] px-1 py-1"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(promo.id)}
                            title="Delete"
                            className="p-1 rounded-lg text-text-muted hover:text-red-400 transition-colors"
                          >
                            <span className="material-icons-round text-base">
                              close
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-xs mb-3">
                  No promos yet. Add drink specials, cover deals, etc.
                </p>
              )}

              {/* Add promo form */}
              {showPromoForm ? (
                <PromoForm
                  onSubmit={(fd) => {
                    onCreatePromo?.(fd);
                    setShowPromoForm(false);
                  }}
                  onCancel={() => setShowPromoForm(false)}
                  isPending={!!isPending}
                />
              ) : (
                <button
                  onClick={() => setShowPromoForm(true)}
                  className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline"
                >
                  <span className="material-icons-round text-sm">add</span>
                  Add Promo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PromoForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <form
      action={onSubmit}
      className="bg-white/[0.03] rounded-xl p-4 space-y-3"
    >
      <div>
        <input
          name="title"
          required
          placeholder="Promo title (e.g. $3 Wells Before 9PM)"
          className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
        />
      </div>
      <div>
        <input
          name="description"
          placeholder="Short description (optional)"
          className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-black font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add Promo"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-text-muted font-semibold text-xs px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EventForm({
  event,
  onSubmit,
  isPending,
  submitLabel,
  venues,
}: {
  event?: VenueEvent;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  submitLabel: string;
  venues: ConnectedVenue[];
}) {
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    Array.isArray(event?.restrictions) ? (event.restrictions as string[]) : []
  );
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(event?.flyer_url || null);
  const [flyerUploading, setFlyerUploading] = useState(false);
  const [flyerUrlInput, setFlyerUrlInput] = useState("");
  const flyerRef = useRef<HTMLInputElement>(null);

  const selectClass =
    "w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer";
  const inputClass =
    "w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50";
  const labelClass = "block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider";

  function handleFlyerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    setFlyerFile(file);
    setFlyerPreview(URL.createObjectURL(file));
  }

  function removeFlyer() {
    setFlyerFile(null);
    setFlyerPreview(null);
    if (flyerRef.current) flyerRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("restrictions", JSON.stringify(selectedRestrictions));

    // Upload flyer if new file selected, or use pasted URL
    if (flyerFile) {
      setFlyerUploading(true);
      const supabase = createClient();
      const ext = flyerFile.name.split(".").pop() || "jpg";
      const fileName = `event-flyers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("flyer-uploads")
        .upload(fileName, flyerFile, { contentType: flyerFile.type });
      setFlyerUploading(false);
      if (!uploadError) {
        const { data } = supabase.storage.from("flyer-uploads").getPublicUrl(fileName);
        formData.set("flyer_url", data.publicUrl);
      }
    } else if (flyerUrlInput.trim()) {
      // Use pasted poster URL (works for both create and edit)
      formData.set("flyer_url", flyerUrlInput.trim());
    } else if (event?.flyer_url && flyerPreview === null) {
      // Flyer was explicitly removed during edit
      formData.set("flyer_url", "");
    }
    // else: no flyer provided (create) or keeping existing (edit) — don't set flyer_url

    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Venue selector — always first */}
      <div>
        <label className={labelClass}>Venue *</label>
        {venues.length === 1 ? (
          <>
            <input type="hidden" name="venue_id" value={venues[0].id} />
            <div className="flex items-center gap-2 bg-white/5 border border-border rounded-xl px-4 py-2.5">
              <span className="material-icons-round text-sm text-primary/60">location_on</span>
              <span className="text-white text-sm font-medium">{venues[0].name}</span>
              {(venues[0].address || venues[0].city) && (
                <span className="text-text-muted text-xs">
                  — {[venues[0].address, venues[0].city].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </>
        ) : (
          <select
            name="venue_id"
            defaultValue={event?.venue_id || ""}
            required
            className={selectClass}
          >
            <option value="" disabled>Select venue...</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}{v.address || v.city ? ` — ${[v.address, v.city].filter(Boolean).join(", ")}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Basic event info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Day of Week *</label>
          <select name="day_of_week" defaultValue={event?.day_of_week || ""} required className={selectClass}>
            <option value="" disabled>Select day...</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Event Date</label>
          <input name="event_date" type="date" defaultValue={event?.event_date || ""} className={`${inputClass} [color-scheme:dark]`} />
        </div>
        <div>
          <label className={labelClass}>Event Name</label>
          <input name="event_name" type="text" defaultValue={event?.event_name || ""} placeholder="Karaoke Night" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>KJ / DJ</label>
          <input name="dj" type="text" defaultValue={event?.dj || ""} placeholder="DJ name (optional)" className={inputClass} />
        </div>
      </div>

      {/* Start Time, End Time, Recurrence */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Start Time *</label>
          <select name="start_time" defaultValue={event?.start_time || ""} required className={selectClass}>
            <option value="" disabled>Select time...</option>
            {TIME_OPTIONS.map((t) => (
              <option key={`start-${t}`} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>End Time *</label>
          <select name="end_time" defaultValue={event?.end_time || ""} required className={selectClass}>
            <option value="" disabled>Select time...</option>
            {TIME_OPTIONS.map((t) => (
              <option key={`end-${t}`} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Recurrence</label>
          <select name="recurrence_type" defaultValue={(event as any)?.recurrence_type || "weekly"} className={selectClass}>
            <option value="weekly">Every Week</option>
            <option value="biweekly">Every 2 Weeks</option>
            <option value="monthly">Monthly</option>
            <option value="one_time">One-Time Event</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Happy Hour</label>
        <input name="happy_hour_details" type="text" defaultValue={event?.happy_hour_details || ""} placeholder="e.g. $3 wells before 9PM" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" defaultValue={event?.notes || ""} placeholder="Any extra details..." rows={2} className={`${inputClass} resize-none`} />
      </div>

      {/* Event rules & restrictions */}
      <div className="border-t border-border pt-4 mt-4">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-icons-round text-base text-accent">rule</span>
          Event Rules
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Age Restriction</label>
            <select name="age_restriction" defaultValue={event?.age_restriction || "all_ages"} className={selectClass}>
              {AGE_RESTRICTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Dress Code</label>
            <select name="dress_code" defaultValue={event?.dress_code || "casual"} className={selectClass}>
              {DRESS_CODES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Cover Charge</label>
            <select name="cover_charge" defaultValue={event?.cover_charge || "free"} className={selectClass}>
              {COVER_CHARGES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Drink Minimum</label>
            <select name="drink_minimum" defaultValue={event?.drink_minimum || "none"} className={selectClass}>
              {DRINK_MINIMUMS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Restriction tags */}
        <div className="mt-4">
          <label className={labelClass}>Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {RESTRICTION_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedRestrictions((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                  selectedRestrictions.includes(tag)
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white/5 border-border text-text-muted hover:border-text-secondary"
                }`}
              >
                {selectedRestrictions.includes(tag) && <span className="mr-0.5">&#10003;</span>}
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flyer Upload */}
      <div className="border-t border-border pt-4 mt-4">
        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <span className="material-icons-round text-base text-accent">image</span>
          Event Flyer
        </h4>

        {flyerPreview ? (
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={flyerPreview}
                alt="Flyer preview"
                className="max-h-40 rounded-xl border border-border"
              />
              <button
                type="button"
                onClick={removeFlyer}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <span className="material-icons-round text-sm">close</span>
              </button>
            </div>
            <div className="text-text-secondary text-xs">
              {flyerFile ? (
                <>
                  <p className="font-semibold text-white">{flyerFile.name}</p>
                  <p>{(flyerFile.size / 1024).toFixed(0)} KB</p>
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
                    onClick={() => flyerRef.current?.click()}
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
            onClick={() => flyerRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-colors"
          >
            <span className="material-icons-round text-2xl text-text-muted mb-1 block">cloud_upload</span>
            <p className="text-text-secondary text-sm">Click to upload a flyer</p>
            <p className="text-text-muted text-xs mt-1">JPEG, PNG, or WebP (max 5MB)</p>
          </div>
        )}
        <input
          ref={flyerRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFlyerSelect}
          className="hidden"
        />

        {/* Or Paste Poster URL */}
        <div className="mt-3">
          <p className="text-text-muted text-xs mb-1.5 flex items-center gap-1">
            <span className="material-icons-round text-xs text-purple-400">link</span>
            Or paste a poster URL
          </p>
          <input
            type="text"
            value={flyerUrlInput}
            onChange={(e) => {
              setFlyerUrlInput(e.target.value);
              if (e.target.value.trim() && flyerFile) {
                setFlyerFile(null);
                setFlyerPreview(null);
                if (flyerRef.current) flyerRef.current.value = "";
              }
            }}
            placeholder="https://example.com/event-poster.jpg"
            className="w-full bg-white/5 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 placeholder:text-text-muted"
            disabled={!!flyerFile}
          />
          {flyerUrlInput.trim() && !flyerFile && (
            <div className="flex items-center gap-2 mt-2">
              <img
                src={flyerUrlInput.trim()}
                alt="URL preview"
                className="max-h-20 rounded-lg border border-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
              />
              <button
                type="button"
                onClick={() => setFlyerUrlInput("")}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || flyerUploading}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {(isPending || flyerUploading) && (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          )}
          {flyerUploading ? "Uploading flyer..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
