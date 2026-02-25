import { createClient } from "@/lib/supabase/server";
import { VenuesList } from "./VenuesList";
import { CreateVenueForm } from "./CreateVenueForm";

export default async function AdminVenuesPage() {
  const supabase = await createClient();

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, address, city, state, zip_code, neighborhood, owner_id, is_private_room, queue_paused, accessibility, created_at, profiles(display_name)")
    .order("name");

  // Event counts
  const { data: events } = await supabase.from("venue_events").select("venue_id");
  const eventCounts: Record<string, number> = {};
  (events ?? []).forEach((e) => { eventCounts[e.venue_id] = (eventCounts[e.venue_id] || 0) + 1; });

  // Review counts + avg
  const { data: reviews } = await supabase.from("reviews").select("venue_id, rating");
  const reviewStats: Record<string, { count: number; total: number }> = {};
  (reviews ?? []).forEach((r) => {
    if (!reviewStats[r.venue_id]) reviewStats[r.venue_id] = { count: 0, total: 0 };
    reviewStats[r.venue_id].count++;
    reviewStats[r.venue_id].total += r.rating;
  });

  // Promo counts
  const { data: promos } = await supabase.from("venue_promos").select("venue_id").eq("is_active", true);
  const promoCounts: Record<string, number> = {};
  (promos ?? []).forEach((p) => { promoCounts[p.venue_id] = (promoCounts[p.venue_id] || 0) + 1; });

  // Media counts
  const { data: media } = await supabase.from("venue_media").select("venue_id");
  const mediaCounts: Record<string, number> = {};
  (media ?? []).forEach((m) => { mediaCounts[m.venue_id] = (mediaCounts[m.venue_id] || 0) + 1; });

  const venuesEnhanced = (venues ?? []).map((v) => ({
    ...v,
    _event_count: eventCounts[v.id] || 0,
    _review_count: reviewStats[v.id]?.count || 0,
    _avg_rating: reviewStats[v.id] ? (reviewStats[v.id].total / reviewStats[v.id].count).toFixed(1) : null,
    _promo_count: promoCounts[v.id] || 0,
    _media_count: mediaCounts[v.id] || 0,
  }));

  // Owners for dropdown
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("role", ["venue_owner", "admin"]);

  return (
    <>
      <CreateVenueForm owners={owners ?? []} />
      <VenuesList venues={venuesEnhanced} owners={owners ?? []} />
    </>
  );
}
