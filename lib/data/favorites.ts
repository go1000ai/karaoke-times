"use server";

import { createClient } from "@/lib/supabase/server";

export async function getFavorites(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("*, venues(*, venue_events(*), venue_media(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function toggleFavorite(userId: string, venueId: string) {
  const supabase = await createClient();

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("venue_id", venueId)
    .single();

  if (existing) {
    // Remove favorite
    await supabase.from("favorites").delete().eq("id", existing.id);
    return { favorited: false };
  } else {
    // Add favorite
    await supabase.from("favorites").insert({ user_id: userId, venue_id: venueId });
    return { favorited: true };
  }
}

export async function isFavorited(userId: string, venueId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("venue_id", venueId)
    .single();

  return !!data;
}
