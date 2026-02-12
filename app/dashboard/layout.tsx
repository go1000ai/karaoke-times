import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

const ownerLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/listing", icon: "storefront", label: "My Listing" },
  { href: "/dashboard/events", icon: "event", label: "Events" },
  { href: "/dashboard/media", icon: "photo_library", label: "Media" },
  { href: "/dashboard/promos", icon: "local_offer", label: "Promos" },
  { href: "/dashboard/queue", icon: "queue_music", label: "Song Queue" },
  { href: "/dashboard/bookings", icon: "book_online", label: "Bookings" },
  { href: "/dashboard/staff", icon: "group", label: "Staff & KJs" },
  { href: "/dashboard/integrations", icon: "point_of_sale", label: "POS Integration" },
  { href: "/profile", icon: "person", label: "My Profile" },
];

const kjLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/connections", icon: "hub", label: "Connections" },
  { href: "/dashboard/queue", icon: "queue_music", label: "Song Queue" },
  { href: "/dashboard/promos", icon: "local_offer", label: "Bar Specials" },
  { href: "/dashboard/bookings", icon: "book_online", label: "Bookings" },
  { href: "/profile", icon: "person", label: "My Profile" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  const { venue, isOwner, allVenues } = await getDashboardVenue(user.id);
  const sidebarLinks = isOwner ? ownerLinks : kjLinks;

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card-dark border-r border-border hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Karaoke Times" className="w-10 h-10 object-contain" />
            <span className="text-sm font-bold text-white">Karaoke Times</span>
          </Link>
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-text-muted uppercase tracking-wider">
              {isOwner ? "Your Venue" : allVenues.length > 1 ? "Active Venue" : "Connected Venue"}
            </p>
            <p className="text-sm font-bold text-white truncate">
              {venue?.name || "No venue linked"}
            </p>
            {!isOwner && allVenues.length > 1 && (
              <p className="text-[10px] text-accent mt-1">{allVenues.length} venues connected</p>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="material-icons-round text-xl">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-accent text-lg">person</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.display_name || user.email?.split("@")[0]}
              </p>
              <p className="text-[11px] text-text-muted truncate">{user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-bg-dark/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="text-text-muted">
            <span className="material-icons-round">arrow_back</span>
          </Link>
          <p className="text-sm font-bold text-white">{venue?.name || "Dashboard"}</p>
          <div className="w-6" />
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-hide">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-text-secondary hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <span className="material-icons-round text-sm">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:p-8 p-4 pt-28 md:pt-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
