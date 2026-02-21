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

  const { venueId } = await request.json();

  if (!venueId) {
    return NextResponse.json({ error: "Venue ID is required" }, { status: 400 });
  }

  // Get venue details and owner
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, owner_id")
    .eq("id", venueId)
    .single();

  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  // Can't request connection to your own venue
  if (venue.owner_id === user.id) {
    return NextResponse.json(
      { error: "You already own this venue." },
      { status: 400 }
    );
  }

  // Check for existing connection
  const { data: existing } = await supabase
    .from("venue_staff")
    .select("id, accepted_at")
    .eq("venue_id", venueId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: existing.accepted_at
        ? "You're already connected to this venue."
        : "You already have a pending request for this venue." },
      { status: 409 }
    );
  }

  // Create the connection request (invited_by = self = KJ-initiated)
  const { error: insertError } = await supabase
    .from("venue_staff")
    .insert({
      venue_id: venueId,
      user_id: user.id,
      role: "kj",
      invited_by: user.id,
    });

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to send request. Please try again." },
      { status: 500 }
    );
  }

  // Get KJ's display name for the notification
  const { data: kjProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const kjName = kjProfile?.display_name || user.email?.split("@")[0] || "A KJ";

  // Create notification for the venue owner
  if (venue.owner_id) {
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await adminSupabase.from("notifications").insert({
      user_id: venue.owner_id,
      type: "kj_request",
      title: "New KJ Connection Request",
      message: `${kjName} wants to connect to ${venue.name} as a KJ.`,
      data: { venue_id: venueId, venue_name: venue.name, requested_by: user.id },
    });

    // Send email to venue owner
    if (process.env.RESEND_API_KEY) {
      const ownerUser = (await adminSupabase.auth.admin.getUserById(venue.owner_id)).data?.user;
      if (ownerUser?.email) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "Karaoke Times <reminders@karaoketimes.net>",
            to: ownerUser.email,
            subject: `🎤 ${kjName} wants to KJ at ${venue.name}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000;">🎤 Karaoke Times</h1>
                </div>
                <div style="padding: 32px 24px;">
                  <h2 style="margin: 0 0 12px; font-size: 20px;">New Connection Request</h2>
                  <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">
                    <strong style="color: #d4a017;">${kjName}</strong> wants to connect to
                    <strong>${venue.name}</strong> as a KJ. Review the request from your dashboard.
                  </p>
                  <a href="https://karaoketimes.net/dashboard/staff" style="display: inline-block; background: #d4a017; color: #000; font-weight: 700; padding: 12px 24px; border-radius: 12px; text-decoration: none;">Review Request</a>
                </div>
              </div>
            `,
          });
        } catch (e) {
          console.error("Failed to send request email:", e);
        }
      }
    }
  }

  return NextResponse.json({
    message: `Connection request sent to ${venue.name}!`,
  });
}
