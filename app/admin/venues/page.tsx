import { createClient } from "@/lib/supabase/server";
import { VenuesList } from "./VenuesList";

export default async function AdminVenuesPage() {
  const supabase = await createClient();

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, address, city, state, neighborhood, owner_id, created_at, profiles(display_name)")
    .order("name");

  // Get event counts per venue
  const { data: events } = await supabase
    .from("venue_events")
    .select("venue_id");

  const eventCounts: Record<string, number> = {};
  (events ?? []).forEach((e) => {
    eventCounts[e.venue_id] = (eventCounts[e.venue_id] || 0) + 1;
  });

  const venuesWithCounts = (venues ?? []).map((v) => ({
    ...v,
    _event_count: eventCounts[v.id] || 0,
  }));

  // Get venue owners for assignment dropdown
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("role", ["venue_owner", "admin"]);

  return (
    <VenuesList
      venues={venuesWithCounts}
      owners={owners ?? []}
    />
  );
}
