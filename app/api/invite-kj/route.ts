import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify the requesting user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { email, venueId } = await request.json();

  if (!email || !venueId) {
    return NextResponse.json(
      { error: "Email and venue ID are required" },
      { status: 400 }
    );
  }

  // Verify the user owns this venue
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .single();

  if (!venue) {
    return NextResponse.json(
      { error: "You don't own this venue" },
      { status: 403 }
    );
  }

  // Find the user by email via profiles + auth
  // We need to look up the user by email. Since we can't query auth.users
  // from the client SDK, we'll use a workaround: check if a profile exists
  // by querying auth users through the admin API or by attempting a lookup.

  // Use Supabase admin client to find user by email
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: usersData } = await adminSupabase.auth.admin.listUsers();
  const targetUser = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!targetUser) {
    return NextResponse.json(
      { error: "No account found with that email. The KJ needs to create a Karaoke Times account first." },
      { status: 404 }
    );
  }

  // Check if they're already staff at this venue
  const { data: existingStaff } = await supabase
    .from("venue_staff")
    .select("id, accepted_at")
    .eq("venue_id", venueId)
    .eq("user_id", targetUser.id)
    .single();

  if (existingStaff) {
    return NextResponse.json(
      { error: "This person is already connected to your venue." },
      { status: 409 }
    );
  }

  // Check if they're the venue owner themselves
  if (targetUser.id === user.id) {
    return NextResponse.json(
      { error: "You can't invite yourself as staff." },
      { status: 400 }
    );
  }

  // Create the staff record
  const { error: insertError } = await supabase
    .from("venue_staff")
    .insert({
      venue_id: venueId,
      user_id: targetUser.id,
      role: "kj",
      invited_by: user.id,
    });

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to send invite. Please try again." },
      { status: 500 }
    );
  }

  // Create a notification for the invited KJ
  await adminSupabase.from("notifications").insert({
    user_id: targetUser.id,
    type: "kj_invite",
    title: "You've been invited!",
    message: `${venue.name} has invited you to be their KJ. You now have access to manage their song queue and TV display.`,
    data: { venue_id: venueId, venue_name: venue.name, invited_by: user.id },
  });

  // Auto-accept the invite (since we're connecting directly)
  await supabase
    .from("venue_staff")
    .update({ accepted_at: new Date().toISOString() })
    .eq("venue_id", venueId)
    .eq("user_id", targetUser.id);

  const displayName =
    targetUser.user_metadata?.full_name ||
    targetUser.email?.split("@")[0] ||
    "KJ";

  return NextResponse.json({
    message: `${displayName} has been connected as a KJ!`,
  });
}
