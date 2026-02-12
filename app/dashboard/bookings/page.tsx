import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";

export default async function BookingsPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { venue } = await getDashboardVenue(user.id);

  const { data: bookings } = await supabase
    .from("room_bookings")
    .select("*, profiles(display_name)")
    .eq("venue_id", venue?.id || "")
    .order("date", { ascending: true });

  const pendingBookings = (bookings ?? []).filter((b: Record<string, string>) => b.status === "pending");
  const otherBookings = (bookings ?? []).filter((b: Record<string, string>) => b.status !== "pending");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Bookings</h1>
      <p className="text-text-secondary text-sm mb-8">Manage private room booking requests.</p>

      {/* Pending */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
            Pending Approval ({pendingBookings.length})
          </p>
          <div className="space-y-3">
            {pendingBookings.map((booking: Record<string, string | number | null | Record<string, string | null>>) => (
              <div key={booking.id as string} className="glass-card rounded-2xl p-5 border-accent/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold">
                      {(booking.profiles as Record<string, string | null>)?.display_name || "Guest"}
                    </p>
                    <p className="text-text-secondary text-sm mt-1">
                      {booking.date as string} | {booking.start_time as string} — {booking.end_time as string}
                    </p>
                    <p className="text-text-muted text-xs mt-1">
                      Party size: {booking.party_size as number}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-primary text-black font-bold text-xs px-4 py-2 rounded-lg">
                      Confirm
                    </button>
                    <button className="bg-white/5 text-text-muted font-bold text-xs px-4 py-2 rounded-lg">
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
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">All Bookings</p>
          <div className="space-y-2">
            {otherBookings.map((booking: Record<string, string | number | null | Record<string, string | null>>) => (
              <div key={booking.id as string} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">
                    {(booking.profiles as Record<string, string | null>)?.display_name || "Guest"}
                  </p>
                  <p className="text-text-muted text-xs">
                    {booking.date as string} | {booking.start_time as string} — {booking.end_time as string} | Party of {booking.party_size as number}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  booking.status === "confirmed"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {(booking.status as string).charAt(0).toUpperCase() + (booking.status as string).slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : pendingBookings.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">book_online</span>
          <p className="text-white font-semibold mb-1">No Bookings</p>
          <p className="text-text-secondary text-sm">Room booking requests will appear here.</p>
        </div>
      ) : null}
    </div>
  );
}
