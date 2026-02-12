import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import Link from "next/link";
import { VenueSelector } from "./VenueSelector";

export default async function DashboardOverview() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { venue, isOwner, allVenues } = await getDashboardVenue(user.id);

  // KJ with no venue selected and multiple venues — show venue picker
  if (!isOwner && allVenues.length > 1 && !venue) {
    return <KJVenueList venues={allVenues} />;
  }

  if (!venue) {
    return (
      <div className="text-center py-20">
        <span className="material-icons-round text-6xl text-text-muted mb-4">storefront</span>
        <h1 className="text-2xl font-bold text-white mb-2">No Venue Linked</h1>
        <p className="text-text-secondary mb-6">
          {isOwner
            ? "Your account needs to be linked to a venue to use the dashboard."
            : "You haven't been connected to any venues yet. Ask a bar owner to invite you."}
        </p>
        <Link href="/" className="text-primary font-semibold hover:underline">
          Go to Homepage
        </Link>
      </div>
    );
  }

  // Get stats
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

  if (isOwner) {
    // Owner dashboard
    const { count: eventCount } = await supabase
      .from("venue_events")
      .select("*", { count: "exact", head: true })
      .eq("venue_id", venue.id);

    const { count: reviewCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("venue_id", venue.id);

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

        {/* Preview Listing */}
        <a
          href={`/venue/${venue.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between glass-card rounded-2xl p-5 mb-8 border-primary/20 hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-primary text-2xl">visibility</span>
            </div>
            <div>
              <p className="font-bold text-white">Preview Your Listing</p>
              <p className="text-xs text-text-muted">See how customers see your venue page</p>
            </div>
          </div>
          <span className="material-icons-round text-primary group-hover:translate-x-1 transition-transform">open_in_new</span>
        </a>

        {/* Quick Actions */}
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: "edit", label: "Edit Listing", desc: "Update your venue info", href: "/dashboard/listing" },
            { icon: "add_photo_alternate", label: "Upload Media", desc: "Add photos or videos", href: "/dashboard/media" },
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

  // KJ dashboard — show active venue info with venue switcher
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">KJ Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">
        You&apos;re managing {venue.name}. Here&apos;s what&apos;s happening.
      </p>

      {/* Venue switcher for KJs with multiple venues */}
      {allVenues.length > 1 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Your Venues</p>
          <VenueSelector venues={allVenues} activeVenueId={venue.id} />
        </div>
      )}

      {/* KJ Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/queue" className="glass-card rounded-2xl p-5 hover:border-accent/30 transition-all">
          <span className="material-icons-round text-3xl text-accent mb-2">queue_music</span>
          <p className="text-2xl font-extrabold text-white">{queueCount ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">In Queue</p>
        </Link>
        <Link href="/dashboard/bookings" className="glass-card rounded-2xl p-5 hover:border-blue-400/30 transition-all">
          <span className="material-icons-round text-3xl text-blue-400 mb-2">book_online</span>
          <p className="text-2xl font-extrabold text-white">{bookingCount ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">Pending Bookings</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { icon: "queue_music", label: "Manage Queue", desc: "View and manage the song lineup", href: "/dashboard/queue" },
          { icon: "tv", label: "Open TV Display", desc: "Show queue on bar screens", href: `/venue/${venue.id}/tv`, external: true },
          { icon: "local_offer", label: "Bar Specials", desc: "View active promotions", href: "/dashboard/promos" },
          { icon: "book_online", label: "View Bookings", desc: "Check room reservations", href: "/dashboard/bookings" },
        ].map((action) => (
          action.external ? (
            <a
              key={action.href}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-accent/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-accent text-2xl">{action.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{action.label}</p>
                <p className="text-xs text-text-muted">{action.desc}</p>
              </div>
              <span className="material-icons-round text-text-muted ml-auto">open_in_new</span>
            </a>
          ) : (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-accent/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-accent text-2xl">{action.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{action.label}</p>
                <p className="text-xs text-text-muted">{action.desc}</p>
              </div>
              <span className="material-icons-round text-text-muted ml-auto">chevron_right</span>
            </Link>
          )
        ))}
      </div>
    </div>
  );
}

function KJVenueList({ venues }: { venues: { id: string; name: string }[] }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Your Venues</h1>
      <p className="text-text-secondary text-sm mb-8">
        Select a venue to start managing. You&apos;ll see the queue, bookings, and specials for that bar.
      </p>
      <VenueSelector venues={venues} activeVenueId="" />
    </div>
  );
}
