import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { DashboardNav, MobileDrawer } from "./DashboardNav";
import VenueSwitcher from "@/components/VenueSwitcher";

// ─── Owner: Listing + Staff + POS ───
const ownerLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/listing", icon: "storefront", label: "Venue Listing" },
  { href: "/dashboard/staff", icon: "group", label: "Staff & KJs" },
  { href: "/dashboard/integrations", icon: "point_of_sale", label: "POS Integration" },
  { href: "/dashboard/my-profile", icon: "person", label: "My Profile" },
];

// ─── KJ: Events + everything operational ───
const kjLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/events", icon: "event", label: "My Events" },
  { href: "/dashboard/media", icon: "photo_library", label: "Media" },
  { href: "/dashboard/flyers", icon: "auto_awesome", label: "Flyer Generator" },
  { href: "/dashboard/queue", icon: "queue_music", label: "Song Queue" },
  { href: "/dashboard/vdj", icon: "album", label: "VirtualDJ" },
  { href: "/dashboard/tv-display", icon: "tv", label: "TV Display" },
  { href: "/dashboard/bookings", icon: "book_online", label: "Bookings" },
  { href: "/dashboard/featured-singers", icon: "star", label: "Featured Singers" },
  { href: "/dashboard/connections", icon: "hub", label: "Connections" },
  { href: "/dashboard/my-profile", icon: "person", label: "My Profile" },
];

// ─── Admin: Everything + sponsor ads management ───
const adminLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/listing", icon: "storefront", label: "Venue Listing" },
  { href: "/dashboard/staff", icon: "group", label: "Staff & KJs" },
  { href: "/dashboard/ads", icon: "campaign", label: "Sponsor Ads" },
  { href: "/dashboard/advertiser", icon: "business", label: "Advertisers" },
  { href: "/dashboard/integrations", icon: "point_of_sale", label: "POS Integration" },
  { href: "/dashboard/my-profile", icon: "person", label: "My Profile" },
];

// ─── Advertiser: Company profile + campaigns ───
const advertiserLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/advertiser/profile", icon: "business", label: "Company Profile" },
  { href: "/dashboard/advertiser/campaigns", icon: "campaign", label: "Campaigns" },
  { href: "/dashboard/advertiser/kjs", icon: "headphones", label: "Browse KJs" },
  { href: "/dashboard/my-profile", icon: "person", label: "My Account" },
];

// ─── Singer: Unchanged ───
const singerLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/request-song", icon: "queue_music", label: "Request a Song" },
  { href: "/dashboard/my-queue", icon: "format_list_numbered", label: "My Queue" },
  { href: "/dashboard/my-songs", icon: "music_note", label: "My Favorite Songs" },
  { href: "/dashboard/my-highlights", icon: "stars", label: "My Highlights" },
  { href: "/dashboard/favorites", icon: "favorite", label: "My Favorite Venues" },
  { href: "/dashboard/bookings", icon: "book_online", label: "My Bookings" },
  { href: "/dashboard/reminders", icon: "notifications", label: "Reminders" },
  { href: "/dashboard/my-profile", icon: "person", label: "My Profile" },
];

type UserRole = "venue_owner" | "kj" | "advertiser" | "user" | "admin";

async function getUserRole(userId: string, supabase: any): Promise<UserRole> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") return "admin";
  if (profile?.role === "venue_owner") return "venue_owner";
  if (profile?.role === "advertiser") return "advertiser";

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
      return ownerLinks;
    case "admin":
      return adminLinks;
    case "kj":
      return kjLinks;
    case "advertiser":
      return advertiserLinks;
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
    if (role === "kj") {
      headerLabel = allVenues.length > 1 ? "Active Venue" : "Connected Venue";
    } else {
      headerLabel = "Your Venue";
    }
    headerValue = venue?.name || "No venue linked";
  } else if (role === "advertiser") {
    headerLabel = "Advertiser";
    headerValue = profile?.display_name || user.email?.split("@")[0] || "My Account";
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
          {isVenueRole && allVenues.length > 0 ? (
            <VenueSwitcher
              venues={allVenues}
              activeVenueId={venue?.id || null}
              label={headerLabel}
            />
          ) : (
            <div className="glass-card rounded-xl p-3">
              <p className="text-xs text-text-muted uppercase tracking-wider">
                {headerLabel}
              </p>
              <p className="text-sm font-bold text-white truncate">
                {headerValue}
              </p>
            </div>
          )}
        </div>

        <DashboardNav links={sidebarLinks} />

        <div className="p-4 border-t border-border">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.display_name || user.email?.split("@")[0]}
            </p>
            <p className="text-[11px] text-text-muted truncate mb-3">{user.email}</p>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <MobileDrawer
        links={sidebarLinks}
        venueName={headerValue}
        venueLabel={headerLabel}
        venues={isVenueRole ? allVenues : []}
        activeVenueId={venue?.id || null}
        isVenueRole={isVenueRole}
        userName={profile?.display_name || user.email?.split("@")[0]}
        userEmail={user.email}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 md:p-8 p-4 pt-20 md:pt-8 overflow-y-auto min-h-screen">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
