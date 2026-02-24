import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public endpoint: returns synced events if available
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("synced_events")
      .select("events_json, synced_at")
      .eq("id", "latest")
      .single();

    if (data?.events_json && Array.isArray(data.events_json) && data.events_json.length > 0) {
      const events = data.events_json as Record<string, unknown>[];

      // Enrich events missing images with flyer_url from venue_events
      const eventsWithoutImages = events.filter((e) => !e.image);
      if (eventsWithoutImages.length > 0) {
        const { data: flyers } = await supabase
          .from("venue_events")
          .select("venue_id, day_of_week, flyer_url, venues(name)")
          .not("flyer_url", "is", null);

        if (flyers && flyers.length > 0) {
          // Build lookup: lowercase venueName + dayOfWeek → flyer_url
          const flyerMap = new Map<string, string>();
          for (const f of flyers) {
            const name = (f.venues as any)?.name;
            if (name && f.flyer_url) {
              flyerMap.set(`${name.toLowerCase()}|${f.day_of_week}`, f.flyer_url);
            }
          }

          for (const ev of events) {
            if (!ev.image && ev.venueName && ev.dayOfWeek) {
              const key = `${(ev.venueName as string).toLowerCase()}|${ev.dayOfWeek}`;
              const flyer = flyerMap.get(key);
              if (flyer) ev.image = flyer;
            }
          }
        }
      }

      return NextResponse.json({
        events,
        synced_at: data.synced_at,
      });
    }

    return NextResponse.json({ events: null });
  } catch {
    return NextResponse.json({ events: null });
  }
}
