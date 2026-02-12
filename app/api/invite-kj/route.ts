import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

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
      { error: existingStaff.accepted_at
        ? "This person is already connected to your venue."
        : "An invite is already pending for this person." },
      { status: 409 }
    );
  }

  if (targetUser.id === user.id) {
    return NextResponse.json(
      { error: "You can't invite yourself as staff." },
      { status: 400 }
    );
  }

  // Create the staff record (pending — accepted_at stays null until KJ accepts)
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

  // Create in-app notification
  await adminSupabase.from("notifications").insert({
    user_id: targetUser.id,
    type: "kj_invite",
    title: "You've been invited!",
    message: `${venue.name} has invited you to be their KJ.`,
    data: { venue_id: venueId, venue_name: venue.name, invited_by: user.id },
  });

  // Send email notification
  if (process.env.RESEND_API_KEY && targetUser.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Karaoke Times <reminders@karaoke-times.vercel.app>",
        to: targetUser.email,
        subject: `🎤 ${venue.name} wants you as their KJ!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000;">🎤 Karaoke Times</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 12px; font-size: 20px;">You've been invited!</h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">
                <strong style="color: #d4a017;">${venue.name}</strong> wants to connect with you as their KJ.
                Log in to your dashboard to accept the invitation.
              </p>
              <a href="https://karaoke-times.vercel.app/dashboard/connections" style="display: inline-block; background: #d4a017; color: #000; font-weight: 700; padding: 12px 24px; border-radius: 12px; text-decoration: none;">View Invitation</a>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error("Failed to send invite email:", e);
    }
  }

  const displayName =
    targetUser.user_metadata?.full_name ||
    targetUser.email?.split("@")[0] ||
    "KJ";

  return NextResponse.json({
    message: `Invite sent to ${displayName}! They need to accept it from their dashboard.`,
  });
}
