import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminOverview() {
  const supabase = await createClient();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all counts in parallel
  const [
    { count: userCount },
    { count: venueCount },
    { count: pendingBookings },
    { count: liveQueues },
    { count: newUsersWeek },
    { count: newReviewsWeek },
    { count: newBookingsWeek },
    { data: recentUsers },
    { data: recentReviews },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("venues").select("*", { count: "exact", head: true }),
    supabase
      .from("room_bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("song_queue")
      .select("*", { count: "exact", head: true })
      .in("status", ["waiting", "up_next", "now_singing"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo),
    supabase
      .from("room_bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo),
    supabase
      .from("profiles")
      .select("id, display_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("reviews")
      .select("id, rating, text, created_at, venues(name), profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const keyMetrics = [
    { label: "Total Users", value: userCount ?? 0, icon: "people", color: "text-primary", bg: "bg-primary/10", href: "/admin/users" },
    { label: "Active Venues", value: venueCount ?? 0, icon: "storefront", color: "text-accent", bg: "bg-accent/10", href: "/admin/venues" },
    { label: "Live Queues", value: liveQueues ?? 0, icon: "queue_music", color: "text-purple-400", bg: "bg-purple-400/10", href: "/admin/queue" },
    { label: "Pending Bookings", value: pendingBookings ?? 0, icon: "book_online", color: "text-blue-400", bg: "bg-blue-400/10", href: "/admin/bookings" },
  ];

  const growthMetrics = [
    { label: "New Users", value: newUsersWeek ?? 0, icon: "person_add", color: "text-green-400", bg: "bg-green-400/10", sub: "this week", href: "/admin/users" },
    { label: "New Reviews", value: newReviewsWeek ?? 0, icon: "rate_review", color: "text-orange-400", bg: "bg-orange-400/10", sub: "this week", href: "/admin/reviews" },
    { label: "New Bookings", value: newBookingsWeek ?? 0, icon: "event_available", color: "text-cyan-400", bg: "bg-cyan-400/10", sub: "this week", href: "/admin/bookings" },
  ];

  const quickActions = [
    { label: "Manage Singers", icon: "mic", href: "/admin/singers", color: "text-primary", bg: "bg-primary/10" },
    { label: "Manage Venues", icon: "storefront", href: "/admin/venues", color: "text-accent", bg: "bg-accent/10" },
    { label: "Support Tickets", icon: "support_agent", href: "/admin/support", color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Sync Sheet", icon: "sync", href: "/admin/sync", color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400",
    venue_owner: "bg-primary/10 text-primary",
    user: "bg-white/5 text-text-muted",
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Admin Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">Platform overview and management.</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {keyMetrics.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <span className={`material-icons-round ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {growthMetrics.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors group">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-icons-round ${stat.color} text-xl`}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label} <span className="text-text-muted/50">{stat.sub}</span></p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Signups + Recent Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Recent Signups */}
        <div className="glass-card rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Signups</h2>
            <Link href="/admin/users" className="text-xs text-primary hover:text-primary/80 transition-colors">
              View all
            </Link>
          </div>
          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-2.5">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-text-muted text-sm">person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{u.display_name || "Unnamed"}</p>
                      <p className="text-[11px] text-text-muted">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[u.role] || roleColors.user}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No users yet.</p>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="glass-card rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Reviews</h2>
            <Link href="/admin/reviews" className="text-xs text-primary hover:text-primary/80 transition-colors">
              View all
            </Link>
          </div>
          {recentReviews && recentReviews.length > 0 ? (
            <div className="space-y-3">
              {recentReviews.map((r: any) => (
                <div key={r.id} className="py-2 border-b border-border/20 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-white font-semibold truncate">
                      {(r.venues as any)?.name || "Unknown Venue"}
                    </p>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`material-icons-round text-xs ${
                            i < r.rating ? "text-yellow-400" : "text-white/10"
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2">{r.text || "No comment"}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-text-muted/60">
                      by {(r.profiles as any)?.display_name || "Anonymous"}
                    </p>
                    {r.rating <= 2 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                        Low Rating
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm">No reviews yet.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-card rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-3`}>
              <span className={`material-icons-round ${action.color}`}>{action.icon}</span>
            </div>
            <p className="text-sm font-bold text-white group-hover:text-white/90">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
