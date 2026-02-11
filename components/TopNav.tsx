"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Explore", href: "/" },
  { label: "Search", href: "/search" },
  { label: "Events", href: "/add-event" },
  { label: "Map", href: "/map" },
  { label: "Favorites", href: "/favorites" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-bg-dark/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <img src="/logo.png" alt="Karaoke Times" className="h-10 w-auto" />
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
            Add Event
          </Link>
          <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-primary">
            <span className="material-icons-round text-xl">notifications</span>
          </button>
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
          >
            <span className="material-icons-round text-xl">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
