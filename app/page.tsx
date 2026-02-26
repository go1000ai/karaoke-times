"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/components/AuthProvider";
import { TubesBackground } from "@/components/ui/neon-flow";
import { CardStack, type CardStackItem } from "@/components/ui/card-stack";
import { createClient } from "@/lib/supabase/client";
import { karaokeEvents as staticEvents, DAY_ORDER, searchKJs, getKJSlugForName, type KaraokeEvent, type KJProfile } from "@/lib/mock-data";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube";
import CircularGallery, { type GalleryItem } from "@/components/CircularGallery";

const GALLERY_ITEMS: GalleryItem[] = [
  { title: "Fusion East", subtitle: "Lower East Side, Manhattan", image: "/venues/fusion-east-monday.jpg", label: "Monday Night" },
  { title: "Karaoke Highlights", subtitle: "NYC's Best Performers", video: "/videos/karaoke-highlight.mp4", image: "/videos/karaoke-highlight-poster.jpg", label: "Featured" },
  { title: "Essence Bar & Grill", subtitle: "Wakefield, Bronx", image: "/venues/essence-bar-grill-friday.jpg", label: "Friday Night" },
  { title: "Superstar Karaoke", subtitle: "Essence Bar Fridays", video: "/videos/essence-reel.mp4", image: "/videos/essence-reel-poster.jpg", label: "Live" },
  { title: "Footprints Cafe", subtitle: "South Ozone Park, Queens", image: "/venues/footprints-cafe-monday.jpg", label: "Monday Night" },
  { title: "Wednesday Karaoke", subtitle: "Midweek Vibes", video: "/videos/wednesday-night.mp4", image: "/videos/wednesday-night-poster.jpg", label: "Live" },
  { title: "GT Kingston", subtitle: "Wakefield, Bronx", image: "/venues/gt-kingston-monday.jpg", label: "Monday Night" },
  { title: "Karaoke Nights NYC", subtitle: "The Best Karaoke in the City", video: "/videos/instagram-clip.mp4", image: "/videos/instagram-clip-poster.jpg", label: "Featured" },
  { title: "Havana Cafe", subtitle: "Bronx, NY", image: "/venues/havana-cafe-wednesday.jpg", label: "Wednesday Night" },
  { title: "Aux Karaoke Live", subtitle: "Live Performance Highlights", video: "/videos/aux-karaoke-live.mp4", image: "/videos/aux-karaoke-live-poster.jpg", label: "Live" },
  { title: "Oval Sports Lounge", subtitle: "Bronx, NY", image: "/venues/oval-sports-lounge-tuesday.jpg", label: "Tuesday Night" },
  { title: "Superstar Fridays", subtitle: "Essence Bar & Grill", video: "/videos/essence-superstar-fridays.mp4", image: "/videos/essence-superstar-fridays-poster.jpg", label: "Live" },
];

const DAY_ICONS: Record<string, string> = {
  Monday: "looks_one",
  Tuesday: "looks_two",
  Wednesday: "looks_3",
  Thursday: "looks_4",
  Friday: "looks_5",
  Saturday: "looks_6",
  Sunday: "calendar_today",
  "Bi-Monthly Sundays": "event_repeat",
  "Private Room Karaoke": "door_sliding",
};

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
  "Bi-Monthly Sundays": "Bi-Sun",
  "Private Room Karaoke": "Private",
};

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.15 }
    );
    el.querySelectorAll(".reveal").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

const VenueCard = memo(function VenueCard({
  event,
  onClick,
  isFavorited,
  onToggleFavorite,
  onShare,
  showActions,
}: {
  event: KaraokeEvent;
  onClick: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  showActions?: boolean;
}) {
  return (
    <div onClick={onClick} className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group cursor-pointer flex flex-col">
      {/* Image or Placeholder */}
      <div className="h-52 relative overflow-hidden flex-shrink-0">
        {event.image ? (
          <img
            alt={event.venueName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src={event.image}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy via-card-dark to-bg-dark flex flex-col items-center justify-center p-4">
            <span className="material-icons-round text-primary/30 text-6xl mb-2">mic</span>
            <p className="text-white/60 text-sm font-bold text-center">{event.venueName}</p>
            <p className="text-white/30 text-xs mt-1">{event.city}</p>
          </div>
        )}
        {/* Day badge */}
        <div className="absolute top-3 left-3 bg-primary text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          {event.dayOfWeek === "Private Room Karaoke" ? "Private Room" : event.dayOfWeek}
        </div>

        {/* Heart + Share — only when logged in */}
        {showActions && (
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isFavorited
                  ? "bg-red-500 shadow-lg shadow-red-500/40"
                  : "bg-black/50 backdrop-blur-sm hover:bg-black/70"
              }`}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <span className="material-icons-round text-white text-lg">
                {isFavorited ? "favorite" : "favorite_border"}
              </span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare?.(); }}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
              title="Share"
            >
              <span className="material-icons-round text-white text-lg">share</span>
            </button>
          </div>
        )}

        {event.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent opacity-60" />
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-white text-lg leading-tight">{event.venueName}</h4>
        </div>
        <p className="text-accent text-xs font-bold uppercase tracking-wider mb-2">
          {event.eventName}
        </p>

        {/* Address */}
        <p className="text-text-muted text-xs mb-3">
          {event.address}, {event.city}, {event.state}
          {event.neighborhood ? ` — ${event.neighborhood}` : ""}
        </p>

        {/* Notes */}
        {event.notes && (
          <p className="text-text-secondary text-xs leading-relaxed mb-3">
            {event.notes}
          </p>
        )}

        {/* Cross street */}
        {event.crossStreet && (
          <p className="text-text-muted text-[10px] mb-3">
            <span className="material-icons-round text-[10px] align-middle mr-0.5">near_me</span>
            Near {event.crossStreet}
          </p>
        )}

        {/* Details row — pinned to bottom */}
        <div className="mt-auto flex flex-col items-start">
          <div className="flex flex-col items-start gap-2 mb-3">
            {event.startTime && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2.5 py-1 rounded-full font-bold">
                <span className="material-icons-round text-xs">schedule</span>
                {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
              </span>
            )}
            {event.dj && event.dj !== "Open" && (() => {
              const kjSlug = getKJSlugForName(event.dj);
              return kjSlug ? (
                <Link
                  href={`/kj/${kjSlug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 bg-accent/10 text-accent text-[10px] px-2.5 py-1 rounded-full font-bold hover:bg-accent/20 transition-colors"
                >
                  <span className="material-icons-round text-xs">headphones</span>
                  {event.dj}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-[10px] px-2.5 py-1 rounded-full font-bold">
                  <span className="material-icons-round text-xs">headphones</span>
                  {event.dj}
                </span>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {event.phone && (
              <a
                href={`tel:${event.phone}`}
                className="inline-flex items-center gap-1.5 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                <span className="material-icons-round text-sm">call</span>
                Call
              </a>
            )}
            {event.isPrivateRoom && (
              <button
                className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-accent/80 transition-colors cursor-default"
                title="Coming Soon"
              >
                <span className="material-icons-round text-sm">door_sliding</span>
                Book Now — Coming Soon
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function isZipCode(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

// Resolve day abbreviations to full day names for search
const DAY_ALIASES: Record<string, string> = {
  mon: "monday", monday: "monday",
  tue: "tuesday", tues: "tuesday", tuesday: "tuesday",
  wed: "wednesday", weds: "wednesday", wednesday: "wednesday",
  thu: "thursday", thur: "thursday", thurs: "thursday", thursday: "thursday",
  fri: "friday", friday: "friday",
  sat: "saturday", saturday: "saturday",
  sun: "sunday", sunday: "sunday",
};

function resolveDayQuery(q: string): string | null {
  return DAY_ALIASES[q.toLowerCase().trim()] || null;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    let timer: ReturnType<typeof setTimeout>;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(check, 150); };
    window.addEventListener("resize", debounced);
    return () => { clearTimeout(timer); window.removeEventListener("resize", debounced); };
  }, [breakpoint]);
  return isMobile;
}

const FAVORITES_KEY = "kt-favorites";

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

export default function HomePage() {
  const scrollRef = useScrollReveal();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [activeDay, setActiveDay] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<KaraokeEvent | null>(null);
  const [searchFilter, setSearchFilter] = useState<"all" | "kjs" | "venues">("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [karaokeEvents, setKaraokeEvents] = useState<KaraokeEvent[]>(staticEvents);
  const venueCount = Math.floor(karaokeEvents.length / 10) * 10;
  const [featuredSingers, setFeaturedSingers] = useState<{
    id: string;
    title: string | null;
    song_title: string | null;
    song_artist: string | null;
    highlight_type: string;
    event_date: string | null;
    video_url: string | null;
    singer?: { display_name: string | null };
    venue?: { name: string | null };
  }[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, KaraokeEvent[]> = {};
    for (const event of karaokeEvents) {
      if (!grouped[event.dayOfWeek]) grouped[event.dayOfWeek] = [];
      grouped[event.dayOfWeek].push(event);
    }
    return grouped;
  }, [karaokeEvents]);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Load synced events from Supabase (if admin has synced via CSV/Google Sheet)
  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setKaraokeEvents(data.events);
        }
      })
      .catch(() => {});
  }, []);

  // Load favorites + featured singers on mount
  useEffect(() => {
    setFavorites(loadFavorites());
    const supabase = createClient();
    supabase
      .from("singer_highlights")
      .select("id, title, song_title, song_artist, highlight_type, event_date, video_url, singer:profiles!singer_user_id(display_name), venue:venues!venue_id(name)")
      .eq("is_active", true)
      .eq("consent_status", "approved")
      .in("highlight_type", ["weekly_featured", "monthly_featured", "singer_of_night"])
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setFeaturedSingers(data as any);
      });
  }, []);

  const toggleFavorite = useCallback((eventId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      const isAdding = !next.has(eventId);
      if (isAdding) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      saveFavorites(next);

      // Also sync to Supabase for logged-in users (best-effort, non-blocking)
      if (user) {
        const event = karaokeEvents.find((e) => e.id === eventId);
        if (event) {
          const supabase = createClient();
          supabase
            .from("venues")
            .select("id")
            .ilike("name", event.venueName)
            .limit(1)
            .single()
            .then(({ data: venueRow }) => {
              if (!venueRow) return;
              if (isAdding) {
                supabase.from("favorites").upsert(
                  { user_id: user.id, venue_id: venueRow.id },
                  { onConflict: "user_id,venue_id" }
                ).then(() => {});
              } else {
                supabase.from("favorites")
                  .delete()
                  .eq("user_id", user.id)
                  .eq("venue_id", venueRow.id)
                  .then(() => {});
              }
            });
        }
      }

      return next;
    });
  }, [user]);

  const shareEvent = useCallback((event: KaraokeEvent) => {
    if (navigator.share) {
      navigator.share({
        title: event.venueName,
        text: `${event.eventName} at ${event.venueName}`,
        url: `${window.location.origin}/venue/${event.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/venue/${event.id}`);
    }
  }, []);

  // Search logic — filters across all fields (memoized)
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];
    const q = searchQuery.toLowerCase();
    const dayMatch = resolveDayQuery(q);
    return karaokeEvents.filter((e) =>
      (dayMatch && e.dayOfWeek.toLowerCase() === dayMatch) ||
      e.venueName.toLowerCase().includes(q) ||
      e.eventName.toLowerCase().includes(q) ||
      e.neighborhood.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      e.dj.toLowerCase().includes(q) ||
      e.address.toLowerCase().includes(q) ||
      e.dayOfWeek.toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // KJ search results (memoized)
  const kjResults: KJProfile[] = useMemo(() => {
    return searchQuery.trim().length >= 2 ? searchKJs(searchQuery) : [];
  }, [searchQuery]);

  const filteredEvents = useMemo(() =>
    activeDay === "All"
      ? karaokeEvents
      : karaokeEvents.filter((e) => e.dayOfWeek === activeDay),
    [activeDay]
  );

  // Count by day for badges (memoized — eventsByDay is stable module-level data)
  const countByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const day of DAY_ORDER) {
      counts[day] = eventsByDay[day]?.length ?? 0;
    }
    return counts;
  }, [eventsByDay]);

  return (
    <div ref={scrollRef} className="min-h-screen bg-bg-dark overflow-x-hidden">

      {/* ─── HERO SECTION with NeonFlow ─── */}
      <section className="relative h-[100svh] min-h-[600px]">
        <TubesBackground
          className="h-full"
          enableClickInteraction
          backgroundImage="/karaoke-hero-2-optimized.jpg"
        >
          <div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-3xl mx-auto pointer-events-auto">
            <div className="mb-8 animate-[fadeSlideUp_1s_ease-out_0.2s_both] relative">
              <div
                className="absolute inset-0 blur-[40px] opacity-60 scale-125 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(212,160,23,0.5) 0%, rgba(192,57,43,0.25) 40%, transparent 70%)",
                }}
              />
              <img
                src="/logo.png"
                alt="Karaoke Times"
                className="relative z-10 w-72 md:w-96 h-auto transition-all duration-500 hover:scale-[1.03]"
                style={{
                  filter:
                    "drop-shadow(0 0 2px rgba(255,255,255,0.8)) drop-shadow(0 0 6px rgba(212,160,23,0.9)) drop-shadow(0 0 12px rgba(212,160,23,0.5)) drop-shadow(0 0 30px rgba(192,57,43,0.3))",
                }}
              />
            </div>

            <p className="text-lg md:text-xl text-white/70 tracking-wide mb-8 max-w-md animate-[fadeSlideUp_0.8s_ease-out_0.6s_both]">
              Discover the best karaoke spots, live events, and KJs across New
              York City.
            </p>

            <div className="w-full max-w-lg mb-6 animate-[fadeSlideUp_0.8s_ease-out_0.8s_both] relative z-30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (!q) return;
                  if (isZipCode(q)) {
                    router.push(`/map?zip=${q}`);
                  } else {
                    setSearchOpen(true);
                  }
                }}
                className="flex items-center gap-3 glass-card rounded-full px-6 py-3"
              >
                <span className="material-icons-round text-text-muted">search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search venues, KJs, days, or zip code..."
                  className="bg-transparent text-white text-sm flex-grow outline-none placeholder:text-text-muted"
                />
                {searchQuery ? (
                  <button
                    type="submit"
                    className="bg-primary text-black text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer"
                  >
                    Go
                  </button>
                ) : (
                  <span className="bg-primary/40 text-black/60 text-xs font-bold px-4 py-1.5 rounded-full">
                    Go
                  </span>
                )}
              </form>
            </div>

            <div className="flex flex-wrap justify-center gap-3 animate-[fadeSlideUp_0.8s_ease-out_1s_both]">
              <Link
                href="/map"
                className="inline-flex items-center gap-1.5 text-white/50 text-sm hover:text-primary transition-colors"
              >
                <span className="material-icons-round text-base">map</span>
                Map View
              </Link>
              <span className="text-white/20">|</span>
              <Link
                href="/favorites"
                className="inline-flex items-center gap-1.5 text-white/50 text-sm hover:text-primary transition-colors"
              >
                <span className="material-icons-round text-base">
                  favorite_border
                </span>
                Favorites
              </Link>
            </div>

            <div className="mt-12 animate-[fadeSlideUp_0.8s_ease-out_1.2s_both]">
              <span className="inline-flex items-center gap-2 text-white/40 text-xs">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span>
                  <span className="text-white font-medium">{karaokeEvents.length}</span>{" "}
                  karaoke events listed across NYC
                </span>
              </span>
            </div>
          </div>
        </TubesBackground>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
          <span className="material-icons-round text-white/30 text-2xl">
            expand_more
          </span>
        </div>
      </section>

      {/* ─── 3D VIDEO GALLERY + ABOUT SECTION ─── */}
      <section className="py-16 md:py-24 bg-bg-dark overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          {/* Section header */}
          <div className="text-center mb-4 reveal">
            <p
              className="text-primary text-2xl mb-2 neon-glow-green"
              style={{ fontFamily: "var(--font-script)" }}
            >
              NYC&apos;s #1 Directory
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight mb-2">
              Your Night Starts Here
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-1">
              From Brooklyn to Manhattan, the Bronx to Queens — Karaoke Times
              is your ultimate guide to the karaoke scene. Find live venues,
              discover amazing KJs, and never miss a karaoke night again.
            </p>
            <p className="text-text-muted text-xs">
              <span className="hidden sm:inline">Drag</span>
              <span className="sm:hidden">Swipe</span>
              {" "}to explore
            </p>
          </div>

          {/* 3D Circular Gallery */}
          <div className="reveal">
            <CircularGallery items={GALLERY_ITEMS} autoRotateSpeed={0.12} />
          </div>

          {/* About bullets + CTA */}
          <div className="flex flex-col items-center mt-8 reveal">
            <div className="inline-flex flex-col gap-4 mb-8">
              {[
                { icon: "mic", text: `${venueCount}+ karaoke nights weekly` },
                { icon: "headphones", text: "Top KJs, all boroughs" },
                { icon: "local_bar", text: "Drink specials & happy hours" },
                { icon: "door_sliding", text: "Private rooms for groups" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-primary text-lg">{item.icon}</span>
                  </div>
                  <p className="text-white/80 text-sm font-medium">{item.text}</p>
                </div>
              ))}
            </div>

            <a
              href="#listings"
              className="inline-flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-primary/40 transition-all text-sm"
            >
              Browse All Listings
              <span className="material-icons-round text-lg">arrow_downward</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FEATURED VENUES CARD STACK ─── */}
      <section className="py-16 md:py-20 border-t border-border overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-6">
            <p
              className="reveal text-primary text-2xl mb-2 neon-glow-green"
              style={{ fontFamily: "var(--font-script)" }}
            >
              Don&apos;t Miss Out
            </p>
            <h2 className="reveal text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight mb-4">
              Featured Karaoke Spots
            </h2>
          </div>
          <CardStack
            items={karaokeEvents
              .filter((e) => e.image)
              .slice(0, 12)
              .map((e) => ({
                id: e.id,
                title: e.venueName,
                description: `${e.eventName} — ${e.dayOfWeek}${e.startTime ? ` at ${e.startTime}` : ""}`,
                imageSrc: e.image ?? undefined,
                href: `/venue/${e.id}`,
                tag: e.neighborhood || e.city,
              }))}
            autoAdvance
            intervalMs={3500}
            pauseOnHover
            loop
            cardWidth={isMobile ? 280 : 480}
            cardHeight={isMobile ? 200 : 300}
            maxVisible={isMobile ? 3 : 7}
            overlap={isMobile ? 0.35 : 0.48}
            spreadDeg={isMobile ? 30 : 48}
            depthPx={isMobile ? 80 : 140}
          />
        </div>
      </section>

      {/* ─── FEATURED SINGERS ─── */}
      {featuredSingers.length > 0 && (
        <section className="py-16 md:py-20 border-t border-border">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <div className="text-center mb-10">
              <p
                className="reveal text-yellow-400 text-2xl mb-2"
                style={{ fontFamily: "var(--font-script)", textShadow: "0 0 20px rgba(250,204,21,0.3)" }}
              >
                Shining Stars
              </p>
              <h2 className="reveal text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight mb-4">
                Featured Singers
              </h2>
              <p className="reveal text-text-secondary leading-relaxed max-w-lg mx-auto">
                Recognized by KJs for outstanding performances at venues across NYC.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredSingers.map((singer) => {
                const vidId = singer.video_url ? extractYouTubeVideoId(singer.video_url) : null;
                return (
                  <div key={singer.id} className="reveal glass-card rounded-2xl p-5 hover:border-yellow-400/20 transition-all group">
                    <div className="flex items-start gap-4">
                      {vidId ? (
                        <div className="w-16 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
                          <img
                            src={getYouTubeThumbnail(vidId, "default")}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <span className="material-icons-round text-white text-lg">play_arrow</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-icons-round text-yellow-400 text-2xl">star</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate">
                          {singer.title || singer.singer?.display_name || "Featured Singer"}
                        </p>
                        {singer.song_title && (
                          <p className="text-accent text-sm font-semibold truncate mt-0.5">
                            &ldquo;{singer.song_title}&rdquo;
                            {singer.song_artist && <span className="text-text-muted"> by {singer.song_artist}</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            singer.highlight_type === "monthly_featured"
                              ? "bg-purple-500/10 text-purple-400"
                              : singer.highlight_type === "weekly_featured"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-yellow-400/10 text-yellow-400"
                          }`}>
                            {singer.highlight_type === "monthly_featured"
                              ? "Monthly Featured"
                              : singer.highlight_type === "weekly_featured"
                              ? "Weekly Featured"
                              : "Singer of the Night"}
                          </span>
                          {singer.venue?.name && (
                            <span className="text-[10px] text-text-muted truncate">
                              at {singer.venue.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All link */}
            <div className="text-center mt-8">
              <Link
                href="/featured-singers"
                className="text-primary font-semibold text-sm hover:underline inline-flex items-center gap-1"
              >
                View All Featured Singers
                <span className="material-icons-round text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── KARAOKE LISTINGS ─── */}
      <section className="py-16 md:py-20" id="listings">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-10">
            <p
              className="reveal text-accent text-2xl mb-2 neon-glow-pink"
              style={{ fontFamily: "var(--font-script)" }}
            >
              Find Your Night
            </p>
            <h2 className="reveal text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight mb-4">
              Karaoke Listings
            </h2>
            <p className="reveal text-text-secondary leading-relaxed max-w-lg mx-auto">
              {karaokeEvents.length} karaoke nights across NYC and beyond. Filter by day to find your spot.
            </p>
          </div>

          {/* Day filter tabs */}
          <div className="reveal mb-10">
            <div
              ref={tabBarRef}
              className="flex flex-wrap gap-2 justify-center"
            >
              <button
                onClick={() => setActiveDay("All")}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                  activeDay === "All"
                    ? "bg-primary text-black shadow-lg shadow-primary/30"
                    : "glass-card text-text-secondary hover:text-white hover:border-primary/30"
                }`}
              >
                All ({karaokeEvents.length})
              </button>
              {DAY_ORDER.map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                    activeDay === day
                      ? "bg-primary text-black shadow-lg shadow-primary/30"
                      : "glass-card text-text-secondary hover:text-white hover:border-primary/30"
                  }`}
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{DAY_SHORT[day] || day}</span>
                  {" "}({countByDay[day]})
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {activeDay === "All" ? (
            // Show grouped by day — first 6 per day with "View More"
            DAY_ORDER.map((day) => {
              const dayEvents = eventsByDay[day];
              if (!dayEvents || dayEvents.length === 0) return null;
              const previewEvents = dayEvents.slice(0, 6);
              const hasMore = dayEvents.length > 6;
              return (
                <div key={day} className="mb-16">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-icons-round text-primary text-2xl">
                      {DAY_ICONS[day] || "event"}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">
                      {day}
                    </h3>
                    <span className="text-text-muted text-sm font-medium">
                      ({dayEvents.length} {dayEvents.length === 1 ? "event" : "events"})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {previewEvents.map((event, idx) => (
                      <VenueCard
                        key={`${event.id}-${event.dayOfWeek}-${idx}`}
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                        showActions={!!user}
                        isFavorited={favorites.has(event.id)}
                        onToggleFavorite={() => toggleFavorite(event.id)}
                        onShare={() => shareEvent(event)}
                      />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => {
                          setActiveDay(day);
                          tabBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="inline-flex items-center gap-2 text-primary text-sm font-bold hover:text-primary/80 transition-colors glass-card px-6 py-3 rounded-full"
                      >
                        View All {dayEvents.length} {day} Events
                        <span className="material-icons-round text-lg">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Show filtered day
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, idx) => (
                <VenueCard
                        key={`${event.id}-${event.dayOfWeek}-${idx}`}
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                        showActions={!!user}
                        isFavorited={favorites.has(event.id)}
                        onToggleFavorite={() => toggleFavorite(event.id)}
                        onShare={() => shareEvent(event)}
                      />
              ))}
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="text-center py-20">
              <span className="material-icons-round text-text-muted text-6xl mb-4 block">
                search_off
              </span>
              <p className="text-text-secondary text-lg">
                No events found for this day.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── SERVICES / WHAT WE OFFER ─── */}
      <section className="py-16 border-t border-b border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                icon: "mic",
                title: "Live Karaoke",
                desc: "Find venues with open mics happening every night",
              },
              {
                icon: "queue_music",
                title: "Song Search",
                desc: "Search by song and see which venues play it tonight",
              },
              {
                icon: "event",
                title: "Events",
                desc: "Themed karaoke nights, battles, and special events",
              },
              {
                icon: "local_bar",
                title: "Drink Specials",
                desc: "Happy hours and deals at karaoke bars near you",
              },
              {
                icon: "door_sliding",
                title: "Private Rooms",
                desc: "Book private karaoke rooms for your group",
              },
              {
                icon: "star",
                title: "KJ Spotlight",
                desc: "Discover top KJs and their upcoming shows",
              },
            ].map((service, i) => (
              <div
                key={i}
                className="reveal glass-card rounded-2xl p-6 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-icons-round text-primary text-2xl">
                    {service.icon}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-2">
                  {service.title}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 pb-36 md:pb-12">
        <div className="max-w-2xl mx-auto px-6">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <img
              src="/logo.png"
              alt="Karaoke Times"
              className="h-12 w-auto"
            />
          </div>

          {/* Social icons */}
          <div className="flex justify-center gap-4 mb-4">
            <a
              href="https://www.facebook.com/groups/632806096911901"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              title="Join our Facebook Group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a
              href="https://www.instagram.com/karaoketimesnyc?igsh=Nnh1aGkyeWYxMWRi"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              title="Follow us on Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>

          {/* Links */}
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/terms" className="text-text-muted text-xs hover:text-primary transition-colors">
              Terms
            </Link>
            <span className="text-border">|</span>
            <Link href="/privacy" className="text-text-muted text-xs hover:text-primary transition-colors">
              Privacy
            </Link>
            <span className="text-border">|</span>
            <a href="mailto:info@go1000.ai" className="text-text-muted text-xs hover:text-primary transition-colors">
              Contact
            </a>
          </div>

          <p className="text-text-muted text-[10px] text-center">
            &copy; 2026 Karaoke Times NYC
          </p>
        </div>
      </footer>

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] -left-[20%] w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] -right-[20%] w-[60%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      {/* Venue Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg mx-auto bg-bg-dark border border-border rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.25s_ease-out]">
            {/* Hero image */}
            <div className="relative h-56">
              {selectedEvent.image ? (
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.venueName}
                  className="w-full h-full object-cover rounded-t-3xl md:rounded-t-3xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-navy via-card-dark to-bg-dark flex flex-col items-center justify-center rounded-t-3xl">
                  <span className="material-icons-round text-primary/30 text-7xl mb-2">mic</span>
                  <p className="text-white/60 font-bold">{selectedEvent.venueName}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/30 to-transparent rounded-t-3xl" />

              {/* Close button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <span className="material-icons-round text-white text-xl">close</span>
              </button>

              {/* Day badge */}
              <div className="absolute top-4 left-4 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedEvent.dayOfWeek === "Private Room Karaoke" ? "Private Room" : selectedEvent.dayOfWeek}
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 -mt-4 relative z-10">
              {/* Venue name + event */}
              <h2 className="text-xl font-extrabold text-white mb-1">{selectedEvent.venueName}</h2>
              <p className="text-accent text-xs font-bold uppercase tracking-wider mb-3">{selectedEvent.eventName}</p>

              {/* Info pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedEvent.startTime && (
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-bold">
                    <span className="material-icons-round text-sm">schedule</span>
                    {selectedEvent.startTime}{selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ""}
                  </span>
                )}
                {selectedEvent.dj && selectedEvent.dj !== "Open" && (() => {
                  const kjSlug = getKJSlugForName(selectedEvent.dj);
                  return kjSlug ? (
                    <Link
                      href={`/kj/${kjSlug}`}
                      className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-3 py-1.5 rounded-full font-bold hover:bg-accent/20 transition-colors"
                    >
                      <span className="material-icons-round text-sm">headphones</span>
                      {selectedEvent.dj}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-3 py-1.5 rounded-full font-bold">
                      <span className="material-icons-round text-sm">headphones</span>
                      {selectedEvent.dj}
                    </span>
                  );
                })()}
                {selectedEvent.isPrivateRoom && (
                  <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 text-xs px-3 py-1.5 rounded-full font-bold">
                    <span className="material-icons-round text-sm">door_sliding</span>
                    Private Room
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="glass-card rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons-round text-primary text-lg mt-0.5">location_on</span>
                  <div>
                    <p className="text-sm text-white font-medium">{selectedEvent.address}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {selectedEvent.city}, {selectedEvent.state}
                      {selectedEvent.neighborhood ? ` — ${selectedEvent.neighborhood}` : ""}
                    </p>
                    {selectedEvent.crossStreet && (
                      <p className="text-[10px] text-text-muted mt-1">Near {selectedEvent.crossStreet}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="glass-card rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="material-icons-round text-accent text-lg mt-0.5">info</span>
                    <p className="text-sm text-text-secondary leading-relaxed">{selectedEvent.notes}</p>
                  </div>
                </div>
              )}

              {/* Action buttons row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => {
                    const addr = encodeURIComponent(`${selectedEvent.address}, ${selectedEvent.neighborhood || selectedEvent.city}`);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, "_blank");
                  }}
                  className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-all"
                >
                  <span className="material-icons-round text-primary text-xl">directions</span>
                  <span className="text-[10px] text-text-secondary font-semibold">Directions</span>
                </button>

                {selectedEvent.phone ? (
                  <a
                    href={`tel:${selectedEvent.phone}`}
                    className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-all"
                  >
                    <span className="material-icons-round text-primary text-xl">call</span>
                    <span className="text-[10px] text-text-secondary font-semibold">Call</span>
                  </a>
                ) : (
                  <div className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 opacity-40">
                    <span className="material-icons-round text-text-muted text-xl">call</span>
                    <span className="text-[10px] text-text-muted font-semibold">No Phone</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: selectedEvent.venueName, text: `${selectedEvent.eventName} at ${selectedEvent.venueName}`, url: `${window.location.origin}/venue/${selectedEvent.id}` });
                    }
                  }}
                  className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-all"
                >
                  <span className="material-icons-round text-primary text-xl">share</span>
                  <span className="text-[10px] text-text-secondary font-semibold">Share</span>
                </button>
              </div>

              {/* Direction modes */}
              <div className="glass-card rounded-xl overflow-hidden mb-4">
                <div className="grid grid-cols-3 divide-x divide-border">
                  {[
                    { icon: "directions_car", label: "Drive", mode: "driving" },
                    { icon: "directions_transit", label: "Transit", mode: "transit" },
                    { icon: "directions_walk", label: "Walk", mode: "walking" },
                  ].map((t) => (
                    <button
                      key={t.mode}
                      onClick={() => {
                        const addr = encodeURIComponent(`${selectedEvent.address}, ${selectedEvent.neighborhood || selectedEvent.city}`);
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=${t.mode}`, "_blank");
                      }}
                      className="py-3 flex flex-col items-center gap-1 hover:bg-white/5 transition-colors"
                    >
                      <span className="material-icons-round text-primary text-lg">{t.icon}</span>
                      <span className="text-[10px] text-text-muted">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full listing link */}
              <Link
                href={`/venue/${selectedEvent.id}`}
                onClick={() => setSelectedEvent(null)}
                className="w-full bg-primary text-black font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all text-sm"
              >
                <span className="material-icons-round text-xl">open_in_new</span>
                View Full Listing
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Popup */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-bg-dark/95 backdrop-blur-lg flex flex-col">
          {/* Popup Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-border">
            <button
              onClick={() => setSearchOpen(false)}
              className="text-text-muted hover:text-white transition-colors flex-shrink-0"
            >
              <span className="material-icons-round text-2xl">arrow_back</span>
            </button>
            <div className="flex-grow flex items-center gap-3 glass-card rounded-full px-5 py-2.5">
              <span className="material-icons-round text-text-muted text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                placeholder="Search venues, KJs, neighborhoods..."
                className="bg-transparent text-white text-sm flex-grow outline-none placeholder:text-text-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <span className="material-icons-round text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {searchQuery.trim().length > 0 && (searchResults.length > 0 || kjResults.length > 0) && (
            <div className="flex gap-1 px-5 pt-3 pb-1">
              {([
                { key: "all" as const, label: "All", count: searchResults.length + kjResults.length },
                { key: "kjs" as const, label: "KJs", count: kjResults.length },
                { key: "venues" as const, label: "Venues", count: searchResults.length },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSearchFilter(tab.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    searchFilter === tab.key
                      ? "bg-primary text-black shadow-lg shadow-primary/30"
                      : "glass-card text-text-secondary hover:text-white hover:border-primary/30"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {searchQuery.trim().length === 0 ? (
              <div className="text-center py-16">
                <span className="material-icons-round text-text-muted text-5xl mb-3 block">search</span>
                <p className="text-text-secondary">Search venues, KJs, and neighborhoods</p>
              </div>
            ) : searchResults.length > 0 || kjResults.length > 0 ? (
              <>
                {/* KJ Results */}
                {kjResults.length > 0 && searchFilter !== "venues" && (
                  <div className="mb-6">
                    {searchFilter === "all" && (
                      <p className="text-xs uppercase tracking-wider text-accent font-bold mb-3 flex items-center gap-1.5">
                        <span className="material-icons-round text-sm">headphones</span>
                        KJs ({kjResults.length})
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {kjResults.map((kj) => (
                        <Link
                          key={kj.slug}
                          href={`/kj/${kj.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="glass-card rounded-2xl overflow-hidden hover:border-accent/30 transition-all group"
                        >
                          <div className="flex gap-3 p-3">
                            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <span className="material-icons-round text-accent text-2xl">headphones</span>
                            </div>
                            <div className="flex-grow min-w-0 py-1">
                              <p className="font-bold text-white text-sm truncate group-hover:text-accent transition-colors">
                                {kj.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {kj.venueCount} {kj.venueCount === 1 ? "venue" : "venues"}
                                </span>
                                <span className="text-[10px] text-text-muted">
                                  {kj.events.length} {kj.events.length === 1 ? "night" : "nights"}/week
                                </span>
                              </div>
                              <p className="text-[10px] text-text-muted mt-1 truncate">
                                {kj.events.map((e) => e.venueName).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Venue Results */}
                {searchResults.length > 0 && searchFilter !== "kjs" && (
                  <div>
                    {searchFilter === "all" && (
                      <p className="text-xs uppercase tracking-wider text-primary font-bold mb-3 flex items-center gap-1.5">
                        <span className="material-icons-round text-sm">storefront</span>
                        Venues ({searchResults.length})
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {searchResults.map((event) => (
                        <Link
                          key={event.id}
                          href={`/venue/${event.id}`}
                          onClick={() => setSearchOpen(false)}
                          className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
                        >
                          <div className="flex gap-3 p-3">
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                              {event.image ? (
                                <img src={event.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                  <span className="material-icons-round text-primary text-2xl">mic</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0 py-1">
                              <p className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors">
                                {event.venueName}
                              </p>
                              <p className="text-xs text-text-secondary mt-0.5 truncate">
                                {event.eventName}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {event.dayOfWeek === "Private Room Karaoke" ? "Private" : event.dayOfWeek}
                                </span>
                                {event.dj && (
                                  <span className="text-[10px] text-text-muted truncate">
                                    {event.dj}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-text-muted mt-1 truncate">
                                {event.neighborhood || event.city} &bull; {event.startTime} - {event.endTime}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <span className="material-icons-round text-text-muted text-5xl mb-3 block">search_off</span>
                <p className="text-white font-semibold mb-1">No results</p>
                <p className="text-text-secondary text-sm">Nothing found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
