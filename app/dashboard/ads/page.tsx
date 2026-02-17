"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface AdSlot {
  id: string;
  ad_placement_id: string;
  status: string;
  accepted_at: string | null;
  created_at: string;
  placement?: {
    headline: string | null;
    body_text: string | null;
    image_url: string | null;
    link_url: string | null;
    placement_type: string;
    advertiser?: {
      company_name: string;
      logo_url: string | null;
      category: string;
    };
  };
}

export default function AdsPage() {
  const { user } = useAuth();
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from("kj_ad_slots")
        .select(`
          *,
          placement:ad_placements(
            headline,
            body_text,
            image_url,
            link_url,
            placement_type,
            advertiser:advertiser_profiles(company_name, logo_url, category)
          )
        `)
        .eq("kj_user_id", user!.id)
        .order("created_at", { ascending: false });
      setAdSlots((data as AdSlot[]) || []);
      setLoading(false);
    }

    load();
  }, [user, supabase]);

  const updateStatus = async (slotId: string, status: "accepted" | "rejected") => {
    const update: Record<string, any> = { status };
    if (status === "accepted") update.accepted_at = new Date().toISOString();

    await supabase.from("kj_ad_slots").update(update).eq("id", slotId);

    setAdSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, status, accepted_at: update.accepted_at || s.accepted_at } : s))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = adSlots.filter((s) => s.status === "pending");
  const accepted = adSlots.filter((s) => s.status === "accepted");
  const rejected = adSlots.filter((s) => s.status === "rejected");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Sponsor Ads</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage ad proposals from advertisers. Accepted ads appear on your profile, events, and TV display.
      </p>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="material-icons-round text-base">pending</span>
            Pending Proposals ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((slot) => (
              <div key={slot.id} className="glass-card rounded-xl p-4 border border-yellow-400/20">
                <div className="flex items-start gap-4">
                  {slot.placement?.advertiser?.logo_url ? (
                    <img src={slot.placement.advertiser.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-card-dark flex items-center justify-center">
                      <span className="material-icons-round text-text-muted">business</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{slot.placement?.advertiser?.company_name || "Advertiser"}</p>
                    <p className="text-xs text-text-secondary">
                      {slot.placement?.headline || "Ad placement"} &middot; {slot.placement?.placement_type?.replace(/_/g, " ")}
                    </p>
                    {slot.placement?.body_text && (
                      <p className="text-xs text-text-muted mt-1">{slot.placement.body_text}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateStatus(slot.id, "accepted")}
                      className="bg-primary/20 text-primary font-bold text-xs px-4 py-2 rounded-lg hover:bg-primary/30 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(slot.id, "rejected")}
                      className="bg-red-500/10 text-red-400 font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-500/20 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Ads */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="material-icons-round text-base">check_circle</span>
          Active Ads ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <span className="material-icons-round text-4xl text-text-muted mb-3 block">campaign</span>
            <p className="text-text-secondary text-sm">
              No active sponsor ads. When advertisers propose placements, they'll appear here for your approval.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accepted.map((slot) => (
              <div key={slot.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-4">
                  {slot.placement?.image_url ? (
                    <img src={slot.placement.image_url} alt="" className="w-16 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-card-dark flex items-center justify-center">
                      <span className="material-icons-round text-text-muted">image</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{slot.placement?.advertiser?.company_name}</p>
                    <p className="text-xs text-text-secondary">{slot.placement?.headline}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {slot.placement?.placement_type?.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">
            Declined ({rejected.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {rejected.map((slot) => (
              <div key={slot.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                <span className="text-xs text-text-muted">{slot.placement?.advertiser?.company_name} - {slot.placement?.headline}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
