import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { BookingsList } from "./BookingsList";
import { SingerBookingsList } from "./SingerBookingsList";
import { KJBookingsCalendar } from "./KJBookingsCalendar";

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

  // Singer: show their room bookings + KJ booking requests
  if (role === "user") {
    const { data: bookings } = await supabase
      .from("room_bookings")
      .select("id, date, start_time, end_time, party_size, status, venues(name)")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    // KJ booking requests made by this singer
    const { data: kjRequests } = await supabase
      .from("kj_bookings")
      .select("id, kj_user_id, client_name, booking_type, event_date, start_time, end_time, location, status, request_source")
      .eq("requested_by", user.id)
      .order("event_date", { ascending: true });

    // Get KJ names for the requests
    const kjUserIds = [...new Set((kjRequests ?? []).map((r: any) => r.kj_user_id))];
    let kjNames: Record<string, string> = {};
    if (kjUserIds.length > 0) {
      const { data: kjProfiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", kjUserIds);
      for (const p of kjProfiles ?? []) {
        kjNames[p.id] = p.display_name || "KJ";
      }
    }

    return (
      <SingerBookingsList
        bookings={bookings ?? []}
        kjRequests={(kjRequests ?? []).map((r: any) => ({
          ...r,
          kj_name: kjNames[r.kj_user_id] || "KJ",
        }))}
      />
    );
  }

  // KJ: show calendar with public events + private bookings + incoming requests
  if (role === "kj") {
    const { data: staffRecords } = await supabase
      .from("venue_staff")
      .select("venue_id, venues(name)")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null);

    const venueNames: Record<string, string> = {};
    for (const s of staffRecords || []) {
      venueNames[s.venue_id] = (s.venues as any)?.name || "Unknown Venue";
    }

    const { data: publicEvents } = await supabase
      .from("venue_events")
      .select("id, day_of_week, event_name, start_time, end_time, venue_id, is_active")
      .eq("kj_user_id", user.id)
      .eq("is_active", true);

    // Get all bookings (self-created + incoming requests)
    const { data: privateBookings } = await supabase
      .from("kj_bookings")
      .select("*")
      .eq("kj_user_id", user.id)
      .order("event_date", { ascending: true });

    // Get requester names for incoming requests
    const requesterIds = [...new Set(
      (privateBookings ?? [])
        .filter((b: any) => b.requested_by)
        .map((b: any) => b.requested_by)
    )];
    let requesterNames: Record<string, string> = {};
    if (requesterIds.length > 0) {
      const { data: requesterProfiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", requesterIds);
      for (const p of requesterProfiles ?? []) {
        requesterNames[p.id] = p.display_name || "User";
      }
    }

    return (
      <KJBookingsCalendar
        publicEvents={(publicEvents ?? []).map((e: any) => ({
          ...e,
          venue_name: venueNames[e.venue_id] || "Venue",
        }))}
        privateBookings={(privateBookings ?? []).map((b: any) => ({
          ...b,
          requester_name: b.requested_by ? requesterNames[b.requested_by] || null : null,
        }))}
        kjUserId={user.id}
      />
    );
  }

  // Owner/Admin: show venue bookings + Book a KJ section
  const { venue } = await getDashboardVenue(user.id);

  const { data: bookings } = await supabase
    .from("room_bookings")
    .select("id, date, start_time, end_time, party_size, status, profiles(display_name)")
    .eq("venue_id", venue?.id || "")
    .order("date", { ascending: true });

  // Connected KJs for this venue
  const { data: connectedKJs } = await supabase
    .from("venue_staff")
    .select("user_id, profiles(display_name)")
    .eq("venue_id", venue?.id || "")
    .not("accepted_at", "is", null);

  // Owner's KJ booking requests
  const { data: ownerKJRequests } = await supabase
    .from("kj_bookings")
    .select("*")
    .eq("requested_by", user.id)
    .eq("request_source", "owner_request")
    .order("event_date", { ascending: true });

  // Get KJ names for requests
  const kjIds = [...new Set((ownerKJRequests ?? []).map((r: any) => r.kj_user_id))];
  let kjNameMap: Record<string, string> = {};
  if (kjIds.length > 0) {
    const { data: kjProfiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", kjIds);
    for (const p of kjProfiles ?? []) {
      kjNameMap[p.id] = p.display_name || "KJ";
    }
  }

  return (
    <BookingsList
      bookings={bookings ?? []}
      connectedKJs={(connectedKJs ?? []).map((k: any) => ({
        user_id: k.user_id,
        display_name: (k.profiles as any)?.display_name || "KJ",
      }))}
      venueId={venue?.id || ""}
      venueName={venue?.name || ""}
      ownerKJRequests={(ownerKJRequests ?? []).map((r: any) => ({
        ...r,
        kj_name: kjNameMap[r.kj_user_id] || "KJ",
      }))}
    />
  );
}
