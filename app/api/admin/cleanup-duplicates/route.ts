import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all events with venue names
  const { data: allEvents, error } = await supabase
    .from("venue_events")
    .select("id, venue_id, day_of_week, event_name, dj, start_time, end_time, flyer_url, is_active, created_at, venues(name)")
    .order("created_at", { ascending: true });

  if (error || !allEvents) {
    return NextResponse.json({ success: false, message: "Failed to fetch events: " + (error?.message || "unknown") });
  }

  // Group events by venue_id + day_of_week
  const groups = new Map<string, typeof allEvents>();
  for (const event of allEvents) {
    const key = `${event.venue_id}|||${event.day_of_week}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }

  const duplicateIds: string[] = [];
  const duplicateDetails: string[] = [];

  for (const [, events] of groups) {
    if (events.length <= 1) continue;

    // Keep the "best" event: prefer one with flyer_url, then the oldest (first created)
    const sorted = [...events].sort((a, b) => {
      // Prefer events with flyers
      if (a.flyer_url && !b.flyer_url) return -1;
      if (!a.flyer_url && b.flyer_url) return 1;
      // Prefer active events
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      // Keep the oldest (first created)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const keeper = sorted[0];
    const toRemove = sorted.slice(1);

    for (const dup of toRemove) {
      duplicateIds.push(dup.id);
      const venueName = (dup.venues as any)?.name || "Unknown";
      duplicateDetails.push(`${venueName} — ${dup.day_of_week}: "${dup.event_name}" (keeping "${keeper.event_name}")`);
    }
  }

  if (duplicateIds.length === 0) {
    return NextResponse.json({ success: true, message: "No duplicates found! All events are unique per venue + day." });
  }

  // Delete duplicates
  const { error: deleteError } = await supabase
    .from("venue_events")
    .delete()
    .in("id", duplicateIds);

  if (deleteError) {
    return NextResponse.json({ success: false, message: "Failed to delete duplicates: " + deleteError.message });
  }

  return NextResponse.json({
    success: true,
    message: `Removed ${duplicateIds.length} duplicate events. Kept 1 event per venue + day.`,
    details: duplicateDetails,
  });
}
