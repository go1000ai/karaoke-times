import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const sidebarLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/listing", icon: "storefront", label: "My Listing" },
  { href: "/dashboard/events", icon: "event", label: "Events" },
  { href: "/dashboard/media", icon: "photo_library", label: "Media" },
  { href: "/dashboard/promos", icon: "local_offer", label: "Promos" },
  { href: "/dashboard/queue", icon: "queue_music", label: "Song Queue" },
  { href: "/dashboard/bookings", icon: "book_online", label: "Bookings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  // Get venue owned by this user
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

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
            <p className="text-xs text-text-muted uppercase tracking-wider">Your Venue</p>
            <p className="text-sm font-bold text-white truncate">
              {venue?.name || "No venue linked"}
            </p>
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
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-muted hover:text-white transition-colors"
          >
            <span className="material-icons-round text-xl">arrow_back</span>
            Back to Site
          </Link>
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
