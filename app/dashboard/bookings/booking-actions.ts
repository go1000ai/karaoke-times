"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireKJOrOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPrivateBooking(formData: FormData) {
  const { user } = await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("kj_bookings").insert({
    kj_user_id: user.id,
    booking_type: (formData.get("booking_type") as string) || "private",
    client_name: formData.get("client_name") as string,
    client_email: (formData.get("client_email") as string) || null,
    client_phone: (formData.get("client_phone") as string) || null,
    event_date: formData.get("event_date") as string,
    start_time: formData.get("start_time") as string,
    end_time: (formData.get("end_time") as string) || null,
    location: (formData.get("location") as string) || null,
    notes: (formData.get("notes") as string) || null,
    price: (formData.get("price") as string) || null,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}

export async function updatePrivateBooking(bookingId: string, formData: FormData) {
  await requireKJOrOwner();
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  const status = formData.get("status") as string;
  if (status) updates.status = status;

  const { error } = await supabase
    .from("kj_bookings")
    .update(updates)
    .eq("id", bookingId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}

export async function deletePrivateBooking(bookingId: string) {
  await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("kj_bookings").delete().eq("id", bookingId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}

// --- Booking Request Actions (singer/owner → KJ) ---

export async function requestKJBooking(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const kjUserId = formData.get("kj_user_id") as string;
  const requestSource = formData.get("request_source") as string;
  const venueId = (formData.get("venue_id") as string) || null;

  // For owner requests, validate they own the venue
  if (requestSource === "owner_request" && venueId) {
    const { data: venue } = await supabase
      .from("venues")
      .select("owner_id")
      .eq("id", venueId)
      .single();
    if (venue?.owner_id !== user.id) return { error: "Not authorized for this venue" };
  }

  const { error } = await supabase.from("kj_bookings").insert({
    kj_user_id: kjUserId,
    booking_type: (formData.get("booking_type") as string) || "private",
    client_name: formData.get("client_name") as string,
    client_email: (formData.get("client_email") as string) || null,
    client_phone: (formData.get("client_phone") as string) || null,
    event_date: formData.get("event_date") as string,
    start_time: formData.get("start_time") as string,
    end_time: (formData.get("end_time") as string) || null,
    location: (formData.get("location") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: "pending",
    requested_by: user.id,
    request_source: requestSource,
    venue_id: venueId,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}

export async function respondToBookingRequest(bookingId: string, action: "confirmed" | "declined") {
  const { user } = await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("kj_bookings")
    .update({ status: action })
    .eq("id", bookingId)
    .eq("kj_user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}

export async function cancelBookingRequest(bookingId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Only the requester can cancel, and only pending requests
  // We use the KJ's update policy won't apply here, but RLS on kj_bookings
  // only allows KJ to update. So we need to work around this:
  // The requester can't update via RLS (only KJ can). Instead, we'll
  // delete the request if it's still pending.
  const { error } = await supabase
    .from("kj_bookings")
    .delete()
    .eq("id", bookingId)
    .eq("requested_by", user.id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}
