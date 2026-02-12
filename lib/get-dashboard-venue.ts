import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Get the active venue for the current dashboard user.
 * - Owners: returns their owned venue
 * - KJs: returns the venue they selected (from cookie), or their first connected venue
 */
export async function getDashboardVenue(userId: string) {
  const supabase = await createClient();

  // Check if user is a venue owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isOwner = profile?.role === "venue_owner";

  if (isOwner) {
    const { data: venue } = await supabase
      .from("venues")
      .select("id, name")
      .eq("owner_id", userId)
      .single();
    return { venue, isOwner: true, allVenues: venue ? [venue] : [] };
  }

  // KJ: get all connected venues
  const { data: staffRecords } = await supabase
    .from("venue_staff")
    .select("venue_id, venues(id, name)")
    .eq("user_id", userId)
    .not("accepted_at", "is", null);

  const allVenues = (staffRecords ?? [])
    .map((s) => s.venues as unknown as { id: string; name: string })
    .filter(Boolean);

  if (allVenues.length === 0) {
    return { venue: null, isOwner: false, allVenues: [] };
  }

  // Check cookie for selected venue
  const cookieStore = await cookies();
  const activeVenueId = cookieStore.get("active_venue_id")?.value;

  // Use the cookie venue if it's one of their connected venues
  const selectedVenue = activeVenueId
    ? allVenues.find((v) => v.id === activeVenueId)
    : null;

  return {
    venue: selectedVenue || allVenues[0],
    isOwner: false,
    allVenues,
  };
}
