"use client";

import Link from "next/link";

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

export function SingerBookingsList({ bookings }: { bookings: SingerBooking[] }) {
  const upcoming = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const past = bookings.filter((b) => b.status !== "pending" && b.status !== "confirmed");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">My Bookings</h1>
      <p className="text-text-secondary text-sm mb-8">
        Your private room reservations.
      </p>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
            Upcoming ({upcoming.length})
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

      {/* Past */}
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

      {bookings.length === 0 && (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">book_online</span>
          <p className="text-white font-semibold mb-1">No Bookings Yet</p>
          <p className="text-text-secondary text-sm mb-5">
            Book a private karaoke room at any venue that offers them!
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
