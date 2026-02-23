import { requireKJOrOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventsList } from "./EventsList";
import { CreateVenueQuickForm } from "@/components/CreateVenueQuickForm";
import { createVenueFromDashboard } from "../actions";

export default async function EventsPage() {
  const ctx = await requireKJOrOwner();
  const supabase = await createClient();
  const isKJ = ctx.role === "kj";

  // Get ALL connected venues for this user
  let connectedVenues: { id: string; name: string; address: string; city: string }[] = [];

  if (isKJ) {
    // KJ: all accepted venue_staff connections
    const { data: staffRows } = await supabase
      .from("venue_staff")
      .select("venues(id, name, address, city)")
      .eq("user_id", ctx.user.id)
      .not("accepted_at", "is", null);

    connectedVenues = (staffRows ?? [])
      .map((s) => s.venues as unknown as { id: string; name: string; address: string; city: string })
      .filter(Boolean)
      .map((v) => ({
        id: v.id,
        name: v.name || "",
        address: v.address || "",
        city: v.city || "",
      }));
  } else {
    // Owner: their owned venue(s)
    const { data: ownedVenues } = await supabase
      .from("venues")
      .select("id, name, address, city")
      .eq("owner_id", ctx.user.id);

    connectedVenues = (ownedVenues ?? []).map((v) => ({
      id: v.id,
      name: v.name || "",
      address: v.address || "",
      city: v.city || "",
    }));
  }

  const venueIds = connectedVenues.map((v) => v.id);

  // Fetch ALL events across ALL connected venues
  const { data: events } = venueIds.length > 0
    ? await supabase
        .from("venue_events")
        .select("*, kj_user_id, venue_id")
        .in("venue_id", venueIds)
        .order("day_of_week")
    : { data: [] };

  // Fetch promos across all connected venues
  const { data: promos } = venueIds.length > 0
    ? await supabase
        .from("venue_promos")
        .select("id, title, description, is_active, event_id")
        .in("venue_id", venueIds)
        .not("event_id", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">
        {isKJ ? "My Events" : "Events"}
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        {isKJ
          ? "Manage your karaoke nights and their promos."
          : "Manage all karaoke event nights at your venue."}
      </p>

      <CreateVenueQuickForm onCreateVenue={createVenueFromDashboard} />

      <EventsList
        events={events ?? []}
        promos={promos ?? []}
        canEdit={true}
        currentUserId={ctx.user.id}
        isKJ={isKJ}
        venues={connectedVenues}
      />
    </div>
  );
}
