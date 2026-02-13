import { createClient } from "@/lib/supabase/server";
import { BookingsList } from "./BookingsList";

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("room_bookings")
    .select("id, venue_id, user_id, date, start_time, end_time, party_size, status, created_at, venues(name), profiles(display_name)")
    .order("date", { ascending: false });

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .order("name");

  return (
    <BookingsList
      bookings={(bookings ?? []) as any[]}
      venues={(venues ?? []) as { id: string; name: string }[]}
    />
  );
}
