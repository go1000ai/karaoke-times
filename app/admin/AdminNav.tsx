"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  icon: string;
  label: string;
};

type NavSection = {
  label: string | null;
  links: NavLink[];
};

export const adminNavSections: NavSection[] = [
  {
    label: null,
    links: [
      { href: "/admin", icon: "dashboard", label: "Dashboard" },
    ],
  },
  {
    label: "Manage Users",
    links: [
      { href: "/admin/singers", icon: "mic", label: "Singers" },
      { href: "/admin/owners", icon: "store", label: "Venue Owners" },
      { href: "/admin/kjs", icon: "headphones", label: "KJs" },
      { href: "/admin/users", icon: "people", label: "All Users" },
    ],
  },
  {
    label: "Platform",
    links: [
      { href: "/admin/venues", icon: "storefront", label: "Venues" },
      { href: "/admin/events", icon: "event", label: "Events" },
      { href: "/admin/bookings", icon: "book_online", label: "Bookings" },
      { href: "/admin/queue", icon: "queue_music", label: "Queue Monitor" },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/reviews", icon: "rate_review", label: "Reviews" },
      { href: "/admin/promos", icon: "local_offer", label: "Promos" },
    ],
  },
  {
    label: "Support",
    links: [
      { href: "/admin/support", icon: "support_agent", label: "Tickets" },
      { href: "/admin/announcements", icon: "campaign", label: "Announcements" },
      { href: "/admin/newsletter", icon: "newspaper", label: "Newsletter" },
    ],
  },
  {
    label: "System",
    links: [
      { href: "/admin/sync", icon: "sync", label: "Sync Sheet" },
      { href: "/admin/activity", icon: "history", label: "Activity Log" },
    ],
  },
];

function isLinkActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      {adminNavSections.map((section, si) => (
        <div key={si} className={si > 0 ? "mt-4" : ""}>
          {section.label && (
            <p className="text-[10px] text-text-muted/60 uppercase tracking-widest font-bold px-4 mb-1.5">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.links.map((link) => {
              const active = isLinkActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "text-red-400 bg-red-500/10 border border-red-500/20"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`material-icons-round text-lg ${
                      active ? "text-red-400" : ""
                    }`}
                  >
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminMobileDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Flatten all links for the mobile horizontal tabs
  const allLinks = adminNavSections.flatMap((s) => s.links);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-bg-dark/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setOpen(true)}
            className="text-text-muted hover:text-white transition-colors"
          >
            <span className="material-icons-round text-2xl">menu</span>
          </button>
          <p className="text-sm font-bold text-red-400">Admin Panel</p>
          <Link href="/" className="text-text-muted hover:text-white transition-colors">
            <span className="material-icons-round">home</span>
          </Link>
        </div>
      </div>

      {/* Slide-out Drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="absolute top-0 left-0 bottom-0 w-72 bg-bg-dark border-r border-border shadow-2xl shadow-black/50 animate-[slideInLeft_0.2s_ease-out] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <img
                  src="/logo.png"
                  alt="Karaoke Times"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-sm font-bold text-white">Karaoke Times</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            {/* Admin Badge */}
            <div className="px-5 py-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-red-400 uppercase tracking-wider font-bold">
                  Admin Panel
                </p>
              </div>
            </div>

            {/* Grouped Nav */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {adminNavSections.map((section, si) => (
                <div key={si} className={si > 0 ? "mt-4" : ""}>
                  {section.label && (
                    <p className="text-[10px] text-text-muted/60 uppercase tracking-widest font-bold px-4 mb-1.5">
                      {section.label}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.links.map((link) => {
                      const active = isLinkActive(link.href, pathname);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            active
                              ? "text-red-400 bg-red-500/10 border border-red-500/20"
                              : "text-text-secondary hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span
                            className={`material-icons-round text-lg ${
                              active ? "text-red-400" : ""
                            }`}
                          >
                            {link.icon}
                          </span>
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Venue Dashboard link */}
              <div className="mt-4 pt-3 border-t border-border">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="material-icons-round text-lg">dashboard</span>
                  Venue Dashboard
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
