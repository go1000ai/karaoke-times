import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300; // 5 minutes max for batch processing

// ── Theme detection from event name / notes / DJ ──────────────────────
const THEME_KEYWORDS: Record<string, string[]> = {
  "Hip-Hop & R&B Night": [
    "hip hop", "hip-hop", "hiphop", "r&b", "rnb", "r & b", "rap",
    "trap", "urban", "old school", "90s hip", "throwback hip",
  ],
  "Latin Karaoke": [
    "latin", "latina", "latino", "salsa", "bachata", "merengue",
    "cumbia", "latin night", "noche latina",
  ],
  "Reggaeton Night": [
    "reggaeton", "reggaetón", "perreo", "dembow", "bad bunny",
  ],
  "K-Pop Night": ["k-pop", "kpop", "k pop", "korean"],
  "80s/90s Throwback": [
    "80s", "90s", "80's", "90's", "throwback", "retro", "old school night",
  ],
  "Rock & Metal Karaoke": [
    "rock", "metal", "punk", "grunge", "classic rock", "hard rock",
  ],
  "Broadway & Show Tunes": [
    "broadway", "show tunes", "musical", "theater", "theatre",
  ],
  "Country Karaoke": ["country", "honky", "nashville", "cowboy"],
  "Duets Night": ["duet", "duets", "couples", "duo"],
  "Karaoke Contest": [
    "contest", "competition", "battle", "showdown", "idol",
    "star search", "sing-off", "sing off",
  ],
};

function detectTheme(eventName: string, notes: string, dj: string): string {
  const text = `${eventName} ${notes} ${dj}`.toLowerCase();
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return theme;
  }
  return "Open Mic Karaoke";
}

// ── Compute next occurrence of a given day of week ────────────────────
const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function getNextDate(dayOfWeek: string): string {
  const target = DAY_MAP[dayOfWeek.toLowerCase().split(" ")[0]];
  if (target === undefined) return ""; // can't parse — let n8n handle it
  const now = new Date();
  const current = now.getDay();
  let daysAhead = target - current;
  if (daysAhead <= 0) daysAhead += 7; // always pick the *next* occurrence
  const next = new Date(now);
  next.setDate(now.getDate() + daysAhead);
  return next.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Day-based color palettes for visual consistency per day ────────────
const DAY_COLORS: Record<string, string[]> = {
  Monday:    ["#00FFC2", "#0066FF"],         // Cyan + Electric Blue
  Tuesday:   ["#FF007A", "#7B2FBE"],         // Hot Pink + Royal Purple
  Wednesday: ["#FFD700", "#FF6B35"],         // Gold + Sunset Orange
  Thursday:  ["#39FF14", "#0066FF"],         // Lime + Electric Blue
  Friday:    ["#FF2D00", "#FFD700"],         // Fire Red + Gold
  Saturday:  ["#7B2FBE", "#FF007A"],         // Purple + Hot Pink
  Sunday:    ["#F7E7CE", "#FF5CA1"],         // Champagne + Rose
};

// ── Build a richer mood description ───────────────────────────────────
function buildMoodDescription(
  eventName: string,
  venueName: string,
  dj: string,
  notes: string,
  dayOfWeek: string,
): string {
  const parts: string[] = [];
  parts.push(`${eventName} at ${venueName}`);
  if (dj) parts.push(`Hosted by ${dj}`);
  if (dayOfWeek) parts.push(`Every ${dayOfWeek} night`);
  if (notes) parts.push(notes);
  return parts.join(". ");
}

export async function POST() {
  // Verify admin
  const serverSupabase = await createServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({
      success: false,
      message: "N8N_WEBHOOK_URL not configured. Cannot generate flyers.",
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find all events without a flyer_url — include promos for specials
  const { data: events, error } = await supabase
    .from("venue_events")
    .select("id, venue_id, day_of_week, event_name, dj, start_time, end_time, notes, venues(name, address, city, state)")
    .is("flyer_url", null)
    .eq("is_active", true)
    .order("day_of_week");

  if (error || !events) {
    return NextResponse.json({
      success: false,
      message: "Failed to fetch events: " + (error?.message || "unknown"),
    });
  }

  if (events.length === 0) {
    return NextResponse.json({
      success: true,
      message: "All active events already have flyers!",
      generated: 0,
      failed: 0,
    });
  }

  // Batch-fetch promos for all relevant venues
  const venueIds = [...new Set(events.map((e) => e.venue_id))];
  const { data: promos } = await supabase
    .from("venue_promos")
    .select("venue_id, event_id, title, description")
    .in("venue_id", venueIds)
    .eq("is_active", true);

  // Index promos by event_id, then by venue_id as fallback
  const promosByEvent = new Map<string, { title: string; description: string }[]>();
  const promosByVenue = new Map<string, { title: string; description: string }[]>();
  for (const p of promos ?? []) {
    if (p.event_id) {
      const arr = promosByEvent.get(p.event_id) || [];
      arr.push({ title: p.title, description: p.description });
      promosByEvent.set(p.event_id, arr);
    } else {
      const arr = promosByVenue.get(p.venue_id) || [];
      arr.push({ title: p.title, description: p.description });
      promosByVenue.set(p.venue_id, arr);
    }
  }

  let generated = 0;
  let failed = 0;
  const errors: string[] = [];

  // Process in batches of 3 to avoid overwhelming n8n
  const BATCH_SIZE = 3;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (event) => {
        const venue = event.venues as unknown as {
          name: string;
          address: string;
          city: string;
          state: string;
        } | null;

        const venueName = venue?.name || "Karaoke Venue";
        const venueAddress = venue?.address || "";
        const eventName = event.event_name || "Karaoke Night";
        const dj = event.dj || "";
        const notes = event.notes || "";
        const dayOfWeek = event.day_of_week || "";

        // Smart theme detection from event name / notes / DJ
        const theme = detectTheme(eventName, notes, dj);

        // Calculate real date for next occurrence
        const eventDate = getNextDate(dayOfWeek) || dayOfWeek;

        // Build richer mood description
        const moodDescription = buildMoodDescription(eventName, venueName, dj, notes, dayOfWeek);

        // Pull promos/specials from DB
        const eventPromos = promosByEvent.get(event.id) || promosByVenue.get(event.venue_id) || [];
        const drinkSpecials = eventPromos
          .filter((p) => /drink|shot|beer|cocktail|happy hour|2.for.1|bogo/i.test(p.title + " " + p.description))
          .map((p) => p.title)
          .join(", ");
        const otherSpecials = eventPromos
          .filter((p) => !/drink|shot|beer|cocktail|happy hour|2.for.1|bogo/i.test(p.title + " " + p.description))
          .map((p) => p.title)
          .join(", ");

        // Day-consistent colors so same-day events have matching visual style
        const dayColors = DAY_COLORS[dayOfWeek] || [];

        // Detect features from event name / notes
        const features: string[] = [];
        const textLower = `${eventName} ${notes} ${dj}`.toLowerCase();
        if (/contest|competition|battle|showdown/i.test(textLower)) features.push("Karaoke Contest");
        if (/prize|cash|win/i.test(textLower)) features.push("Cash Prizes");
        if (/dj /i.test(textLower) || /dj$/i.test(textLower)) features.push("DJ Set");
        if (/band|live music/i.test(textLower)) features.push("Live Band");
        if (/drink|happy hour|special/i.test(textLower)) features.push("Drink Specials");

        const payload = {
          eventName,
          venueName,
          venueAddress: `${venueAddress}${venue?.city ? `, ${venue.city}` : ""}${venue?.state ? `, ${venue.state}` : ""}`,
          eventDate,
          startTime: event.start_time || "9:00 PM",
          endTime: event.end_time || "",
          coverCharge: "",
          theme,
          moodDescription,
          dressCode: "",
          specialFeatures: features,
          drinkSpecials,
          foodDeals: "",
          prizes: otherSpecials,
          promoText: dj ? `Hosted by ${dj}` : "",
          venueId: event.venue_id,
          userId: user.id,
          autoGenerated: true,
          generatedAt: new Date().toISOString(),
          ...(dayColors.length > 0 && { colors: dayColors }),
        };

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`n8n returned ${res.status}`);
          }

          const result = await res.json();

          if (!result.success || (!result.imageUrl && !result.imageBase64)) {
            throw new Error(result.error || "No image returned");
          }

          // Get the image URL (prefer direct URL over base64)
          let imageUrl = result.imageUrl;

          // If only base64 was returned, upload it to Supabase storage
          if (!imageUrl && result.imageBase64) {
            const fileName = `auto-flyers/${event.id}-${Date.now()}.webp`;
            const buffer = Buffer.from(result.imageBase64, "base64");

            const { error: uploadError } = await supabase.storage
              .from("flyer-uploads")
              .upload(fileName, buffer, {
                contentType: "image/webp",
                upsert: true,
              });

            if (uploadError) throw new Error("Upload failed: " + uploadError.message);

            const { data: urlData } = supabase.storage
              .from("flyer-uploads")
              .getPublicUrl(fileName);

            imageUrl = urlData.publicUrl;
          }

          // Update the event's flyer_url
          const { error: updateError } = await supabase
            .from("venue_events")
            .update({ flyer_url: imageUrl })
            .eq("id", event.id);

          if (updateError) throw new Error("DB update failed: " + updateError.message);

          return { eventId: event.id, venueName, theme, success: true };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          throw new Error(`${venueName} — ${eventName}: ${msg}`);
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        generated++;
      } else {
        failed++;
        errors.push(result.reason?.message || "Unknown error");
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < events.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return NextResponse.json({
    success: true,
    message: `Generated ${generated} flyers. ${failed > 0 ? `${failed} failed.` : "All succeeded!"}`,
    generated,
    failed,
    total: events.length,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}
