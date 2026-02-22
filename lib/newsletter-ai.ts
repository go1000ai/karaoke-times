import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

interface NewsletterData {
  venues: Array<{
    name: string;
    neighborhood: string;
    address: string;
    is_new: boolean;
  }>;
  events: Array<{
    event_name: string;
    venue_name: string;
    day_of_week: string;
    dj: string | null;
    start_time: string | null;
    end_time: string | null;
    recurrence_type: string;
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

  const venues = (venuesRes.data ?? []).map((v: any) => ({
    name: v.name,
    neighborhood: v.neighborhood || "NYC",
    address: v.address || "",
    is_new: new Date(v.created_at) > thirtyDaysAgo,
  }));

  const events = (eventsRes.data ?? []).map((e: any) => ({
    event_name: e.event_name,
    venue_name: e.venues?.name ?? "Unknown",
    day_of_week: e.day_of_week,
    dj: e.dj,
    start_time: e.start_time,
    end_time: e.end_time,
    recurrence_type: e.recurrence_type ?? "weekly",
  }));

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
    max_tokens: 2048,
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
              `  - ${e.event_name} at ${e.venue_name} (${e.start_time || "TBD"}–${e.end_time || "late"}, KJ: ${e.dj || "TBA"})${e.recurrence_type !== "weekly" ? ` [${e.recurrence_type}]` : ""}`
          )
          .join("\n")}`
    )
    .join("\n\n");

  const newVenues = data.venues
    .filter((v) => v.is_new)
    .map((v) => `- ${v.name} in ${v.neighborhood} (${v.address})`)
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

OUTPUT FORMAT — respond with EXACTLY this structure:

SUBJECT: [A catchy email subject line for ${currentMonth}, under 60 characters]

BODY:
[Write the newsletter body as HTML paragraphs. Use these inline styles ONLY:
- <p style="margin: 0 0 12px;"> for paragraphs
- <strong> for bold text
- <span style="color: #d4a017;"> for gold highlights (venue names, special items)
- <br/> for line breaks within a paragraph
- Use emoji sparingly (1-2 per section max)
- Keep total length under 400 words

Structure:
1. Greeting (1 sentence)
2. What's New section (new venues, notable changes) — skip if nothing new
3. This Month's Highlights (2-3 most interesting events or promos to feature)
4. Weekly Schedule Quick Hits (brief mention of the variety available, not every event)
5. Sign-off with CTA to browse karaoketimes.net

Do NOT use <h1>, <h2>, <h3>, <ul>, <li>, <table>, or any block-level HTML. Only <p>, <strong>, <span>, <br/>, <a> tags.]`;
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

  // If AI didn't wrap in <p> tags, do it
  if (!bodyHtml.startsWith("<p")) {
    bodyHtml = bodyHtml
      .split("\n\n")
      .map(
        (p) =>
          `<p style="margin: 0 0 12px;">${p.replace(/\n/g, "<br/>")}</p>`
      )
      .join("");
  }

  return { subject, bodyHtml };
}
