"use client";

import { useState, useTransition } from "react";
import { createPrivateBooking, updatePrivateBooking, deletePrivateBooking, respondToBookingRequest } from "./booking-actions";

interface PublicEvent {
  id: string;
  day_of_week: string;
  event_name: string | null;
  start_time: string;
  end_time: string;
  venue_id: string;
  venue_name: string;
}

interface PrivateBooking {
  id: string;
  booking_type: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  price: string | null;
  status: string;
  requested_by: string | null;
  request_source: string;
  venue_id: string | null;
  requester_name: string | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const BOOKING_TYPES = [
  { value: "private", label: "Private Party" },
  { value: "corporate", label: "Corporate Event" },
  { value: "party", label: "Birthday Party" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  confirmed: "bg-green-500/10 text-green-400",
  completed: "bg-blue-500/10 text-blue-400",
  cancelled: "bg-red-500/10 text-red-400",
  declined: "bg-red-500/10 text-red-400",
};

export function KJBookingsCalendar({
  publicEvents,
  privateBookings: initialBookings,
  kjUserId,
}: {
  publicEvents: PublicEvent[];
  privateBookings: PrivateBooking[];
  kjUserId: string;
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<PrivateBooking | null>(null);
  const [privateBookings, setPrivateBookings] = useState(initialBookings);
  const [isPending, startTransition] = useTransition();

  // Calendar math
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  // Get events for a specific date
  function getEventsForDate(date: number) {
    const dateObj = new Date(currentYear, currentMonth, date);
    const dayName = DAY_NAMES[dateObj.getDay()];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

    const pubEvents = publicEvents.filter((e) => e.day_of_week === dayName);
    const privBookings = privateBookings.filter((b) => b.event_date === dateStr);

    return { pubEvents, privBookings };
  }

  function formatDateStr(date: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  }

  function handleCreateBooking(formData: FormData) {
    startTransition(async () => {
      const result = await createPrivateBooking(formData);
      if (result?.success) {
        setShowForm(false);
        setPrivateBookings((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            booking_type: formData.get("booking_type") as string,
            client_name: formData.get("client_name") as string,
            client_email: (formData.get("client_email") as string) || null,
            client_phone: (formData.get("client_phone") as string) || null,
            event_date: formData.get("event_date") as string,
            start_time: formData.get("start_time") as string,
            end_time: (formData.get("end_time") as string) || null,
            location: (formData.get("location") as string) || null,
            notes: (formData.get("notes") as string) || null,
            price: (formData.get("price") as string) || null,
            status: "pending",
            requested_by: null,
            request_source: "kj_created",
            venue_id: null,
            requester_name: null,
          },
        ]);
      }
    });
  }

  function handleRespondToRequest(bookingId: string, action: "confirmed" | "declined") {
    startTransition(async () => {
      await respondToBookingRequest(bookingId, action);
      setPrivateBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: action } : b))
      );
    });
  }

  function handleDeleteBooking(bookingId: string) {
    if (!confirm("Delete this booking?")) return;
    startTransition(async () => {
      await deletePrivateBooking(bookingId);
      setPrivateBookings((prev) => prev.filter((b) => b.id !== bookingId));
    });
  }

  function handleUpdateStatus(bookingId: string, status: string) {
    const fd = new FormData();
    fd.set("status", status);
    startTransition(async () => {
      await updatePrivateBooking(bookingId, fd);
      setPrivateBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    });
  }

  // Selected date details
  const selectedEvents = selectedDate
    ? (() => {
        const dateObj = new Date(selectedDate + "T12:00:00");
        const dayName = DAY_NAMES[dateObj.getDay()];
        const pubEvents = publicEvents.filter((e) => e.day_of_week === dayName);
        const privBookings = privateBookings.filter((b) => b.event_date === selectedDate);
        return { pubEvents, privBookings, dayName };
      })()
    : null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Bookings</h1>
          <p className="text-text-secondary text-sm">
            Your calendar — public events and private gigs.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingBooking(null); }}
          className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/30 transition-all w-full sm:w-auto justify-center"
        >
          <span className="material-icons-round text-lg">add</span>
          New Booking
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-text-secondary">Public Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-xs text-text-secondary">My Booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-xs text-text-secondary">Incoming Request</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        {/* Month header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={prevMonth} className="p-1 text-text-muted hover:text-white transition-colors">
            <span className="material-icons-round">chevron_left</span>
          </button>
          <h2 className="text-lg font-bold text-white">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-1 text-text-muted hover:text-white transition-colors">
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center py-2 text-[10px] font-bold text-text-muted uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[52px] sm:min-h-[72px] border-b border-r border-border bg-white/[0.01]" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = i + 1;
            const dateStr = formatDateStr(date);
            const { pubEvents, privBookings: privB } = getEventsForDate(date);
            const isToday =
              date === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isSelected = selectedDate === dateStr;
            const hasEvents = pubEvents.length > 0 || privB.length > 0;

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[52px] sm:min-h-[72px] border-b border-r border-border p-1 sm:p-1.5 text-left transition-colors hover:bg-white/[0.03] ${
                  isSelected ? "bg-primary/10 ring-1 ring-primary/30" : ""
                }`}
              >
                <span
                  className={`text-[10px] sm:text-xs font-semibold inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                    isToday
                      ? "bg-primary text-black"
                      : "text-text-secondary"
                  }`}
                >
                  {date}
                </span>
                {hasEvents && (
                  <>
                    {/* Mobile: colored dots */}
                    <div className="flex gap-1 mt-1 sm:hidden justify-center">
                      {pubEvents.length > 0 && <span className="w-2 h-2 rounded-full bg-green-400" />}
                      {privB.some((b) => b.request_source === "kj_created") && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                      {privB.some((b) => b.request_source !== "kj_created") && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    {/* Desktop: text labels */}
                    <div className="hidden sm:flex flex-wrap gap-0.5 mt-1">
                      {pubEvents.map((e) => (
                        <span key={e.id} className="w-full text-[9px] font-semibold bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded truncate block">
                          {e.event_name || "Event"}
                        </span>
                      ))}
                      {privB.map((b) => {
                        const isRequest = b.request_source !== "kj_created";
                        return (
                          <span
                            key={b.id}
                            className={`w-full text-[9px] font-semibold px-1.5 py-0.5 rounded truncate block ${
                              isRequest
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {b.client_name}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* New Booking Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-6 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">New Private Booking</h3>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-white transition-colors">
              <span className="material-icons-round">close</span>
            </button>
          </div>
          <BookingForm
            onSubmit={handleCreateBooking}
            isPending={isPending}
            defaultDate={selectedDate || ""}
          />
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && selectedEvents && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-white font-bold mb-4">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>

          {selectedEvents.pubEvents.length === 0 && selectedEvents.privBookings.length === 0 ? (
            <p className="text-text-muted text-sm">No events on this day.</p>
          ) : (
            <div className="space-y-3">
              {/* Public events */}
              {selectedEvents.pubEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 bg-green-500/5 rounded-xl px-4 py-3 border border-green-500/10">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-green-400">event</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {e.event_name || "Karaoke Night"}
                      </p>
                      <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        Public
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {e.start_time} — {e.end_time} at {e.venue_name}
                    </p>
                  </div>
                </div>
              ))}

              {/* Private bookings */}
              {selectedEvents.privBookings.map((b) => {
                const isRequest = b.request_source !== "kj_created";
                const borderColor = isRequest ? "border-amber-500/10" : "border-blue-500/10";
                const bgColor = isRequest ? "bg-amber-500/5" : "bg-blue-500/5";
                const iconColor = isRequest ? "text-amber-400" : "text-blue-400";
                const iconBg = isRequest ? "bg-amber-500/10" : "bg-blue-500/10";

                return (
                  <div key={b.id} className={`${bgColor} rounded-xl px-4 py-3 border ${borderColor}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 hidden sm:flex`}>
                        <span className={`material-icons-round ${iconColor}`}>
                          {isRequest ? "inbox" : b.booking_type === "corporate" ? "business" : b.booking_type === "wedding" ? "favorite" : "lock"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-semibold text-white truncate">
                            {b.client_name}
                          </p>
                          <span className={`${isRequest ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"} text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0`}>
                            {BOOKING_TYPES.find((t) => t.value === b.booking_type)?.label || "Private"}
                          </span>
                          {isRequest && (
                            <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              {b.request_source === "singer_request" ? "Singer" : "Venue"}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[b.status] || ""}`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">
                          {b.start_time}{b.end_time ? ` — ${b.end_time}` : ""}
                          {b.location ? ` at ${b.location}` : ""}
                        </p>
                        {b.requester_name && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            Requested by <span className="font-semibold text-white">{b.requester_name}</span>
                          </p>
                        )}
                        {b.notes && <p className="text-xs text-text-muted mt-1">{b.notes}</p>}
                        {b.price && <p className="text-xs text-accent mt-1 font-semibold">{b.price}</p>}

                        {/* Mobile action buttons (below content) */}
                        {isRequest && b.status === "pending" && (
                          <div className="flex gap-2 mt-2 sm:hidden">
                            <button
                              onClick={() => handleRespondToRequest(b.id, "confirmed")}
                              disabled={isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 text-green-400 font-bold text-xs py-2 rounded-lg"
                            >
                              <span className="material-icons-round text-sm">check_circle</span>
                              Accept
                            </button>
                            <button
                              onClick={() => handleRespondToRequest(b.id, "declined")}
                              disabled={isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 font-bold text-xs py-2 rounded-lg"
                            >
                              <span className="material-icons-round text-sm">cancel</span>
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Desktop action buttons (right side) */}
                      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                        {isRequest && b.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleRespondToRequest(b.id, "confirmed")}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
                              title="Accept"
                            >
                              <span className="material-icons-round text-base">check_circle</span>
                            </button>
                            <button
                              onClick={() => handleRespondToRequest(b.id, "declined")}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Decline"
                            >
                              <span className="material-icons-round text-base">cancel</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {b.status === "pending" && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, "confirmed")}
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
                                title="Confirm"
                              >
                                <span className="material-icons-round text-base">check_circle</span>
                              </button>
                            )}
                            {b.status === "confirmed" && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, "completed")}
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                                title="Mark Complete"
                              >
                                <span className="material-icons-round text-base">task_alt</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title="Delete"
                            >
                              <span className="material-icons-round text-base">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingForm({
  onSubmit,
  isPending,
  defaultDate,
}: {
  onSubmit: (fd: FormData) => void;
  isPending: boolean;
  defaultDate: string;
}) {
  const inputClass =
    "w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50";
  const selectClass =
    "w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer";
  const labelClass = "block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider";

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Client Name *</label>
          <input name="client_name" required placeholder="John Smith" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Booking Type</label>
          <select name="booking_type" defaultValue="private" className={selectClass}>
            {BOOKING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date *</label>
          <input name="event_date" type="date" required defaultValue={defaultDate} className={`${inputClass} [color-scheme:dark]`} />
        </div>
        <div>
          <label className={labelClass}>Start Time *</label>
          <input name="start_time" type="text" required placeholder="7:00 PM" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>End Time</label>
          <input name="end_time" type="text" placeholder="11:00 PM" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input name="location" type="text" placeholder="Venue or address" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Client Email</label>
          <input name="client_email" type="email" placeholder="email@example.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Client Phone</label>
          <input name="client_phone" type="tel" placeholder="(555) 123-4567" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Price</label>
          <input name="price" type="text" placeholder="$500" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" placeholder="Special requests, equipment needed, etc." rows={2} className={`${inputClass} resize-none`} />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {isPending && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
          Add Booking
        </button>
      </div>
    </form>
  );
}
