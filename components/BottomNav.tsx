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
    { icon: "add", label: "", href: "/add-event", isFab: true },
    ...(user
      ? [
          { icon: "favorite_border", label: "Favorites", href: "/dashboard/favorites" },
          { icon: "notifications_none", label: "Reminders", href: "/notifications" },
        ]
      : [{ icon: "login", label: "Login", href: "/signin" }]),
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] glass-card rounded-[2rem] py-2 px-2 z-50 shadow-2xl shadow-primary/10 md:hidden">
      <ul className="flex justify-between items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isFab) {
            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className="bg-primary text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 -mt-7 border-4 border-bg-dark"
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
                  isActive ? "text-primary" : "text-text-muted"
                }`}
              >
                <span className={`material-icons-round text-2xl ${isActive ? "neon-glow-green" : ""}`}>
                  {isActive && item.icon === "favorite_border" ? "favorite" : isActive && item.icon === "notifications_none" ? "notifications_active" : item.icon}
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
