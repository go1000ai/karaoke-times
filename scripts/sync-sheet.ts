/**
 * Syncs karaoke event data from Google Sheets CSV into lib/mock-data.ts
 *
 * Usage: npx tsx scripts/sync-sheet.ts
 */

import * as fs from "fs";
import * as path from "path";

const SHEET_ID = "1Hjvo1uMhxtvTcnHNzHaCH9Qq-lbIqRV3Kag5vzSukFk";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

interface RawRow {
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
  // Last row
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

async function main() {
  console.log("Fetching Google Sheet CSV...");
  const response = await fetch(CSV_URL, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    throw new Error("Sheet appears empty or has no data rows");
  }

  // Skip header row
  const headers = rows[0];
  console.log(`Found ${rows.length - 1} data rows`);
  console.log("Headers:", headers.join(", "));

  const events: RawRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue; // skip empty rows

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

  console.log(`Parsed ${events.length} events`);

  // Collect unique days for DAY_ORDER
  const daySet = new Set<string>();
  events.forEach((e) => daySet.add(e.dayOfWeek));
  const standardDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const extraDays = [...daySet].filter((d) => !standardDays.includes(d));
  const dayOrder = [...standardDays.filter((d) => daySet.has(d)), ...extraDays];

  // Generate the mock-data.ts file
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

  // Group by day for readability
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
    image: null,
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

  const outPath = path.join(__dirname, "..", "lib", "mock-data.ts");
  fs.writeFileSync(outPath, output, "utf-8");
  console.log(`\nWrote ${events.length} events to lib/mock-data.ts`);
  console.log(`Days: ${dayOrder.join(", ")}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
