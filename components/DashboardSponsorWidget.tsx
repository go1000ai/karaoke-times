"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  link_url: string | null;
  category: string;
  tagline: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  liquor: "local_bar",
  equipment: "speaker",
  entertainment: "music_note",
  venue: "storefront",
  general: "business",
};

export default function DashboardSponsorWidget() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sponsors")
      .select("id, name, logo_url, link_url, category, tagline")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) setSponsors(data as Sponsor[]);
      });
  }, []);

  // Rotate sponsors every 8 seconds
  useEffect(() => {
    if (sponsors.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % sponsors.length), 8000);
    return () => clearInterval(t);
  }, [sponsors.length]);

  if (sponsors.length === 0) return null;

  const s = sponsors[idx];
  const icon = CATEGORY_ICONS[s.category] ?? "business";

  const inner = (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 hover:border-primary/20 transition-all group cursor-pointer">
      <p className="text-[9px] text-text-muted/50 uppercase tracking-widest font-bold mb-2">
        Sponsored
      </p>
      <div className="flex items-center gap-2.5">
        {s.logo_url ? (
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <img
              src={s.logo_url}
              alt={s.name}
              className="max-h-7 max-w-[32px] object-contain brightness-75 group-hover:brightness-100 transition-all"
            />
          </div>
        ) : (
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-primary/5 flex items-center justify-center">
            <span className="material-icons-round text-primary/40 text-base">{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white/70 text-xs font-bold truncate group-hover:text-white transition-colors">
            {s.name}
          </p>
          {s.tagline && (
            <p className="text-text-muted text-[10px] truncate leading-tight">{s.tagline}</p>
          )}
        </div>
      </div>
      {sponsors.length > 1 && (
        <div className="flex justify-center gap-1 mt-2.5">
          {sponsors.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === idx ? "w-4 bg-primary/50" : "w-1 bg-white/10"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (s.link_url) {
    return (
      <a href={s.link_url} target="_blank" rel="noopener noreferrer" className="block px-3 mb-2">
        {inner}
      </a>
    );
  }
  return <div className="px-3 mb-2">{inner}</div>;
}
