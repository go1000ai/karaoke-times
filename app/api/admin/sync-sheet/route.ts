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
  // Monday
  "fusion-east-monday": "/venues/fusion-east-monday.jpg",
  "footprints-cafe-monday": "/venues/footprints-cafe-monday.jpg",
  "native-monday": "/venues/native-monday.jpg",
  "saints-scholars-monday": "/venues/saints-scholars-monday.jpg",
  "sunset-bar-and-restaurant-monday": "/venues/sunset-bar-monday.jpg",
  "4807-church-monday": "/venues/gt-kingston-monday.jpg",
  "gt-kingston-monday": "/venues/gt-kingston-monday.jpg",
  "island-grill-cafe-monday": "/venues/island-grill-cafe-monday.jpg",
  "the-skinny-bar-and-lounge-monday": "/venues/skinny-bar-monday.jpg",
  "1683-bar-and-restaurant-monday": "/venues/1683-bar-monday.jpg",
  // Tuesday
  "pitch-tuesday": "/venues/pitch-tuesday.jpg",
  "blu-seafood-restaurant-tuesday": "/venues/blu-seafood-tuesday.jpg",
  "metropolitan-bar-tuesday": "/venues/metropolitan-bar-tuesday.jpg",
  "the-oval-sports-bar-and-lounge-tuesday": "/venues/oval-sports-lounge-tuesday.jpg",
  "harlem-nights-tuesday": "/venues/harlem-nights-bar-tuesday.jpg",
  "mo-s-bar-tuesday": "/venues/mos-bar-tuesday.jpg",
  "drink-lounge-tuesday": "/venues/drink-lounge-tuesday.jpg",
  // Wednesday
  "patrick-steakhouse-wednesday": "/venues/patrick-steakhouse-wednesday.jpg",
  "poseidon-wednesday": "/venues/poseidon-wednesday.jpg",
  "havana-cafe-wednesday": "/venues/havana-cafe-wednesday.jpg",
  "havana-room-wednesday": "/venues/havana-room-wednesday.jpg",
  "buck-it-sports-latin-grill-wednesday": "/venues/buck-it-sports-latin-grill-wednesday.jpg",
  "my-place-tavern-wednesday": "/venues/my-place-tavern-wednesday.jpg",
  "gt-kingston-wednesday": "/venues/gt-kingston-wednesday.jpg",
  "lagos-times-square-wednesday": "/venues/lagos-times-square-wednesday.jpg",
  "mc-shane-s-pub-restaurant-wednesday": "/venues/mc-shane-s-pub-restaurant-wednesday.jpg",
  "hamilton-hall-wednesday": "/venues/hamilton-hall-wednesday.jpg",
  "canz-bohemia-wednesday": "/venues/canz-bohemia-wednesday.jpg",
  // Thursday
  "ocean-prime-thursday": "/venues/ocean-prime-thursday.jpg",
  "fusion-east-thursday": "/venues/fusion-east-thursday.jpg",
  "prohibition-thursday": "/venues/prohibition-thursday.jpg",
  "curly-wolf-saloon-thursday": "/venues/curly-wolf-saloon-thursday.jpg",
  "frontline-bar-and-lounge-thursday": "/venues/frontline-thursday.jpg",
  "pour-choices-thursday": "/venues/pour-choices-thursday.jpg",
  "the-rabbit-hole-thursday": "/venues/rabbit-hole-thursday.jpg",
  "tubby-hook-tavern-thursday": "/venues/tubby-hook-tavern-thursday.jpg",
  "maloney-s-bar-thursday": "/venues/maloneys-bar-thursday.jpg",
  // Friday
  "it-s-about-time-cocktail-lounge-friday": "/venues/it-s-about-time-cocktail-lounge-friday.jpg",
  "good-company-friday": "/venues/good-company-friday.jpg",
  "allan-s-bakery-friday": "/venues/allan-s-bakery-friday.jpg",
  "american-legion-hall-friday": "/venues/american-legion-hall-friday.jpg",
  "woodzy-friday": "/venues/woodzy-friday.jpg",
  "essence-bar-grill-friday": "/venues/essence-bar-grill-friday.jpg",
  "ocean-prime-friday": "/venues/ocean-prime-friday.jpg",
  "the-blue-room-friday": "/venues/blu-room-friday.jpg",
  "klassique-restaurant-friday": "/venues/klassique-friday.jpg",
  "sylk-cove-lounge-friday": "/venues/silkcove-friday.jpg",
  "sissy-mcginty-s-friday": "/venues/sissy-mcgintys-friday.jpg",
  "the-corner-lounge-bistro-friday": "/venues/corner-bistro-friday.jpeg",
  "instant-reply-sports-bar-friday": "/venues/instant-reply-sports-bar-friday.jpg",
  // Saturday
  "la-cocina-boriqua-saturday": "/venues/la-cocina-boriqua-saturday.jpg",
  "whisky-red-s-saturday": "/venues/whisky-red-s-saturday.jpg",
  "moonlight-pub-saturday": "/venues/moonlight-pub-saturday.jpg",
  "irish-american-pub-saturday": "/venues/irish-american-pub-saturday.jpg",
  "the-courtyard-ale-house-saturday": "/venues/courtyard-ale-house-saturday.jpg",
  "shenanigans-pub-saturday": "/venues/shenanigans-saturday.jpg",
  "the-c-list-saturday": "/venues/c-list-cocktail-bar-saturday.jpg",
  "the-brew-house-saturday": "/venues/brew-house-saturday.jpg",
  "charlie-meaney-s-saturday": "/venues/charlie-meaneys-saturday.jpg",
  "essence-bar-grill-saturday": "/venues/essence-bar-grill-saturday.jpg",
  // Sunday
  "333-lounge-and-restaurant-sunday": "/venues/333-lounge-and-restaurant-sunday.jpg",
  "stop-at-the-spot-sunday": "/venues/stop-at-the-spot-sunday.jpg",
  "the-backyard-sunday": "/venues/the-backyard-sunday.jpg",
  "pitants-sports-bar-sunday": "/venues/pitants-sports-bar-sunday.jpg",
  "la-mode-bk-sunday": "/venues/la-mode-bk-sunday.jpg",
  "frontline-bar-and-lounge-sunday": "/venues/frontline-sunday.jpg",
  "my-place-tavern-sunday": "/venues/my-place-tavern-sunday.jpg",
  // Private Room / Special
  "sing-sing-karaoke-private-room-karaoke": "/venues/sing-sing-avenue-a.jpg",
  "singsing-karaoke-bar-and-chicken-private-room-karaoke": "/venues/singsing-karaoke-bar-and-chicken.jpg",
  "boho-karaoke-private-room-karaoke": "/venues/boho-karaoke.jpg",
  "aux-karaoke-private-room-karaoke": "/venues/aux-karaoke.jpg",
  "anytime-karaoke-private-room-karaoke": "/venues/anytime-karaoke.jpg",
  "rpm-underground-private-room-karaoke": "/venues/rpm-underground.jpg",
  "ms-kims-private-room-karaoke": "/venues/ms-kims.jpg",
  "karaoke-shout-private-room-karaoke": "/venues/karaoke-shout.jpg",
  "233-starr-karaoke-and-eats-private-room-karaoke": "/venues/233-starr-karaoke-and-eats.jpg",
  "101-ktv-bar-lounge-private-room-karaoke": "/venues/101-ktv-bar-lounge.jpg",
  "lilah-s-bar-and-grill-bi-monthly-sundays": "/venues/lilah-s-bar-and-grill-bi-monthly-sundays.jpg",
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

// Normalize venue name for matching: lowercase, collapse whitespace, "&" ↔ "and"
function normalizeVenueName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

// Aggressive normalization: also strips common venue suffixes for fuzzy matching
// "Harlem Nights Bar" and "Harlem Nights" both become "harlem nights"
const VENUE_SUFFIX_RE = /\b(bar|lounge|restaurant|grill|pub|cafe|tavern|saloon|club|bistro|inn|house|room|kitchen|eatery|steakhouse)\b/gi;
function fuzzyVenueName(name: string): string {
  return normalizeVenueName(name)
    .replace(VENUE_SUFFIX_RE, "")
    .replace(/['']/g, "")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize day-of-week: handle plurals, non-standard names, and case variations
const SYNC_DAY_NORMALIZE: Record<string, string> = {
  mondays: "Monday", tuesdays: "Tuesday", wednesdays: "Wednesday",
  thursdays: "Thursday", fridays: "Friday", saturdays: "Saturday", sundays: "Sunday",
  "bi monthly sundays": "Sunday", "bi-monthly sundays": "Sunday",
  "every 3rd monday": "Monday", "1st and 3rd mondays": "Monday",
  "every 1st and 3rd saturdays": "Saturday", "monthly fridays": "Friday",
  "open karaoke party room": "Private Room Karaoke",
};
function normalizeDay(day: string): string {
  if (!day) return day;
  const lookup = SYNC_DAY_NORMALIZE[day.toLowerCase().trim()];
  if (lookup) return lookup;
  // Title-case and strip trailing 's' for simple plurals (e.g. "Fridays" → "Friday")
  const trimmed = day.trim();
  const singular = trimmed.replace(/s$/i, "");
  const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  for (const d of VALID_DAYS) {
    if (d.toLowerCase() === singular.toLowerCase()) return d;
    if (d.toLowerCase() === trimmed.toLowerCase()) return d;
  }
  return trimmed;
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

  // 1. Extract unique venues by normalized name (handles "&" vs "And", casing, etc.)
  const uniqueVenues = new Map<string, ParsedEvent>();
  for (const event of parsedEvents) {
    const norm = normalizeVenueName(event.venueName);
    if (norm && !uniqueVenues.has(norm)) {
      uniqueVenues.set(norm, event);
    }
  }

  // 2. Fetch existing venues from database
  const { data: existingVenues } = await adminSupabase
    .from("venues")
    .select("id, name");

  const venueNameToId = new Map<string, string>();
  const fuzzyNameToId = new Map<string, string>(); // fuzzy name → first venue ID
  const duplicateVenueIds: string[] = []; // IDs of duplicate venues to clean up
  for (const v of existingVenues ?? []) {
    const norm = normalizeVenueName(v.name);
    const fuzzy = fuzzyVenueName(v.name);
    if (venueNameToId.has(norm)) {
      // Exact duplicate — reassign its events to the first one, then delete it
      const keepId = venueNameToId.get(norm)!;
      await adminSupabase
        .from("venue_events")
        .update({ venue_id: keepId })
        .eq("venue_id", v.id);
      duplicateVenueIds.push(v.id);
    } else if (fuzzyNameToId.has(fuzzy) && !venueNameToId.has(norm)) {
      // Fuzzy duplicate (e.g. "Harlem Nights Bar" vs "Harlem Nights")
      const keepId = fuzzyNameToId.get(fuzzy)!;
      console.log(`Fuzzy duplicate: "${v.name}" matches existing venue (ID ${keepId.slice(0, 8)}), merging`);
      await adminSupabase
        .from("venue_events")
        .update({ venue_id: keepId })
        .eq("venue_id", v.id);
      duplicateVenueIds.push(v.id);
      // Also map the exact name so lookups work
      venueNameToId.set(norm, keepId);
    } else {
      venueNameToId.set(norm, v.id);
      if (!fuzzyNameToId.has(fuzzy)) fuzzyNameToId.set(fuzzy, v.id);
    }
  }

  // Delete duplicate venues
  if (duplicateVenueIds.length > 0) {
    for (const dupId of duplicateVenueIds) {
      await adminSupabase.from("venues").delete().eq("id", dupId);
    }
    console.log(`Cleaned up ${duplicateVenueIds.length} duplicate venue(s)`);
  }

  // 3. Insert missing venues + update existing ones
  const newVenues: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    neighborhood: string;
    cross_street: string;
    phone: string;
    website: string | null;
    is_private_room: boolean;
  }> = [];

  for (const [normName, event] of uniqueVenues) {
    // Try fuzzy match if exact match fails
    if (!venueNameToId.has(normName)) {
      const fuzzy = fuzzyVenueName(event.venueName);
      if (fuzzyNameToId.has(fuzzy)) {
        venueNameToId.set(normName, fuzzyNameToId.get(fuzzy)!);
      }
    }
    if (!venueNameToId.has(normName)) {
      newVenues.push({
        name: event.venueName,
        address: event.address || "",
        city: event.city || "New York",
        state: event.state || "New York",
        zip_code: event.zipCode || "",
        neighborhood: event.neighborhood || "",
        cross_street: event.crossStreet || "",
        phone: event.phone || "",
        website: event.website || null,
        is_private_room: event.isPrivateRoom,
      });
    } else {
      // Update existing venue details from the sheet
      const venueId = venueNameToId.get(normName)!;
      await adminSupabase
        .from("venues")
        .update({
          address: event.address || "",
          city: event.city || "New York",
          state: event.state || "New York",
          zip_code: event.zipCode || "",
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
        venueNameToId.set(normalizeVenueName(v.name), v.id);
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
    const venueId = venueNameToId.get(normalizeVenueName(event.venueName));
    if (!venueId) continue;
    if (!event.dayOfWeek) continue;

    eventRows.push({
      venue_id: venueId,
      day_of_week: normalizeDay(event.dayOfWeek),
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

  // Deduplicate eventRows by venue_id + day_of_week (prevent "Karaoke Monday's" vs "Karaoke Mondays" duplicates)
  // When duplicates exist, prefer the entry with a flyer_url
  const eventDedup = new Map<string, (typeof eventRows)[0]>();
  for (const row of eventRows) {
    const key = `${row.venue_id}|${row.day_of_week}`;
    const existing = eventDedup.get(key);
    if (!existing || (!existing.flyer_url && row.flyer_url)) {
      eventDedup.set(key, row);
    }
  }
  const dedupedBefore = eventRows.length;
  eventRows.length = 0;
  eventRows.push(...eventDedup.values());
  if (dedupedBefore > eventRows.length) {
    console.log(`Deduped ${dedupedBefore - eventRows.length} duplicate venue+day events`);
  }

  // Preserve admin-uploaded flyer_urls that would otherwise be overwritten with null
  const { data: existingEventsWithFlyers } = await adminSupabase
    .from("venue_events")
    .select("venue_id, day_of_week, event_name, start_time, flyer_url")
    .not("flyer_url", "is", null);

  if (existingEventsWithFlyers?.length) {
    const flyerMap = new Map<string, string>();
    for (const e of existingEventsWithFlyers) {
      const key = `${e.venue_id}|${e.day_of_week}|${e.event_name}|${e.start_time}`;
      if (e.flyer_url) flyerMap.set(key, e.flyer_url);
    }
    for (const row of eventRows) {
      if (!row.flyer_url) {
        const key = `${row.venue_id}|${row.day_of_week}|${row.event_name}|${row.start_time}`;
        row.flyer_url = flyerMap.get(key) || null;
      }
    }
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

  // Enrich parsedEvents with flyer_urls so homepage cards show flyers
  // Build reverse map: venue_id → normalized venue name
  const idToNormName = new Map<string, string>();
  for (const [norm, vid] of venueNameToId) {
    idToNormName.set(vid, norm);
  }

  // Build map of event slugs → flyer_url from the final eventRows
  for (const row of eventRows) {
    if (!row.flyer_url) continue;
    const normName = idToNormName.get(row.venue_id);
    if (!normName) continue;
    // Find matching parsedEvent by normalized name + day
    for (const pe of parsedEvents) {
      if (normalizeVenueName(pe.venueName) === normName && pe.dayOfWeek === row.day_of_week && !pe.image) {
        pe.image = row.flyer_url;
      }
    }
  }

  // Re-save synced_events with flyer images included
  await adminSupabase
    .from("synced_events")
    .upsert({
      id: "latest",
      events_json: parsedEvents,
      event_count: parsedEvents.length,
      day_count: Object.keys(dayCounts).length,
      synced_at: new Date().toISOString(),
    });

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
