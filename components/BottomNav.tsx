"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { icon: "home", label: "Explore", href: "/" },
    { icon: "search", label: "Search", href: "/search" },
    { icon: "mic", label: "", href: "/dashboard", isFab: true },
    ...(user
      ? [
          { icon: "favorite_border", label: "Favorites", href: "/dashboard/favorites" },
          { icon: "notifications_none", label: "Reminders", href: "/notifications" },
        ]
      : [{ icon: "login", label: "Login", href: "/signin" }]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-2xl pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 shadow-2xl shadow-primary/10 md:hidden">
      <ul className="flex items-end w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isFab) {
            return (
              <li key={item.href} className="flex-1 flex justify-center">
                <Link
                  href={item.href}
                  className="bg-primary text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 -mt-8 border-4 border-bg-dark"
                >
                  <span className="material-icons-round text-3xl">add</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center py-1 transition-colors ${
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                <span className={`material-icons-round text-2xl ${isActive ? "neon-glow-green" : ""}`}>
                  {isActive && item.icon === "favorite_border" ? "favorite" : isActive && item.icon === "notifications_none" ? "notifications_active" : item.icon}
                </span>
                <span className="text-[10px] mt-0.5 font-semibold truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
