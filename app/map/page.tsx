"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import { venues } from "@/lib/mock-data";

export default function MapPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const venue = selectedVenue ? venues.find((v) => v.id === selectedVenue) : null;

  return (
    <div className="min-h-screen pb-24">
      {/* Map Area */}
      <div className="relative h-[65vh] bg-bg">
        {/* Fake map background */}
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=50"
          alt="Map of NYC"
          className="w-full h-full object-cover opacity-60"
        />

        {/* Toggle */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20">
          <div className="flex bg-white rounded-full p-1 shadow-lg border border-border">
            <button
              onClick={() => setViewMode("map")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                viewMode === "map"
                  ? "bg-crimson text-white"
                  : "text-text-secondary"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-crimson text-white"
                  : "text-text-secondary"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="absolute top-28 left-5 right-5 z-20">
          <SearchBar placeholder="Search venues, songs, or neighborhoods" />
        </div>

        {/* Venue Pins */}
        {[
          { id: "space-karaoke", top: "40%", left: "35%", label: "Space Karaoke" },
          { id: "sing-sing-ave-a", top: "50%", left: "60%", label: "Sing Sing Ave A" },
          { id: "neon-echo-lounge", top: "55%", left: "40%", label: "Neon Echo Lounge" },
          { id: "baby-grand", top: "35%", left: "55%", label: "Baby Grand" },
        ].map((pin) => (
          <button
            key={pin.id}
            className="absolute z-10 flex flex-col items-center"
            style={{ top: pin.top, left: pin.left }}
            onClick={() => setSelectedVenue(pin.id === selectedVenue ? null : pin.id)}
          >
            <span
              className={`material-icons-round text-3xl transition-colors ${
                pin.id === selectedVenue ? "text-crimson" : "text-navy"
              }`}
            >
              location_on
            </span>
            <span className="bg-white/90 backdrop-blur-sm text-navy text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm mt-0.5">
              {pin.label}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Venue Card */}
      {venue && (
        <div className="px-5 -mt-6 relative z-20">
          <Link
            href={`/venue/${venue.id}`}
            className="block bg-white rounded-2xl p-4 shadow-lg border border-border"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-navy">{venue.name}</h3>
                <p className="text-xs text-text-secondary">{venue.neighborhood}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-gold text-xs font-bold">
                    <span className="material-icons-round text-sm mr-0.5">star</span>
                    {venue.rating}
                  </div>
                  <span className="text-xs text-text-secondary">{venue.priceRange}</span>
                  {venue.isLive && (
                    <span className="bg-crimson text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
              </div>
              <span className="material-icons-round text-text-muted self-center">
                chevron_right
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom Nav Label */}
      <div className="px-5 mt-4">
        <p className="text-xs text-text-secondary text-center">
          {venues.length} venues near you &bull; Tap a pin to see details
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
