import { createClient } from "@/lib/supabase/server";
import { QueueList } from "./QueueList";

export default async function AdminQueuePage() {
  const supabase = await createClient();

  const { data: queueEntries } = await supabase
    .from("song_queue")
    .select("id, venue_id, user_id, song_title, artist, status, position, youtube_video_id, requested_at, venues(name), profiles(display_name)")
    .in("status", ["waiting", "up_next", "now_singing"])
    .order("position", { ascending: true });

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .order("name");

  return (
    <QueueList
      entries={(queueEntries ?? []) as any[]}
      venues={(venues ?? []) as { id: string; name: string }[]}
    />
  );
}
