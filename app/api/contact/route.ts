import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot — silently accept and discard bot submissions
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (
    name.length < 1 || name.length > 120 ||
    !EMAIL_RE.test(email) || email.length > 200 ||
    subject.length < 1 || subject.length > 200 ||
    message.length < 1 || message.length > 5000
  ) {
    return NextResponse.json(
      { error: "Please fill in every field with a valid value." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;

  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      subject,
      message,
      ip_address: ip,
      user_agent: userAgent,
    });

  if (insertError) {
    console.error("contact_messages insert failed:", insertError);
    return NextResponse.json(
      { error: "Couldn't save your message. Please try again." },
      { status: 500 }
    );
  }

  // Forward to the configured inbox. Address is server-only — never returned or logged.
  const forwardTo = process.env.CONTACT_FORWARD_EMAIL;
  if (process.env.RESEND_API_KEY && forwardTo) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Karaoke Times <reminders@karaoketimes.net>",
        to: forwardTo,
        replyTo: email,
        subject: `[Karaoke Times Contact] ${subject}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #000;">🎤 New Contact Message</h1>
            </div>
            <div style="padding: 24px; font-size: 14px; line-height: 1.55;">
              <p style="margin: 0 0 4px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px;">From</p>
              <p style="margin: 0 0 16px;"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
              <p style="margin: 0 0 4px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px;">Subject</p>
              <p style="margin: 0 0 16px;">${escapeHtml(subject)}</p>
              <p style="margin: 0 0 4px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px;">Message</p>
              <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <div style="padding: 16px 24px; background: #111118; border-top: 1px solid #2a2a38; font-size: 12px; color: #a0a0a0;">
              Reply directly to this email to respond. Also saved in the admin Contact tab.
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error("Failed to forward contact email:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
