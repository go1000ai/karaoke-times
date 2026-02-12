"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { label: "Explore", href: "/" },
  { label: "Search", href: "/search" },
  { label: "Events", href: "/add-event" },
  { label: "Map", href: "/map" },
  { label: "Favorites", href: "/favorites" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-bg-dark/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <img
            src="/logo.png"
            alt="Karaoke Times"
            className="w-[100px] h-[100px] object-contain"
            style={{
              filter:
                "drop-shadow(0 0 2px rgba(255,255,255,0.8)) drop-shadow(0 0 6px rgba(212,160,23,0.9)) drop-shadow(0 0 12px rgba(212,160,23,0.5)) drop-shadow(0 0 30px rgba(192,57,43,0.3))",
            }}
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary neon-glow-green"
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <Link
            href="/add-event"
            className="hidden md:flex bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-full items-center gap-1.5 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            Add Karaoke Event
          </Link>

          {!loading && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 border border-primary/40 text-primary font-semibold text-sm px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <span className="material-icons-round text-base">person</span>
                )}
                <span className="hidden sm:inline">
                  {user.user_metadata?.full_name?.split(" ")[0] || "Profile"}
                </span>
              </Link>
              <button
                onClick={signOut}
                className="text-text-muted hover:text-white transition-colors"
                title="Sign out"
              >
                <span className="material-icons-round text-xl">logout</span>
              </button>
            </div>
          ) : !loading ? (
            <Link
              href="/signin"
              className="flex items-center gap-1.5 border border-primary/40 text-primary font-semibold text-sm px-5 py-2 rounded-full hover:bg-primary/10 transition-colors"
            >
              <span className="material-icons-round text-base">login</span>
              Login
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
