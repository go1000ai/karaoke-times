"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QueueEntry } from "./useQueueSubscription";

export { type QueueEntry };

/**
 * Subscribe to a venue's song queue using the venue UUID directly.
 * This avoids the name-based ilike lookup.
 */
export function useQueueSubscriptionById(venueId: string) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchQueue = async () => {
      const { data, error } = await supabase
        .from("song_queue")
        .select("*, profiles(display_name, avatar_url)")
        .eq("venue_id", venueId)
        .in("status", ["waiting", "up_next", "now_singing"])
        .order("position", { ascending: true });

      if (error) {
        console.error("[Queue] Fetch error:", error.message, "venueId:", venueId);
      } else {
        console.log("[Queue] Fetched", data?.length ?? 0, "entries for venue", venueId);
      }

      setQueue((data as unknown as QueueEntry[]) ?? []);
      setLoading(false);
    };

    fetchQueue();

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

    // Polling fallback — ensures TV display stays fresh even if realtime drops
    const poll = setInterval(fetchQueue, 5000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [venueId]);

  return { queue, loading };
}
