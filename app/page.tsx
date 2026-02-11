"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { CardStack, type CardItem } from "@/components/ui/card-stack";
import { venues, events, sponsoredKJ } from "@/lib/mock-data";

const venueCards: CardItem[] = [
  {
    id: 0,
    name: "Space Karaoke",
    designation: "Koreatown, Manhattan",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    content: (
      <div className="flex items-center gap-2">
        <span className="bg-[#00FFC2]/10 text-[#00FFC2] text-[10px] px-2 py-1 rounded-full font-bold">No Cover</span>
        <span className="bg-[#FF007A]/10 text-[#FF007A] text-[10px] px-2 py-1 rounded-full font-bold">Drink Specials</span>
        <span className="flex items-center text-[#00FFC2] font-bold text-xs ml-auto">
          <span className="material-icons-round text-sm mr-0.5">star</span>4.8
        </span>
      </div>
    ),
  },
  {
    id: 1,
    name: "Neon Echo Lounge",
    designation: "Lower East Side, Manhattan",
    image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&q=80",
    content: (
      <div className="flex items-center gap-2">
        <span className="bg-[#00FFC2]/10 text-[#00FFC2] text-[10px] px-2 py-1 rounded-full font-bold">No Cover</span>
        <span className="bg-[#FF007A]/10 text-[#FF007A] text-[10px] px-2 py-1 rounded-full font-bold">Happy Hour</span>
        <span className="flex items-center text-[#00FFC2] font-bold text-xs ml-auto">
          <span className="material-icons-round text-sm mr-0.5">star</span>4.9
        </span>
      </div>
    ),
  },
  {
    id: 2,
    name: "Sing Sing Ave A",
    designation: "East Village",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    content: (
      <div className="flex items-center gap-2">
        <span className="bg-[#00FFC2]/10 text-[#00FFC2] text-[10px] px-2 py-1 rounded-full font-bold">$10 Hourly</span>
        <span className="flex items-center text-[#00FFC2] font-bold text-xs ml-auto">
          <span className="material-icons-round text-sm mr-0.5">star</span>4.5
        </span>
      </div>
    ),
  },
  {
    id: 3,
    name: "Baby Grand",
    designation: "Nolita, Manhattan",
    image: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=800&q=80",
    content: (
      <div className="flex items-center gap-2">
        <span className="bg-[#00FFC2]/10 text-[#00FFC2] text-[10px] px-2 py-1 rounded-full font-bold">No Cover</span>
        <span className="bg-[#FF007A]/10 text-[#FF007A] text-[10px] px-2 py-1 rounded-full font-bold">$5 Wells</span>
        <span className="flex items-center text-[#00FFC2] font-bold text-xs ml-auto">
          <span className="material-icons-round text-sm mr-0.5">star</span>4.6
        </span>
      </div>
    ),
  },
  {
    id: 4,
    name: "Radio Star Karaoke",
    designation: "Hell's Kitchen",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    content: (
      <div className="flex items-center gap-2">
        <span className="bg-[#00FFC2]/10 text-[#00FFC2] text-[10px] px-2 py-1 rounded-full font-bold">Private Rooms</span>
        <span className="bg-[#FF007A]/10 text-[#FF007A] text-[10px] px-2 py-1 rounded-full font-bold">Late Night</span>
        <span className="flex items-center text-[#00FFC2] font-bold text-xs ml-auto">
          <span className="material-icons-round text-sm mr-0.5">star</span>4.7
        </span>
      </div>
    ),
  },
];

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

export default function HomePage() {
  const scrollRef = useScrollReveal();

  return (
    <div ref={scrollRef} className="min-h-screen bg-bg-dark overflow-x-hidden">
      <TopNav />

      {/* ─── HERO SECTION ─── */}
      <section className="relative h-[100vh] min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background video-style image */}
        <img
          alt="Neon lit karaoke venue"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
          src={sponsoredKJ.image}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/70 via-bg-dark/80 to-bg-dark" />

        {/* Subtle floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white/15 rounded-full"
              style={{
                left: `${10 + i * 10}%`,
                top: `${15 + (i * 9) % 70}%`,
                animation: `float ${4 + i * 0.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
          {/* Logo — transparent PNG */}
          <div className="mb-8 animate-[fadeSlideUp_1s_ease-out_0.2s_both]">
            <img
              src="/logo.png"
              alt="Karaoke Times"
              className="w-72 md:w-96 h-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:drop-shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-500 hover:scale-[1.03]"
            />
          </div>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-text-secondary tracking-wide mb-8 max-w-md animate-[fadeSlideUp_0.8s_ease-out_0.6s_both]">
            Discover the best karaoke spots, live events, and KJs across New York City.
          </p>

          {/* Search bar hero */}
          <div className="w-full max-w-lg mb-6 animate-[fadeSlideUp_0.8s_ease-out_0.8s_both]">
            <Link href="/search" className="flex items-center gap-3 glass-card rounded-full px-6 py-4 hover:border-primary/30 transition-all group cursor-pointer">
              <span className="material-icons-round text-text-muted group-hover:text-primary transition-colors">search</span>
              <span className="text-text-muted text-sm flex-grow text-left">Search venues, songs, or KJs...</span>
              <span className="bg-primary text-black text-xs font-bold px-4 py-1.5 rounded-full">Go</span>
            </Link>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-3 animate-[fadeSlideUp_0.8s_ease-out_1s_both]">
            <Link href="/map" className="inline-flex items-center gap-1.5 text-text-secondary text-sm hover:text-primary transition-colors">
              <span className="material-icons-round text-base">map</span>
              Map View
            </Link>
            <span className="text-border">|</span>
            <Link href="/add-event" className="inline-flex items-center gap-1.5 text-text-secondary text-sm hover:text-primary transition-colors">
              <span className="material-icons-round text-base">event</span>
              Post Event
            </Link>
            <span className="text-border">|</span>
            <Link href="/favorites" className="inline-flex items-center gap-1.5 text-text-secondary text-sm hover:text-primary transition-colors">
              <span className="material-icons-round text-base">favorite_border</span>
              Favorites
            </Link>
          </div>

          {/* Sponsored KJ — minimal pill */}
          <div className="mt-12 animate-[fadeSlideUp_0.8s_ease-out_1.2s_both]">
            <Link href="/venue/neon-echo-lounge" className="inline-flex items-center gap-2 text-text-muted text-xs hover:text-white transition-colors">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              <span>Live Now: <span className="text-white font-medium">{sponsoredKJ.name}</span> at {sponsoredKJ.venue}</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <span className="material-icons-round text-text-muted/50 text-2xl">expand_more</span>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <p className="reveal text-primary text-2xl mb-2 neon-glow-green" style={{ fontFamily: "var(--font-script)" }}>
            NYC&apos;s #1 Directory
          </p>
          <h2 className="reveal text-3xl md:text-4xl font-extrabold text-white mb-6 uppercase tracking-tight">
            About Karaoke Times
          </h2>
          <p className="reveal text-text-secondary leading-relaxed max-w-2xl mx-auto mb-8">
            Your ultimate guide to the karaoke scene in New York City. Discover live venues, find your
            favorite songs, connect with KJs, and never miss a karaoke night again. From Koreatown to
            the East Village, we&apos;ve got every mic in the city covered.
          </p>
          <Link
            href="/search"
            className="reveal inline-flex items-center gap-2 border border-primary text-primary font-semibold px-8 py-3 rounded-full hover:bg-primary/10 transition-colors"
          >
            Explore Venues
          </Link>
        </div>
      </section>

      {/* ─── FEATURED VENUES CARD STACK ─── */}
      <section className="py-20 md:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            {/* Left: Text */}
            <div className="flex-1 text-center md:text-left">
              <p className="reveal text-accent text-2xl mb-2 neon-glow-pink" style={{ fontFamily: "var(--font-script)" }}>
                Swipe &amp; Discover
              </p>
              <h2 className="reveal text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tight mb-6">
                Featured Bars<br />&amp; Clubs
              </h2>
              <p className="reveal text-text-secondary leading-relaxed mb-8 max-w-md">
                Swipe through the hottest karaoke spots in NYC. Each venue hand-picked
                for the best vibes, sound systems, and drink specials.
              </p>
              <Link
                href="/search"
                className="reveal inline-flex items-center gap-2 bg-primary text-black font-bold px-8 py-3.5 rounded-full hover:shadow-lg hover:shadow-primary/40 transition-all"
              >
                Explore All Venues
                <span className="material-icons-round">arrow_forward</span>
              </Link>
            </div>

            {/* Right: Card Stack */}
            <div className="reveal flex-shrink-0 flex items-center justify-center">
              <CardStack items={venueCards} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── VIDEO / PROMO SECTION ─── */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="reveal relative rounded-3xl overflow-hidden h-72 md:h-96">
            <img
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=70"
              alt="Karaoke venue interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-bg-dark/50" />
            <p className="absolute top-1/2 left-0 -translate-y-1/2 text-[6rem] md:text-[10rem] font-bold opacity-[0.06] text-white whitespace-nowrap pointer-events-none" style={{ fontFamily: "var(--font-script)" }}>
              Club Session
            </p>
            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-primary/60 flex items-center justify-center hover:bg-primary/20 transition-colors group">
              <span className="material-icons-round text-primary text-4xl group-hover:scale-110 transition-transform">play_arrow</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── LIVE NOW / FEATURED VENUES ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <p className="reveal text-accent text-2xl mb-2 neon-glow-pink" style={{ fontFamily: "var(--font-script)" }}>
              Active Mics
            </p>
            <h2 className="reveal text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
              Live Now in NYC
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {venues.map((venue, i) => (
              <Link
                key={venue.id}
                href={`/venue/${venue.id}`}
                className="reveal glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src={venue.image}
                  />
                  {venue.isLive && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent opacity-60" />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-white">{venue.name}</h4>
                    <span className="flex items-center text-primary font-bold text-xs">
                      <span className="material-icons-round text-sm mr-0.5">star</span>
                      {venue.rating}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mb-3">{venue.neighborhood}</p>
                  <div className="flex items-center gap-2">
                    {!venue.coverCharge ? (
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold">No Cover</span>
                    ) : (
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold">{venue.coverCharge}</span>
                    )}
                    {venue.hasDrinkSpecials && (
                      <span className="bg-accent/10 text-accent text-[10px] px-2 py-1 rounded-full font-bold">Drink Spec</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/map"
              className="reveal inline-flex items-center gap-2 border border-border text-text-secondary font-semibold px-8 py-3 rounded-full hover:text-primary hover:border-primary transition-colors"
            >
              <span className="material-icons-round">map</span>
              View All on Map
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SERVICES / WHAT WE OFFER ─── */}
      <section className="py-16 border-t border-b border-border">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: "mic", title: "Live Karaoke", desc: "Find venues with open mics happening right now" },
              { icon: "queue_music", title: "Song Search", desc: "Search by song and see which venues play it tonight" },
              { icon: "event", title: "Events", desc: "Themed karaoke nights, battles, and special events" },
              { icon: "local_bar", title: "Drink Specials", desc: "Happy hours and deals at karaoke bars near you" },
              { icon: "celebration", title: "Private Rooms", desc: "Book private karaoke rooms for your group" },
              { icon: "star", title: "KJ Spotlight", desc: "Discover top KJs and their upcoming shows" },
            ].map((service, i) => (
              <div key={i} className="reveal glass-card rounded-2xl p-6 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-icons-round text-primary text-2xl">{service.icon}</span>
                </div>
                <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-2">{service.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── UPCOMING EVENTS ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <p className="reveal text-primary text-2xl mb-2 neon-glow-green" style={{ fontFamily: "var(--font-script)" }}>
              Don&apos;t Miss Out
            </p>
            <h2 className="reveal text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
              Upcoming Parties
            </h2>
            <p className="reveal text-text-secondary mt-3 max-w-lg mx-auto">
              Themed nights, karaoke battles, and special events happening across NYC.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {events.map((event, i) => (
              <div
                key={event.id}
                className="reveal glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-72 h-48 md:h-auto relative overflow-hidden flex-shrink-0">
                    <img
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      src={event.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-dark/80 hidden md:block" />
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <p className="text-accent text-[11px] font-bold uppercase tracking-widest mb-2 neon-glow-pink">
                      {event.date}
                    </p>
                    <h3 className="text-xl font-extrabold text-white mb-2">{event.title}</h3>
                    <p className="text-sm text-text-secondary mb-4">
                      {event.venue} &bull; {event.time}
                    </p>
                    <button className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline w-fit">
                      Get Tickets
                      <span className="material-icons-round text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-10">
            <p className="reveal text-primary text-3xl mb-1" style={{ fontFamily: "var(--font-script)" }}>
              Karaoke
            </p>
            <h2 className="reveal text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
              Gallery
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=70",
              "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=70",
              "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400&q=70",
              "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=400&q=70",
              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=70",
              "https://images.unsplash.com/photo-1571266028243-3716f02d2d74?w=400&q=70",
              "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&q=70",
              "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&q=70",
            ].map((src, i) => (
              <div key={i} className="reveal aspect-square rounded-xl overflow-hidden group cursor-pointer">
                <img
                  src={src}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-100"
                />
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
              <img src="/logo.png" alt="Karaoke Times" className="h-8 w-auto" />
            </div>
            <p className="text-text-muted text-sm">
              &copy; 2026 Karaoke Times NYC. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-text-muted text-xs hover:text-primary cursor-pointer transition-colors">Terms</span>
              <span className="text-text-muted text-xs hover:text-primary cursor-pointer transition-colors">Privacy</span>
              <span className="text-text-muted text-xs hover:text-primary cursor-pointer transition-colors">Contact</span>
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
