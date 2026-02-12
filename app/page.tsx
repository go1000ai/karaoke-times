"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { TubesBackground } from "@/components/ui/neon-flow";
import { karaokeEvents, DAY_ORDER, getEventsByDay, type KaraokeEvent } from "@/lib/mock-data";

const DAY_ICONS: Record<string, string> = {
  Monday: "looks_one",
  Tuesday: "looks_two",
  Wednesday: "looks_3",
  Thursday: "looks_4",
  Friday: "looks_5",
  Saturday: "looks_6",
  Sunday: "calendar_today",
  "Bi-Monthly Sundays": "event_repeat",
  "Private Room Karaoke": "meeting_room",
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

function VenueCard({ event, onClick }: { event: KaraokeEvent; onClick: () => void }) {
  return (
    <div onClick={onClick} className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group cursor-pointer">
      {/* Image or Placeholder */}
      <div className="h-52 relative overflow-hidden">
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
        {event.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent opacity-60" />
        )}
      </div>

      {/* Info */}
      <div className="p-5">
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

        {/* Details row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {event.startTime && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2.5 py-1 rounded-full font-bold">
              <span className="material-icons-round text-xs">schedule</span>
              {event.startTime}{event.endTime ? ` - ${event.endTime}` : ""}
            </span>
          )}
          {event.dj && event.dj !== "Open" && (
            <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-[10px] px-2.5 py-1 rounded-full font-bold">
              <span className="material-icons-round text-xs">headphones</span>
              {event.dj}
            </span>
          )}
        </div>

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

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          {event.phone && (
            <a
              href={`tel:${event.phone}`}
              className="inline-flex items-center gap-1.5 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
            >
              <span className="material-icons-round text-sm">call</span>
              Call
            </a>
          )}
          {event.isPrivateRoom && (
            <button
              className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-accent/80 transition-colors cursor-default"
              title="Coming Soon"
            >
              <span className="material-icons-round text-sm">meeting_room</span>
              Book Now — Coming Soon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function isZipCode(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

export default function HomePage() {
  const scrollRef = useScrollReveal();
  const router = useRouter();
  const [activeDay, setActiveDay] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<KaraokeEvent | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const eventsByDay = getEventsByDay();
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Search logic — filters across all fields
  const searchResults = searchQuery.trim().length > 0
    ? karaokeEvents.filter((e) => {
        const q = searchQuery.toLowerCase();
        return (
          e.venueName.toLowerCase().includes(q) ||
          e.eventName.toLowerCase().includes(q) ||
          e.neighborhood.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.dj.toLowerCase().includes(q) ||
          e.address.toLowerCase().includes(q) ||
          e.dayOfWeek.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
        );
      })
    : [];

  const filteredEvents =
    activeDay === "All"
      ? karaokeEvents
      : karaokeEvents.filter((e) => e.dayOfWeek === activeDay);

  // Count by day for badges
  const countByDay: Record<string, number> = {};
  for (const day of DAY_ORDER) {
    countByDay[day] = eventsByDay[day]?.length ?? 0;
  }

  return (
    <div ref={scrollRef} className="min-h-screen bg-bg-dark overflow-x-hidden">

      {/* ─── HERO SECTION with NeonFlow ─── */}
      <section className="relative h-[100svh] min-h-[600px]">
        <TubesBackground
          className="h-full"
          enableClickInteraction
          backgroundImage="/karaoke-hero-2.png"
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
                  placeholder="Search venues, DJs, or enter a zip code..."
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
                href="/add-event"
                className="inline-flex items-center gap-1.5 text-white/50 text-sm hover:text-primary transition-colors"
              >
                <span className="material-icons-round text-base">event</span>
                Post Event
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

      {/* ─── VIDEO + ABOUT SECTION ─── */}
      <section className="py-16 md:py-24 bg-bg-dark">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* Video */}
            <div className="w-full md:w-5/12 reveal">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-accent/10 aspect-[9/16] max-h-[420px] md:max-h-[480px] mx-auto">
                <video
                  className="w-full h-full object-cover rounded-2xl"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/karaoke-hero-2.png"
                >
                  <source src="/karaoke-highlight.mp4" type="video/mp4" />
                </video>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-white/80 text-xs font-semibold">Karaoke Highlights</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="w-full md:w-5/12 text-center md:text-left">
              <p
                className="reveal text-primary text-2xl mb-2 neon-glow-green"
                style={{ fontFamily: "var(--font-script)" }}
              >
                NYC&apos;s #1 Directory
              </p>
              <h2 className="reveal text-3xl md:text-4xl font-extrabold text-white mb-6 uppercase tracking-tight">
                Your Night Starts Here
              </h2>
              <p className="reveal text-text-secondary leading-relaxed mb-6">
                From Brooklyn to Manhattan, the Bronx to Queens — Karaoke Times
                is your ultimate guide to the karaoke scene. Find live venues,
                discover amazing KJs, and never miss a karaoke night again.
              </p>

              <div className="reveal space-y-4 mb-8">
                {[
                  { icon: "mic", text: "49+ karaoke nights listed every week" },
                  { icon: "headphones", text: "Top DJs and KJs across all boroughs" },
                  { icon: "local_bar", text: "Drink specials, happy hours & free shots" },
                  { icon: "meeting_room", text: "Private rooms available for groups" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-primary text-lg">{item.icon}</span>
                    </div>
                    <p className="text-white/80 text-sm font-medium">{item.text}</p>
                  </div>
                ))}
              </div>

              <a
                href="#listings"
                className="reveal inline-flex items-center gap-2 bg-primary text-black font-bold px-7 py-3 rounded-full hover:shadow-lg hover:shadow-primary/40 transition-all text-sm"
              >
                Browse All Listings
                <span className="material-icons-round text-lg">arrow_downward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

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
                    {previewEvents.map((event) => (
                      <VenueCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
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
              {filteredEvents.map((event) => (
                <VenueCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
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
                icon: "meeting_room",
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
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Karaoke Times"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-text-muted text-sm">
              &copy; 2026 Karaoke Times NYC. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-text-muted text-xs hover:text-primary cursor-pointer transition-colors">
                Terms
              </span>
              <span className="text-text-muted text-xs hover:text-primary cursor-pointer transition-colors">
                Privacy
              </span>
              <span className="text-text-muted text-xs hover:text-primary cursor-pointer transition-colors">
                Contact
              </span>
            </div>
          </div>
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
                {selectedEvent.dj && selectedEvent.dj !== "Open" && (
                  <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-3 py-1.5 rounded-full font-bold">
                    <span className="material-icons-round text-sm">headphones</span>
                    {selectedEvent.dj}
                  </span>
                )}
                {selectedEvent.isPrivateRoom && (
                  <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 text-xs px-3 py-1.5 rounded-full font-bold">
                    <span className="material-icons-round text-sm">meeting_room</span>
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
                className="w-full bg-primary text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
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
                placeholder="Search venues, DJs, neighborhoods..."
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

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {searchQuery.trim().length === 0 ? (
              <div className="text-center py-16">
                <span className="material-icons-round text-text-muted text-5xl mb-3 block">search</span>
                <p className="text-text-secondary">Type to search all 49 venues</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-4">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                </p>
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
              </>
            ) : (
              <div className="text-center py-16">
                <span className="material-icons-round text-text-muted text-5xl mb-3 block">search_off</span>
                <p className="text-white font-semibold mb-1">No results</p>
                <p className="text-text-secondary text-sm">No venues found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
