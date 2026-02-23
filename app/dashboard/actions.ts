"use server";

import { createClient } from "@/lib/supabase/server";
import { requireVenueOwner, requireKJOrOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";

export async function selectVenue(venueId: string) {
  const cookieStore = await cookies();
  cookieStore.set("active_venue_id", venueId, {
    path: "/dashboard",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
  });
  revalidatePath("/dashboard");
}

export async function updateVenue(formData: FormData) {
  const { user } = await requireKJOrOwner();
  const supabase = await createClient();
  const { venue } = await getDashboardVenue(user.id);

  if (!venue) return { error: "No venue found" };

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
    .eq("id", venue.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/listing");
  return { success: true };
}

export async function createPromo(formData: FormData) {
  const { user } = await requireKJOrOwner();
  const supabase = await createClient();
  const { venue } = await getDashboardVenue(user.id);

  if (!venue) return { error: "No venue found" };

  const insertData: Record<string, unknown> = {
    venue_id: venue.id,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    is_active: true,
  };

  const eventId = formData.get("event_id") as string;
  if (eventId) insertData.event_id = eventId;

  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  if (startDate) insertData.start_date = startDate;
  if (endDate) insertData.end_date = endDate;

  const { error } = await supabase.from("venue_promos").insert(insertData);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function updatePromo(promoId: string, formData: FormData) {
  await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_promos")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      start_date: (formData.get("start_date") as string) || null,
      end_date: (formData.get("end_date") as string) || null,
    })
    .eq("id", promoId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function togglePromo(promoId: string, isActive: boolean) {
  await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_promos")
    .update({ is_active: isActive })
    .eq("id", promoId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function deletePromo(promoId: string) {
  await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("venue_promos").delete().eq("id", promoId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function createEvent(formData: FormData) {
  const ctx = await requireKJOrOwner();
  const supabase = await createClient();

  const venueId = formData.get("venue_id") as string;
  if (!venueId) return { error: "No venue selected" };

  let restrictions: string[] = [];
  try {
    restrictions = JSON.parse((formData.get("restrictions") as string) || "[]");
  } catch { /* empty */ }

  const insertData: Record<string, unknown> = {
    venue_id: venueId,
    day_of_week: formData.get("day_of_week") as string,
    event_name: (formData.get("event_name") as string) || "Karaoke Night",
    dj: (formData.get("dj") as string) || null,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    notes: (formData.get("notes") as string) || null,
    is_active: true,
    recurrence_type: (formData.get("recurrence_type") as string) || "weekly",
    age_restriction: (formData.get("age_restriction") as string) || "all_ages",
    dress_code: (formData.get("dress_code") as string) || "casual",
    cover_charge: (formData.get("cover_charge") as string) || "free",
    drink_minimum: (formData.get("drink_minimum") as string) || "none",
    happy_hour_details: (formData.get("happy_hour_details") as string) || null,
    event_date: (formData.get("event_date") as string) || null,
    restrictions,
  };

  // KJs get tagged as the event owner
  if (ctx.role === "kj") {
    insertData.kj_user_id = ctx.user.id;
  }

  const { error } = await supabase.from("venue_events").insert(insertData);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function updateEvent(eventId: string, formData: FormData) {
  await requireKJOrOwner();
  const supabase = await createClient();

  let restrictions: string[] = [];
  try {
    restrictions = JSON.parse((formData.get("restrictions") as string) || "[]");
  } catch { /* empty */ }

  const { error } = await supabase
    .from("venue_events")
    .update({
      day_of_week: formData.get("day_of_week") as string,
      event_name: formData.get("event_name") as string,
      dj: (formData.get("dj") as string) || null,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      notes: (formData.get("notes") as string) || null,
      recurrence_type: (formData.get("recurrence_type") as string) || "weekly",
      age_restriction: (formData.get("age_restriction") as string) || "all_ages",
      dress_code: (formData.get("dress_code") as string) || "casual",
      cover_charge: (formData.get("cover_charge") as string) || "free",
      drink_minimum: (formData.get("drink_minimum") as string) || "none",
      happy_hour_details: (formData.get("happy_hour_details") as string) || null,
      event_date: (formData.get("event_date") as string) || null,
      restrictions,
    })
    .eq("id", eventId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function toggleEvent(eventId: string, isActive: boolean) {
  await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_events")
    .update({ is_active: isActive })
    .eq("id", eventId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("venue_events").delete().eq("id", eventId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/events");
  return { success: true };
}

export async function createVenueFromDashboard(params: {
  name: string;
  address: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  cross_street?: string;
  phone?: string;
  website?: string | null;
  description?: string | null;
}) {
  const ctx = await requireKJOrOwner();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: params.name,
      address: params.address || "",
      city: params.city || "New York",
      state: params.state || "New York",
      neighborhood: params.neighborhood || "",
      cross_street: params.cross_street || "",
      phone: params.phone || "",
      website: params.website || null,
      description: params.description || null,
      owner_id: ctx.role === "owner" ? ctx.user.id : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Auto-link KJ to the new venue via venue_staff
  if (ctx.role === "kj") {
    await supabase.from("venue_staff").insert({
      venue_id: data.id,
      user_id: ctx.user.id,
      role: "kj",
      accepted_at: new Date().toISOString(),
    });
  }

  revalidatePath("/dashboard/events");
  return { success: true, venueId: data.id };
}

export async function handleBooking(bookingId: string, status: "confirmed" | "cancelled") {
  await requireKJOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("room_bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/bookings");
  return { success: true };
}
