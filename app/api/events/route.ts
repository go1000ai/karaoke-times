import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Normalize venue names: "And" ↔ "&", trim, collapse whitespace
const normalizeName = (n: string) =>
  n.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();

// Normalize non-standard day-of-week values to standard days
const DAY_NORMALIZE: Record<string, string> = {
  "Bi Monthly Sundays": "Sunday",
  "Bi-Monthly Sundays": "Sunday",
  "Every 3rd Monday": "Monday",
  "1st And 3rd Mondays": "Monday",
  "Every 1st And 3rd Saturdays": "Saturday",
  "Monthly Fridays": "Friday",
  "Open Karaoke Party Room": "Private Room Karaoke",
};

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
  "alibi": "/venues/drink-lounge-tuesday.jpg",
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
  "rollin-greens": "/venues/rollin-greens-thursday.jpg",
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
  "skinny-bar": "/venues/skinny-bar-monday.jpg",
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
  // Generated flyers for remaining venues
  "pianos": "/venues/pianos.jpg",
  "sandy-jacks": "/venues/sandy-jacks.jpg",
  "echo-bravo": "/venues/echo-bravo.jpg",
  "edie-jo-s": "/venues/edie-jo-s.jpg",
  "someplace-else-bar": "/venues/someplace-else-bar.jpg",
  "lucky-13-saloon": "/venues/lucky-13-saloon.jpg",
  "wraptor-restaurant-bar": "/venues/wraptor-restaurant-bar.jpg",
  "flava-2": "/venues/flava-2.jpg",
  "barbablu": "/venues/barbablu.jpg",
  "royal-restaurant-2": "/venues/royal-restaurant-2.jpg",
  "bamboo-walk": "/venues/bamboo-walk.jpg",
  "boro-bar": "/venues/boro-bar.jpg",
  "matrix-lounge": "/venues/matrix-lounge.jpg",
  "the-angry-gnome-pub": "/venues/the-angry-gnome-pub.jpg",
  "american-cheez": "/venues/american-cheez.jpg",
  "alligator-lounge": "/venues/alligator-lounge.jpg",
  "brixx-bar-and-grill": "/venues/brixx-bar-and-grill.jpg",
  "mr-nancy-s": "/venues/mr-nancy-s.jpg",
  "insa": "/venues/insa.jpg",
  "merv-s": "/venues/merv-s.jpg",
  "arirang-hibachi-steakhouse": "/venues/arirang-hibachi-steakhouse.jpg",
  "brooklyn-chop-house-times-square": "/venues/brooklyn-chop-house-times-square.jpg",
  "the-cobra-club": "/venues/the-cobra-club.jpg",
  "hinterlands": "/venues/hinterlands.jpg",
  "lvsiadas-restaurant": "/venues/lvsiadas-restaurant.jpg",
  "roebling-sporting-club": "/venues/roebling-sporting-club.jpg",
  "ek-s-hideaway": "/venues/ek-s-hideaway.jpg",
  "pinebox-rockshop": "/venues/pinebox-rockshop.jpg",
  "montero-s": "/venues/montero-s.jpg",
  "sean-og-s": "/venues/sean-og-s.jpg",
  "minnies-bar": "/venues/minnies-bar.jpg",
  "the-coal-pot": "/venues/the-coal-pot.jpg",
  "midwood-flats": "/venues/midwood-flats.jpg",
  "rullo-s": "/venues/rullo-s.jpg",
  "cassette": "/venues/cassette.jpg",
  "whoopsie-daisy-bar": "/venues/whoopsie-daisy-bar.jpg",
  "winnie-s-bar": "/venues/winnie-s-bar.jpg",
};

// Look up a static image for a venue name
function findVenueImage(venueName: string): string | null {
  // Try raw slugify first
  const slug = slugify(venueName);
  if (VENUE_IMAGES[slug]) return VENUE_IMAGES[slug];

  // Try with "&" → "and" normalization before slugifying
  const normalized = slugify(venueName.replace(/&/g, " and "));
  if (VENUE_IMAGES[normalized]) return VENUE_IMAGES[normalized];

  // Try without "the-" prefix
  for (const s of [slug, normalized]) {
    const noThe = s.replace(/^the-/, "");
    if (VENUE_IMAGES[noThe]) return VENUE_IMAGES[noThe];
    if (VENUE_IMAGES[`the-${s}`]) return VENUE_IMAGES[`the-${s}`];
  }

  return null;
}

// Public endpoint: returns synced events merged with venue_events from DB
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch synced events (CSV-sourced) and all active venue_events from DB in parallel
    const [syncResult, dbResult] = await Promise.all([
      supabase
        .from("synced_events")
        .select("events_json, synced_at")
        .eq("id", "latest")
        .single(),
      supabase
        .from("venue_events")
        .select("id, venue_id, day_of_week, event_name, dj, start_time, end_time, notes, flyer_url, is_active, venues(name, address, city, state, zip_code, neighborhood, cross_street, phone, website)")
        .neq("is_active", false),
    ]);

    const syncedEvents = (syncResult.data?.events_json && Array.isArray(syncResult.data.events_json))
      ? syncResult.data.events_json as Record<string, unknown>[]
      : [];

    // Deduplicate synced events
    const seen = new Set<string>();
    const events = syncedEvents.filter((e) => {
      const key = `${normalizeName((e.venueName as string) || "")}|${e.dayOfWeek || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Merge venue_events from DB that aren't already in synced_events
    const dbEvents = dbResult.data || [];
    for (const ve of dbEvents) {
      const venue = ve.venues as any;
      if (!venue?.name) continue;
      const key = `${normalizeName(venue.name)}|${ve.day_of_week || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({
        id: ve.id,
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
        isPrivateRoom: false,
        bookingUrl: null,
      });
    }

    // Build map of DB flyer_urls (user-uploaded flyers take priority over static images)
    const flyerMap = new Map<string, string>();
    for (const ve of dbEvents) {
      const name = (ve.venues as any)?.name;
      if (name && ve.flyer_url) {
        flyerMap.set(`${normalizeName(name)}|${ve.day_of_week}`, ve.flyer_url);
      }
    }

    // Enrich all events: DB flyer_urls override everything, then static VENUE_IMAGES as fallback
    for (const ev of events) {
      // Always prefer DB flyer_url (user uploads) over static images
      if (ev.venueName && ev.dayOfWeek) {
        const key = `${normalizeName(ev.venueName as string)}|${ev.dayOfWeek}`;
        const dbFlyer = flyerMap.get(key);
        if (dbFlyer) {
          ev.image = dbFlyer;
          continue;
        }
      }

      // If already has an image (from synced_events), keep it
      if (ev.image) continue;

      // Fallback: try static VENUE_IMAGES map
      if (ev.venueName) {
        const staticImg = findVenueImage(ev.venueName as string);
        if (staticImg) {
          ev.image = staticImg;
        }
      }
    }

    // Normalize non-standard dayOfWeek values to standard days
    for (const ev of events) {
      if (ev.dayOfWeek && DAY_NORMALIZE[ev.dayOfWeek as string]) {
        ev.dayOfWeek = DAY_NORMALIZE[ev.dayOfWeek as string];
      }
    }

    if (events.length > 0) {
      return NextResponse.json({
        events,
        synced_at: syncResult.data?.synced_at || new Date().toISOString(),
      });
    }

    return NextResponse.json({ events: null });
  } catch {
    return NextResponse.json({ events: null });
  }
}
