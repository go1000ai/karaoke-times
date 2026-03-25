import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Normalize venue names: "And" ↔ "&", trim, collapse whitespace
const normalizeName = (n: string) =>
  n.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();

// Normalize non-standard day-of-week values to standard days
const DAY_NORMALIZE: Record<string, string> = {
  // Plural forms
  "Mondays": "Monday",
  "Tuesdays": "Tuesday",
  "Wednesdays": "Wednesday",
  "Thursdays": "Thursday",
  "Fridays": "Friday",
  "Saturdays": "Saturday",
  "Sundays": "Sunday",
  // Non-standard recurring
  "Bi Monthly Sundays": "Sunday",
  "Bi-Monthly Sundays": "Sunday",
  "Every 3rd Monday": "Monday",
  "1st And 3rd Mondays": "Monday",
  "1st & 3rd Mondays": "Monday",
  "Every 1st And 3rd Saturdays": "Saturday",
  "Every 1st & 3rd Saturdays": "Saturday",
  "Monthly Fridays": "Friday",
  "Open Karaoke Party Room": "Private Room Karaoke",
};

// Standard day names for fallback extraction
const STANDARD_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Robust day normalization: handles &/And variants, plural forms, and extracts
// embedded standard day names as a fallback (e.g., "Every 3rd Monday" → "Monday")
function normalizeDay(raw: string): string {
  if (!raw) return raw;
  // Direct lookup first
  if (DAY_NORMALIZE[raw]) return DAY_NORMALIZE[raw];
  // Try with & → And normalization
  const withAnd = raw.replace(/&/g, "And");
  if (DAY_NORMALIZE[withAnd]) return DAY_NORMALIZE[withAnd];
  // If it's already a standard day, return as-is
  if (STANDARD_DAYS.includes(raw)) return raw;
  // Fallback: extract standard day name from the string (e.g., "Every 3rd Monday" → "Monday")
  const lower = raw.toLowerCase();
  for (const day of STANDARD_DAYS) {
    if (lower.includes(day.toLowerCase())) return day;
  }
  // Also check plural forms embedded in string
  for (const day of STANDARD_DAYS) {
    if (lower.includes(day.toLowerCase() + "s")) return day;
  }
  return raw;
}

// Slugify for image lookup: lowercase, replace non-alphanumeric with hyphens
const slugify = (n: string) =>
  n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Static venue image map: slugified venue name → image path
// This matches the venue name (without day) to an image file in /public/venues/
const VENUE_IMAGES: Record<string, string> = {
  "101-ktv-bar-lounge": "/venues/101-ktv-bar-lounge.jpg",
  "1683-bar": "/venues/1683-bar-monday.jpg",
  "233-starr-karaoke-and-eats": "/venues/233-starr-karaoke-and-eats.jpg",
  "333-lounge-and-restaurant": "/venues/333-lounge-and-restaurant-sunday.jpg",
  "95-south": "/venues/dj-frank-smooth-thursday.jpg",
  // "alibi" — no dedicated image; removed incorrect drink-lounge mapping
  "allan-s-bakery": "/venues/allan-s-bakery-friday.webp",
  "allans-bakery": "/venues/allans-bakery-friday.jpg",
  "american-legion-hall": "/venues/american-legion-hall-friday.jpg",
  "anytime-karaoke": "/venues/anytime-karaoke.jpg",
  "aux-karaoke": "/venues/aux-karaoke.jpg",
  "blu-seafood": "/venues/blu-seafood-tuesday.jpg",
  "boho-karaoke": "/venues/boho-karaoke.jpg",
  "brew-house": "/venues/brew-house-saturday.jpg",
  "the-brew-house": "/venues/brew-house-saturday.jpg",
  "buck-it-sports-latin-grill": "/venues/buck-it-sports-latin-grill-wednesday.jpg",
  "c-list-cocktail-bar": "/venues/c-list-cocktail-bar-saturday.jpg",
  "the-c-list-cocktail-bar": "/venues/c-list-cocktail-bar-saturday.jpg",
  "the-c-list": "/venues/c-list-superstar-saturday.jpg",
  "canz-bohemia": "/venues/canz-bohemia-wednesday.jpg",
  "charlie-meaney-s": "/venues/charlie-meaneys-saturday.jpg",
  "charlie-meaneys": "/venues/charlie-meaneys-saturday.jpg",
  "corner-bistro": "/venues/corner-bistro-friday.jpeg",
  "the-corner-lounge-bistro": "/venues/corner-bistro-friday.jpeg",
  "courtyard-ale-house": "/venues/courtyard-ale-house-saturday.jpg",
  "the-courtyard-ale-house": "/venues/courtyard-ale-house-saturday.jpg",
  "curly-wolf-saloon": "/venues/curly-wolf-saloon-thursday.jpg",
  "deja-vu-haitian-restaurant": "/venues/deja-vu-haitian-restaurant-thursday.jpg",
  "dreamhouse": "/venues/dreamhouse-wednesday.jpg",
  "drink-lounge": "/venues/drink-lounge-tuesday.jpg",
  "essence-bar-and-grill": "/venues/essence-bar-grill-saturday.jpg",
  "essence-bar-grill": "/venues/essence-bar-grill-saturday.jpg",
  "footprints-cafe": "/venues/footprints-cafe-monday.jpg",
  "frontline-bar-and-lounge": "/venues/frontline-thursday.jpg",
  "fusion-east": "/venues/fusion-east-monday.jpg",
  "good-company": "/venues/good-company-friday.jpg",
  "gt-kingston": "/venues/gt-kingston-wednesday.jpg",
  "gt-kingston-monday": "/venues/gt-kingston-monday.jpg",
  "guest-house": "/venues/guest-house-tuesday.jpg",
  "hamilton-hall": "/venues/hamilton-hall-wednesday.jpg",
  "harlem-nights": "/venues/harlem-nights.jpg",
  "harlem-nights-bar": "/venues/harlem-nights-bar-tuesday.jpg",
  "havana-cafe": "/venues/havana-cafe-wednesday.jpg",
  "havana-room": "/venues/havana-room-wednesday.jpg",
  "ho-brah": "/venues/ho-brah-wednesday.jpg",
  "instant-reply-sports-bar": "/venues/instant-reply-sports-bar-friday.jpg",
  "irish-american-pub": "/venues/irish-american-pub-saturday.jpg",
  "island-grill-cafe": "/venues/island-grill-cafe-monday.jpg",
  "island-suite": "/venues/island-grill.jpg",
  "it-s-about-time-cocktail-lounge": "/venues/it-s-about-time-cocktail-lounge-friday.jpg",
  "karaoke-shout": "/venues/karaoke-shout.jpg",
  "klassique-restaurant": "/venues/klassique-friday.jpg",
  "klassique": "/venues/klassique-friday.jpg",
  "la-cocina-boricua": "/venues/la-cocina-boricua-friday.jpg",
  "la-cocina-boriqua": "/venues/la-cocina-boriqua-saturday.jpg",
  "la-mode-bk": "/venues/la-mode-bk-sunday.jpg",
  "lagos-times-square": "/venues/lagos-times-square-wednesday.jpg",
  "lilah-s-bar-and-grill": "/venues/lilah-s-bar-and-grill-bi-monthly-sundays.jpg",
  "maloney-s-bar": "/venues/maloneys-bar-thursday.jpg",
  "maloneys-bar": "/venues/maloneys-bar-thursday.jpg",
  "mc-shane-s-pub-restaurant": "/venues/mc-shane-s-pub-restaurant-wednesday.jpg",
  "metropolitan-bar": "/venues/metropolitan-bar-tuesday.jpg",
  "moonlight-pub": "/venues/moonlight-pub-saturday.jpg",
  "mo-s-bar": "/venues/mos-bar-tuesday.jpg",
  "mo-s-bar-and-lounge": "/venues/mos-bar-tuesday.jpg",
  "ms-kims": "/venues/ms-kims.jpg",
  "murf-s-backstreet-tavern": "/venues/murf-s-backstreet-tavern-thursday.jpg",
  "my-place-tavern": "/venues/my-place-tavern-sunday.jpg",
  "native": "/venues/native-monday.jpg",
  "ocean-prime": "/venues/ocean-prime-friday.jpg",
  "ocho-rios-seafood-and-lounge": "/venues/ocho-rios-wednesday.jpg",
  "ocho-rios": "/venues/ocho-rios-wednesday.jpg",
  "the-oval-sports-bar-and-lounge": "/venues/oval-sports-lounge-tuesday.jpg",
  "oval-sports-lounge": "/venues/oval-sports-lounge-tuesday.jpg",
  "patrick-steakhouse": "/venues/patrick-steakhouse-wednesday.jpg",
  "pitants-sports-bar": "/venues/pitants-sports-bar-sunday.jpg",
  "pitch": "/venues/pitch-tuesday.jpg",
  "poseidon": "/venues/poseidon-wednesday.jpg",
  "pour-choices": "/venues/pour-choices-thursday.jpg",
  "prohibition": "/venues/prohibition-thursday.jpg",
  "the-rabbit-hole": "/venues/rabbit-hole-thursday.jpg",
  "rabbit-hole": "/venues/rabbit-hole-thursday.jpg",
  "richards-restaurant-and-grill": "/venues/richards-monday.jpg",
  "richards": "/venues/richards-monday.jpg",
  "roaddog-karaoke": "/venues/roaddog-karaoke-friday.jpg",
  "the-rock": "/venues/the-rock-wednesday.jpg",
  // "rollin-greens" removed — static flyer had a specific date baked in; use AI flyer instead
  "rpm-underground": "/venues/rpm-underground.jpg",
  "saints-and-scholars": "/venues/saints-scholars-monday.jpg",
  "saints-scholars": "/venues/saints-scholars-monday.jpg",
  "the-samurai-lounge": "/venues/the-samurai-lounge-thursday.jpg",
  "shannon-pot-2": "/venues/shannon-pot-2-friday.jpg",
  "shenanigans-pub": "/venues/shenanigans-saturday.jpg",
  "shenanigans": "/venues/shenanigans-saturday.jpg",
  "silkcove": "/venues/silkcove-friday.jpg",
  "sylk-cove-lounge": "/venues/silkcove-friday.jpg",
  "sing-sing-karaoke": "/venues/sing-sing-avenue-a.jpg",
  "singsing-karaoke-bar-and-chicken": "/venues/singsing-karaoke-bar-and-chicken.jpg",
  "sissy-mcginty-s": "/venues/sissy-mcgintys-friday.jpg",
  "sissy-mcgintys": "/venues/sissy-mcgintys-friday.jpg",
  "stop-at-the-spot": "/venues/stop-at-the-spot-sunday.jpg",
  "sunset-bar-and-restaurant": "/venues/sunset-bar-monday.jpg",
  "sunset-bar": "/venues/sunset-bar-monday.jpg",
  "tacotumba": "/venues/tacotumba-wednesday.jpg",
  "tha-cafe": "/venues/tha-cafe-wednesday.jpg",
  "the-american-legion": "/venues/american-legion-hall-friday.jpg",
  "the-backyard": "/venues/the-backyard-sunday.jpg",
  "the-blue-room": "/venues/blu-room-friday.jpg",
  "the-noon-inn": "/venues/the-noon-inn-thursday.jpg",
  "the-throwback": "/venues/prohibition-thursday.jpg",
  "tubby-hook-tavern": "/venues/tubby-hook-tavern-thursday.jpg",
  "waterfall-lounge": "/venues/waterfall-lounge-monday.jpg",
  "whisky-reds": "/venues/whisky-red-s-saturday.jpg",
  "woodzy": "/venues/woodzy-friday.jpg",
};

// Day names used to detect day-specific static images
const IMAGE_DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Check if a static image filename contains a day that doesn't match the event's day.
// e.g. "blu-room-friday.jpg" should NOT be used for a Saturday event.
function staticImageMatchesDay(imagePath: string, eventDay: string | null): boolean {
  if (!eventDay) return true; // no day info — allow the image
  const lowerPath = imagePath.toLowerCase();
  const lowerDay = eventDay.toLowerCase();
  for (const d of IMAGE_DAY_NAMES) {
    if (lowerPath.includes(d)) {
      // Image has a day baked in — only allow if it matches
      return d === lowerDay;
    }
  }
  // Image filename has no day — always OK
  return true;
}

// Look up a static image for a venue name, optionally filtering by day
function findVenueImage(venueName: string, eventDay?: string | null): string | null {
  const candidates: string[] = [];

  const slug = slugify(venueName);
  const normalized = slugify(venueName.replace(/&/g, " and "));

  // Try day-specific keys first (e.g., "gt-kingston-monday") — exact day match
  if (eventDay) {
    const daySlug = eventDay.toLowerCase();
    for (const s of [slug, normalized]) {
      const dayKey = `${s}-${daySlug}`;
      if (VENUE_IMAGES[dayKey] && !candidates.includes(VENUE_IMAGES[dayKey])) candidates.push(VENUE_IMAGES[dayKey]);
      const noThe = s.replace(/^the-/, "");
      const dayKeyNoThe = `${noThe}-${daySlug}`;
      if (VENUE_IMAGES[dayKeyNoThe] && !candidates.includes(VENUE_IMAGES[dayKeyNoThe])) candidates.push(VENUE_IMAGES[dayKeyNoThe]);
    }
    // Return immediately if a day-specific key matched
    if (candidates.length > 0) return candidates[0];
  }

  // Then generic keys, filtered by day via staticImageMatchesDay
  if (VENUE_IMAGES[slug]) candidates.push(VENUE_IMAGES[slug]);
  if (VENUE_IMAGES[normalized] && !candidates.includes(VENUE_IMAGES[normalized])) candidates.push(VENUE_IMAGES[normalized]);

  for (const s of [slug, normalized]) {
    const noThe = s.replace(/^the-/, "");
    if (VENUE_IMAGES[noThe] && !candidates.includes(VENUE_IMAGES[noThe])) candidates.push(VENUE_IMAGES[noThe]);
    if (VENUE_IMAGES[`the-${s}`] && !candidates.includes(VENUE_IMAGES[`the-${s}`])) candidates.push(VENUE_IMAGES[`the-${s}`]);
  }

  // Return first candidate that matches the event's day (or has no day in filename)
  for (const img of candidates) {
    if (staticImageMatchesDay(img, eventDay || null)) return img;
  }

  return null;
}

// Public endpoint: returns synced events merged with venue_events from DB
export async function GET() {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch synced events (CSV-sourced), active venue_events, and inactive venue_events in parallel
    const [syncResult, dbResult, inactiveResult] = await Promise.all([
      supabase
        .from("synced_events")
        .select("events_json, synced_at")
        .eq("id", "latest")
        .single(),
      supabase
        .from("venue_events")
        .select("id, venue_id, day_of_week, event_name, dj, start_time, end_time, notes, flyer_url, is_active, venues(name, address, city, state, zip_code, neighborhood, cross_street, phone, website, instagram, menu_url)")
        .neq("is_active", false),
      supabase
        .from("venue_events")
        .select("day_of_week, venues(name)")
        .eq("is_active", false),
    ]);

    // Build blocklist: inactive venue+day combos that should be suppressed from synced_events
    const blockedKeys = new Set<string>();
    for (const ie of (inactiveResult.data || [])) {
      const name = (ie.venues as any)?.name;
      if (name) blockedKeys.add(`${normalizeName(name)}|${normalizeDay(ie.day_of_week || "")}`);
    }

    const syncedEvents = (syncResult.data?.events_json && Array.isArray(syncResult.data.events_json))
      ? syncResult.data.events_json as Record<string, unknown>[]
      : [];

    // Deduplicate synced events; also suppress any that have been deactivated in venue_events
    const seen = new Set<string>();
    const events = syncedEvents.filter((e) => {
      const rawDay = (e.dayOfWeek as string) || "";
      const normalizedDay = normalizeDay(rawDay);
      const key = `${normalizeName((e.venueName as string) || "")}|${normalizedDay}`;
      if (blockedKeys.has(key)) return false; // admin marked inactive
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Merge venue_events from DB that aren't already in synced_events
    const dbEvents = dbResult.data || [];
    for (const ve of dbEvents) {
      const venue = ve.venues as any;
      if (!venue?.name) continue;
      const rawDay = ve.day_of_week || "";
      const normalizedDay = normalizeDay(rawDay);
      const key = `${normalizeName(venue.name)}|${normalizedDay}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({
        id: ve.venue_id,
        dayOfWeek: ve.day_of_week,
        eventName: ve.event_name || "",
        venueName: venue.name,
        address: venue.address || "",
        city: venue.city || "",
        state: venue.state || "",
        zipCode: venue.zip_code || "",
        neighborhood: venue.neighborhood || "",
        crossStreet: venue.cross_street || "",
        phone: venue.phone || "",
        dj: ve.dj || "",
        startTime: ve.start_time || "",
        endTime: ve.end_time || "",
        notes: ve.notes || "",
        image: ve.flyer_url || null,
        website: venue.website || null,
        instagram: venue.instagram || null,
        menuUrl: venue.menu_url || null,
        isPrivateRoom: false,
        bookingUrl: null,
      });
    }

    // Fetch primary venue images from venue_media AND all venues for name→ID mapping
    const [{ data: primaryImages }, { data: allVenues }] = await Promise.all([
      supabase
        .from("venue_media")
        .select("venue_id, url")
        .eq("is_primary", true)
        .eq("type", "image"),
      supabase
        .from("venues")
        .select("id, name, instagram, menu_url"),
    ]);

    // Build venue_id → primary image map
    const venueImageMap = new Map<string, string>();
    for (const img of primaryImages || []) {
      venueImageMap.set(img.venue_id, img.url);
    }

    // Build venue name → venue_id map from ALL venues (not just venue_events)
    // This ensures every venue can be looked up for venue_media images
    const venueIdMap = new Map<string, string>();
    const venueInstagramMap = new Map<string, string>();
    const venueMenuMap = new Map<string, string>();
    for (const v of allVenues || []) {
      if (v.name) {
        venueIdMap.set(normalizeName(v.name), v.id);
        if (v.instagram) venueInstagramMap.set(normalizeName(v.name), v.instagram);
        if (v.menu_url) venueMenuMap.set(normalizeName(v.name), v.menu_url);
      }
    }

    // Build flyer maps: by name+day, by venue_id+day
    // KJ/Admin uploaded flyers go in flyerMap (top priority)
    // Gemini auto-generated flyers go in autoFlyerMap (lower priority, after static images)
    const flyerMap = new Map<string, string>();
    const flyerByIdMap = new Map<string, string>();
    const autoFlyerMap = new Map<string, string>();
    for (const ve of dbEvents) {
      const name = (ve.venues as any)?.name;
      if (name) {
        if (!venueIdMap.has(normalizeName(name))) {
          venueIdMap.set(normalizeName(name), ve.venue_id);
        }
        if (ve.flyer_url) {
          const key = `${normalizeName(name)}|${normalizeDay(ve.day_of_week)}`;
          if (ve.flyer_url.includes("auto-flyers/")) {
            autoFlyerMap.set(key, ve.flyer_url);
          } else {
            flyerMap.set(key, ve.flyer_url);
            flyerByIdMap.set(`${ve.venue_id}|${normalizeDay(ve.day_of_week)}`, ve.flyer_url);
          }
        }
      }
    }

    // Replace slug IDs with venue UUIDs so venue detail pages work
    // UUIDs match pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const ev of events) {
      if (ev.venueName && ev.id && !uuidRe.test(ev.id as string)) {
        const vid = venueIdMap.get(normalizeName(ev.venueName as string));
        if (vid) ev.id = vid;
      }
    }

    // Enrich all events with images. Priority:
    // 1. KJ uploaded flyer (venue_events.flyer_url, day-matched)
    // 2. Admin curated images (static /venues/*.jpg photos)
    // 3. AI-generated (Gemini stored in auto-flyers, or on-the-fly placeholder)
    for (const ev of events) {
      const venueKey = ev.venueName ? normalizeName(ev.venueName as string) : null;
      const normalizedDay = ev.dayOfWeek ? normalizeDay(ev.dayOfWeek as string) : null;

      // 1a. KJ flyer by venue name + day
      if (venueKey && normalizedDay) {
        const dayKey = `${venueKey}|${normalizedDay}`;
        const dbFlyer = flyerMap.get(dayKey);
        if (dbFlyer) {
          ev.image = dbFlyer;
          continue;
        }
      }

      // 1b. KJ flyer by venue_id + day (fallback if name mismatch)
      if (ev.id && uuidRe.test(ev.id as string) && normalizedDay) {
        const idDayKey = `${ev.id}|${normalizedDay}`;
        const dbFlyer = flyerByIdMap.get(idDayKey);
        if (dbFlyer) {
          ev.image = dbFlyer;
          continue;
        }
      }

      // 2. Gemini auto-generated flyer (stored in auto-flyers/)
      if (venueKey && normalizedDay) {
        const dayKey = `${venueKey}|${normalizedDay}`;
        const autoFlyer = autoFlyerMap.get(dayKey);
        if (autoFlyer) {
          ev.image = autoFlyer;
          continue;
        }
      }

      // 3. Admin curated static images (/venues/*.jpg) — day-aware
      if (ev.venueName) {
        const staticImg = findVenueImage(ev.venueName as string, normalizedDay);
        if (staticImg) {
          ev.image = staticImg;
          continue;
        }
      }

      // 4. venue_media primary image (admin uploaded via dashboard)
      if (venueKey) {
        const vid = venueIdMap.get(venueKey);
        if (vid) {
          const mediaImg = venueImageMap.get(vid);
          if (mediaImg) {
            ev.image = mediaImg;
            continue;
          }
        }
      }

      // 5. OG placeholder (on-the-fly, always correct day/venue info)
      if (ev.venueName) {
        const params = new URLSearchParams({ venue: ev.venueName as string });
        if (ev.eventName) params.set("event", ev.eventName as string);
        if (ev.dayOfWeek) params.set("day", ev.dayOfWeek as string);
        if (ev.dj) params.set("dj", ev.dj as string);
        ev.image = `/api/venue-image?${params.toString()}`;
      }
    }


    // Enrich all events with instagram/menu from venue data
    for (const ev of events) {
      const venueKey = ev.venueName ? normalizeName(ev.venueName as string) : null;
      if (venueKey) {
        if (!ev.instagram) ev.instagram = venueInstagramMap.get(venueKey) || null;
        if (!ev.menuUrl) ev.menuUrl = venueMenuMap.get(venueKey) || null;
      }
    }

    // Final dedup pass: catch any remaining duplicates after all normalization
    const finalSeen = new Set<string>();
    const dedupedEvents = events.filter((e) => {
      const day = normalizeDay((e.dayOfWeek as string) || "");
      const key = `${normalizeName((e.venueName as string) || "")}|${day}`;
      if (finalSeen.has(key)) return false;
      finalSeen.add(key);
      return true;
    });

    if (dedupedEvents.length > 0) {
      return NextResponse.json({
        events: dedupedEvents,
        synced_at: syncResult.data?.synced_at || new Date().toISOString(),
      });
    }

    return NextResponse.json({ events: null });
  } catch {
    return NextResponse.json({ events: null });
  }
}
