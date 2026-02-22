import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { getReminderEmailHtml } from "@/lib/email-templates";

/**
 * Parse a time string like "9:00 PM" into hours (24h format).
 */
function parseTimeToHours(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/);
  if (!match) return 21; // default 9 PM

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours + minutes / 60;
}

/**
 * Get the next occurrence of a day+time in Eastern Time.
 */
function getNextOccurrence(dayOfWeek: string, startTime: string): Date {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const targetDay = days.indexOf(dayOfWeek.toLowerCase());
  if (targetDay === -1) return new Date(0);

  // Current time in Eastern
  const now = new Date();
  const eastern = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const currentDay = eastern.getDay();

  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    // Same day — check if event time is still in the future
    const eventHour = parseTimeToHours(startTime);
    const currentHour = eastern.getHours() + eastern.getMinutes() / 60;
    if (currentHour >= eventHour) {
      daysUntil = 7; // Already passed today, next week
    }
  }

  const nextDate = new Date(eastern);
  nextDate.setDate(eastern.getDate() + daysUntil);

  const eventHour = parseTimeToHours(startTime);
  nextDate.setHours(Math.floor(eventHour), Math.round((eventHour % 1) * 60), 0, 0);

  return nextDate;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 });
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get all active reminders
  const { data: reminders } = await adminSupabase
    .from("event_reminders")
    .select("*")
    .eq("is_active", true);

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent24h: 0, sent4h: 0, message: "No active reminders" });
  }

  const now = new Date();
  const nyNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

  let sent24h = 0;
  let sent4h = 0;

  for (const reminder of reminders) {
    if (!reminder.email || !reminder.day_of_week || !reminder.start_time) continue;

    const nextOccurrence = getNextOccurrence(reminder.day_of_week, reminder.start_time);
    const hoursUntil = (nextOccurrence.getTime() - nyNow.getTime()) / (1000 * 60 * 60);

    // 24-hour reminder (20-28 hour window — daily cron, wider window)
    if (hoursUntil >= 20 && hoursUntil <= 28) {
      const lastSent = reminder.last_24h_reminder_at
        ? new Date(reminder.last_24h_reminder_at)
        : null;
      const alreadySent = lastSent && now.getTime() - lastSent.getTime() < 48 * 60 * 60 * 1000;

      if (!alreadySent) {
        try {
          await resend.emails.send({
            from: "Karaoke Times <reminders@karaoketimes.net>",
            to: reminder.email,
            subject: `Tomorrow: ${reminder.event_name}`,
            html: getReminderEmailHtml(reminder, "24h"),
          });
          await adminSupabase
            .from("event_reminders")
            .update({ last_24h_reminder_at: now.toISOString() })
            .eq("id", reminder.id);
          sent24h++;
        } catch (err) {
          console.error(`Failed 24h reminder for ${reminder.id}:`, err);
        }
      }
    }

    // 4-hour reminder (1-7 hour window — daily cron, wider window)
    if (hoursUntil >= 1 && hoursUntil <= 7) {
      const lastSent = reminder.last_4h_reminder_at
        ? new Date(reminder.last_4h_reminder_at)
        : null;
      const alreadySent = lastSent && now.getTime() - lastSent.getTime() < 48 * 60 * 60 * 1000;

      if (!alreadySent) {
        try {
          await resend.emails.send({
            from: "Karaoke Times <reminders@karaoketimes.net>",
            to: reminder.email,
            subject: `Tonight: ${reminder.event_name}`,
            html: getReminderEmailHtml(reminder, "4h"),
          });
          await adminSupabase
            .from("event_reminders")
            .update({ last_4h_reminder_at: now.toISOString() })
            .eq("id", reminder.id);
          sent4h++;
        } catch (err) {
          console.error(`Failed 4h reminder for ${reminder.id}:`, err);
        }
      }
    }
  }

  return NextResponse.json({ sent24h, sent4h, total: reminders.length });
}
