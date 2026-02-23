import { createClient } from "@/lib/supabase/server";
import { EventsList } from "./EventsList";
import { CreateEventForm } from "./CreateEventForm";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("venue_events")
    .select("id, venue_id, day_of_week, event_name, dj, start_time, end_time, is_active, notes, venues(name)")
    .order("start_time", { ascending: true });

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .order("name");

  // Group by day
  const grouped: Record<string, any[]> = {};
  DAY_ORDER.forEach((day) => { grouped[day] = []; });

  (events ?? []).forEach((e: any) => {
    const day = e.day_of_week || "Unknown";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });

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
      />
    </>
  );
}
