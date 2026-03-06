// Slugify for image lookup: lowercase, replace non-alphanumeric with hyphens
const slugify = (n: string) =>
  n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Static venue image map: slugified venue name → image path
// This matches the venue name (without day) to an image file in /public/venues/
export const VENUE_IMAGES: Record<string, string> = {
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

// Look up a static image for a venue name
export function findVenueImage(venueName: string): string | null {
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
