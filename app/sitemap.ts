import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { karaokeEvents } from "@/lib/mock-data";

const SITE_URL = "https://karaoketimes.net";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/map`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/signin`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Mock-data karaoke events (slug-based URLs)
  const mockVenueRoutes: MetadataRoute.Sitemap = karaokeEvents.map((event) => ({
    url: `${SITE_URL}/venue/${event.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Supabase venues (UUID-based URLs)
  let dbVenueRoutes: MetadataRoute.Sitemap = [];
  let kjRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();

    const { data: venues } = await supabase
      .from("venues")
      .select("id, updated_at")
      .order("updated_at", { ascending: false });

    dbVenueRoutes = (venues ?? []).map((v) => ({
      url: `${SITE_URL}/venue/${v.id}`,
      lastModified: v.updated_at ? new Date(v.updated_at as string) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const { data: kjs } = await supabase
      .from("kj_profiles")
      .select("slug, updated_at")
      .not("slug", "is", null);

    kjRoutes = (kjs ?? []).map((k) => ({
      url: `${SITE_URL}/kj/${k.slug as string}`,
      lastModified: k.updated_at ? new Date(k.updated_at as string) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Build-time fallback: ship static routes only if DB is unreachable
  }

  return [...staticRoutes, ...mockVenueRoutes, ...dbVenueRoutes, ...kjRoutes];
}
