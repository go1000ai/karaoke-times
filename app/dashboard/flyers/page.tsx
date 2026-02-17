import { requireVenueOwner } from "@/lib/auth";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { createClient } from "@/lib/supabase/server";
import FlyerGenerator from "./FlyerGenerator";
import SavedFlyers from "./SavedFlyers";
import FlyerTabs from "./FlyerTabs";

export default async function FlyersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireVenueOwner();
  const { venue } = await getDashboardVenue(user.id);
  const supabase = await createClient();

  // Fetch all venues with city/state and primary logo
  const { data: venueRows } = await supabase
    .from("venues")
    .select("id, name, address, city, state, venue_media!inner(url)")
    .eq("venue_media.is_primary", true)
    .order("name");

  // Also fetch venues without a primary logo
  const { data: allVenueRows } = await supabase
    .from("venues")
    .select("id, name, address, city, state")
    .order("name");

  // Merge: use logo from first query, fill in rest from second
  const logoMap = new Map<string, string>();
  for (const v of venueRows ?? []) {
    const media = v.venue_media as unknown as { url: string }[];
    if (media?.[0]?.url) logoMap.set(v.id, media[0].url);
  }

  // Deduplicate venues by name (keep first occurrence)
  const seen = new Set<string>();
  const allVenues = (allVenueRows ?? [])
    .map((v) => ({
      id: v.id,
      name: v.name,
      address: v.address || "",
      city: v.city || "",
      state: v.state || "",
      logoUrl: logoMap.get(v.id) || "",
    }))
    .filter((v) => {
      const key = v.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">
        Flyer Generator
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        Create and manage AI-generated promotional flyers for your events.
      </p>
      <FlyerTabs
        generatorTab={
          <FlyerGenerator
            venues={allVenues}
            defaultVenueId={venue?.id || ""}
            defaults={params.eventName ? {
              eventName: params.eventName,
              eventDate: params.eventDate,
              startTime: params.startTime,
              endTime: params.endTime,
              coverCharge: params.coverCharge,
              dressCode: params.dressCode,
              drinkSpecials: params.drinkSpecials,
              dj: params.dj,
              notes: params.notes,
              ageRestriction: params.ageRestriction,
              promos: params.promos,
            } : undefined}
          />
        }
        savedTab={<SavedFlyers />}
      />
    </div>
  );
}
