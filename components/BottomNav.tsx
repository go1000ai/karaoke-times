"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "home", label: "Explore", href: "/home" },
  { icon: "search", label: "Search", href: "/search" },
  { icon: "add", label: "", href: "/add-event", isFab: true },
  { icon: "favorite_border", label: "Favorites", href: "/favorites" },
  { icon: "person_outline", label: "Profile", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-50 safe-bottom md:hidden">
      <ul className="flex justify-between items-center px-4 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.isFab) {
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className="bg-crimson text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg -mt-7 border-4 border-bg"
                >
                  <span className="material-icons-round text-3xl">add</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 transition-colors ${
                  isActive ? "text-crimson" : "text-text-muted"
                }`}
              >
                <span className="material-icons-round text-2xl">
                  {isActive && item.icon === "favorite_border" ? "favorite" : isActive && item.icon === "person_outline" ? "person" : item.icon}
                </span>
                <span className="text-[10px] mt-0.5 font-semibold">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
