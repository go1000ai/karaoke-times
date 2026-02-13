"use client";

import { useState, useTransition } from "react";
import { updateBookingStatus } from "../actions";

interface Booking {
  id: string;
  venue_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  party_size: number | null;
  status: string;
  created_at: string;
  venues: { name: string } | null;
  profiles: { display_name: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  confirmed: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
};

export function BookingsList({ bookings: initial, venues }: { bookings: Booking[]; venues: { id: string; name: string }[] }) {
  const [bookings, setBookings] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");

  const filtered = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (venueFilter && b.venue_id !== venueFilter) return false;
    return true;
  });

  function handleStatusChange(bookingId: string, newStatus: string) {
    setProcessingId(bookingId);
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, newStatus);
      if (result.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Bookings</h1>
          <p className="text-text-secondary text-sm">{bookings.length} total bookings</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer flex-1">
          <option value="">All Venues</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((booking) => (
          <div key={booking.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold truncate">{booking.profiles?.display_name || "Unknown User"}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[booking.status] || "bg-white/5 text-text-muted"}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-text-muted truncate">{booking.venues?.name || "Unknown Venue"}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="material-icons-round text-sm">calendar_today</span>
                    {new Date(booking.date).toLocaleDateString()}
                  </span>
                  {booking.start_time && (
                    <span className="flex items-center gap-1">
                      <span className="material-icons-round text-sm">schedule</span>
                      {booking.start_time}{booking.end_time && `–${booking.end_time}`}
                    </span>
                  )}
                  {booking.party_size && (
                    <span className="flex items-center gap-1">
                      <span className="material-icons-round text-sm">group</span>
                      {booking.party_size} guests
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {booking.status === "pending" && (
                  <>
                    <button onClick={() => handleStatusChange(booking.id, "confirmed")} disabled={isPending && processingId === booking.id} className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50">Confirm</button>
                    <button onClick={() => handleStatusChange(booking.id, "cancelled")} disabled={isPending && processingId === booking.id} className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">Cancel</button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <button onClick={() => handleStatusChange(booking.id, "cancelled")} disabled={isPending && processingId === booking.id} className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">Cancel</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
}
