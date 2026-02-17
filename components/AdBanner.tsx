"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AdSlot {
  id: string;
  placement: {
    headline: string | null;
    body_text: string | null;
    image_url: string | null;
    link_url: string | null;
    placement_type: string;
    advertiser: {
      company_name: string;
      logo_url: string | null;
    };
  };
}

/**
 * Displays accepted sponsor ads for a given KJ.
 * Placement filters: "kj_profile", "event_listing", "tv_display"
 */
export function AdBanner({
  kjUserId,
  placementType,
  className = "",
}: {
  kjUserId: string;
  placementType: "kj_profile" | "event_listing" | "tv_display";
  className?: string;
}) {
  const [ads, setAds] = useState<AdSlot[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("kj_ad_slots")
      .select(`
        id,
        placement:ad_placements(
          headline,
          body_text,
          image_url,
          link_url,
          placement_type,
          advertiser:advertiser_profiles(company_name, logo_url)
        )
      `)
      .eq("kj_user_id", kjUserId)
      .eq("status", "accepted")
      .then(({ data }) => {
        if (data) {
          const filtered = (data as unknown as AdSlot[]).filter(
            (d) => d.placement?.placement_type === placementType && d.placement?.advertiser
          );
          setAds(filtered);
        }
      });
  }, [kjUserId, placementType]);

  if (ads.length === 0) return null;

  if (placementType === "tv_display") {
    return <TVAdDisplay ads={ads} className={className} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

function AdCard({ ad }: { ad: AdSlot }) {
  const { placement } = ad;
  const content = (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-all group">
      {placement.image_url ? (
        <img
          src={placement.image_url}
          alt=""
          className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : placement.advertiser?.logo_url ? (
        <img
          src={placement.advertiser.logo_url}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-icons-round text-primary text-lg">campaign</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {placement.headline && (
          <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
            {placement.headline}
          </p>
        )}
        {placement.body_text && (
          <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">
            {placement.body_text}
          </p>
        )}
        <p className="text-[10px] text-text-muted mt-1">
          Sponsored by {placement.advertiser?.company_name}
        </p>
      </div>
    </div>
  );

  if (placement.link_url) {
    return (
      <a href={placement.link_url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function TVAdDisplay({ ads, className }: { ads: AdSlot[]; className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 10_000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const ad = ads[currentIndex];
  if (!ad) return null;

  return (
    <div className={`flex items-center gap-4 bg-white/[0.03] rounded-xl px-4 py-3 ${className}`}>
      {ad.placement.image_url ? (
        <img
          src={ad.placement.image_url}
          alt=""
          className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
        />
      ) : ad.placement.advertiser?.logo_url ? (
        <img
          src={ad.placement.advertiser.logo_url}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{ad.placement.headline}</p>
        {ad.placement.body_text && (
          <p className="text-text-muted text-xs truncate">{ad.placement.body_text}</p>
        )}
      </div>
      <span className="text-[10px] text-text-muted opacity-50 flex-shrink-0">Sponsored</span>
    </div>
  );
}
