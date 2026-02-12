"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function GlobalNav() {
  const pathname = usePathname();

  // Hide TopNav on dashboard (sidebar layout), TV display (fullscreen), and owner setup
  if (pathname.startsWith("/dashboard") || pathname.endsWith("/tv") || pathname.startsWith("/signin/owner/setup")) return null;

  return <TopNav />;
}
