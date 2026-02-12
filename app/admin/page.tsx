import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();

  // Fetch counts
  const [
    { count: userCount },
    { count: venueCount },
    { count: eventCount },
    { count: reviewCount },
    { count: bookingCount },
    { count: reminderCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("venues").select("*", { count: "exact", head: true }),
    supabase.from("venue_events").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("room_bookings").select("*", { count: "exact", head: true }),
    supabase.from("event_reminders").select("*", { count: "exact", head: true }),
  ]);

  // Recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Total Users", value: userCount ?? 0, icon: "people", color: "primary" },
    { label: "Venues", value: venueCount ?? 0, icon: "storefront", color: "accent" },
    { label: "Events", value: eventCount ?? 0, icon: "event", color: "purple-400" },
    { label: "Reviews", value: reviewCount ?? 0, icon: "rate_review", color: "orange-400" },
    { label: "Bookings", value: bookingCount ?? 0, icon: "book_online", color: "blue-400" },
    { label: "Reminders", value: reminderCount ?? 0, icon: "notifications", color: "green-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Admin Dashboard</h1>
      <p className="text-text-secondary text-sm mb-8">Platform overview and management.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                <span className={`material-icons-round text-${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">Recent Users</h2>
        {recentUsers && recentUsers.length > 0 ? (
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons-round text-primary text-sm">person</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-semibold">{u.display_name || "Unnamed"}</p>
                    <p className="text-xs text-text-muted">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  u.role === "admin"
                    ? "bg-red-500/10 text-red-400"
                    : u.role === "venue_owner"
                    ? "bg-primary/10 text-primary"
                    : "bg-white/5 text-text-muted"
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">No users yet.</p>
        )}
      </div>
    </div>
  );
}
