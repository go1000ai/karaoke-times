"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import { venues } from "@/lib/mock-data";

export default function MapPage() {
  const [search, setSearch] = useState("");

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.neighborhood.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        <header className="pt-20 px-5 mb-6">
          <h1 className="text-2xl font-extrabold text-white">Venue Map</h1>
          <p className="text-sm text-text-secondary mb-4">
            {venues.length} venues across NYC and beyond
          </p>
          <div className="relative">
            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues, neighborhoods..."
              className="w-full bg-card-dark border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>
        </header>

        <section className="px-5 space-y-3">
          {filteredVenues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.id}`}
              className="block glass-card rounded-2xl p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-primary">
                    {venue.isPrivateRoom ? "meeting_room" : "mic"}
                  </span>
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-sm text-white">{venue.name}</h3>
                  <p className="text-xs text-text-secondary">
                    {venue.neighborhood ? `${venue.neighborhood}, ` : ""}
                    {venue.city}, {venue.state}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{venue.address}</p>
                </div>
                <span className="material-icons-round text-text-muted self-center">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}

          {filteredVenues.length === 0 && (
            <div className="text-center py-12">
              <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
              <p className="text-text-secondary text-sm">No venues match your search</p>
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
