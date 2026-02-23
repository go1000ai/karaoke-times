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
      return NextResponse.json({
        events: data.events_json,
        synced_at: data.synced_at,
      });
    }

    return NextResponse.json({ events: null });
  } catch {
    return NextResponse.json({ events: null });
  }
}
