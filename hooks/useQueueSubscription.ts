"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface QueueEntry {
  id: string;
  venue_id: string;
  user_id: string;
  song_title: string;
  artist: string;
  status: string;
  position: number;
  requested_at: string;
  completed_at: string | null;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useQueueSubscription(venueName: string) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      // Resolve venue name to Supabase UUID
      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .ilike("name", venueName.trim())
        .limit(1)
        .single();

      const venueId = venue?.id;
      if (!venueId) {
        setLoading(false);
        return;
      }

      // Initial fetch
      const fetchQueue = async () => {
        const { data } = await supabase
          .from("song_queue")
          .select("*, profiles(display_name, avatar_url)")
          .eq("venue_id", venueId)
          .in("status", ["waiting", "up_next", "now_singing"])
          .order("position", { ascending: true });

        setQueue((data as unknown as QueueEntry[]) ?? []);
        setLoading(false);
      };

      await fetchQueue();

      // Subscribe to real-time changes
      channel = supabase
        .channel(`queue:${venueId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "song_queue",
            filter: `venue_id=eq.${venueId}`,
          },
          () => {
            fetchQueue();
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [venueName, supabase]);

  return { queue, loading };
}
