"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Explore", href: "/home", icon: "home" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Map", href: "/map", icon: "map" },
  { label: "Favorites", href: "/favorites", icon: "favorite_border" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3 flex-shrink-0">
          <img src="/logo.png" alt="Karaoke Times" className="h-10 w-auto" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-crimson/10 text-crimson"
                    : "text-text-secondary hover:text-navy hover:bg-navy/5"
                }`}
              >
                <span className="material-icons-round text-lg">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <Link
            href="/add-event"
            className="hidden md:flex bg-crimson text-white font-semibold text-sm px-5 py-2.5 rounded-xl items-center gap-1.5 hover:bg-crimson-light transition-colors shadow-sm"
          >
            <span className="material-icons-round text-lg">add</span>
            Add Event
          </Link>
          <button className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center text-navy hover:bg-white transition-colors">
            <span className="material-icons-round">notifications</span>
          </button>
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy hover:bg-navy/20 transition-colors"
          >
            <span className="material-icons-round">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
