import { requireVenueOwner } from "@/lib/auth";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { createClient } from "@/lib/supabase/server";
import FlyerGenerator from "./FlyerGenerator";

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
      <p className="text-text-secondary text-sm mb-8">
        Describe your event and let AI create a professional promotional flyer.
      </p>
      <FlyerGenerator
        venues={allVenues}
        defaultVenueId={venue?.id || ""}
      />
    </div>
  );
}
