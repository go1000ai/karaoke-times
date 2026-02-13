"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const publicNavLinks = [
  { label: "Explore", href: "/", icon: "home" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Map", href: "/map", icon: "map" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, loading, hasDashboard, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = user
    ? [...publicNavLinks, { label: "Favorites", href: "/favorites", icon: "favorite" }]
    : publicNavLinks;

  return (
    <>
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

          {/* Right Side — Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/add-event"
              className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-full flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              Add Karaoke Event
            </Link>

            {!loading && user ? (
              <div className="flex items-center gap-3">
                {hasDashboard && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 text-accent font-semibold text-sm px-4 py-2 rounded-full hover:bg-accent/20 transition-colors"
                  >
                    <span className="material-icons-round text-base">dashboard</span>
                    Dashboard
                  </Link>
                )}
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
                  <span>
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

          {/* Hamburger — Mobile */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="material-icons-round text-white text-2xl">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Down Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute top-16 left-0 right-0 bg-bg-dark border-b border-border shadow-2xl shadow-black/50 animate-[slideDown_0.2s_ease-out]">
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-primary/5 neon-glow-green"
                        : "text-text-secondary hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="material-icons-round text-xl">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}

              <div className="border-t border-border my-2" />

              <Link
                href="/add-event"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="material-icons-round text-xl">add_circle</span>
                Add Karaoke Event
              </Link>

              {!loading && user ? (
                <>
                  {hasDashboard && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
                    >
                      <span className="material-icons-round text-xl">dashboard</span>
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <span className="material-icons-round text-xl">person</span>
                    )}
                    {user.user_metadata?.full_name || "My Profile"}
                  </Link>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/5 transition-colors w-full text-left"
                  >
                    <span className="material-icons-round text-xl">logout</span>
                    Sign Out
                  </button>
                </>
              ) : !loading ? (
                <Link
                  href="/signin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="material-icons-round text-xl">login</span>
                  Login / Sign Up
                </Link>
              ) : null}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
