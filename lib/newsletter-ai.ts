import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { karaokeEvents } from "@/lib/mock-data";

const BASE_URL = "https://karaoketimes.net";

interface NewsletterData {
  venues: Array<{
    name: string;
    neighborhood: string;
    address: string;
    is_new: boolean;
    image_url: string | null;
  }>;
  events: Array<{
    event_name: string;
    venue_name: string;
    day_of_week: string;
    dj: string | null;
    start_time: string | null;
    end_time: string | null;
    recurrence_type: string;
    image_url: string | null;
  }>;
  promos: Array<{
    title: string;
    description: string;
    venue_name: string;
    end_date: string | null;
  }>;
  stats: {
    totalVenues: number;
    totalEvents: number;
    totalUsers: number;
    newVenuesThisMonth: number;
  };
  pastNewsletterSubjects: string[];
  venueImages: Record<string, string>; // venue name → absolute image URL
}

export async function gatherNewsletterData(): Promise<NewsletterData> {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [venuesRes, eventsRes, promosRes, userCountRes, pastNewslettersRes] =
    await Promise.all([
      adminSupabase.from("venues").select("name, neighborhood, address, created_at"),
      adminSupabase
        .from("venue_events")
        .select("event_name, day_of_week, dj, start_time, end_time, recurrence_type, venues(name)")
        .eq("is_active", true),
      adminSupabase
        .from("venue_promos")
        .select("title, description, start_date, end_date, venues(name)")
        .eq("is_active", true),
      adminSupabase.from("profiles").select("id", { count: "exact", head: true }),
      adminSupabase
        .from("newsletters")
        .select("subject")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Build venue name → image URL map from mock data
  const venueImages: Record<string, string> = {};
  for (const event of karaokeEvents) {
    if (event.image && !venueImages[event.venueName]) {
      venueImages[event.venueName] = `${BASE_URL}${event.image}`;
    }
  }

  const venues = (venuesRes.data ?? []).map((v: any) => ({
    name: v.name,
    neighborhood: v.neighborhood || "NYC",
    address: v.address || "",
    is_new: new Date(v.created_at) > thirtyDaysAgo,
    image_url: venueImages[v.name] || null,
  }));

  const events = (eventsRes.data ?? []).map((e: any) => {
    const venueName = e.venues?.name ?? "Unknown";
    return {
      event_name: e.event_name,
      venue_name: venueName,
      day_of_week: e.day_of_week,
      dj: e.dj,
      start_time: e.start_time,
      end_time: e.end_time,
      recurrence_type: e.recurrence_type ?? "weekly",
      image_url: venueImages[venueName] || null,
    };
  });

  const promos = (promosRes.data ?? []).map((p: any) => ({
    title: p.title,
    description: p.description,
    venue_name: p.venues?.name ?? "Unknown",
    end_date: p.end_date,
  }));

  return {
    venues,
    events,
    promos,
    stats: {
      totalVenues: venues.length,
      totalEvents: events.length,
      totalUsers: userCountRes.count ?? 0,
      newVenuesThisMonth: venues.filter((v) => v.is_new).length,
    },
    pastNewsletterSubjects: (pastNewslettersRes.data ?? []).map((n: any) => n.subject),
    venueImages,
  };
}

export async function generateNewsletter(
  data: NewsletterData,
  adminContext?: string
): Promise<{ subject: string; bodyHtml: string }> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const currentMonth = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prompt = buildPrompt(data, currentMonth, adminContext);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseAIResponse(text, currentMonth);
}

function buildPrompt(
  data: NewsletterData,
  currentMonth: string,
  adminContext?: string
): string {
  const eventsByDay: Record<string, typeof data.events> = {};
  for (const event of data.events) {
    const day = event.day_of_week;
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(event);
  }

  const eventsSummary = Object.entries(eventsByDay)
    .map(
      ([day, events]) =>
        `${day}:\n${events
          .map(
            (e) =>
              `  - ${e.event_name} at ${e.venue_name} (${e.start_time || "TBD"}–${e.end_time || "late"}, KJ: ${e.dj || "TBA"})${e.recurrence_type !== "weekly" ? ` [${e.recurrence_type}]` : ""}${e.image_url ? ` [IMAGE: ${e.image_url}]` : ""}`
          )
          .join("\n")}`
    )
    .join("\n\n");

  const newVenues = data.venues
    .filter((v) => v.is_new)
    .map((v) => `- ${v.name} in ${v.neighborhood} (${v.address})${v.image_url ? ` [IMAGE: ${v.image_url}]` : ""}`)
    .join("\n");

  const activePromos = data.promos
    .map(
      (p) =>
        `- ${p.title} at ${p.venue_name}: ${p.description}${p.end_date ? ` (ends ${p.end_date})` : ""}`
    )
    .join("\n");

  const pastSubjects =
    data.pastNewsletterSubjects.length > 0
      ? `Recent newsletter subjects (avoid repeating):\n${data.pastNewsletterSubjects.map((s) => `- ${s}`).join("\n")}`
      : "";

  // Build available venue images list
  const availableImages = Object.entries(data.venueImages)
    .map(([name, url]) => `  ${name}: ${url}`)
    .join("\n");

  return `You are the newsletter writer for Karaoke Times, New York City's premier karaoke event guide. Write the ${currentMonth} monthly newsletter.

TONE: Warm, fun, community-focused. Like a friend who knows all the best karaoke spots. Use casual NYC energy. Keep it concise — people skim emails.

DATA FOR THIS MONTH:
- Total venues: ${data.stats.totalVenues}
- Total weekly events: ${data.stats.totalEvents}
- Community size: ${data.stats.totalUsers} members
- New venues this month: ${data.stats.newVenuesThisMonth}

${newVenues ? `NEW VENUES:\n${newVenues}\n` : ""}
WEEKLY EVENTS BY DAY:
${eventsSummary || "No events currently listed."}

${activePromos ? `ACTIVE PROMOS & SPECIALS:\n${activePromos}\n` : ""}
${pastSubjects ? `\n${pastSubjects}\n` : ""}
${adminContext ? `ADMIN NOTES (incorporate these):\n${adminContext}\n` : ""}
AVAILABLE VENUE IMAGES (use these exact URLs for featured venues):
${availableImages || "  No images available."}

OUTPUT FORMAT — respond with EXACTLY this structure:

SUBJECT: [A catchy email subject line for ${currentMonth}, under 60 characters]

BODY:
[Write the newsletter body as HTML. This is an email so use only inline styles and these elements:
- <p style="margin: 0 0 16px; font-size: 14px;"> for paragraphs
- <strong> for bold text
- <span style="color: #d4a017;"> for gold highlights (venue names, special items)
- <br/> for line breaks within a paragraph
- <a href="..." style="color: #d4a017; text-decoration: underline;"> for links
- Use emoji sparingly (1-2 per section max)

IMAGES — For 2-3 featured venues/events that have images available, include venue photo cards using this EXACT format:
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;"><tr><td style="background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden;"><img src="IMAGE_URL_HERE" alt="VENUE_NAME" width="100%" style="display: block; border-radius: 12px 12px 0 0; max-height: 200px; object-fit: cover;" /><div style="padding: 12px 16px;"><p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #ffffff;">VENUE_NAME</p><p style="margin: 0; font-size: 12px; color: #a0a0a0;">EVENT_DETAILS_HERE</p></div></td></tr></table>

Only use venue images from the AVAILABLE VENUE IMAGES list — never invent URLs.
Only include 2-3 image cards total to keep the email focused.

Keep total length under 500 words.

Structure:
1. Greeting (1 sentence)
2. What's New section (new venues, notable changes) — skip if nothing new
3. Featured Spots (2-3 venues with image cards — pick the most interesting events)
4. Weekly Schedule Quick Hits (brief mention of the variety available, not every event)
5. Sign-off with CTA to browse karaoketimes.net]`;
}

function parseAIResponse(
  text: string,
  fallbackMonth: string
): { subject: string; bodyHtml: string } {
  const subjectMatch = text.match(/SUBJECT:\s*(.+?)(?:\n|$)/);
  const subject = subjectMatch
    ? subjectMatch[1].trim()
    : `${fallbackMonth} — NYC Karaoke Roundup`;

  const bodyMatch = text.match(/BODY:\s*([\s\S]+)$/);
  let bodyHtml = bodyMatch ? bodyMatch[1].trim() : text;

  // If AI didn't wrap in <p> or <table> tags, do it
  if (!bodyHtml.startsWith("<p") && !bodyHtml.startsWith("<table")) {
    bodyHtml = bodyHtml
      .split("\n\n")
      .map(
        (p) =>
          `<p style="margin: 0 0 16px; font-size: 14px;">${p.replace(/\n/g, "<br/>")}</p>`
      )
      .join("");
  }

  return { subject, bodyHtml };
}
