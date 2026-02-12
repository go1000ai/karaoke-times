import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { BookingsList } from "./BookingsList";

export default async function BookingsPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { venue } = await getDashboardVenue(user.id);

  const { data: bookings } = await supabase
    .from("room_bookings")
    .select("id, date, start_time, end_time, party_size, status, profiles(display_name)")
    .eq("venue_id", venue?.id || "")
    .order("date", { ascending: true });

  return <BookingsList bookings={bookings ?? []} />;
}
