import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import { venues, events, sponsoredKJ } from "@/lib/mock-data";

export default function HomePage() {
  const liveVenues = venues.filter((v) => v.isLive);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="pt-12 px-5 flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-crimson font-bold">
            NYC Edition
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="text-navy">KARAOKE</span>
            <span className="text-crimson italic" style={{ fontFamily: "var(--font-script)" }}>
              TIMES
            </span>
          </h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-navy shadow-sm">
          <span className="material-icons-round">notifications</span>
        </button>
      </header>

      {/* Search */}
      <section className="px-5 mb-8">
        <SearchBar />
      </section>

      {/* Sponsored KJ Hero */}
      <section className="px-5 mb-10">
        <Link href="/venue/neon-echo-lounge" className="block">
          <div className="relative w-full h-56 rounded-3xl overflow-hidden group shadow-lg">
            <img
              alt="KJ performing at a neon lit venue"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src={sponsoredKJ.image}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
            <div className="absolute top-4 left-4 bg-gold text-navy text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <span className="material-icons-round text-xs">star</span> Sponsored
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-gold text-2xl mb-0" style={{ fontFamily: "var(--font-script)" }}>
                KJ of the Month
              </p>
              <h3 className="text-white text-xl font-bold leading-tight">
                Vibe with {sponsoredKJ.name} @ {sponsoredKJ.venue}
              </h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <span className="material-icons-round text-sm">schedule</span>{" "}
                  {sponsoredKJ.time}
                </span>
                {sponsoredKJ.isTrending && (
                  <span className="text-xs text-white/80 flex items-center gap-1">
                    <span className="material-icons-round text-sm text-crimson">
                      local_fire_department
                    </span>{" "}
                    Trending
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Live Now */}
      <section className="mb-10">
        <div className="px-5 flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Live Now</h2>
            <p className="text-xs text-text-secondary">Active mics in NYC right now</p>
          </div>
          <Link href="/map" className="text-xs font-semibold text-crimson uppercase tracking-wider">
            See Map
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto px-5 hide-scrollbar">
          {liveVenues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.id}`}
              className="min-w-[260px] bg-white rounded-2xl overflow-hidden shadow-md border border-border hover:shadow-lg transition-shadow"
            >
              <div className="h-32 relative">
                <img
                  alt={venue.name}
                  className="w-full h-full object-cover"
                  src={venue.image}
                />
                <div className="absolute top-3 right-3 bg-crimson text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-navy">{venue.name}</h4>
                    <p className="text-xs text-text-secondary">{venue.neighborhood}</p>
                  </div>
                  <div className="flex items-center text-gold font-bold text-xs">
                    <span className="material-icons-round text-sm mr-0.5">star</span>
                    {venue.rating}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {!venue.coverCharge && (
                    <span className="bg-navy/10 text-navy text-[10px] px-2 py-1 rounded-full font-bold">
                      No Cover
                    </span>
                  )}
                  {venue.coverCharge && (
                    <span className="bg-navy/10 text-navy text-[10px] px-2 py-1 rounded-full font-bold">
                      {venue.coverCharge}
                    </span>
                  )}
                  {venue.hasDrinkSpecials && (
                    <span className="bg-crimson/10 text-crimson text-[10px] px-2 py-1 rounded-full font-bold">
                      Drink Spec
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="px-5 mb-10">
        <h2 className="text-lg font-bold text-navy mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex gap-4 bg-white p-3 rounded-2xl items-center shadow-sm border border-border"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  alt={event.title}
                  className="w-full h-full object-cover"
                  src={event.image}
                />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[10px] text-crimson font-bold uppercase tracking-widest mb-0.5">
                  {event.date}
                </p>
                <h4 className="font-bold text-sm text-navy leading-tight truncate">
                  {event.title}
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  {event.venue} &bull; {event.time}
                </p>
              </div>
              <button className="w-8 h-8 rounded-full flex items-center justify-center bg-bg flex-shrink-0">
                <span className="material-icons-round text-sm text-navy">chevron_right</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Nearby Specials */}
      <section className="px-5 mb-10">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-navy">Nearby Specials</h2>
          <Link href="/search" className="text-xs text-crimson font-semibold underline">
            View All
          </Link>
        </div>
        <div className="relative h-40 rounded-2xl overflow-hidden border border-border shadow-sm">
          <div className="w-full h-full bg-bg flex items-center justify-center">
            <img
              alt="Map preview"
              className="w-full h-full object-cover opacity-40"
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=50"
            />
          </div>
          <div className="absolute inset-0 bg-navy/20" />
          <div className="absolute top-1/2 left-1/3">
            <span className="material-icons-round text-crimson text-3xl animate-bounce">
              location_on
            </span>
          </div>
          <div className="absolute top-1/4 right-1/4">
            <span className="material-icons-round text-crimson/50 text-2xl">location_on</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm py-2 px-3 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-crimson/10 flex items-center justify-center">
              <span className="material-icons-round text-crimson text-lg">local_bar</span>
            </div>
            <div>
              <p className="text-xs font-bold text-navy leading-none">2-for-1 Sake Bombs</p>
              <p className="text-[10px] text-text-secondary mt-0.5">
                MK Karaoke &bull; 0.3 miles away
              </p>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
