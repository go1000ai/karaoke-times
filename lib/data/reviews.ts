"use server";

import { createClient } from "@/lib/supabase/server";

export async function getReviewsByVenue(venueId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(display_name, avatar_url), review_photos(*)")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function createReview(formData: {
  venueId: string;
  userId: string;
  rating: number;
  text: string;
  isAnonymous: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      venue_id: formData.venueId,
      user_id: formData.userId,
      rating: formData.rating,
      text: formData.text,
      is_anonymous: formData.isAnonymous,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) return { error: error.message };
  return { success: true };
}
