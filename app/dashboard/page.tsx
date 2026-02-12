import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardOverview() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  // Get venue data
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!venue) {
    return (
      <div className="text-center py-20">
        <span className="material-icons-round text-6xl text-text-muted mb-4">storefront</span>
        <h1 className="text-2xl font-bold text-white mb-2">No Venue Linked</h1>
        <p className="text-text-secondary mb-6">Your account needs to be linked to a venue to use the dashboard.</p>
        <Link href="/" className="text-primary font-semibold hover:underline">
          Go to Homepage
        </Link>
      </div>
    );
  }

  // Get stats
  const { count: eventCount } = await supabase
    .from("venue_events")
    .select("*", { count: "exact", head: true })
    .eq("venue_id", venue.id);

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("venue_id", venue.id);

  const { count: queueCount } = await supabase
    .from("song_queue")
    .select("*", { count: "exact", head: true })
    .eq("venue_id", venue.id)
    .in("status", ["waiting", "up_next", "now_singing"]);

  const { count: bookingCount } = await supabase
    .from("room_bookings")
    .select("*", { count: "exact", head: true })
    .eq("venue_id", venue.id)
    .eq("status", "pending");

  const stats = [
    { label: "Karaoke Nights", value: eventCount ?? 0, icon: "event", href: "/dashboard/events", color: "text-primary" },
    { label: "Reviews", value: reviewCount ?? 0, icon: "star", href: "/dashboard/listing", color: "text-yellow-400" },
    { label: "In Queue", value: queueCount ?? 0, icon: "queue_music", href: "/dashboard/queue", color: "text-accent" },
    { label: "Pending Bookings", value: bookingCount ?? 0, icon: "book_online", href: "/dashboard/bookings", color: "text-blue-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">Welcome back! Here&apos;s what&apos;s happening at {venue.name}.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all"
          >
            <span className={`material-icons-round text-3xl ${stat.color} mb-2`}>{stat.icon}</span>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { icon: "edit", label: "Edit Listing", desc: "Update your venue info", href: "/dashboard/listing" },
          { icon: "add_photo_alternate", label: "Upload Photos", desc: "Add images or videos", href: "/dashboard/media" },
          { icon: "campaign", label: "Create Promo", desc: "Run a promotion", href: "/dashboard/promos" },
          { icon: "queue_music", label: "Manage Queue", desc: "Live song queue management", href: "/dashboard/queue" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-primary/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-primary text-2xl">{action.icon}</span>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{action.label}</p>
              <p className="text-xs text-text-muted">{action.desc}</p>
            </div>
            <span className="material-icons-round text-text-muted ml-auto">chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
