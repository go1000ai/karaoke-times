import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { BookingsList } from "./BookingsList";
import { SingerBookingsList } from "./SingerBookingsList";

async function getUserRole(userId: string, supabase: any) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "venue_owner") return "venue_owner";
  if (profile?.role === "admin") return "admin";

  const { data: staffRecord } = await supabase
    .from("venue_staff")
    .select("id")
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (staffRecord) return "kj";
  return "user";
}

export default async function BookingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const role = await getUserRole(user.id, supabase);

  // Singer: show their own bookings
  if (role === "user") {
    const { data: bookings } = await supabase
      .from("room_bookings")
      .select("id, date, start_time, end_time, party_size, status, venues(name)")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    return <SingerBookingsList bookings={bookings ?? []} />;
  }

  // Owner/KJ/Admin: show venue bookings
  const { venue } = await getDashboardVenue(user.id);

  const { data: bookings } = await supabase
    .from("room_bookings")
    .select("id, date, start_time, end_time, party_size, status, profiles(display_name)")
    .eq("venue_id", venue?.id || "")
    .order("date", { ascending: true });

  return <BookingsList bookings={bookings ?? []} />;
}
