import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "../dashboard/SignOutButton";

const adminLinks = [
  { href: "/admin", icon: "admin_panel_settings", label: "Overview" },
  { href: "/admin/users", icon: "people", label: "Users" },
  { href: "/admin/venues", icon: "storefront", label: "Venues" },
  { href: "/admin/sync", icon: "sync", label: "Sync Sheet" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
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
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400 uppercase tracking-wider font-bold">
              Admin Panel
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="material-icons-round text-xl">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border my-3" />
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="material-icons-round text-xl">dashboard</span>
            Venue Dashboard
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-red-400 text-lg">shield</span>
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
          <p className="text-sm font-bold text-red-400">Admin Panel</p>
          <div className="w-6" />
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-hide">
          {adminLinks.map((link) => (
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
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
