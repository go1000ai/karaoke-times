import { createClient } from "@/lib/supabase/server";
import { KJsList } from "./KJsList";

export default async function AdminKJsPage() {
  const supabase = await createClient();

  // Get all active venue_staff connections
  const { data: staffRecords } = await supabase
    .from("venue_staff")
    .select("id, user_id, venue_id, role, accepted_at, venues(name), profiles(display_name, avatar_url, created_at)")
    .not("accepted_at", "is", null)
    .order("accepted_at", { ascending: false });

  // Group by user
  const kjMap = new Map<string, {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
    venues: { staffId: string; venueId: string; venueName: string; role: string }[];
  }>();

  (staffRecords ?? []).forEach((s: any) => {
    const existing = kjMap.get(s.user_id) || {
      id: s.user_id,
      display_name: s.profiles?.display_name || null,
      avatar_url: s.profiles?.avatar_url || null,
      created_at: s.profiles?.created_at || s.accepted_at,
      venues: [] as { staffId: string; venueId: string; venueName: string; role: string }[],
    };
    existing.venues.push({
      staffId: s.id,
      venueId: s.venue_id,
      venueName: s.venues?.name || "Unknown Venue",
      role: s.role || "kj",
    });
    kjMap.set(s.user_id, existing);
  });

  // Get KJ review averages
  const { data: kjReviews } = await supabase
    .from("kj_reviews")
    .select("kj_slug, rating");

  const kjReviewAvg = new Map<string, { total: number; count: number }>();
  (kjReviews ?? []).forEach((r) => {
    const existing = kjReviewAvg.get(r.kj_slug) || { total: 0, count: 0 };
    existing.total += r.rating;
    existing.count++;
    kjReviewAvg.set(r.kj_slug, existing);
  });

  const kjs = Array.from(kjMap.values()).map((kj) => ({
    ...kj,
    venueCount: kj.venues.length,
  }));

  return <KJsList kjs={kjs} />;
}
