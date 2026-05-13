import { NextResponse } from "next/server";

export const revalidate = 3600;

const SITE_URL = "https://karaoketimes.net";

export async function GET() {
  const body = `# Karaoke Times NYC

> The most complete directory of karaoke nights, KJs, and karaoke venues across New York City — covering Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. Find a karaoke spot for every night of the week, search by neighborhood, browse private karaoke rooms, and discover the best KJs in NYC.

Karaoke Times NYC is a free, public directory of live karaoke events updated weekly. Visitors can browse by day of the week, search by neighborhood or venue name, view interactive maps, request songs at participating venues, and read reviews of venues and karaoke jockeys (KJs).

## Primary content

- [Home / Browse by night](${SITE_URL}): Featured karaoke nights, weekly schedule, neighborhood gallery, KJ spotlights.
- [Interactive map](${SITE_URL}/map): All karaoke venues plotted by location with filters by night and neighborhood.
- [Search](${SITE_URL}/search): Search venues, KJs, and events by name, neighborhood, or day.
- [Contact](${SITE_URL}/contact): Submit a venue, report a problem, or send feedback.

## Data feeds

- [Full sitemap (XML)](${SITE_URL}/sitemap.xml): All indexable URLs including every venue and KJ profile.
- [Full text feed (llms-full.txt)](${SITE_URL}/llms-full.txt): Plain-text dump of every venue and KJ with key details, optimized for AI ingestion.

## URL patterns

- Venue pages: \`${SITE_URL}/venue/{venue-id}\` — full venue detail with address, schedule, KJ, reviews, song-request form.
- KJ profile pages: \`${SITE_URL}/kj/{kj-slug}\` — KJ bio, genres, equipment, upcoming venues, reviews.

## Key concepts

- **Karaoke night**: a recurring weekly karaoke event at a specific venue, hosted by a KJ.
- **KJ (karaoke jockey)**: the host/DJ who runs the karaoke night, manages the song queue, and emcees performances.
- **Private karaoke room**: a rentable private room with karaoke equipment, typically for groups; distinct from open-format public karaoke nights.
- **Open-format karaoke**: a public karaoke night at a bar or restaurant where anyone can sign up to sing.

## About

Karaoke Times NYC is run by a small NYC-based team. Listings are curated and updated weekly. Venues and KJs can claim profiles via the contact form. Always confirm event details with the venue before visiting — karaoke nights can be canceled or rescheduled.
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
