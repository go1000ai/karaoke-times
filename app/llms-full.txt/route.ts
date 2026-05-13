import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { karaokeEvents, DAY_ORDER } from "@/lib/mock-data";

export const revalidate = 3600;

const SITE_URL = "https://karaoketimes.net";

interface DbVenue {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  is_private_room: boolean | null;
  karaoke_type: string | null;
}

interface DbKj {
  slug: string;
  stage_name: string | null;
  bio: string | null;
  genres: string[] | null;
}

export async function GET() {
  let dbVenues: DbVenue[] = [];
  let dbKjs: DbKj[] = [];

  try {
    const supabase = await createClient();

    const { data: venues } = await supabase
      .from("venues")
      .select(
        "id, name, address, city, state, neighborhood, phone, website, description, is_private_room, karaoke_type"
      )
      .order("name");
    dbVenues = (venues ?? []) as DbVenue[];

    const { data: kjs } = await supabase
      .from("kj_profiles")
      .select("slug, stage_name, bio, genres")
      .not("slug", "is", null);
    dbKjs = (kjs ?? []) as DbKj[];
  } catch {
    // fall back to mock data only
  }

  const lines: string[] = [];
  lines.push("# Karaoke Times NYC — Full Directory");
  lines.push("");
  lines.push(
    "Complete directory of karaoke nights, KJs, and karaoke venues across New York City. Updated weekly."
  );
  lines.push(`Site: ${SITE_URL}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Group mock karaoke events by day
  lines.push("## Weekly karaoke schedule (curated NYC nights)");
  lines.push("");
  for (const day of DAY_ORDER) {
    const events = karaokeEvents.filter((e) => e.dayOfWeek === day);
    if (events.length === 0) continue;
    lines.push(`### ${day}`);
    lines.push("");
    for (const e of events) {
      const url = `${SITE_URL}/venue/${e.id}`;
      const addr = [e.address, e.neighborhood, e.city, e.state].filter(Boolean).join(", ");
      lines.push(`- **${e.venueName}** (${e.eventName || "Karaoke Night"}) — ${addr}`);
      if (e.startTime || e.endTime) lines.push(`  - Time: ${e.startTime}${e.endTime ? ` – ${e.endTime}` : ""}`);
      if (e.dj) lines.push(`  - KJ: ${e.dj}`);
      if (e.phone) lines.push(`  - Phone: ${e.phone}`);
      if (e.isPrivateRoom) lines.push(`  - Private karaoke rooms available`);
      if (e.notes) lines.push(`  - Notes: ${e.notes}`);
      lines.push(`  - URL: ${url}`);
      lines.push("");
    }
  }

  // Supabase-managed venues (additional/dynamic)
  if (dbVenues.length > 0) {
    lines.push("## Additional venues (community / claimed)");
    lines.push("");
    for (const v of dbVenues) {
      const addr = [v.address, v.neighborhood, v.city, v.state].filter(Boolean).join(", ");
      lines.push(`- **${v.name}** — ${addr || "NYC"}`);
      if (v.phone) lines.push(`  - Phone: ${v.phone}`);
      if (v.website) lines.push(`  - Website: ${v.website}`);
      if (v.is_private_room) lines.push(`  - Private karaoke rooms`);
      else if (v.karaoke_type === "open_format") lines.push(`  - Open-format karaoke`);
      if (v.description) lines.push(`  - About: ${v.description.replace(/\s+/g, " ").trim()}`);
      lines.push(`  - URL: ${SITE_URL}/venue/${v.id}`);
      lines.push("");
    }
  }

  // KJs
  if (dbKjs.length > 0) {
    lines.push("## Karaoke Jockeys (KJs)");
    lines.push("");
    for (const k of dbKjs) {
      lines.push(`- **${k.stage_name ?? k.slug}**`);
      if (k.genres && k.genres.length > 0) lines.push(`  - Genres: ${k.genres.join(", ")}`);
      if (k.bio) lines.push(`  - Bio: ${k.bio.replace(/\s+/g, " ").trim()}`);
      lines.push(`  - URL: ${SITE_URL}/kj/${k.slug}`);
      lines.push("");
    }
  }

  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
