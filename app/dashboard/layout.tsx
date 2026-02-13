import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { DashboardNav, MobileDrawer } from "./DashboardNav";

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
  { href: "/dashboard/my-profile", icon: "person", label: "My Profile" },
];

const kjLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/connections", icon: "hub", label: "Connections" },
  { href: "/dashboard/queue", icon: "queue_music", label: "Song Queue" },
  { href: "/dashboard/promos", icon: "local_offer", label: "Bar Specials" },
  { href: "/dashboard/bookings", icon: "book_online", label: "Bookings" },
  { href: "/dashboard/my-profile", icon: "person", label: "My Profile" },
];

const singerLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/request-song", icon: "queue_music", label: "Request a Song" },
  { href: "/dashboard/my-queue", icon: "format_list_numbered", label: "My Queue" },
  { href: "/dashboard/my-songs", icon: "music_note", label: "My Favorite Songs" },
  { href: "/dashboard/favorites", icon: "favorite", label: "My Favorite Venues" },
  { href: "/dashboard/bookings", icon: "book_online", label: "My Bookings" },
  { href: "/dashboard/reminders", icon: "notifications", label: "Reminders" },
  { href: "/dashboard/my-profile", icon: "person", label: "My Profile" },
];

type UserRole = "venue_owner" | "kj" | "user" | "admin";

async function getUserRole(userId: string, supabase: any): Promise<UserRole> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "venue_owner") return "venue_owner";
  if (profile?.role === "admin") return "admin";

  // Check if user is a connected KJ
  const { data: staffRecord } = await supabase
    .from("venue_staff")
    .select("id")
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (staffRecord) return "kj";

  return "user";
}

function getLinksForRole(role: UserRole) {
  switch (role) {
    case "venue_owner":
    case "admin":
      return ownerLinks;
    case "kj":
      return kjLinks;
    default:
      return singerLinks;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  const role = await getUserRole(user.id, supabase);
  const isVenueRole = role === "venue_owner" || role === "kj" || role === "admin";

  // Only fetch venue data for venue-related roles
  let venue = null;
  let isOwner = false;
  let allVenues: { id: string; name: string }[] = [];

  if (isVenueRole) {
    const venueData = await getDashboardVenue(user.id);
    venue = venueData.venue;
    isOwner = venueData.isOwner;
    allVenues = venueData.allVenues;
  }

  const sidebarLinks = getLinksForRole(role);

  // Sidebar header info
  let headerLabel: string;
  let headerValue: string;

  if (isVenueRole) {
    headerLabel = isOwner ? "Your Venue" : allVenues.length > 1 ? "Active Venue" : "Connected Venue";
    headerValue = venue?.name || "No venue linked";
  } else {
    headerLabel = "Singer";
    headerValue = profile?.display_name || user.email?.split("@")[0] || "My Account";
  }

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card-dark border-r border-border hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Karaoke Times" className="w-10 h-10 object-contain" />
            <span className="text-sm font-bold text-white">Karaoke Times</span>
          </Link>
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-text-muted uppercase tracking-wider">
              {headerLabel}
            </p>
            <p className="text-sm font-bold text-white truncate">
              {headerValue}
            </p>
            {!isOwner && allVenues.length > 1 && (
              <p className="text-[10px] text-accent mt-1">{allVenues.length} venues connected</p>
            )}
          </div>
        </div>

        <DashboardNav links={sidebarLinks} />

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

      {/* Mobile Drawer */}
      <MobileDrawer
        links={sidebarLinks}
        venueName={headerValue}
        venueLabel={headerLabel}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 md:p-8 p-4 pt-20 md:pt-8 overflow-y-auto min-h-screen">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
