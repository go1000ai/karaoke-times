"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import VenueSwitcher from "@/components/VenueSwitcher";
import { SignOutButton } from "./SignOutButton";

type NavLink = {
  href: string;
  icon: string;
  label: string;
};

export function DashboardNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {links.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "text-primary bg-primary/10 border border-primary/20"
                : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            <span
              className={`material-icons-round text-xl ${
                isActive ? "text-primary" : ""
              }`}
            >
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileDrawer({
  links,
  venueName,
  venueLabel,
  venues = [],
  activeVenueId = null,
  isVenueRole = false,
  userName,
  userEmail,
}: {
  links: NavLink[];
  venueName: string;
  venueLabel: string;
  venues?: { id: string; name: string }[];
  activeVenueId?: string | null;
  isVenueRole?: boolean;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
          <p className="text-sm font-bold text-white">{venueName}</p>
          <Link href="/" className="text-text-muted hover:text-white transition-colors">
            <span className="material-icons-round">home</span>
          </Link>
        </div>
      </div>

      {/* Slide-out Drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Panel */}
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
                <span className="text-sm font-bold text-white">
                  Karaoke Times
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            {/* Venue Info */}
            <div className="px-5 py-4">
              {isVenueRole && venues.length > 0 ? (
                <VenueSwitcher
                  venues={venues}
                  activeVenueId={activeVenueId}
                  label={venueLabel}
                />
              ) : (
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-text-muted uppercase tracking-wider">
                    {venueLabel}
                  </p>
                  <p className="text-sm font-bold text-white truncate">
                    {venueName}
                  </p>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {links.map((link) => {
                const isActive =
                  link.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-text-secondary hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`material-icons-round text-xl ${
                        isActive ? "text-primary" : ""
                      }`}
                    >
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Info + Sign Out */}
            <div className="p-4 border-t border-border">
              <div className="px-3 py-2">
                {userName && (
                  <p className="text-sm font-semibold text-white truncate">{userName}</p>
                )}
                {userEmail && (
                  <p className="text-[11px] text-text-muted truncate mb-3">{userEmail}</p>
                )}
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
