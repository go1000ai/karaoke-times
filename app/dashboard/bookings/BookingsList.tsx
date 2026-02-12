"use client";

import { useState, useTransition } from "react";
import { handleBooking } from "../actions";

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

export function BookingsList({ bookings: initialBookings }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Bookings</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage private room booking requests.
      </p>

      {/* Pending */}
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

      {/* Other Bookings */}
      {otherBookings.length > 0 ? (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            All Bookings
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
      ) : pendingBookings.length === 0 ? (
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
