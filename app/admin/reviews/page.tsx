import { createClient } from "@/lib/supabase/server";
import { ReviewsList } from "./ReviewsList";

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  // Venue reviews
  const { data: venueReviews } = await supabase
    .from("reviews")
    .select("id, venue_id, user_id, rating, text, is_anonymous, created_at, venues(name), profiles(display_name)")
    .order("created_at", { ascending: false });

  // KJ reviews
  const { data: kjReviews } = await supabase
    .from("kj_reviews")
    .select("id, kj_slug, user_id, rating, text, is_anonymous, created_at, profiles(display_name)")
    .order("created_at", { ascending: false });

  // Stats
  const allRatings = [...(venueReviews ?? []), ...(kjReviews ?? [])].map((r) => r.rating);
  const avgRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : "0";

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thisWeekCount = [...(venueReviews ?? []), ...(kjReviews ?? [])].filter((r) => r.created_at >= oneWeekAgo).length;

  return (
    <ReviewsList
      venueReviews={(venueReviews ?? []) as any[]}
      kjReviews={(kjReviews ?? []) as any[]}
      totalCount={allRatings.length}
      avgRating={avgRating}
      thisWeekCount={thisWeekCount}
    />
  );
}
