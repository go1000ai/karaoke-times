import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1Hjvo1uMhxtvTcnHNzHaCH9Qq-lbIqRV3Kag5vzSukFk/edit";

function sheetUrlToCsvExport(sheetUrl: string): string {
  // Extract the sheet ID from various Google Sheets URL formats
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("Invalid Google Sheet URL");
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=0`;
}

// Map user-facing column names (lowercase) to EventRow field keys
// Includes aliases for both short names and actual Google Sheet headers
const COLUMN_NAME_TO_FIELD: Record<string, string> = {
  "day of the week": "dayOfWeek",
  "day of week": "dayOfWeek",
  "event name": "eventName",
  "event location": "venueName",
  "venue name": "venueName",
  "event address": "address",
  "address": "address",
  "city": "city",
  "state": "state",
  "zip code": "zipCode",
  "zip": "zipCode",
  "neighborhood": "neighborhood",
  "cross street": "crossStreet",
  "reservations": "phone",
  "phone": "phone",
  "music by/dj": "dj",
  "dj": "dj",
  "start time": "startTime",
  "end time": "endTime",
  "notes": "notes",
  "website": "website",
  "flyer": "flyer",
};

// Map event IDs or venue slugs to local images in /public/venues/
const VENUE_IMAGES: Record<string, string> = {
  "fusion-east-monday": "/venues/fusion-east-monday.jpg",
  "footprints-cafe-monday": "/venues/footprints-cafe.jpg",
  "native-monday": "/venues/native-bk.jpg",
  "metropolitan-bar-tuesday": "/venues/metropolitan-bar.jpg",
  "patrick-steakhouse-wednesday": "/venues/patrick-steakhouse.jpg",
  "fusion-east-thursday": "/venues/fusion-east-thursday.jpg",
  "essence-bar-grill-friday": "/venues/essence-bar.jpg",
  "1683-bar-restaurant-monday": "/venues/1683-bar.jpg",
  "island-grill-cafe-monday": "/venues/island-grill.jpg",
  "sunset-bar-restaurant-monday": "/venues/sunset-bar.jpg",
  "the-skinny-bar-lounge-monday": "/venues/skinny-bar.jpg",
  "the-oval-sports-bar-lounge-tuesday": "/venues/oval-sports-lounge.jpg",
  "harlem-nights-bar-tuesday": "/venues/harlem-nights.jpg",
  "blu-seafood-restaurant-tuesday": "/venues/blu-seafood.jpg",
  "mo-s-bar-and-lounge-tuesday": "/venues/mos-bar.jpg",
  "ocho-rios-seafood-lounge-wednesday": "/venues/ocho-rios.jpg",
  "c-list-cocktail-bar-saturday": "/venues/c-list-cocktail-bar.jpg",
  "saints-scholars-monday": "/venues/saints-scholars-monday.jpg",
  "pitch-tuesday": "/venues/pitch-tuesday.jpg",
  "waterfall-lounge-monday": "/venues/waterfall-lounge-monday.jpg",
  "poseidon-wednesday": "/venues/poseidon-wednesday.jpg",
  "buck-it-sports-latin-grill-wednesday": "/venues/buck-it-sports-latin-grill-wednesday.jpg",
  "my-place-tavern-wednesday": "/venues/my-place-tavern-wednesday.jpg",
  "gt-kingston-wednesday": "/venues/gt-kingston-wednesday.jpg",
  "lagos-times-square-wednesday": "/venues/lagos-times-square-wednesday.jpg",
  "mc-shane-s-pub-restaurant-wednesday": "/venues/mc-shane-s-pub-restaurant-wednesday.jpg",
  "ocean-prime-thursday": "/venues/ocean-prime-thursday.jpg",
  "murf-s-backstreet-tavern-thursday": "/venues/murf-s-backstreet-tavern-thursday.jpg",
  "the-samurai-lounge-thursday": "/venues/the-samurai-lounge-thursday.jpg",
  "deja-vu-haitian-restaurant-thursday": "/venues/deja-vu-haitian-restaurant-thursday.jpg",
  "prohibition-thursday": "/venues/prohibition-thursday.jpg",
  "the-noon-inn-thursday": "/venues/the-noon-inn-thursday.jpg",
  "curly-wolf-saloon-thursday": "/venues/curly-wolf-saloon-thursday.jpg",
  "rollin-greens-thursday": "/venues/rollin-greens-thursday.jpg",
  "shannon-pot-2-friday": "/venues/shannon-pot-2-friday.jpg",
  "it-s-about-time-cocktail-lounge-friday": "/venues/it-s-about-time-cocktail-lounge-friday.jpg",
  "good-company-friday": "/venues/good-company-friday.jpg",
  "allan-s-bakery-friday": "/venues/allan-s-bakery-friday.jpg",
  "american-legion-hall-friday": "/venues/american-legion-hall-friday.jpg",
  "woodzy-friday": "/venues/woodzy-friday.jpg",
  "la-cocina-boriqua-saturday": "/venues/la-cocina-boriqua-saturday.jpg",
  "whisky-red-s-saturday": "/venues/whisky-red-s-saturday.jpg",
  "moonlight-pub-saturday": "/venues/moonlight-pub-saturday.jpg",
  "irish-american-pub-saturday": "/venues/irish-american-pub-saturday.jpg",
  "333-lounge-and-restaurant-sunday": "/venues/333-lounge-and-restaurant-sunday.jpg",
  "lilah-s-bar-and-grill-bi-monthly-sundays": "/venues/lilah-s-bar-and-grill-bi-monthly-sundays.jpg",
  "sing-sing-karaoke-private-room-karaoke": "/venues/sing-sing-avenue-a.jpg",
  "boho-karaoke-private-room-karaoke": "/venues/boho-karaoke.jpg",
  "aux-karaoke-private-room-karaoke": "/venues/aux-karaoke.jpg",
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

// Convert Google Drive sharing links to direct image URLs
function toDirectImageUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  // Google Drive file link: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
  }

  // Google Drive open link: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }

  // Already a direct URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return null;
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

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

interface ParsedEvent {
  id: string;
  dayOfWeek: string;
  eventName: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
  crossStreet: string;
  phone: string;
  dj: string;
  startTime: string;
  endTime: string;
  notes: string;
  image: string | null;
  flyer: string | null;
  isPrivateRoom: boolean;
  bookingUrl: string | null;
  website: string | null;
}

function generateMockData(csvText: string, columns?: string[]): { output: string; parsedEvents: ParsedEvent[]; eventCount: number; dayCount: number } {
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error("CSV appears empty or has no data rows");
  }

  // Build column index → field key mapping
  const fieldOrder = [
    "dayOfWeek", "eventName", "venueName", "address", "city", "state",
    "zipCode", "neighborhood", "crossStreet", "phone", "dj", "startTime",
    "endTime", "notes", "website", "flyer",
  ];

  let colToField: Record<number, string>;

  if (columns && columns.length > 0) {
    // Use the custom column mapping: columns[i] is the name for CSV column i
    colToField = {};
    columns.forEach((colName, i) => {
      const field = COLUMN_NAME_TO_FIELD[colName.toLowerCase().trim()];
      if (field) colToField[i] = field;
    });
  } else {
    // Default: columns 0-13 map to fields in order
    colToField = {};
    fieldOrder.forEach((field, i) => {
      colToField[i] = field;
    });
  }

  interface EventRow {
    dayOfWeek: string;
    eventName: string;
    venueName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    neighborhood: string;
    crossStreet: string;
    phone: string;
    dj: string;
    startTime: string;
    endTime: string;
    notes: string;
    website: string;
    flyer: string;
  }

  const events: EventRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue;

    const event: Record<string, string> = {};
    for (const field of fieldOrder) event[field] = "";
    // Apply column mapping
    for (const [colIdx, field] of Object.entries(colToField)) {
      event[field] = row[Number(colIdx)] || (field === "eventName" ? "Karaoke Night" : "");
    }

    events.push(event as unknown as EventRow);
  }

  const daySet = new Set<string>();
  events.forEach((e) => daySet.add(e.dayOfWeek));
  const standardDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const extraDays = [...daySet].filter((d) => !standardDays.includes(d));
  const dayOrder = [...standardDays.filter((d) => daySet.has(d)), ...extraDays];

  let output = `export interface KaraokeEvent {
  id: string;
  dayOfWeek: string;
  eventName: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
  crossStreet: string;
  phone: string;
  dj: string;
  startTime: string;
  endTime: string;
  notes: string;
  image: string | null;
  flyer: string | null;
  isPrivateRoom: boolean;
  bookingUrl: string | null;
  website: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
    zipCode: "${escapeString(event.zipCode)}",
    neighborhood: "${escapeString(event.neighborhood)}",
    crossStreet: "${escapeString(event.crossStreet)}",
    phone: "${escapeString(event.phone)}",
    dj: "${escapeString(event.dj)}",
    startTime: "${escapeString(event.startTime)}",
    endTime: "${escapeString(event.endTime)}",
    notes: "${escapeString(event.notes)}",
    image: ${VENUE_IMAGES[id] ? `"${VENUE_IMAGES[id]}"` : "null"},
    flyer: ${event.flyer ? `"${escapeString(event.flyer)}"` : "null"},
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
import { getVenueCoordinates } from "./venue-coordinates";

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
    latitude: number | null;
    longitude: number | null;
  }>
>((acc, event) => {
  if (!acc.find((v) => v.name === event.venueName)) {
    const coords = getVenueCoordinates(event.address);
    acc.push({
      id: event.id,
      name: event.venueName,
      address: event.address,
      neighborhood: event.neighborhood,
      city: event.city,
      state: event.state,
      image: event.image,
      isPrivateRoom: event.isPrivateRoom,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
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

// ─── KJ Profiles (derived from events) ───

export interface KJProfile {
  name: string;
  slug: string;
  venueCount: number;
  events: Array<{
    venueId: string;
    venueName: string;
    eventName: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    image: string | null;
    neighborhood: string;
    city: string;
  }>;
}

const EXCLUDED_KJ_NAMES = new Set([
  "", "n/a", "various kj's", "various kj's", "house dj's",
  "private rooms and open karaoke bar", "open",
]);

function generateKJSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildKJProfiles(): KJProfile[] {
  const kjMap = new Map<string, KJProfile>();

  for (const event of karaokeEvents) {
    const kjName = event.dj.trim();
    if (!kjName || EXCLUDED_KJ_NAMES.has(kjName.toLowerCase())) continue;

    const slug = generateKJSlug(kjName);
    if (!slug) continue;

    if (!kjMap.has(slug)) {
      kjMap.set(slug, { name: kjName, slug, venueCount: 0, events: [] });
    }

    kjMap.get(slug)!.events.push({
      venueId: event.id,
      venueName: event.venueName,
      eventName: event.eventName,
      dayOfWeek: event.dayOfWeek,
      startTime: event.startTime,
      endTime: event.endTime,
      image: event.image,
      neighborhood: event.neighborhood,
      city: event.city,
    });
  }

  for (const profile of kjMap.values()) {
    profile.venueCount = new Set(profile.events.map((e) => e.venueName)).size;
  }

  return Array.from(kjMap.values());
}

const kjProfiles = buildKJProfiles();
export const kjs = kjProfiles;
const kjBySlug = new Map(kjProfiles.map((kj) => [kj.slug, kj]));
const kjByName = new Map(kjProfiles.map((kj) => [kj.name.toLowerCase(), kj]));

export function getKJBySlug(slug: string): KJProfile | null {
  return kjBySlug.get(slug) ?? null;
}

export function getKJSlugForName(name: string): string | null {
  const profile = kjByName.get(name.toLowerCase());
  return profile?.slug ?? null;
}

export function searchKJs(query: string): KJProfile[] {
  const q = query.toLowerCase();
  return kjProfiles.filter((kj) => kj.name.toLowerCase().includes(q));
}
`;

  // Build JSON-friendly events array for Supabase storage
  const parsedEvents: ParsedEvent[] = events.map((event) => {
    const id = slugify(`${event.venueName}-${event.dayOfWeek}`);
    const isPrivateRoom =
      event.dayOfWeek === "Private Room Karaoke" ||
      event.notes.toLowerCase().includes("private room");
    return {
      id,
      dayOfWeek: event.dayOfWeek,
      eventName: event.eventName,
      venueName: event.venueName,
      address: event.address,
      city: event.city,
      state: event.state,
      zipCode: event.zipCode,
      neighborhood: event.neighborhood,
      crossStreet: event.crossStreet,
      phone: event.phone,
      dj: event.dj,
      startTime: event.startTime,
      endTime: event.endTime,
      notes: event.notes,
      image: VENUE_IMAGES[id] || null,
      flyer: event.flyer || null,
      isPrivateRoom,
      bookingUrl: null,
      website: event.website || null,
    };
  });

  return { output, parsedEvents, eventCount: events.length, dayCount: dayOrder.length };
}

async function saveToSupabase(parsedEvents: ParsedEvent[], eventCount: number, dayCount: number) {
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Save the raw synced_events blob (existing behavior)
  const { error } = await adminSupabase
    .from("synced_events")
    .upsert({
      id: "latest",
      events_json: parsedEvents,
      event_count: eventCount,
      day_count: dayCount,
      synced_at: new Date().toISOString(),
    });

  if (error) throw new Error(`Database save failed: ${error.message}`);

  // --- Also sync to venues + venue_events tables ---

  // 1. Extract unique venues by name
  const uniqueVenues = new Map<string, ParsedEvent>();
  for (const event of parsedEvents) {
    if (event.venueName && !uniqueVenues.has(event.venueName.toLowerCase())) {
      uniqueVenues.set(event.venueName.toLowerCase(), event);
    }
  }

  // 2. Fetch existing venues from database
  const { data: existingVenues } = await adminSupabase
    .from("venues")
    .select("id, name");

  const venueNameToId = new Map<string, string>();
  for (const v of existingVenues ?? []) {
    venueNameToId.set(v.name.toLowerCase(), v.id);
  }

  // 3. Insert missing venues + update existing ones
  const newVenues: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    neighborhood: string;
    cross_street: string;
    phone: string;
    website: string | null;
    is_private_room: boolean;
  }> = [];

  for (const [lowerName, event] of uniqueVenues) {
    if (!venueNameToId.has(lowerName)) {
      newVenues.push({
        name: event.venueName,
        address: event.address || "",
        city: event.city || "New York",
        state: event.state || "New York",
        neighborhood: event.neighborhood || "",
        cross_street: event.crossStreet || "",
        phone: event.phone || "",
        website: event.website || null,
        is_private_room: event.isPrivateRoom,
      });
    } else {
      // Update existing venue details from the sheet
      const venueId = venueNameToId.get(lowerName)!;
      await adminSupabase
        .from("venues")
        .update({
          address: event.address || "",
          city: event.city || "New York",
          state: event.state || "New York",
          neighborhood: event.neighborhood || "",
          cross_street: event.crossStreet || "",
          phone: event.phone || "",
          website: event.website || null,
          is_private_room: event.isPrivateRoom,
        })
        .eq("id", venueId);
    }
  }

  if (newVenues.length > 0) {
    const { data: inserted, error: insertError } = await adminSupabase
      .from("venues")
      .insert(newVenues)
      .select("id, name");

    if (insertError) {
      console.error("Failed to insert venues:", insertError.message);
    } else if (inserted) {
      for (const v of inserted) {
        venueNameToId.set(v.name.toLowerCase(), v.id);
      }
    }
  }

  // 4. Upsert venue_events
  const eventRows: Array<{
    venue_id: string;
    day_of_week: string;
    event_name: string;
    dj: string;
    start_time: string;
    end_time: string;
    notes: string;
    is_active: boolean;
    recurrence_type: string;
    flyer_url: string | null;
  }> = [];

  for (const event of parsedEvents) {
    const venueId = venueNameToId.get(event.venueName.toLowerCase());
    if (!venueId) continue;
    if (!event.dayOfWeek) continue;

    eventRows.push({
      venue_id: venueId,
      day_of_week: event.dayOfWeek,
      event_name: event.eventName || "Karaoke Night",
      dj: event.dj || "",
      start_time: event.startTime || "",
      end_time: event.endTime || "",
      notes: event.notes || "",
      is_active: true,
      recurrence_type: "weekly",
      flyer_url: toDirectImageUrl(event.flyer || "") || null,
    });
  }

  let eventsSynced = 0;
  const dayCounts: Record<string, number> = {};

  if (eventRows.length > 0) {
    // Batch upsert in chunks of 50 to avoid request size limits
    for (let i = 0; i < eventRows.length; i += 50) {
      const batch = eventRows.slice(i, i + 50);
      const { error: eventError } = await adminSupabase
        .from("venue_events")
        .upsert(batch, {
          onConflict: "venue_id,day_of_week,event_name,start_time",
          ignoreDuplicates: false,
        });

      if (eventError) {
        console.error(`Failed to upsert venue_events batch ${i}:`, eventError.message);
      } else {
        eventsSynced += batch.length;
        for (const row of batch) {
          dayCounts[row.day_of_week] = (dayCounts[row.day_of_week] || 0) + 1;
        }
      }
    }
  }

  return { eventsSynced, dayCounts, venuesCreated: newVenues.length };
}

// POST: Sync from Google Sheet
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const sheetUrl = body.sheetUrl || DEFAULT_SHEET_URL;
    const columns: string[] | undefined = body.columns;

    let csvExportUrl: string;
    try {
      csvExportUrl = sheetUrlToCsvExport(sheetUrl);
    } catch {
      return NextResponse.json({
        success: false,
        message: "Invalid Google Sheet URL. Please provide a valid sheets.google.com link.",
      }, { status: 400 });
    }

    const response = await fetch(csvExportUrl, { redirect: "follow" });
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Failed to fetch sheet: ${response.status}`,
      });
    }

    const csvText = await response.text();
    const { parsedEvents, eventCount, dayCount } = generateMockData(csvText, columns);

    const syncResult = await saveToSupabase(parsedEvents, eventCount, dayCount);

    const dayBreakdown = Object.entries(syncResult.dayCounts)
      .map(([day, count]) => `${day}: ${count}`)
      .join(", ");

    return NextResponse.json({
      success: true,
      message: `Synced ${eventCount} events across ${dayCount} days from Google Sheet. ${syncResult.eventsSynced} events saved to venue_events table (${dayBreakdown}). ${syncResult.venuesCreated} new venues created. Changes are live immediately!`,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}

// PUT: Upload CSV file
export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({
        success: false,
        message: "No CSV file provided",
      }, { status: 400 });
    }

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      return NextResponse.json({
        success: false,
        message: "Please upload a .csv file",
      }, { status: 400 });
    }

    const columnsRaw = formData.get("columns");
    let columns: string[] | undefined;
    if (columnsRaw && typeof columnsRaw === "string") {
      try {
        columns = JSON.parse(columnsRaw);
      } catch {
        // Ignore invalid JSON, use default mapping
      }
    }

    const csvText = await file.text();
    const { parsedEvents, eventCount, dayCount } = generateMockData(csvText, columns);

    const syncResult = await saveToSupabase(parsedEvents, eventCount, dayCount);

    const dayBreakdown = Object.entries(syncResult.dayCounts)
      .map(([day, count]) => `${day}: ${count}`)
      .join(", ");

    return NextResponse.json({
      success: true,
      message: `Uploaded ${eventCount} events across ${dayCount} days from "${file.name}". ${syncResult.eventsSynced} events saved to venue_events table (${dayBreakdown}). ${syncResult.venuesCreated} new venues created. Changes are live immediately!`,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}
