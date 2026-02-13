import { createClient } from "@/lib/supabase/server";
import { SingersList } from "./SingersList";

export default async function AdminSingersPage() {
  const supabase = await createClient();

  // Get all KJ user IDs (users with accepted venue_staff records)
  const { data: kjStaff } = await supabase
    .from("venue_staff")
    .select("user_id")
    .not("accepted_at", "is", null);

  const kjUserIds = new Set((kjStaff ?? []).map((s) => s.user_id));

  // Get all users with role = 'user'
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at")
    .eq("role", "user")
    .order("created_at", { ascending: false });

  // Filter out KJs (they have venue_staff connections)
  const singers = (profiles ?? []).filter((p) => !kjUserIds.has(p.id));

  // Get song counts per user
  const { data: songCounts } = await supabase
    .from("song_queue")
    .select("user_id");

  const songCountMap = new Map<string, number>();
  (songCounts ?? []).forEach((s) => {
    songCountMap.set(s.user_id, (songCountMap.get(s.user_id) || 0) + 1);
  });

  // Get booking counts per user
  const { data: bookingCounts } = await supabase
    .from("room_bookings")
    .select("user_id");

  const bookingCountMap = new Map<string, number>();
  (bookingCounts ?? []).forEach((b) => {
    bookingCountMap.set(b.user_id, (bookingCountMap.get(b.user_id) || 0) + 1);
  });

  // Get favorite counts per user
  const { data: favCounts } = await supabase
    .from("favorites")
    .select("user_id");

  const favCountMap = new Map<string, number>();
  (favCounts ?? []).forEach((f) => {
    favCountMap.set(f.user_id, (favCountMap.get(f.user_id) || 0) + 1);
  });

  const singersWithStats = singers.map((s) => ({
    ...s,
    display_name: s.display_name as string | null,
    songCount: songCountMap.get(s.id) || 0,
    bookingCount: bookingCountMap.get(s.id) || 0,
    favoriteCount: favCountMap.get(s.id) || 0,
  }));

  return <SingersList singers={singersWithStats} />;
}
