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
      <section className="relative h-[90vh] min-h-[600px] flex items-end overflow-hidden">
        <img
          alt="KJ performing at a neon lit venue"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
          src={sponsoredKJ.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/60 to-transparent" />

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: `${15 + i * 15}%`,
                bottom: `${10 + i * 8}%`,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Decorative cursive text */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <p className="text-[8rem] md:text-[12rem] font-bold opacity-[0.04] text-white whitespace-nowrap" style={{ fontFamily: "var(--font-script)" }}>
            Karaoke Times
          </p>
        </div>

        {/* Play button */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <button className="w-20 h-20 rounded-full border-2 border-primary/60 flex items-center justify-center hover:bg-primary/20 transition-colors group animate-pulse">
            <span className="material-icons-round text-primary text-4xl group-hover:scale-110 transition-transform">play_arrow</span>
          </button>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 pb-16 md:pb-20 w-full">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4 animate-[fadeSlideUp_0.8s_ease-out_0.2s_both]">
            <span className="material-icons-round text-primary text-sm">star</span>
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Sponsored KJ of the Month</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-none mb-2 animate-[fadeSlideUp_0.8s_ease-out_0.4s_both]" style={{ fontFamily: "var(--font-script)" }}>
            {sponsoredKJ.name}
          </h1>
          <p className="text-xl md:text-2xl text-primary neon-glow-green font-semibold mb-4 animate-[fadeSlideUp_0.8s_ease-out_0.6s_both]" style={{ fontFamily: "var(--font-script)" }}>
            {sponsoredKJ.venue}
          </p>
          <div className="flex items-center gap-4 mb-6 animate-[fadeSlideUp_0.8s_ease-out_0.8s_both]">
            <span className="text-sm text-text-secondary flex items-center gap-1.5">
              <span className="material-icons-round text-lg">schedule</span>
              {sponsoredKJ.time}
            </span>
            <span className="text-sm text-accent flex items-center gap-1.5 neon-glow-pink">
              <span className="material-icons-round text-lg">local_fire_department</span>
              Trending
            </span>
          </div>
          <Link
            href="/venue/neon-echo-lounge"
            className="inline-flex items-center gap-2 bg-primary text-black font-bold px-8 py-3.5 rounded-full hover:shadow-lg hover:shadow-primary/40 transition-all animate-[fadeSlideUp_0.8s_ease-out_1s_both]"
          >
            View Venue
            <span className="material-icons-round">arrow_forward</span>
          </Link>

          {/* Navigation arrows */}
          <div className="absolute right-8 bottom-20 hidden md:flex gap-3">
            <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors">
              <span className="material-icons-round">chevron_left</span>
            </button>
            <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors">
              <span className="material-icons-round">chevron_right</span>
            </button>
          </div>
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
