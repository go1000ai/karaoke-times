"use server";

import { createClient } from "@/lib/supabase/server";

export async function getQueue(venueId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("song_queue")
    .select("*, profiles(display_name, avatar_url)")
    .eq("venue_id", venueId)
    .in("status", ["waiting", "up_next", "now_singing"])
    .order("position", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function requestSong(params: {
  venueId: string;
  userId: string;
  songTitle: string;
  artist: string;
}) {
  const supabase = await createClient();

  // Get current max position for this venue
  const { data: lastInQueue } = await supabase
    .from("song_queue")
    .select("position")
    .eq("venue_id", params.venueId)
    .in("status", ["waiting", "up_next", "now_singing"])
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (lastInQueue?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from("song_queue")
    .insert({
      venue_id: params.venueId,
      user_id: params.userId,
      song_title: params.songTitle,
      artist: params.artist,
      position: nextPosition,
      status: "waiting",
    })
    .select("id, position")
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateSongStatus(
  songId: string,
  status: "waiting" | "up_next" | "now_singing" | "completed" | "skipped"
) {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status };

  if (status === "completed" || status === "skipped") {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("song_queue").update(updates).eq("id", songId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getQueuePosition(venueId: string, userId: string) {
  const supabase = await createClient();

  // Get all active queue entries for this venue
  const { data: queue } = await supabase
    .from("song_queue")
    .select("id, user_id, position, status")
    .eq("venue_id", venueId)
    .in("status", ["waiting", "up_next", "now_singing"])
    .order("position", { ascending: true });

  if (!queue) return null;

  const userEntry = queue.find((entry) => entry.user_id === userId);
  if (!userEntry) return null;

  const ahead = queue.filter(
    (entry) => entry.position < userEntry.position && entry.status !== "now_singing"
  ).length;

  return {
    position: userEntry.position,
    ahead,
    status: userEntry.status,
    totalInQueue: queue.length,
  };
}
