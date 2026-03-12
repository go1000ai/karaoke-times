import { createClient } from "@/lib/supabase/server";
import { EventsList } from "./EventsList";
import { CreateEventForm } from "./CreateEventForm";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Normalize special schedule labels to their base day for grouping
function normalizeToBaseDay(day: string): string {
  if (DAY_ORDER.includes(day)) return day;
  const lower = day.toLowerCase();
  for (const d of DAY_ORDER) {
    if (lower.includes(d.toLowerCase())) return d;
  }
  return day;
}

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("venue_events")
    .select("id, venue_id, day_of_week, event_name, dj, start_time, end_time, is_active, notes, recurrence_type, event_date, flyer_url, happy_hour_details, age_restriction, dress_code, cover_charge, drink_minimum, restrictions, website, venues(name)")
    .order("start_time", { ascending: true });

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .order("name");

  // Group by base day — special schedules like "Every 3rd Monday" go under "Monday"
  const grouped: Record<string, any[]> = {};
  DAY_ORDER.forEach((day) => { grouped[day] = []; });

  (events ?? []).forEach((e: any) => {
    const baseDay = normalizeToBaseDay(e.day_of_week || "Unknown");
    if (!grouped[baseDay]) grouped[baseDay] = [];
    grouped[baseDay].push(e);
  });

  // Fetch upcoming event skips
  const eventIds = (events ?? []).map((e: any) => e.id);
  const { data: skips } = eventIds.length > 0
    ? await supabase
        .from("event_skips")
        .select("id, event_id, skip_date, reason, created_by")
        .in("event_id", eventIds)
        .gte("skip_date", new Date().toISOString().split("T")[0])
        .order("skip_date")
    : { data: [] };

  const activeCount = (events ?? []).filter((e: any) => e.is_active !== false).length;
  const venueSet = new Set((events ?? []).map((e: any) => e.venue_id));

  return (
    <>
      <CreateEventForm venues={(venues ?? []) as { id: string; name: string }[]} />
      <EventsList
        groupedEvents={grouped}
        venues={(venues ?? []) as { id: string; name: string }[]}
        totalActive={activeCount}
        totalVenues={venueSet.size}
        dayOrder={DAY_ORDER}
        skips={(skips ?? []) as { id: string; event_id: string; skip_date: string; reason: string | null; created_by: string | null }[]}
      />
    </>
  );
}
