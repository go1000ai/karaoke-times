import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { karaokeEvents } from "@/lib/mock-data";
import VenueClient from "./VenueClient";

const SITE_URL = "https://karaoketimes.net";

type VenueInfo = {
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  neighborhood: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  isPrivateRoom: boolean;
  karaokeType: string | null;
  image: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  dj: string | null;
};

async function getVenue(id: string): Promise<VenueInfo | null> {
  // Try mock data first (slug IDs)
  const mock = karaokeEvents.find((e) => e.id === id);
  if (mock) {
    return {
      name: mock.venueName,
      address: mock.address,
      city: mock.city,
      state: mock.state,
      zip: mock.zipCode ?? null,
      neighborhood: mock.neighborhood,
      phone: mock.phone,
      website: mock.website,
      description: mock.notes || null,
      isPrivateRoom: !!mock.isPrivateRoom,
      karaokeType: mock.isPrivateRoom ? "private_room" : "open_format",
      image: mock.image ?? mock.flyer ?? null,
      dayOfWeek: mock.dayOfWeek,
      startTime: mock.startTime,
      endTime: mock.endTime,
      dj: mock.dj,
    };
  }

  // Try Supabase (UUID)
  try {
    const supabase = await createClient();
    const { data: venue } = await supabase
      .from("venues")
      .select(
        "name, address, city, state, zip_code, neighborhood, phone, website, description, is_private_room, karaoke_type"
      )
      .eq("id", id)
      .single();
    if (!venue) return null;

    const { data: event } = await supabase
      .from("venue_events")
      .select("day_of_week, start_time, end_time, dj")
      .eq("venue_id", id)
      .eq("is_active", true)
      .limit(1)
      .single();

    return {
      name: venue.name as string,
      address: (venue.address as string) ?? null,
      city: (venue.city as string) ?? null,
      state: (venue.state as string) ?? null,
      zip: (venue.zip_code as string) ?? null,
      neighborhood: (venue.neighborhood as string) ?? null,
      phone: (venue.phone as string) ?? null,
      website: (venue.website as string) ?? null,
      description: (venue.description as string) ?? null,
      isPrivateRoom: !!venue.is_private_room,
      karaokeType: (venue.karaoke_type as string) ?? null,
      image: null,
      dayOfWeek: (event?.day_of_week as string) ?? null,
      startTime: (event?.start_time as string) ?? null,
      endTime: (event?.end_time as string) ?? null,
      dj: (event?.dj as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const v = await getVenue(id);
  if (!v) {
    return {
      title: "Venue not found",
      robots: { index: false, follow: false },
    };
  }

  const locationParts = [v.neighborhood, v.city, v.state].filter(Boolean);
  const locationLabel = locationParts.length > 0 ? locationParts.join(", ") : "NYC";
  const eventLabel = v.dayOfWeek ? `${v.dayOfWeek} Karaoke` : "Karaoke";
  const title = `${v.name} — ${eventLabel} in ${locationLabel}`;
  const desc =
    v.description?.slice(0, 160) ||
    `${v.name} hosts karaoke${v.dayOfWeek ? ` every ${v.dayOfWeek}` : ""} at ${v.address ?? locationLabel}${v.dj ? `, hosted by ${v.dj}` : ""}. View schedule, address, and request songs on Karaoke Times NYC.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/venue/${id}` },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/venue/${id}`,
      title,
      description: desc,
      images: v.image ? [{ url: v.image, width: 1200, height: 630, alt: v.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: v.image ? [v.image] : undefined,
    },
  };
}

function venueJsonLd(id: string, v: VenueInfo) {
  const addressNode = v.address
    ? {
        "@type": "PostalAddress",
        streetAddress: v.address,
        addressLocality: v.city ?? "New York",
        addressRegion: v.state ?? "NY",
        postalCode: v.zip ?? undefined,
        addressCountry: "US",
      }
    : undefined;

  const businessType = v.isPrivateRoom ? "EntertainmentBusiness" : "BarOrPub";

  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": businessType,
    "@id": `${SITE_URL}/venue/${id}`,
    name: v.name,
    url: `${SITE_URL}/venue/${id}`,
    description: v.description ?? undefined,
    telephone: v.phone ?? undefined,
    sameAs: v.website ? [v.website] : undefined,
    image: v.image ?? undefined,
    address: addressNode,
    servesCuisine: undefined,
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "Karaoke",
        value: true,
      },
    ],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: v.city ?? "NYC",
        item: `${SITE_URL}/search`,
      },
      { "@type": "ListItem", position: 3, name: v.name, item: `${SITE_URL}/venue/${id}` },
    ],
  };

  const event =
    v.dayOfWeek && v.startTime
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: `${v.dayOfWeek} Karaoke at ${v.name}`,
          eventSchedule: {
            "@type": "Schedule",
            byDay: `https://schema.org/${v.dayOfWeek}`,
            repeatFrequency: "P1W",
            startTime: v.startTime,
            endTime: v.endTime ?? undefined,
          },
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: v.name,
            address: addressNode,
          },
          organizer: v.dj
            ? { "@type": "Person", name: v.dj }
            : { "@type": "Organization", name: v.name },
          url: `${SITE_URL}/venue/${id}`,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            url: `${SITE_URL}/venue/${id}`,
            availability: "https://schema.org/InStock",
          },
        }
      : null;

  return { localBusiness, breadcrumb, event };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await getVenue(id);

  const ld = v ? venueJsonLd(id, v) : null;

  return (
    <>
      {ld && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld.localBusiness) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld.breadcrumb) }}
          />
          {ld.event && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(ld.event) }}
            />
          )}
        </>
      )}
      <VenueClient params={params} />
    </>
  );
}
