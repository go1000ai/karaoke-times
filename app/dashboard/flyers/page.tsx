import { requireVenueOwner } from "@/lib/auth";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { createClient } from "@/lib/supabase/server";
import FlyerGenerator from "./FlyerGenerator";
import SavedFlyers from "./SavedFlyers";
import FlyerTabs from "./FlyerTabs";

export default async function FlyersPage() {
  const user = await requireVenueOwner();
  const { venue } = await getDashboardVenue(user.id);
  const supabase = await createClient();

  // Fetch all venues so the user can generate flyers for any venue
  const { data: venueRows } = await supabase
    .from("venues")
    .select("id, name, address")
    .order("name");

  const allVenues = (venueRows ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address || "",
  }));

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
          />
        }
        savedTab={<SavedFlyers />}
      />
    </div>
  );
}
