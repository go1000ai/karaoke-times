"use server";

import { createClient } from "@/lib/supabase/server";
import { requireVenueOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateVenue(formData: FormData) {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venues")
    .update({
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      neighborhood: formData.get("neighborhood") as string,
      cross_street: formData.get("cross_street") as string,
      phone: formData.get("phone") as string,
      description: formData.get("description") as string,
      is_private_room: formData.get("is_private_room") === "true",
      booking_url: (formData.get("booking_url") as string) || null,
    })
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/listing");
  return { success: true };
}

export async function createPromo(formData: FormData) {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!venue) return { error: "No venue found" };

  const { error } = await supabase.from("venue_promos").insert({
    venue_id: venue.id,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    start_date: (formData.get("start_date") as string) || null,
    end_date: (formData.get("end_date") as string) || null,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/promos");
  return { success: true };
}

export async function togglePromo(promoId: string, isActive: boolean) {
  await requireVenueOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_promos")
    .update({ is_active: isActive })
    .eq("id", promoId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/promos");
  return { success: true };
}

export async function deletePromo(promoId: string) {
  await requireVenueOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("venue_promos").delete().eq("id", promoId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/promos");
  return { success: true };
}

export async function updateEvent(eventId: string, formData: FormData) {
  await requireVenueOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_events")
    .update({
      day_of_week: formData.get("day_of_week") as string,
      event_name: formData.get("event_name") as string,
      dj: formData.get("dj") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      notes: formData.get("notes") as string,
    })
    .eq("id", eventId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function handleBooking(bookingId: string, status: "confirmed" | "cancelled") {
  await requireVenueOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("room_bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}
