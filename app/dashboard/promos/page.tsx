import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { PromosList } from "./PromosList";

export default async function PromosPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { venue, isOwner } = await getDashboardVenue(user.id);

  const { data: promos } = await supabase
    .from("venue_promos")
    .select("id, title, description, start_date, end_date, is_active")
    .eq("venue_id", venue?.id || "")
    .order("created_at", { ascending: false });

  return <PromosList promos={promos ?? []} isOwner={isOwner} />;
}
