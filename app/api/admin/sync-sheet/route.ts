import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as fs from "fs";
import * as path from "path";

const SHEET_ID = "1Hjvo1uMhxtvTcnHNzHaCH9Qq-lbIqRV3Kag5vzSukFk";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

// Map event IDs or venue slugs to local images in /public/venues/
const VENUE_IMAGES: Record<string, string> = {
  "fusion-east-monday": "/venues/fusion-east-monday.jpg",
  "footprints-cafe-monday": "/venues/footprints-cafe.png",
  "native-monday": "/venues/native-bk.png",
  "metropolitan-bar-tuesday": "/venues/metropolitan-bar.png",
  "patrick-steakhouse-wednesday": "/venues/patrick-steakhouse.jpg",
  "fusion-east-thursday": "/venues/fusion-east-thursday.png",
  "essence-bar-grill-friday": "/venues/essence-bar.png",
  "1683-bar-restaurant-monday": "/venues/1683-bar.jpg",
  "island-grill-cafe-monday": "/venues/island-grill.png",
  "sunset-bar-restaurant-monday": "/venues/sunset-bar.jpg",
  "the-skinny-bar-lounge-monday": "/venues/skinny-bar.png",
  "the-oval-sports-bar-lounge-tuesday": "/venues/oval-sports-lounge.png",
  "harlem-nights-bar-tuesday": "/venues/harlem-nights.jpg",
  "blu-seafood-restaurant-tuesday": "/venues/blu-seafood.jpg",
  "mo-s-bar-and-lounge-tuesday": "/venues/mos-bar.jpg",
  "ocho-rios-seafood-lounge-wednesday": "/venues/ocho-rios.jpg",
  "c-list-cocktail-bar-saturday": "/venues/c-list-cocktail-bar.png",
  // Generated flyer images
  "saints-scholars-monday": "/venues/saints-scholars-monday.webp",
  "pitch-tuesday": "/venues/pitch-tuesday.webp",
  "waterfall-lounge-monday": "/venues/waterfall-lounge-monday.webp",
  "poseidon-wednesday": "/venues/poseidon-wednesday.webp",
  "buck-it-sports-latin-grill-wednesday": "/venues/buck-it-sports-latin-grill-wednesday.webp",
  "my-place-tavern-wednesday": "/venues/my-place-tavern-wednesday.webp",
  "gt-kingston-wednesday": "/venues/gt-kingston-wednesday.webp",
  "lagos-times-square-wednesday": "/venues/lagos-times-square-wednesday.webp",
  "mc-shane-s-pub-restaurant-wednesday": "/venues/mc-shane-s-pub-restaurant-wednesday.webp",
  "ocean-prime-thursday": "/venues/ocean-prime-thursday.webp",
  "murf-s-backstreet-tavern-thursday": "/venues/murf-s-backstreet-tavern-thursday.webp",
  "the-samurai-lounge-thursday": "/venues/the-samurai-lounge-thursday.webp",
  "deja-vu-haitian-restaurant-thursday": "/venues/deja-vu-haitian-restaurant-thursday.webp",
  "prohibition-thursday": "/venues/prohibition-thursday.webp",
  "the-noon-inn-thursday": "/venues/the-noon-inn-thursday.webp",
  "curly-wolf-saloon-thursday": "/venues/curly-wolf-saloon-thursday.webp",
  "rollin-greens-thursday": "/venues/rollin-greens-thursday.webp",
  "shannon-pot-2-friday": "/venues/shannon-pot-2-friday.webp",
  "it-s-about-time-cocktail-lounge-friday": "/venues/it-s-about-time-cocktail-lounge-friday.webp",
  "good-company-friday": "/venues/good-company-friday.webp",
  "allan-s-bakery-friday": "/venues/allan-s-bakery-friday.webp",
  "american-legion-hall-friday": "/venues/american-legion-hall-friday.webp",
  "woodzy-friday": "/venues/woodzy-friday.webp",
  "la-cocina-boriqua-saturday": "/venues/la-cocina-boriqua-saturday.webp",
  "whisky-red-s-saturday": "/venues/whisky-red-s-saturday.webp",
  "moonlight-pub-saturday": "/venues/moonlight-pub-saturday.webp",
  "irish-american-pub-saturday": "/venues/irish-american-pub-saturday.webp",
  "333-lounge-and-restaurant-sunday": "/venues/333-lounge-and-restaurant-sunday.webp",
  "lilah-s-bar-and-grill-bi-monthly-sundays": "/venues/lilah-s-bar-and-grill-bi-monthly-sundays.webp",
  // Private room venues
  "sing-sing-karaoke-private-room-karaoke": "/venues/sing-sing-avenue-a.webp",
  "boho-karaoke-private-room-karaoke": "/venues/boho-karaoke.webp",
  "aux-karaoke-private-room-karaoke": "/venues/aux-karaoke.webp",
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(current.trim());
        current = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        row.push(current.trim());
        current = "";
        if (row.some((cell) => cell !== "")) rows.push(row);
        row = [];
        if (char === "\r") i++;
      } else {
        current += char;
      }
    }
  }
  row.push(current.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);

  return rows;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export async function POST() {
  // Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  try {
    const response = await fetch(CSV_URL, { redirect: "follow" });
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Failed to fetch sheet: ${response.status}`,
      });
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return NextResponse.json({
        success: false,
        message: "Sheet appears empty or has no data rows",
      });
    }

    interface EventRow {
      dayOfWeek: string;
      eventName: string;
      venueName: string;
      address: string;
      city: string;
      state: string;
      neighborhood: string;
      crossStreet: string;
      phone: string;
      dj: string;
      startTime: string;
      endTime: string;
      notes: string;
      website: string;
    }

    const events: EventRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      events.push({
        dayOfWeek: row[0] || "",
        eventName: row[1] || "Karaoke Night",
        venueName: row[2] || "",
        address: row[3] || "",
        city: row[4] || "",
        state: row[5] || "",
        neighborhood: row[6] || "",
        crossStreet: row[7] || "",
        phone: row[8] || "",
        dj: row[9] || "",
        startTime: row[10] || "",
        endTime: row[11] || "",
        notes: row[12] || "",
        website: row[13] || "",
      });
    }

    // Collect unique days
    const daySet = new Set<string>();
    events.forEach((e) => daySet.add(e.dayOfWeek));
    const standardDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const extraDays = [...daySet].filter((d) => !standardDays.includes(d));
    const dayOrder = [...standardDays.filter((d) => daySet.has(d)), ...extraDays];

    // Generate mock-data.ts
    let output = `export interface KaraokeEvent {
  id: string;
  dayOfWeek: string;
  eventName: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  crossStreet: string;
  phone: string;
  dj: string;
  startTime: string;
  endTime: string;
  notes: string;
  image: string | null;
  isPrivateRoom: boolean;
  bookingUrl: string | null;
  website: string | null;
}

export const DAY_ORDER = [
${dayOrder.map((d) => `  "${d}",`).join("\n")}
] as const;

export const karaokeEvents: KaraokeEvent[] = [
`;

    let currentDay = "";
    for (const event of events) {
      if (event.dayOfWeek !== currentDay) {
        currentDay = event.dayOfWeek;
        output += `  // ─── ${currentDay.toUpperCase()} ───\n`;
      }

      const id = slugify(`${event.venueName}-${event.dayOfWeek}`);
      const isPrivateRoom =
        event.dayOfWeek === "Private Room Karaoke" ||
        event.notes.toLowerCase().includes("private room");

      output += `  {
    id: "${escapeString(id)}",
    dayOfWeek: "${escapeString(event.dayOfWeek)}",
    eventName: "${escapeString(event.eventName)}",
    venueName: "${escapeString(event.venueName)}",
    address: "${escapeString(event.address)}",
    city: "${escapeString(event.city)}",
    state: "${escapeString(event.state)}",
    neighborhood: "${escapeString(event.neighborhood)}",
    crossStreet: "${escapeString(event.crossStreet)}",
    phone: "${escapeString(event.phone)}",
    dj: "${escapeString(event.dj)}",
    startTime: "${escapeString(event.startTime)}",
    endTime: "${escapeString(event.endTime)}",
    notes: "${escapeString(event.notes)}",
    image: ${VENUE_IMAGES[id] ? `"${VENUE_IMAGES[id]}"` : "null"},
    isPrivateRoom: ${isPrivateRoom},
    bookingUrl: null,
    website: ${event.website ? `"${escapeString(event.website)}"` : "null"},
  },
`;
    }

    output += `];

// Helper: get events grouped by day, or for a specific day
export function getEventsByDay(): Record<string, KaraokeEvent[]>;
export function getEventsByDay(day: string): KaraokeEvent[];
export function getEventsByDay(day?: string): Record<string, KaraokeEvent[]> | KaraokeEvent[] {
  if (day) return karaokeEvents.filter((e) => e.dayOfWeek === day);
  const grouped: Record<string, KaraokeEvent[]> = {};
  for (const event of karaokeEvents) {
    if (!grouped[event.dayOfWeek]) grouped[event.dayOfWeek] = [];
    grouped[event.dayOfWeek].push(event);
  }
  return grouped;
}

// Helper: venues derived from events (unique by name)
export const venues = karaokeEvents.reduce<
  Array<{
    id: string;
    name: string;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    image: string | null;
    isPrivateRoom: boolean;
  }>
>((acc, event) => {
  if (!acc.find((v) => v.name === event.venueName)) {
    acc.push({
      id: event.id,
      name: event.venueName,
      address: event.address,
      neighborhood: event.neighborhood,
      city: event.city,
      state: event.state,
      image: event.image,
      isPrivateRoom: event.isPrivateRoom,
    });
  }
  return acc;
}, []);

// Placeholder reviews (to be replaced by Supabase)
export const reviews: Array<{
  id: string;
  venueId: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
}> = [];

// Song search demo data (used by /search page)
export const songSearchResults = [
  {
    song: "Don't Stop Believin'",
    artist: "Journey",
    venues: [
      { name: "Sing Sing Karaoke", distance: "0.3 mi", available: true, waitTime: "~15 min wait", special: "Happy Hour till 8 PM" },
      { name: "Boho Karaoke", distance: "0.5 mi", available: true, waitTime: null, special: null },
      { name: "Aux Karaoke", distance: "1.2 mi", available: false, waitTime: null, special: "2-for-1 Drinks" },
    ],
  },
];
`;

    const outPath = path.join(process.cwd(), "lib", "mock-data.ts");
    fs.writeFileSync(outPath, output, "utf-8");

    return NextResponse.json({
      success: true,
      message: `Synced ${events.length} events across ${dayOrder.length} days. Redeploy to update production.`,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}
