"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cancelBookingRequest } from "./booking-actions";

interface SingerBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  venues: any;
}

interface KJRequest {
  id: string;
  kj_user_id: string;
  kj_name: string;
  client_name: string;
  booking_type: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  status: string;
  request_source: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Pending" },
  confirmed: { bg: "bg-green-500/10", text: "text-green-400", label: "Confirmed" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Completed" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", label: "Cancelled" },
  declined: { bg: "bg-red-500/10", text: "text-red-400", label: "Declined" },
};

const BOOKING_TYPE_LABELS: Record<string, string> = {
  private: "Private Party",
  corporate: "Corporate Event",
  party: "Birthday Party",
  wedding: "Wedding",
  other: "Other",
};

export function SingerBookingsList({
  bookings,
  kjRequests = [],
}: {
  bookings: SingerBooking[];
  kjRequests?: KJRequest[];
}) {
  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const past = bookings.filter((b) => b.status !== "pending" && b.status !== "confirmed");

  const [requests, setRequests] = useState(kjRequests);
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function handleCancel(requestId: string) {
    if (!confirm("Cancel this booking request?")) return;
    setCancellingId(requestId);
    startTransition(async () => {
      await cancelBookingRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setCancellingId(null);
    });
  }

  const activeRequests = requests.filter((r) => r.status === "pending" || r.status === "confirmed");
  const pastRequests = requests.filter((r) => r.status !== "pending" && r.status !== "confirmed");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">My Bookings</h1>
      <p className="text-text-secondary text-sm mb-8">
        Your private room reservations and KJ booking requests.
      </p>

      {/* KJ Booking Requests */}
      {requests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-round text-accent">headphones</span>
            <h2 className="font-bold text-white">KJ Booking Requests</h2>
          </div>

          {activeRequests.length > 0 && (
            <div className="space-y-3 mb-4">
              {activeRequests.map((req) => {
                const statusInfo = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                return (
                  <div key={req.id} className="glass-card rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{req.kj_name}</p>
                          <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {BOOKING_TYPE_LABELS[req.booking_type] || "Private"}
                          </span>
                          <span className={`${statusInfo.bg} ${statusInfo.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-text-secondary text-sm">
                          {new Date(req.event_date + "T12:00:00").toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {req.start_time}
                          {req.end_time ? ` — ${req.end_time}` : ""}
                        </p>
                        {req.location && (
                          <p className="text-text-muted text-xs mt-1">{req.location}</p>
                        )}
                      </div>
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          disabled={isPending && cancellingId === req.id}
                          className="bg-white/5 text-text-muted font-bold text-xs px-4 py-2 rounded-lg hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isPending && cancellingId === req.id ? "..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pastRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Past Requests
              </p>
              {pastRequests.map((req) => {
                const statusInfo = STATUS_COLORS[req.status] || STATUS_COLORS.cancelled;
                return (
                  <div key={req.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{req.kj_name}</p>
                      <p className="text-text-muted text-xs">
                        {req.event_date} | {req.start_time}{req.end_time ? ` — ${req.end_time}` : ""}
                        {req.location ? ` | ${req.location}` : ""}
                      </p>
                    </div>
                    <span className={`${statusInfo.bg} ${statusInfo.text} text-xs font-bold px-2 py-0.5 rounded-full`}>
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Room Bookings - Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
            Upcoming Room Bookings ({upcoming.length})
          </p>
          <div className="space-y-3">
            {upcoming.map((booking) => {
              const venueName = booking.venues?.name || "Private Room";
              return (
                <div key={booking.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold">{venueName}</p>
                      <p className="text-text-secondary text-sm mt-1">
                        {new Date(booking.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {booking.start_time}
                        {booking.end_time ? ` — ${booking.end_time}` : ""}
                      </p>
                      <p className="text-text-muted text-xs mt-1">
                        Party size: {booking.party_size}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        booking.status === "confirmed"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Bookings - Past */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            Past Bookings
          </p>
          <div className="space-y-2">
            {past.map((booking) => {
              const venueName = booking.venues?.name || "Private Room";
              return (
                <div key={booking.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{venueName}</p>
                    <p className="text-text-muted text-xs">
                      {booking.date} | {booking.start_time} — {booking.end_time} | Party of {booking.party_size}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      booking.status === "completed"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {bookings.length === 0 && requests.length === 0 && (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">book_online</span>
          <p className="text-white font-semibold mb-1">No Bookings Yet</p>
          <p className="text-text-secondary text-sm mb-5">
            Book a private karaoke room or hire a KJ for your event!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            <span className="material-icons-round text-lg">explore</span>
            Explore Venues
          </Link>
        </div>
      )}
    </div>
  );
}
