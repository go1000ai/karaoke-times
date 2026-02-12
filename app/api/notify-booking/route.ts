import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { venueId, venueName, date, startTime, partySize } = await request.json();

  if (!venueId || !venueName) {
    return NextResponse.json({ error: "Missing venue info" }, { status: 400 });
  }

  // Use admin client to insert notifications (bypasses RLS)
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get venue owner
  const { data: venue } = await adminSupabase
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .single();

  // Get connected KJ staff
  const { data: staff } = await adminSupabase
    .from("venue_staff")
    .select("user_id")
    .eq("venue_id", venueId)
    .not("accepted_at", "is", null);

  // Collect all user IDs to notify (owner + KJs)
  const notifyUserIds: string[] = [];
  if (venue?.owner_id) notifyUserIds.push(venue.owner_id);
  if (staff) {
    for (const s of staff) {
      if (!notifyUserIds.includes(s.user_id)) {
        notifyUserIds.push(s.user_id);
      }
    }
  }

  // Get booker's display name
  const { data: bookerProfile } = await adminSupabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const bookerName = bookerProfile?.display_name || user.email?.split("@")[0] || "Someone";

  // Create notifications
  const notifications = notifyUserIds.map((userId) => ({
    user_id: userId,
    type: "new_booking",
    title: "New Room Booking!",
    message: `${bookerName} booked a private room at ${venueName} for ${date} at ${startTime} (party of ${partySize}).`,
    data: {
      venue_id: venueId,
      venue_name: venueName,
      booker_id: user.id,
      booker_name: bookerName,
      date,
      start_time: startTime,
      party_size: partySize,
    },
  }));

  if (notifications.length > 0) {
    await adminSupabase.from("notifications").insert(notifications);
  }

  return NextResponse.json({ success: true });
}
