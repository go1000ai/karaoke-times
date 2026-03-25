import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getWelcomeEmailHtml } from "@/lib/email-templates";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  // Auth check — only logged-in users (or admins) can trigger welcome emails
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, displayName } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const name = displayName || email.split("@")[0];

    const { data, error } = await resend.emails.send({
      from: "Karaoke Times <reminders@karaoketimes.net>",
      to: email,
      subject: "Welcome to Karaoke Times!",
      html: getWelcomeEmailHtml(name),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
