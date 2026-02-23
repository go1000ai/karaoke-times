import { createClient } from "@/lib/supabase/server";
import { karaokeEvents as staticEvents, type KaraokeEvent } from "@/lib/mock-data";

/**
 * Fetches karaoke events from Supabase synced_events (if available),
 * falling back to the static mock-data.ts array.
 *
 * Use this in server components instead of importing karaokeEvents directly
 * when you want to pick up CSV/Google Sheet syncs done from the admin panel.
 */
export async function getKaraokeEvents(): Promise<KaraokeEvent[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("synced_events")
      .select("events_json")
      .eq("id", "latest")
      .single();

    if (data?.events_json && Array.isArray(data.events_json) && data.events_json.length > 0) {
      return data.events_json as KaraokeEvent[];
    }
  } catch {
    // Fall back to static data
  }

  return staticEvents;
}
