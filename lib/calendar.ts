/**
 * Calendar utilities for generating Google Calendar URLs and .ics file downloads.
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  /** Day of week the event occurs, e.g. "Friday" */
  dayOfWeek: string;
  /** Start time string, e.g. "9:00 PM" */
  startTime: string;
  /** End time string, e.g. "2:00 AM" */
  endTime: string;
}

/**
 * Get the next occurrence of a given day of week from today.
 */
function getNextDayOfWeek(dayName: string): Date {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const targetDay = days.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return new Date(); // fallback to today

  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7; // next week if today or past

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  return nextDate;
}

/**
 * Parse a time string like "9:00 PM" or "2:00 AM" into hours and minutes (24h).
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/);
  if (!match) return { hours: 21, minutes: 0 }; // default 9 PM

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

/**
 * Combine a date and time string into a Date object.
 * If endTime is earlier than startTime, assumes it's the next day.
 */
function combineDateAndTime(
  baseDate: Date,
  timeStr: string,
  isEnd?: boolean,
  startHours?: number
): Date {
  const { hours, minutes } = parseTime(timeStr);
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);

  // If end time is earlier than start time (e.g., 2 AM end for 9 PM start), it's next day
  if (isEnd && startHours !== undefined && hours < startHours) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

/**
 * Format a Date to Google Calendar's format: YYYYMMDDTHHmmss
 */
function toGoogleCalDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T` +
    `${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

/**
 * Format a Date to .ics format: YYYYMMDDTHHmmss
 */
function toICSDate(date: Date): string {
  return toGoogleCalDate(date); // Same format
}

/**
 * Generate a Google Calendar URL for the event.
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const nextDate = getNextDayOfWeek(event.dayOfWeek);
  const startParsed = parseTime(event.startTime);
  const start = combineDateAndTime(nextDate, event.startTime);
  const end = combineDateAndTime(
    nextDate,
    event.endTime,
    true,
    startParsed.hours
  );

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleCalDate(start)}/${toGoogleCalDate(end)}`,
    details: event.description || `Karaoke night — ${event.startTime} to ${event.endTime}`,
    location: event.location || "",
    recur: "RRULE:FREQ=WEEKLY", // Repeats weekly
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook Web calendar URL.
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const nextDate = getNextDayOfWeek(event.dayOfWeek);
  const startParsed = parseTime(event.startTime);
  const start = combineDateAndTime(nextDate, event.startTime);
  const end = combineDateAndTime(
    nextDate,
    event.endTime,
    true,
    startParsed.hours
  );

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: event.description || `Karaoke night — ${event.startTime} to ${event.endTime}`,
    location: event.location || "",
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate and download an .ics file (works with Apple Calendar, Outlook desktop, etc.)
 */
export function downloadICSFile(event: CalendarEvent): void {
  const nextDate = getNextDayOfWeek(event.dayOfWeek);
  const startParsed = parseTime(event.startTime);
  const start = combineDateAndTime(nextDate, event.startTime);
  const end = combineDateAndTime(
    nextDate,
    event.endTime,
    true,
    startParsed.hours
  );

  const description = event.description || `Karaoke night — ${event.startTime} to ${event.endTime}`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Karaoke Times//EN",
    "BEGIN:VEVENT",
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location || ""}`,
    "RRULE:FREQ=WEEKLY",
    `UID:${Date.now()}@karaoke-times`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
