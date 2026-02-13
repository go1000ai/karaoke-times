import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutButton } from "../dashboard/SignOutButton";
import { AdminNav, AdminMobileDrawer } from "./AdminNav";

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
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card-dark border-r border-border hidden md:flex flex-col">
        {/* Header */}
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

        {/* Grouped Navigation */}
        <AdminNav />

        {/* Venue Dashboard link */}
        <div className="px-3 pb-2">
          <div className="border-t border-border pt-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="material-icons-round text-lg">dashboard</span>
              Venue Dashboard
            </Link>
          </div>
        </div>

        {/* User Footer */}
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

      {/* Mobile Drawer */}
      <AdminMobileDrawer />

      {/* Main Content */}
      <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
