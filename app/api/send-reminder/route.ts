import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const { email, eventTitle, venueName, dayOfWeek, startTime, endTime, location } =
    await request.json();

  if (!email || !eventTitle) {
    return NextResponse.json(
      { error: "Email and event title are required" },
      { status: 400 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 }
    );
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "Karaoke Times <reminders@karaoketimes.net>",
      to: email,
      subject: `🎤 Reminder: ${eventTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000;">🎤 Karaoke Times</h1>
            <p style="margin: 8px 0 0; font-size: 13px; color: #000; opacity: 0.7;">Your karaoke reminder</p>
          </div>

          <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 4px; font-size: 20px; color: #ffffff;">${eventTitle}</h2>
            <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">${venueName || ""}</p>

            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #a0a0a0; font-size: 13px;">📅 Day</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-align: right;">Every ${dayOfWeek}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #a0a0a0; font-size: 13px;">🕘 Time</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-align: right;">${startTime}${endTime ? ` – ${endTime}` : ""}</td>
                </tr>
                ${location ? `
                <tr>
                  <td style="padding: 8px 0; color: #a0a0a0; font-size: 13px;">📍 Location</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-align: right;">${location}</td>
                </tr>` : ""}
              </table>
            </div>

            <a href="https://karaoketimes.net" style="display: block; background: #d4a017; color: #000; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">
              View on Karaoke Times
            </a>
          </div>

          <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #666;">
              You received this because you requested a karaoke event reminder on Karaoke Times.
            </p>
          </div>
        </div>
      `,
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
