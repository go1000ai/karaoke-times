"use server";

import { createClient } from "@/lib/supabase/server";

export async function createBooking(params: {
  venueId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_bookings")
    .insert({
      venue_id: params.venueId,
      user_id: params.userId,
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
      party_size: params.partySize,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getBookings(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_bookings")
    .select("*, venues(name, address, phone)")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("room_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  return { success: true };
}
