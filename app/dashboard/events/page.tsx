import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { EventsList } from "./EventsList";

export default async function EventsPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { venue, isOwner } = await getDashboardVenue(user.id);

  const { data: events } = await supabase
    .from("venue_events")
    .select("*")
    .eq("venue_id", venue?.id || "")
    .order("day_of_week");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Events</h1>
      <p className="text-text-secondary text-sm mb-8">
        {isOwner ? "Manage your karaoke event nights." : "View scheduled karaoke nights."}
      </p>

      <EventsList events={events ?? []} isOwner={isOwner} />
    </div>
  );
}
