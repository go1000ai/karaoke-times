"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { VDJBridge } from "./VDJBridge";

export default function VDJPage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const findVenue = async () => {
      // 1. Check cookie for active venue
      const res = await fetch("/api/active-venue");
      const { venueId: activeId } = await res.json();
      if (activeId) {
        const { data: venue } = await supabase
          .from("venues")
          .select("name")
          .eq("id", activeId)
          .single();
        if (venue) {
          setVenueId(activeId);
          setVenueName(venue.name);
          setLoading(false);
          return;
        }
      }

      // 2. KJ connected venue
      const { data: staff } = await supabase
        .from("venue_staff")
        .select("venue_id, venues(name)")
        .eq("user_id", user.id)
        .not("accepted_at", "is", null)
        .limit(1);

      if (staff?.[0]) {
        setVenueId(staff[0].venue_id);
        setVenueName((staff[0].venues as unknown as { name: string })?.name || null);
        setLoading(false);
        return;
      }

      // 3. Owned venue
      const { data: owned } = await supabase
        .from("venues")
        .select("id, name")
        .eq("owner_id", user.id)
        .single();

      if (owned) {
        setVenueId(owned.id);
        setVenueName(owned.name);
      }
      setLoading(false);
    };

    findVenue();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="text-center py-20">
        <span className="material-icons-round text-6xl text-text-muted mb-4">music_off</span>
        <h1 className="text-2xl font-bold text-white mb-2">No Venue Connected</h1>
        <p className="text-text-secondary">Connect to a venue first to use VirtualDJ integration.</p>
      </div>
    );
  }

  return <VDJBridge venueId={venueId} venueName={venueName} />;
}
