"use client";

import { useState, useTransition } from "react";
import { handleBooking } from "../actions";
import { requestKJBooking, cancelBookingRequest } from "./booking-actions";

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profiles: any;
}

interface ConnectedKJ {
  user_id: string;
  display_name: string;
}

interface OwnerKJRequest {
  id: string;
  kj_user_id: string;
  kj_name: string;
  booking_type: string;
  client_name: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  status: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Pending" },
  confirmed: { bg: "bg-green-500/10", text: "text-green-400", label: "Confirmed" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Completed" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", label: "Cancelled" },
  declined: { bg: "bg-red-500/10", text: "text-red-400", label: "Declined" },
};

const BOOKING_TYPES = [
  { value: "private", label: "Private Party" },
  { value: "corporate", label: "Corporate Event" },
  { value: "party", label: "Birthday Party" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" },
];

export function BookingsList({
  bookings: initialBookings,
  connectedKJs = [],
  venueId = "",
  venueName = "",
  ownerKJRequests: initialRequests = [],
}: {
  bookings: Booking[];
  connectedKJs?: ConnectedKJ[];
  venueId?: string;
  venueName?: string;
  ownerKJRequests?: OwnerKJRequest[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [kjRequests, setKjRequests] = useState(initialRequests);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showKJBookingForm, setShowKJBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const otherBookings = bookings.filter((b) => b.status !== "pending");

  function onAction(bookingId: string, status: "confirmed" | "cancelled") {
    setProcessingId(bookingId);
    startTransition(async () => {
      await handleBooking(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
      setProcessingId(null);
    });
  }

  function handleKJBookingSubmit(formData: FormData) {
    setBookingError(null);
    startTransition(async () => {
      const result = await requestKJBooking(formData);
      if (result?.error) {
        setBookingError(result.error);
      } else {
        setBookingSuccess(true);
        setShowKJBookingForm(false);
        // Add optimistic entry
        const kjId = formData.get("kj_user_id") as string;
        const kj = connectedKJs.find((k) => k.user_id === kjId);
        setKjRequests((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            kj_user_id: kjId,
            kj_name: kj?.display_name || "KJ",
            booking_type: (formData.get("booking_type") as string) || "private",
            client_name: formData.get("client_name") as string,
            event_date: formData.get("event_date") as string,
            start_time: formData.get("start_time") as string,
            end_time: (formData.get("end_time") as string) || null,
            location: (formData.get("location") as string) || null,
            notes: (formData.get("notes") as string) || null,
            status: "pending",
          },
        ]);
      }
    });
  }

  function handleCancelRequest(requestId: string) {
    if (!confirm("Cancel this KJ booking request?")) return;
    startTransition(async () => {
      await cancelBookingRequest(requestId);
      setKjRequests((prev) => prev.filter((r) => r.id !== requestId));
    });
  }

  const inputClass =
    "w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50";
  const selectClass =
    "w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer";
  const labelClass = "block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider";

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Bookings</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage room booking requests and hire KJs for your venue.
      </p>

      {/* Book a KJ Section */}
      {connectedKJs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-accent">headphones</span>
              <h2 className="font-bold text-white">Book a KJ</h2>
            </div>
            {!showKJBookingForm && (
              <button
                onClick={() => { setShowKJBookingForm(true); setBookingSuccess(false); setBookingError(null); }}
                className="bg-accent text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 hover:shadow-lg hover:shadow-accent/30 transition-all"
              >
                <span className="material-icons-round text-lg">add</span>
                Book KJ
              </button>
            )}
          </div>

          {bookingSuccess && !showKJBookingForm && (
            <div className="glass-card rounded-xl p-4 mb-4 border border-green-500/20 flex items-center gap-3">
              <span className="material-icons-round text-green-400">check_circle</span>
              <p className="text-sm text-green-400 font-semibold">Booking request sent! The KJ will review it.</p>
            </div>
          )}

          {/* KJ Booking Form */}
          {showKJBookingForm && (
            <div className="glass-card rounded-2xl p-6 mb-4 border border-accent/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Book a KJ for {venueName}</h3>
                <button onClick={() => setShowKJBookingForm(false)} className="text-text-muted hover:text-white transition-colors">
                  <span className="material-icons-round">close</span>
                </button>
              </div>
              {bookingError && (
                <div className="bg-red-500/10 text-red-400 text-sm px-4 py-2 rounded-xl mb-4">
                  {bookingError}
                </div>
              )}
              <form
                action={(formData: FormData) => {
                  formData.set("request_source", "owner_request");
                  formData.set("venue_id", venueId);
                  formData.set("location", venueName);
                  handleKJBookingSubmit(formData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Select KJ *</label>
                    <select name="kj_user_id" required className={selectClass}>
                      <option value="">Choose a KJ...</option>
                      {connectedKJs.map((kj) => (
                        <option key={kj.user_id} value={kj.user_id}>{kj.display_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Event Name *</label>
                    <input name="client_name" required placeholder="e.g. Friday Karaoke Night" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Event Type</label>
                    <select name="booking_type" defaultValue="private" className={selectClass}>
                      {BOOKING_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Date *</label>
                    <input name="event_date" type="date" required className={`${inputClass} [color-scheme:dark]`} />
                  </div>
                  <div>
                    <label className={labelClass}>Start Time *</label>
                    <input name="start_time" type="text" required placeholder="7:00 PM" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>End Time</label>
                    <input name="end_time" type="text" placeholder="11:00 PM" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea name="notes" placeholder="Special requirements, equipment needed, etc." rows={2} className={`${inputClass} resize-none`} />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Owner's KJ booking requests list */}
          {kjRequests.length > 0 && (
            <div className="space-y-2">
              {kjRequests.map((req) => {
                const statusInfo = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                return (
                  <div key={req.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-semibold text-sm">{req.kj_name}</p>
                        <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {BOOKING_TYPES.find((t) => t.value === req.booking_type)?.label || "Private"}
                        </span>
                        <span className={`${statusInfo.bg} ${statusInfo.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-text-muted text-xs">
                        {req.client_name} | {req.event_date} | {req.start_time}{req.end_time ? ` — ${req.end_time}` : ""}
                      </p>
                    </div>
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        disabled={isPending}
                        className="bg-white/5 text-text-muted font-bold text-xs px-3 py-1.5 rounded-lg hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Room Bookings - Pending */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
            Pending Approval ({pendingBookings.length})
          </p>
          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="glass-card rounded-2xl p-5 border-accent/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold">
                      {booking.profiles?.display_name || "Guest"}
                    </p>
                    <p className="text-text-secondary text-sm mt-1">
                      {booking.date} | {booking.start_time} — {booking.end_time}
                    </p>
                    <p className="text-text-muted text-xs mt-1">
                      Party size: {booking.party_size}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAction(booking.id, "confirmed")}
                      disabled={isPending && processingId === booking.id}
                      className="bg-primary text-black font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isPending && processingId === booking.id
                        ? "..."
                        : "Confirm"}
                    </button>
                    <button
                      onClick={() => onAction(booking.id, "cancelled")}
                      disabled={isPending && processingId === booking.id}
                      className="bg-white/5 text-text-muted font-bold text-xs px-4 py-2 rounded-lg hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Bookings - Other */}
      {otherBookings.length > 0 ? (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            All Room Bookings
          </p>
          <div className="space-y-2">
            {otherBookings.map((booking) => (
              <div
                key={booking.id}
                className="glass-card rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold text-sm">
                    {booking.profiles?.display_name || "Guest"}
                  </p>
                  <p className="text-text-muted text-xs">
                    {booking.date} | {booking.start_time} — {booking.end_time} |
                    Party of {booking.party_size}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    booking.status === "confirmed"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : pendingBookings.length === 0 && connectedKJs.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">
            book_online
          </span>
          <p className="text-white font-semibold mb-1">No Bookings</p>
          <p className="text-text-secondary text-sm">
            Room booking requests will appear here.
          </p>
        </div>
      ) : null}
    </div>
  );
}
