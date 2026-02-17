"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveFeaturedHighlight(highlightId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("singer_highlights")
    .update({ consent_status: "approved" })
    .eq("id", highlightId)
    .eq("singer_user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/my-highlights");
  revalidatePath("/featured-singers");
  revalidatePath("/");
  return { success: true };
}

export async function declineFeaturedHighlight(highlightId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("singer_highlights")
    .update({ consent_status: "declined" })
    .eq("id", highlightId)
    .eq("singer_user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/my-highlights");
  revalidatePath("/featured-singers");
  revalidatePath("/");
  return { success: true };
}
