"use server";

import { createClient } from "@/lib/supabase/server";

export async function getReviewsByKJ(kjSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kj_reviews")
    .select("*, profiles(display_name, avatar_url)")
    .eq("kj_slug", kjSlug)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function createKJReview(formData: {
  kjSlug: string;
  userId: string;
  rating: number;
  text: string;
  isAnonymous: boolean;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kj_reviews")
    .insert({
      kj_slug: formData.kjSlug,
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

export async function deleteKJReview(reviewId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("kj_reviews").delete().eq("id", reviewId);

  if (error) return { error: error.message };
  return { success: true };
}
