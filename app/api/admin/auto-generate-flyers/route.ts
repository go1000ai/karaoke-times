import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import promptConfig from "@/lib/flyer-prompts.json";

export const maxDuration = 300; // 5 minutes max for batch processing

// ── Theme detection from event name / notes / DJ ──────────────────────
function detectStyle(eventName: string, notes: string, dj: string, dayOfWeek: string): string {
  const text = `${eventName} ${notes} ${dj}`.toLowerCase();

  // Check keyword-based theme overrides first
  for (const [style, keywords] of Object.entries(promptConfig.theme_keywords)) {
    if ((keywords as string[]).some((kw) => text.includes(kw))) return style;
  }

  // Fall back to day-based style hints with deterministic variety
  const dayHints = (promptConfig.day_style_hints as Record<string, string[]>)[dayOfWeek];
  if (dayHints && dayHints.length > 0) {
    // Use venue name hash for consistent but varied selection
    const hash = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return dayHints[hash % dayHints.length];
  }

  return "neon_stage"; // default
}

// ── Build the full prompt from config ──────────────────────────────────
function buildPrompt(styleName: string, venueHash: number): string {
  const styles = promptConfig.styles as Record<string, {
    prompt: string;
    colors: string[][];
  }>;
  const style = styles[styleName] || styles["neon_stage"];
  const colorSet = style.colors[venueHash % style.colors.length];
  const [color1, color2] = colorSet;

  const styledPrompt = style.prompt
    .replace(/\{color1\}/g, color1)
    .replace(/\{color2\}/g, color2);

  return `${styledPrompt} ${promptConfig.base_instructions}`;
}

// ── Call Imagen 4.0 Fast to generate an image (with retry on rate limit) ──
async function generateImage(prompt: string, apiKey: string, attempt = 0): Promise<Buffer> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "4:3" },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    // Retry once on rate limit (429) or server error (500/503) after a delay
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const delay = res.status === 429 ? 8000 : 4000;
      await new Promise((r) => setTimeout(r, delay));
      return generateImage(prompt, apiKey, attempt + 1);
    }
    throw new Error(`Imagen API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("No image data in response");

  return Buffer.from(b64, "base64");
}

export async function POST(request: Request) {
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      message: "GEMINI_API_KEY not configured.",
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check for optional body params
  let limit: number | undefined;
  let forceRegenerate = false;
  let venueEventIds: string[] | undefined;
  try {
    const body = await request.json();
    limit = body?.limit;
    forceRegenerate = body?.forceRegenerate === true;
    venueEventIds = Array.isArray(body?.venueEventIds) ? body.venueEventIds : undefined;
  } catch {
    // No body — that's fine
  }

  // Find events that need flyers
  // If venueEventIds provided: regenerate only those specific events
  // If forceRegenerate: include events with auto-generated flyers too
  // Otherwise: only events without any flyer
  let query = supabase
    .from("venue_events")
    .select("id, venue_id, day_of_week, event_name, dj, notes, venues(name, address, city)")
    .eq("is_active", true)
    .order("day_of_week");

  if (venueEventIds && venueEventIds.length > 0) {
    // Regenerate specific events by ID (always regenerate regardless of flyer status)
    query = query.in("id", venueEventIds);
  } else if (forceRegenerate) {
    // Get events with no flyer OR with auto-generated flyers
    query = query.or("flyer_url.is.null,flyer_url.like.*auto-flyers*");
  } else {
    query = query.is("flyer_url", null);
  }

  const { data: events, error } = await query;

  if (error || !events) {
    return NextResponse.json({
      success: false,
      message: "Failed to fetch events: " + (error?.message || "unknown"),
    });
  }

  // Optionally limit batch size (phase 2 venues share the same limit budget)
  const batch = limit ? events.slice(0, limit) : events;

  let generated = 0;
  let failed = 0;
  const errors: string[] = [];
  const results: { venue: string; event: string; style: string; success: boolean }[] = [];

  // Process one at a time to avoid rate limits
  const BATCH_SIZE = 1;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);

    const chunkResults = await Promise.allSettled(
      chunk.map(async (ev) => {
        const venue = ev.venues as unknown as { name: string; address: string; city: string } | null;
        const venueName = venue?.name || "Karaoke Venue";
        const eventName = ev.event_name || "Karaoke Night";
        const dj = ev.dj || "";
        const notes = ev.notes || "";
        const dayOfWeek = ev.day_of_week || "";

        // Pick the visual style
        const styleName = detectStyle(eventName, notes, dj, dayOfWeek);
        const venueHash = venueName.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
        const prompt = buildPrompt(styleName, venueHash);

        try {
          // Generate image via Imagen 4.0
          const imageBuffer = await generateImage(prompt, apiKey);

          // Upload to Supabase storage
          const fileName = `auto-flyers/${ev.id}-${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from("flyer-uploads")
            .upload(fileName, imageBuffer, {
              contentType: "image/png",
              upsert: true,
            });

          if (uploadError) throw new Error("Upload failed: " + uploadError.message);

          const { data: urlData } = supabase.storage
            .from("flyer-uploads")
            .getPublicUrl(fileName);

          // Update event's flyer_url
          const { error: updateError } = await supabase
            .from("venue_events")
            .update({ flyer_url: urlData.publicUrl })
            .eq("id", ev.id);

          if (updateError) throw new Error("DB update failed: " + updateError.message);

          return { venue: venueName, event: eventName, style: styleName, success: true };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          throw new Error(`${venueName} — ${eventName}: ${msg}`);
        }
      })
    );

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        generated++;
        results.push(result.value);
      } else {
        failed++;
        errors.push(result.reason?.message || "Unknown error");
      }
    }

    // Delay between requests to respect rate limits
    if (i + BATCH_SIZE < batch.length) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // ── Phase 2: private-room and open-format venues (no venue_events) ────
  // These are karaoke displays that have no event row, so the loop above
  // never reaches them. They live entirely on the venue and use venue_media
  // as their image source.
  //
  // Skipped when the request targeted specific venue_event IDs — that's an
  // event-only workflow.
  let venuesProcessed = 0;
  const venueStyles = Object.keys(promptConfig.styles as Record<string, unknown>);

  if (!venueEventIds || venueEventIds.length === 0) {
    const { data: candidateVenues } = await supabase
      .from("venues")
      .select("id, name, address, city, is_private_room, karaoke_type, venue_media(id, url, is_primary, type)")
      .or("is_private_room.eq.true,karaoke_type.eq.open_format");

    // Phase 2 is intentionally fill-only: a venue is processed only when it
    // has no primary image at all. forceRegenerate applies to events (Phase 1);
    // per-venue replacement should be a separate, explicit action.
    const venuesNeedingFlyer = (candidateVenues || []).filter((v) => {
      const media = (v.venue_media as { id: string; url: string; is_primary: boolean; type: string }[] | null) || [];
      const primaryImage = media.find((m) => m.is_primary && m.type === "image");
      return !primaryImage;
    });

    const venueBatch = limit ? venuesNeedingFlyer.slice(0, Math.max(0, limit - batch.length)) : venuesNeedingFlyer;

    for (let i = 0; i < venueBatch.length; i += BATCH_SIZE) {
      const chunk = venueBatch.slice(i, i + BATCH_SIZE);

      const chunkResults = await Promise.allSettled(
        chunk.map(async (v) => {
          const venueName = v.name || "Karaoke Venue";
          const hash = venueName.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
          const styleName = venueStyles[hash % venueStyles.length];
          const prompt = buildPrompt(styleName, hash);

          try {
            const imageBuffer = await generateImage(prompt, apiKey);

            const fileName = `auto-flyers/venue-${v.id}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
              .from("flyer-uploads")
              .upload(fileName, imageBuffer, { contentType: "image/png", upsert: true });
            if (uploadError) throw new Error("Upload failed: " + uploadError.message);

            const { data: urlData } = supabase.storage.from("flyer-uploads").getPublicUrl(fileName);

            const { error: insertError } = await supabase.from("venue_media").insert({
              venue_id: v.id,
              url: urlData.publicUrl,
              type: "image",
              is_primary: true,
              sort_order: 0,
            });
            if (insertError) throw new Error("DB insert failed: " + insertError.message);

            return { venue: venueName, event: "(venue)", style: styleName, success: true };
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            throw new Error(`${venueName} — venue: ${msg}`);
          }
        })
      );

      for (const result of chunkResults) {
        if (result.status === "fulfilled") {
          venuesProcessed++;
          generated++;
          results.push(result.value);
        } else {
          failed++;
          errors.push(result.reason?.message || "Unknown error");
        }
      }

      if (i + BATCH_SIZE < venueBatch.length) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  const totalProcessed = batch.length + venuesProcessed;
  return NextResponse.json({
    success: true,
    message: `Generated ${generated} flyers via Imagen 4.0. ${failed > 0 ? `${failed} failed.` : "All succeeded!"}`,
    generated,
    failed,
    total: totalProcessed,
    results: results.slice(0, 20),
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}
