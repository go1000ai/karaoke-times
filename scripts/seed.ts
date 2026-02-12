/**
 * Seed script — migrates the 49 static karaoke events into Supabase.
 *
 * Run with: npx tsx scripts/seed.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and a SUPABASE_SERVICE_ROLE_KEY in .env.local
 * (service role key bypasses RLS for seeding).
 */

import { createClient } from "@supabase/supabase-js";
import { karaokeEvents } from "../lib/mock-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log(`Seeding ${karaokeEvents.length} events...`);

  // Group events by venue name + address to deduplicate venues
  // (same venue can have events on multiple days, e.g. Fusion East Mon + Thu)
  const venueMap = new Map<
    string,
    {
      name: string;
      address: string;
      city: string;
      state: string;
      neighborhood: string;
      crossStreet: string;
      phone: string;
      isPrivateRoom: boolean;
      bookingUrl: string | null;
      image: string | null;
      events: typeof karaokeEvents;
    }
  >();

  for (const event of karaokeEvents) {
    const key = `${event.venueName}||${event.address}`;
    if (!venueMap.has(key)) {
      venueMap.set(key, {
        name: event.venueName,
        address: event.address,
        city: event.city,
        state: event.state,
        neighborhood: event.neighborhood,
        crossStreet: event.crossStreet,
        phone: event.phone,
        isPrivateRoom: event.isPrivateRoom,
        bookingUrl: event.bookingUrl,
        image: event.image,
        events: [],
      });
    }
    venueMap.get(key)!.events.push(event);
  }

  console.log(`Found ${venueMap.size} unique venues`);

  let venueCount = 0;
  let eventCount = 0;
  let mediaCount = 0;

  for (const [, venue] of venueMap) {
    // Insert venue
    const { data: insertedVenue, error: venueError } = await supabase
      .from("venues")
      .insert({
        name: venue.name,
        address: venue.address,
        city: venue.city,
        state: venue.state,
        neighborhood: venue.neighborhood,
        cross_street: venue.crossStreet,
        phone: venue.phone,
        is_private_room: venue.isPrivateRoom,
        booking_url: venue.bookingUrl,
      })
      .select("id")
      .single();

    if (venueError) {
      console.error(`Error inserting venue ${venue.name}:`, venueError.message);
      continue;
    }

    const venueId = insertedVenue.id;
    venueCount++;

    // Insert events for this venue
    for (const event of venue.events) {
      const { error: eventError } = await supabase
        .from("venue_events")
        .insert({
          venue_id: venueId,
          day_of_week: event.dayOfWeek,
          event_name: event.eventName,
          dj: event.dj,
          start_time: event.startTime,
          end_time: event.endTime,
          notes: event.notes,
        });

      if (eventError) {
        console.error(`Error inserting event for ${venue.name}:`, eventError.message);
      } else {
        eventCount++;
      }
    }

    // Insert primary image if exists
    if (venue.image) {
      const { error: mediaError } = await supabase
        .from("venue_media")
        .insert({
          venue_id: venueId,
          url: venue.image,
          type: "image",
          is_primary: true,
          sort_order: 0,
        });

      if (mediaError) {
        console.error(`Error inserting media for ${venue.name}:`, mediaError.message);
      } else {
        mediaCount++;
      }
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`  Venues:  ${venueCount}`);
  console.log(`  Events:  ${eventCount}`);
  console.log(`  Media:   ${mediaCount}`);
}

seed().catch(console.error);
