"use server";

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { karaokeEvents } from "@/lib/mock-data";

export async function POST() {
  // Verify admin
  const serverSupabase = await createServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  // Use service role for unrestricted DB access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let venuesCreated = 0;
  let eventsCreated = 0;
  let eventsSkipped = 0;

  // Group mock events by venue name + address to create unique venues
  const venueMap = new Map<string, (typeof karaokeEvents)[0]>();
  for (const event of karaokeEvents) {
    const key = `${event.venueName}|||${event.address}`;
    if (!venueMap.has(key)) {
      venueMap.set(key, event);
    }
  }

  // Fetch existing venues by name to avoid duplicates
  const { data: existingVenues } = await supabase
    .from("venues")
    .select("id, name, address");

  const venueNameToId = new Map<string, string>();
  for (const v of existingVenues ?? []) {
    // Key by lowercase name + address for matching
    const key = `${v.name.toLowerCase().trim()}|||${v.address.toLowerCase().trim()}`;
    venueNameToId.set(key, v.id);
    // Also key by just name for looser matching
    venueNameToId.set(v.name.toLowerCase().trim(), v.id);
  }

  // Create venues that don't exist yet
  for (const [, event] of venueMap) {
    const exactKey = `${event.venueName.toLowerCase().trim()}|||${event.address.toLowerCase().trim()}`;
    const nameKey = event.venueName.toLowerCase().trim();

    if (!venueNameToId.has(exactKey) && !venueNameToId.has(nameKey)) {
      const { data: newVenue, error } = await supabase
        .from("venues")
        .insert({
          name: event.venueName,
          address: event.address,
          city: event.city || "New York",
          state: event.state || "New York",
          zip_code: event.zipCode || "",
          neighborhood: event.neighborhood || "",
          cross_street: event.crossStreet || "",
          phone: event.phone || "",
          website: event.website || null,
          is_private_room: event.isPrivateRoom || false,
        })
        .select("id")
        .single();

      if (newVenue && !error) {
        venueNameToId.set(exactKey, newVenue.id);
        venueNameToId.set(nameKey, newVenue.id);
        venuesCreated++;
      }
    }
  }

  // Fetch existing events to avoid duplicates
  const { data: existingEvents } = await supabase
    .from("venue_events")
    .select("venue_id, day_of_week, event_name");

  const existingEventKeys = new Set<string>();
  for (const e of existingEvents ?? []) {
    existingEventKeys.add(`${e.venue_id}|||${e.day_of_week}`);
  }

  // Create events for each mock data entry
  for (const event of karaokeEvents) {
    const exactKey = `${event.venueName.toLowerCase().trim()}|||${event.address.toLowerCase().trim()}`;
    const nameKey = event.venueName.toLowerCase().trim();
    const venueId = venueNameToId.get(exactKey) || venueNameToId.get(nameKey);

    if (!venueId) continue;

    const eventKey = `${venueId}|||${event.dayOfWeek}`;
    if (existingEventKeys.has(eventKey)) {
      eventsSkipped++;
      continue;
    }

    // Get existing image path as flyer_url if it exists
    const flyerUrl = event.image || null;

    const { error } = await supabase.from("venue_events").insert({
      venue_id: venueId,
      day_of_week: event.dayOfWeek,
      event_name: event.eventName || "Karaoke",
      dj: event.dj || null,
      start_time: event.startTime || null,
      end_time: event.endTime || null,
      notes: event.notes || null,
      flyer_url: flyerUrl,
      is_active: true,
    });

    if (!error) {
      existingEventKeys.add(eventKey);
      eventsCreated++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Import complete: ${venuesCreated} venues created, ${eventsCreated} events created, ${eventsSkipped} events already existed.`,
  });
}
