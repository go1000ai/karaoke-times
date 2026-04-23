"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const publicNavLinks = [
  { label: "Explore", href: "/", icon: "home" },
  { label: "Map", href: "/map", icon: "map" },
  { label: "Contact", href: "/contact", icon: "mail" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Private Room Karaoke"];

// ── Sub-component: desktop "Browse" dropdown — needs useSearchParams ───────────
function BrowseDropdown() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeDay = pathname === "/" ? (searchParams.get("day") || "All") : "All";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          activeDay !== "All"
            ? "text-primary neon-glow-green"
            : "text-text-secondary hover:text-white"
        }`}
      >
        {activeDay !== "All"
          ? (activeDay === "Private Room Karaoke" ? "Private Room" : activeDay)
          : "Browse"}
        <span className="material-icons-round text-base leading-none">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-bg-dark border border-border rounded-xl shadow-2xl shadow-black/60 py-1 z-50 overflow-hidden">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
              activeDay === "All" ? "text-primary bg-primary/5" : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="material-icons-round text-base">apps</span>
            All Days
          </Link>
          <div className="h-px bg-border mx-3 my-1" />
          {DAYS.map((day) => (
            <Link
              key={day}
              href={`/?day=${encodeURIComponent(day)}`}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                activeDay === day ? "text-primary bg-primary/5" : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-icons-round text-base">
                {day === "Private Room Karaoke" ? "meeting_room" : "event"}
              </span>
              {day === "Private Room Karaoke" ? "Private Room" : day}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-component: mobile hamburger day grid — needs useSearchParams ──────────
function MobileDayGrid({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeDay = pathname === "/" ? (searchParams.get("day") || "All") : "All";

  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted px-4 pt-1 pb-2">Browse by Day</p>
      <div className="grid grid-cols-4 gap-1.5 px-3 mb-2">
        <Link
          href="/"
          onClick={onClose}
          className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-center transition-colors ${
            activeDay === "All" ? "bg-primary/15 text-primary" : "bg-white/5 text-text-secondary hover:text-white hover:bg-white/10"
          }`}
        >
          <span className="material-icons-round text-lg">apps</span>
          <span className="text-[10px] font-bold leading-tight">All</span>
        </Link>
        {DAYS.filter((d) => d !== "Private Room Karaoke").map((day) => (
          <Link
            key={day}
            href={`/?day=${encodeURIComponent(day)}`}
            onClick={onClose}
            className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-center transition-colors ${
              activeDay === day ? "bg-primary/15 text-primary" : "bg-white/5 text-text-secondary hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="material-icons-round text-lg">event</span>
            <span className="text-[10px] font-bold leading-tight">{day.slice(0, 3)}</span>
          </Link>
        ))}
        <Link
          href={`/?day=${encodeURIComponent("Private Room Karaoke")}`}
          onClick={onClose}
          className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-center transition-colors ${
            activeDay === "Private Room Karaoke" ? "bg-primary/15 text-primary" : "bg-white/5 text-text-secondary hover:text-white hover:bg-white/10"
          }`}
        >
          <span className="material-icons-round text-lg">meeting_room</span>
          <span className="text-[10px] font-bold leading-tight">Private</span>
        </Link>
      </div>
    </>
  );
}

// ── Main TopNav ────────────────────────────────────────────────────────────────
export default function TopNav() {
  const pathname = usePathname();
  const { user, loading, hasDashboard, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = user
    ? [...publicNavLinks, { label: "Favorites", href: "/dashboard/favorites", icon: "favorite" }]
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

            {/* Browse by Day dropdown — wrapped in Suspense */}
            <Suspense fallback={
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary">
                Browse <span className="material-icons-round text-base leading-none">expand_more</span>
              </button>
            }>
              <BrowseDropdown />
            </Suspense>
          </nav>

          {/* Right Side — Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://www.facebook.com/groups/632806096911901"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              title="Join our Facebook Group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a
              href="https://www.instagram.com/karaoketimesnyc?igsh=Nnh1aGkyeWYxMWRi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              title="Follow us on Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
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
                    <img src={user.user_metadata.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className="material-icons-round text-base">person</span>
                  )}
                  <span>{user.user_metadata?.full_name?.split(" ")[0] || "Profile"}</span>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

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

              {/* Browse by Day — mobile, wrapped in Suspense */}
              <Suspense fallback={null}>
                <MobileDayGrid onClose={() => setMenuOpen(false)} />
              </Suspense>

              <div className="border-t border-border my-2" />

              {/* Social Icons */}
              <div className="flex items-center gap-4 px-4 py-2">
                <a href="https://www.facebook.com/groups/632806096911901" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/karaoketimesnyc?igsh=Nnh1aGkyeWYxMWRi" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>

              <div className="border-t border-border my-2" />

              {!loading && user ? (
                <>
                  {hasDashboard && (
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-colors">
                      <span className="material-icons-round text-xl">dashboard</span>
                      Dashboard
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <span className="material-icons-round text-xl">person</span>
                    )}
                    {user.user_metadata?.full_name || "My Profile"}
                  </Link>
                  <button onClick={() => { signOut(); setMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/5 transition-colors w-full text-left">
                    <span className="material-icons-round text-xl">logout</span>
                    Sign Out
                  </button>
                </>
              ) : !loading ? (
                <Link href="/signin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
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
