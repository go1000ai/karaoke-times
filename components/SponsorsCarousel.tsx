"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  link_url: string | null;
  category: string;
  tagline: string | null;
}

const CATEGORY_CONFIG: Record<string, {
  label: string;
  icon: string;
  gradient: string;
  accent: string;
}> = {
  liquor: {
    label: "Featured Spirits",
    icon: "local_bar",
    gradient: "from-amber-900/60 via-yellow-900/40 to-orange-900/60",
    accent: "#F59E0B",
  },
  equipment: {
    label: "Featured Equipment",
    icon: "speaker",
    gradient: "from-blue-900/60 via-cyan-900/40 to-teal-900/60",
    accent: "#06B6D4",
  },
  entertainment: {
    label: "Entertainment",
    icon: "music_note",
    gradient: "from-purple-900/60 via-pink-900/40 to-violet-900/60",
    accent: "#A855F7",
  },
  venue: {
    label: "Featured Venue",
    icon: "storefront",
    gradient: "from-green-900/60 via-emerald-900/40 to-teal-900/60",
    accent: "#10B981",
  },
  general: {
    label: "Featured Partner",
    icon: "business",
    gradient: "from-slate-800/60 via-gray-800/40 to-zinc-800/60",
    accent: "#94A3B8",
  },
};

export default function SponsorsCarousel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sponsors")
      .select("id, name, logo_url, link_url, category, tagline")
      .eq("is_active", true)
      .order("display_order")
      .order("created_at")
      .then(({ data }) => {
        if (data && data.length > 0) setSponsors(data as Sponsor[]);
      });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || sponsors.length === 0) return;

    let pos = 0;
    const speed = 0.5;

    function step() {
      const half = track!.scrollWidth / 2;
      pos += speed;
      if (pos >= half) pos = 0;
      track!.style.transform = `translateX(-${pos}px)`;
      animRef.current = requestAnimationFrame(step);
    }
    animRef.current = requestAnimationFrame(step);

    const pause = () => cancelAnimationFrame(animRef.current);
    const resume = () => { animRef.current = requestAnimationFrame(step); };
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(animRef.current);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, [sponsors]);

  if (sponsors.length === 0) return null;

  // Repeat 4x to always fill any viewport
  const repeated = [...sponsors, ...sponsors, ...sponsors, ...sponsors];

  return (
    <section className="border-t border-border bg-bg-dark overflow-hidden">
      {/* Header — full width */}
      <div className="flex items-center gap-4 px-6 md:px-12 py-5 border-b border-border/40">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="text-text-muted text-xs uppercase tracking-[0.2em] font-bold whitespace-nowrap flex items-center gap-2">
          <span className="material-icons-round text-primary text-sm">verified</span>
          Partners &amp; Sponsors
        </p>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Track */}
      <div className="relative py-6">
        <div
          className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #0B0B0F, transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #0B0B0F, transparent)" }}
        />
        <div className="overflow-hidden w-full">
          <div ref={trackRef} className="flex gap-5 w-max will-change-transform px-5">
            {repeated.map((s, i) => (
              <SponsorCard key={`${s.id}-${i}`} sponsor={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const config = CATEGORY_CONFIG[sponsor.category] ?? CATEGORY_CONFIG.general;
  const [imgFailed, setImgFailed] = useState(false);

  const inner = (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden border border-white/[0.07] hover:border-white/20 transition-all duration-300 group cursor-pointer select-none"
      style={{ width: 240 }}
    >
      {/* Image area */}
      <div className={`h-36 relative bg-gradient-to-br ${config.gradient} flex items-center justify-center overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-25 blur-2xl scale-150"
          style={{ background: `radial-gradient(circle, ${config.accent}88, transparent 70%)` }}
        />
        {sponsor.logo_url && !imgFailed ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="relative z-10 max-h-16 max-w-[170px] object-contain brightness-90 group-hover:brightness-110 transition-all duration-300 drop-shadow-lg"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span
            className="relative z-10 material-icons-round text-[56px] opacity-60 group-hover:opacity-90 transition-all"
            style={{ color: config.accent }}
          >
            {config.icon}
          </span>
        )}
        <div className="absolute bottom-2 right-2">
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              background: `${config.accent}18`,
              color: config.accent,
              border: `1px solid ${config.accent}35`,
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Text */}
      <div className="bg-card-dark px-4 py-3">
        <p className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">
          {sponsor.name}
        </p>
        <p className="text-text-muted text-[11px] truncate mt-0.5 leading-tight">
          {sponsor.tagline || config.label}
        </p>
      </div>
    </div>
  );

  if (sponsor.link_url) {
    return (
      <a href={sponsor.link_url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}
