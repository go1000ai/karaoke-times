/**
 * Shared email HTML templates for Karaoke Times.
 * All emails use a consistent dark theme with gold-to-red gradient header.
 */

function emailWrapper(content: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #ffffff; border-radius: 16px; overflow: hidden;">
  ${content}
  <div style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
    <p style="margin: 0; font-size: 11px; color: #666;">
      Karaoke Times &mdash; New York City Edition<br/>
      <a href="https://karaoketimes.net" style="color: #d4a017; text-decoration: none;">karaoketimes.net</a>
    </p>
  </div>
</div>`;
}

export function getWelcomeEmailHtml(name: string): string {
  return emailWrapper(`
    <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #000;">Welcome to Karaoke Times!</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #000; opacity: 0.7;">New York City Edition</p>
    </div>

    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 20px; font-size: 16px; color: #ffffff;">
        Hey ${name}, thanks for joining! We&rsquo;re thrilled to have you.
      </p>

      <p style="margin: 0 0 16px; font-size: 14px; color: #a0a0a0;">
        Here&rsquo;s what you can do on Karaoke Times:
      </p>

      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #d4a017; font-size: 18px; width: 30px; vertical-align: top;">&#127908;</td>
            <td style="padding: 10px 0 10px 8px;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #fff;">Browse 100+ NYC Venues</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #a0a0a0;">Find karaoke nights every day of the week</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #d4a017; font-size: 18px; width: 30px; vertical-align: top;">&#127926;</td>
            <td style="padding: 10px 0 10px 8px;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #fff;">Join Live Song Queues</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #a0a0a0;">Request songs and track your spot in real time</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #d4a017; font-size: 18px; width: 30px; vertical-align: top;">&#128276;</td>
            <td style="padding: 10px 0 10px 8px;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #fff;">Set Event Reminders</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #a0a0a0;">Get notified before your favorite karaoke nights</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #d4a017; font-size: 18px; width: 30px; vertical-align: top;">&#127911;</td>
            <td style="padding: 10px 0 10px 8px;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #fff;">Connect with KJs</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #a0a0a0;">Follow your favorite karaoke jockeys</p>
            </td>
          </tr>
        </table>
      </div>

      <a href="https://karaoketimes.net" style="display: block; background: #d4a017; color: #000; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">
        Explore Karaoke Nights
      </a>
    </div>
  `);
}

export function getReminderEmailHtml(
  reminder: {
    event_name: string;
    venue_name: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string | null;
    location: string | null;
  },
  type: "24h" | "4h"
): string {
  const isTonight = type === "4h";
  const heading = isTonight
    ? `Tonight: ${reminder.event_name}`
    : `Tomorrow: ${reminder.event_name}`;
  const subtitle = isTonight
    ? `Starts in about 4 hours at ${reminder.venue_name || "your venue"}`
    : `Don&rsquo;t forget &mdash; ${reminder.event_name} is tomorrow!`;

  return emailWrapper(`
    <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000;">&#127908; Karaoke Times</h1>
      <p style="margin: 8px 0 0; font-size: 13px; color: #000; opacity: 0.7;">Event Reminder</p>
    </div>

    <div style="padding: 32px 24px;">
      <h2 style="margin: 0 0 4px; font-size: 20px; color: #ffffff;">${heading}</h2>
      <p style="margin: 0 0 24px; font-size: 14px; color: #a0a0a0;">${subtitle}</p>

      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #a0a0a0; font-size: 13px;">&#128197; Day</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-align: right;">Every ${reminder.day_of_week}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #a0a0a0; font-size: 13px;">&#128344; Time</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-align: right;">${reminder.start_time}${reminder.end_time ? ` &ndash; ${reminder.end_time}` : ""}</td>
          </tr>
          ${reminder.location ? `
          <tr>
            <td style="padding: 8px 0; color: #a0a0a0; font-size: 13px;">&#128205; Location</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-align: right;">${reminder.location}</td>
          </tr>` : ""}
        </table>
      </div>

      <a href="https://karaoketimes.net" style="display: block; background: #d4a017; color: #000; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">
        View on Karaoke Times
      </a>
    </div>
  `);
}

export function getNewsletterEmailHtml(subject: string, bodyHtml: string): string {
  return emailWrapper(`
    <div style="background: linear-gradient(135deg, #d4a017 0%, #c0392b 100%); padding: 32px 24px; text-align: center;">
      <img src="https://karaoketimes.net/logo.png" alt="Karaoke Times" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 12px;" />
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #000;">Karaoke Times</h1>
      <p style="margin: 8px 0 0; font-size: 13px; color: #000; opacity: 0.7;">Monthly Newsletter</p>
    </div>

    <div style="padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #ffffff;">${subject}</h2>
      <div style="font-size: 14px; color: #d0d0d0; line-height: 1.7;">
        ${bodyHtml}
      </div>

      <div style="margin-top: 24px;">
        <a href="https://karaoketimes.net" style="display: block; background: #d4a017; color: #000; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">
          Browse Events
        </a>
      </div>
    </div>
  `);
}
