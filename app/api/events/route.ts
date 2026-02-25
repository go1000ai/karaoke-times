import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Normalize venue names: "And" ↔ "&", trim, collapse whitespace
const normalizeName = (n: string) =>
  n.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();

// Public endpoint: returns synced events merged with venue_events from DB
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch synced events (CSV-sourced) and all active venue_events from DB in parallel
    const [syncResult, dbResult] = await Promise.all([
      supabase
        .from("synced_events")
        .select("events_json, synced_at")
        .eq("id", "latest")
        .single(),
      supabase
        .from("venue_events")
        .select("id, venue_id, day_of_week, event_name, dj, start_time, end_time, notes, flyer_url, is_active, venues(name, address, city, state, zip_code, neighborhood, cross_street, phone, website)")
        .neq("is_active", false),
    ]);

    const syncedEvents = (syncResult.data?.events_json && Array.isArray(syncResult.data.events_json))
      ? syncResult.data.events_json as Record<string, unknown>[]
      : [];

    // Deduplicate synced events
    const seen = new Set<string>();
    const events = syncedEvents.filter((e) => {
      const key = `${normalizeName((e.venueName as string) || "")}|${e.dayOfWeek || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Merge venue_events from DB that aren't already in synced_events
    const dbEvents = dbResult.data || [];
    for (const ve of dbEvents) {
      const venue = ve.venues as any;
      if (!venue?.name) continue;
      const key = `${normalizeName(venue.name)}|${ve.day_of_week || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({
        id: ve.id,
        dayOfWeek: ve.day_of_week,
        eventName: ve.event_name || "",
        venueName: venue.name,
        address: venue.address || "",
        city: venue.city || "",
        state: venue.state || "",
        zipCode: venue.zip_code || "",
        neighborhood: venue.neighborhood || "",
        crossStreet: venue.cross_street || "",
        phone: venue.phone || "",
        dj: ve.dj || "",
        startTime: ve.start_time || "",
        endTime: ve.end_time || "",
        notes: ve.notes || "",
        image: ve.flyer_url || null,
        website: venue.website || null,
        isPrivateRoom: false,
        bookingUrl: null,
      });
    }

    // Enrich events missing images with flyer_url from DB
    const eventsWithoutImages = events.filter((e) => !e.image);
    if (eventsWithoutImages.length > 0 && dbEvents.length > 0) {
      const flyerMap = new Map<string, string>();
      for (const ve of dbEvents) {
        const name = (ve.venues as any)?.name;
        if (name && ve.flyer_url) {
          flyerMap.set(`${normalizeName(name)}|${ve.day_of_week}`, ve.flyer_url);
        }
      }
      for (const ev of events) {
        if (!ev.image && ev.venueName && ev.dayOfWeek) {
          const key = `${normalizeName(ev.venueName as string)}|${ev.dayOfWeek}`;
          const flyer = flyerMap.get(key);
          if (flyer) ev.image = flyer;
        }
      }
    }

    if (events.length > 0) {
      return NextResponse.json({
        events,
        synced_at: syncResult.data?.synced_at || new Date().toISOString(),
      });
    }

    return NextResponse.json({ events: null });
  } catch {
    return NextResponse.json({ events: null });
  }
}
