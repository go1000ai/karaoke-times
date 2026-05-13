import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getKJBySlug } from "@/lib/mock-data";
import KJClient from "./KJClient";

const SITE_URL = "https://karaoketimes.net";

type KJInfo = {
  stageName: string;
  slug: string;
  bio: string | null;
  photo: string | null;
  genres: string[];
  venues: { name: string; day: string }[];
  social: Record<string, string>;
};

async function getKJ(slug: string): Promise<KJInfo | null> {
  const mock = getKJBySlug(slug);

  type DbProfile = {
    stage_name: string | null;
    bio: string | null;
    photo_url: string | null;
    genres: string[] | null;
    social_links: Record<string, string> | null;
  };
  let dbProfile: DbProfile | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("kj_profiles")
      .select("stage_name, bio, photo_url, genres, social_links")
      .eq("slug", slug)
      .single();
    dbProfile = data as unknown as DbProfile | null;
  } catch {
    // ignore
  }

  if (!mock && !dbProfile) return null;

  const stageName = dbProfile?.stage_name ?? mock?.name ?? slug;
  return {
    stageName,
    slug,
    bio: dbProfile?.bio ?? null,
    photo: dbProfile?.photo_url ?? null,
    genres: dbProfile?.genres ?? [],
    venues: (mock?.events ?? []).map((e) => ({ name: e.venueName, day: e.dayOfWeek })),
    social: dbProfile?.social_links ?? {},
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kj = await getKJ(slug);
  if (!kj) {
    return {
      title: "KJ not found",
      robots: { index: false, follow: false },
    };
  }

  const venueCount = kj.venues.length;
  const title = `${kj.stageName} — Karaoke Jockey (KJ) in NYC`;
  const desc =
    (kj.bio && kj.bio.length > 0
      ? kj.bio.slice(0, 160)
      : `${kj.stageName} is a karaoke jockey hosting${
          venueCount > 0 ? ` ${venueCount} weekly karaoke night${venueCount === 1 ? "" : "s"}` : " karaoke nights"
        } across NYC. View schedule, venues, and book ${kj.stageName} for events.`);

  return {
    title,
    description: desc,
    alternates: { canonical: `/kj/${slug}` },
    openGraph: {
      type: "profile",
      url: `${SITE_URL}/kj/${slug}`,
      title,
      description: desc,
      images: kj.photo ? [{ url: kj.photo, width: 1200, height: 630, alt: kj.stageName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: kj.photo ? [kj.photo] : undefined,
    },
  };
}

function kjJsonLd(kj: KJInfo) {
  const sameAs = Object.values(kj.social).filter((v) => typeof v === "string" && v.startsWith("http"));

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/kj/${kj.slug}`,
    name: kj.stageName,
    url: `${SITE_URL}/kj/${kj.slug}`,
    image: kj.photo ?? undefined,
    description: kj.bio ?? undefined,
    jobTitle: "Karaoke Jockey (KJ)",
    knowsAbout: kj.genres.length > 0 ? kj.genres : ["Karaoke", "Music Hosting"],
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    worksFor: {
      "@type": "Organization",
      name: "Karaoke Times NYC",
      url: SITE_URL,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "KJs", item: `${SITE_URL}/search?type=kj` },
      { "@type": "ListItem", position: 3, name: kj.stageName, item: `${SITE_URL}/kj/${kj.slug}` },
    ],
  };

  return { person, breadcrumb };
}

export default async function KJPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kj = await getKJ(slug);
  const ld = kj ? kjJsonLd(kj) : null;

  return (
    <>
      {ld && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld.person) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld.breadcrumb) }}
          />
        </>
      )}
      <KJClient params={params} />
    </>
  );
}
