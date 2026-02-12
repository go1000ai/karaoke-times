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

  const { staffId, action } = await request.json();

  if (!staffId || !["accept", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "staffId and action (accept/reject) are required" },
      { status: 400 }
    );
  }

  // Use admin client for cross-user operations
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the staff record
  const { data: staffRecord } = await adminSupabase
    .from("venue_staff")
    .select("id, venue_id, user_id, invited_by, venues(name, owner_id)")
    .eq("id", staffId)
    .single();

  if (!staffRecord) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const venue = staffRecord.venues as unknown as { name: string; owner_id: string | null };
  const isOwnerInitiated = staffRecord.invited_by !== staffRecord.user_id;

  // Authorization check:
  // - If owner invited KJ → only the KJ (user_id) can accept/reject
  // - If KJ requested → only the venue owner can accept/reject
  if (isOwnerInitiated) {
    // Owner sent invite — only the KJ can respond
    if (user.id !== staffRecord.user_id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  } else {
    // KJ requested — only the venue owner can respond
    if (user.id !== venue.owner_id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  }

  if (action === "accept") {
    const { error } = await adminSupabase
      .from("venue_staff")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", staffId);

    if (error) {
      return NextResponse.json({ error: "Failed to accept" }, { status: 500 });
    }

    // Notify the other party
    const notifyUserId = isOwnerInitiated ? staffRecord.invited_by : staffRecord.user_id;
    const { data: acceptorProfile } = await adminSupabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const acceptorName = acceptorProfile?.display_name || "Someone";

    if (notifyUserId) {
      await adminSupabase.from("notifications").insert({
        user_id: notifyUserId,
        type: "connection_accepted",
        title: "Connection Accepted!",
        message: isOwnerInitiated
          ? `${acceptorName} accepted your invite to ${venue.name}.`
          : `${venue.name} accepted your connection request.`,
        data: { venue_id: staffRecord.venue_id, venue_name: venue.name },
      });

      // Send email
      if (process.env.RESEND_API_KEY) {
        const targetUser = (await adminSupabase.auth.admin.getUserById(notifyUserId)).data?.user;
        if (targetUser?.email) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "Karaoke Times <reminders@karaoke-times.vercel.app>",
              to: targetUser.email,
              subject: `🎤 Connection accepted — ${venue.name}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 16px; overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000;">🎤 Karaoke Times</h1>
                  </div>
                  <div style="padding: 32px 24px;">
                    <h2 style="margin: 0 0 12px; font-size: 20px;">You're Connected!</h2>
                    <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">
                      Your connection to <strong style="color: #d4a017;">${venue.name}</strong> has been accepted.
                      You can now manage the song queue and TV display.
                    </p>
                    <a href="https://karaoke-times.vercel.app/dashboard" style="display: inline-block; background: #d4a017; color: #000; font-weight: 700; padding: 12px 24px; border-radius: 12px; text-decoration: none;">Go to Dashboard</a>
                  </div>
                </div>
              `,
            });
          } catch (e) {
            console.error("Failed to send acceptance email:", e);
          }
        }
      }
    }

    return NextResponse.json({ message: "Connection accepted!" });
  }

  // Reject — delete the record
  const { error } = await adminSupabase
    .from("venue_staff")
    .delete()
    .eq("id", staffId);

  if (error) {
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }

  return NextResponse.json({ message: "Connection rejected." });
}
