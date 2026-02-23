"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── User Management ────────────────────────────────────────

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

// ─── Venue Management ───────────────────────────────────────

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

// ─── Event Management ───────────────────────────────────────

export async function toggleEvent(eventId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_events")
    .update({ is_active: isActive })
    .eq("id", eventId);

  if (error) return { error: error.message };
  revalidatePath("/admin/events");
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_events")
    .delete()
    .eq("id", eventId);

  if (error) return { error: error.message };
  revalidatePath("/admin/events");
  return { success: true };
}

// ─── Booking Management ─────────────────────────────────────

export async function updateBookingStatus(bookingId: string, status: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("room_bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  revalidatePath("/admin/bookings");
  return { success: true };
}

// ─── Queue Management ───────────────────────────────────────

export async function updateQueueStatus(songId: string, status: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("song_queue")
    .update({ status })
    .eq("id", songId);

  if (error) return { error: error.message };
  revalidatePath("/admin/queue");
  return { success: true };
}

export async function removeFromQueue(songId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("song_queue")
    .delete()
    .eq("id", songId);

  if (error) return { error: error.message };
  revalidatePath("/admin/queue");
  return { success: true };
}

// ─── Review Management ──────────────────────────────────────

export async function deleteReview(reviewId: string, type: "venue" | "kj") {
  await requireAdmin();
  const supabase = await createClient();

  const table = type === "venue" ? "reviews" : "kj_reviews";
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", reviewId);

  if (error) return { error: error.message };
  revalidatePath("/admin/reviews");
  return { success: true };
}

// ─── Promo Management ───────────────────────────────────────

export async function togglePromo(promoId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_promos")
    .update({ is_active: isActive })
    .eq("id", promoId);

  if (error) return { error: error.message };
  revalidatePath("/admin/promos");
  return { success: true };
}

export async function deletePromo(promoId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_promos")
    .delete()
    .eq("id", promoId);

  if (error) return { error: error.message };
  revalidatePath("/admin/promos");
  return { success: true };
}

// ─── KJ Connection Management ───────────────────────────────

export async function removeConnection(staffId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("venue_staff")
    .delete()
    .eq("id", staffId);

  if (error) return { error: error.message };
  revalidatePath("/admin/kjs");
  return { success: true };
}

// ─── Support Tickets ────────────────────────────────────────

export async function updateTicketStatus(ticketId: string, status: string) {
  await requireAdmin();
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "resolved") updates.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath("/admin/support");
  return { success: true };
}

export async function updateTicketPriority(ticketId: string, priority: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({ priority, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath("/admin/support");
  return { success: true };
}

export async function addTicketMessage(ticketId: string, message: string) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message,
      is_admin: true,
    });

  if (error) return { error: error.message };

  // Set ticket to in_progress if it was open
  await supabase
    .from("support_tickets")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("status", "open");

  revalidatePath("/admin/support");
  return { success: true };
}

// ─── Create Venue ────────────────────────────────────────────

export async function createVenue(params: {
  name: string;
  address: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  cross_street?: string;
  phone?: string;
  website?: string | null;
  description?: string | null;
  is_private_room?: boolean;
  accessibility?: string | null;
  owner_id?: string | null;
}) {
  await requireAdmin();
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
      is_private_room: params.is_private_room || false,
      accessibility: params.accessibility || null,
      owner_id: params.owner_id || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/venues");
  return { success: true, venueId: data.id };
}

// ─── Create Event ────────────────────────────────────────────

export async function createEvent(params: {
  venue_id: string;
  day_of_week: string;
  event_name?: string;
  dj?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  recurrence_type?: string;
  event_date?: string;
  happy_hour_details?: string;
  age_restriction?: string;
  dress_code?: string;
  cover_charge?: string;
  drink_minimum?: string;
  restrictions?: string[];
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("venue_events").insert({
    venue_id: params.venue_id,
    day_of_week: params.day_of_week,
    event_name: params.event_name || "",
    dj: params.dj || "",
    start_time: params.start_time || "",
    end_time: params.end_time || "",
    notes: params.notes || "",
    recurrence_type: params.recurrence_type || "weekly",
    event_date: params.event_date || null,
    happy_hour_details: params.happy_hour_details || null,
    age_restriction: params.age_restriction || "all_ages",
    dress_code: params.dress_code || "casual",
    cover_charge: params.cover_charge || "free",
    drink_minimum: params.drink_minimum || "none",
    restrictions: params.restrictions || [],
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/events");
  return { success: true };
}

// ─── Announcements ──────────────────────────────────────────

export async function sendAnnouncement(params: {
  audience: "all" | "venue_owner" | "kj" | "user";
  title: string;
  message: string;
}) {
  await requireAdmin();
  const supabase = await createClient();

  let targetUserIds: string[] = [];

  if (params.audience === "kj") {
    const { data: staff } = await supabase
      .from("venue_staff")
      .select("user_id")
      .not("accepted_at", "is", null);
    targetUserIds = (staff ?? []).map((s) => s.user_id);
  } else {
    let query = supabase.from("profiles").select("id");
    if (params.audience !== "all") {
      query = query.eq("role", params.audience);
    }
    const { data: users } = await query;
    targetUserIds = (users ?? []).map((u) => u.id);
  }

  if (targetUserIds.length === 0) return { error: "No users to notify" };

  const notifications = targetUserIds.map((userId) => ({
    user_id: userId,
    type: "announcement",
    title: params.title,
    message: params.message,
    is_read: false,
    data: { audience: params.audience },
  }));

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) return { error: error.message };
  revalidatePath("/admin/announcements");
  return { success: true, count: targetUserIds.length };
}
