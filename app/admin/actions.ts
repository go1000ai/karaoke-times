"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // Delete profile (cascade will handle related records)
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteVenue(venueId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venues")
    .delete()
    .eq("id", venueId);

  if (error) return { error: error.message };
  revalidatePath("/admin/venues");
  return { success: true };
}

export async function assignVenueOwner(venueId: string, ownerId: string | null) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venues")
    .update({ owner_id: ownerId })
    .eq("id", venueId);

  if (error) return { error: error.message };
  revalidatePath("/admin/venues");
  return { success: true };
}
