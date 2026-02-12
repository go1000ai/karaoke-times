"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function GlobalNav() {
  const pathname = usePathname();

  // Hide TopNav on dashboard (sidebar layout) and signin (centered layout)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/signin")) return null;

  return <TopNav />;
}
