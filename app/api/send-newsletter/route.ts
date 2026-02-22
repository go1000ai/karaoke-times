import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getNewsletterEmailHtml } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  // Verify admin auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { subject, bodyHtml } = await request.json();
  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  try {
    // Fetch all user emails using admin client
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id");

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    // Get emails from auth.users via admin API
    const { data: authData } = await adminSupabase.auth.admin.listUsers({
      perPage: 1000,
    });

    const emails = (authData?.users ?? [])
      .map((u) => u.email)
      .filter((e): e is string => !!e);

    if (emails.length === 0) {
      return NextResponse.json({ error: "No email addresses found" }, { status: 404 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = getNewsletterEmailHtml(subject, bodyHtml);

    // Send in batches of 50
    let totalSent = 0;
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      const batchEmails = batch.map((to) => ({
        from: "Karaoke Times <reminders@karaoketimes.net>",
        to,
        subject,
        html,
      }));

      try {
        await resend.batch.send(batchEmails);
        totalSent += batch.length;
      } catch (batchErr) {
        console.error(`Newsletter batch ${i} failed:`, batchErr);
      }
    }

    // Record in newsletters table
    await adminSupabase.from("newsletters").insert({
      subject,
      body_html: bodyHtml,
      sent_by: user.id,
      recipient_count: totalSent,
    });

    return NextResponse.json({ success: true, count: totalSent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send newsletter" },
      { status: 500 }
    );
  }
}
