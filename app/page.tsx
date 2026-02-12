"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
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

function VenueCard({ event }: { event: KaraokeEvent }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
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

export default function HomePage() {
  const scrollRef = useScrollReveal();
  const [activeDay, setActiveDay] = useState<string>("All");
  const eventsByDay = getEventsByDay();
  const tabBarRef = useRef<HTMLDivElement>(null);

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
      <TopNav />

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

            <div className="w-full max-w-lg mb-6 animate-[fadeSlideUp_0.8s_ease-out_0.8s_both]">
              <Link
                href="/search"
                className="flex items-center gap-3 glass-card rounded-full px-6 py-4 hover:border-primary/30 transition-all group cursor-pointer"
              >
                <span className="material-icons-round text-text-muted group-hover:text-primary transition-colors">
                  search
                </span>
                <span className="text-text-muted text-sm flex-grow text-left">
                  Search venues, songs, or KJs...
                </span>
                <span className="bg-primary text-black text-xs font-bold px-4 py-1.5 rounded-full">
                  Go
                </span>
              </Link>
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

      {/* ─── VIDEO HIGHLIGHT SECTION ─── */}
      <section className="py-16 md:py-20 bg-bg-dark">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="text-center mb-8">
            <p
              className="reveal text-accent text-2xl mb-2 neon-glow-pink"
              style={{ fontFamily: "var(--font-script)" }}
            >
              See The Vibes
            </p>
            <h2 className="reveal text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
              Karaoke Highlights
            </h2>
          </div>
          <div className="reveal relative rounded-3xl overflow-hidden shadow-2xl shadow-accent/10">
            <video
              className="w-full h-auto rounded-3xl"
              autoPlay
              muted
              loop
              playsInline
              poster="/karaoke-hero-2.png"
            >
              <source src="/karaoke-highlight.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <p
            className="reveal text-primary text-2xl mb-2 neon-glow-green"
            style={{ fontFamily: "var(--font-script)" }}
          >
            NYC&apos;s #1 Directory
          </p>
          <h2 className="reveal text-3xl md:text-4xl font-extrabold text-white mb-6 uppercase tracking-tight">
            About Karaoke Times
          </h2>
          <p className="reveal text-text-secondary leading-relaxed max-w-2xl mx-auto mb-8">
            Your ultimate guide to the karaoke scene in New York City. Discover
            live venues, find your favorite songs, connect with KJs, and never
            miss a karaoke night again. From Brooklyn to Manhattan, the Bronx to
            Queens — we&apos;ve got every mic in the city covered.
          </p>
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
          <div className="reveal mb-10 relative">
            <div
              ref={tabBarRef}
              className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-1"
            >
              <button
                onClick={() => setActiveDay("All")}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
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
                  className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeDay === day
                      ? "bg-primary text-black shadow-lg shadow-primary/30"
                      : "glass-card text-text-secondary hover:text-white hover:border-primary/30"
                  }`}
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                  {" "}({countByDay[day]})
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {activeDay === "All" ? (
            // Show grouped by day
            DAY_ORDER.map((day) => {
              const dayEvents = eventsByDay[day];
              if (!dayEvents || dayEvents.length === 0) return null;
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
                    {dayEvents.map((event) => (
                      <VenueCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Show filtered day
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <VenueCard key={event.id} event={event} />
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

      <BottomNav />
    </div>
  );
}
