"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { songSearchResults } from "@/lib/mock-data";

export default function SearchPage() {
  const [query, setQuery] = useState("Don't Stop Believin'");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const result = songSearchResults[0];

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <TopNav />
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="pt-12 px-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/home">
            <span className="material-icons-round text-navy">arrow_back</span>
          </Link>
          <h1 className="text-xl font-extrabold text-navy">Search Results</h1>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-border rounded-2xl py-3.5 pl-12 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30 focus:border-crimson shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-border rounded-full flex items-center justify-center"
            >
              <span className="material-icons-round text-sm text-text-secondary">close</span>
            </button>
          )}
        </div>
      </header>

      {/* Result Header */}
      <section className="px-5 mb-4">
        <div className="bg-navy/5 rounded-2xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase text-text-secondary tracking-wider font-semibold">
                Search Result
              </p>
              <h2 className="text-lg font-extrabold text-crimson">{result.song}</h2>
              <p className="text-sm text-text-secondary">{result.artist}</p>
            </div>
            <span className="text-xs text-text-secondary font-semibold">
              {result.venues.length} Venues
            </span>
          </div>
        </div>
      </section>

      {/* View Toggle */}
      <section className="px-5 mb-4">
        <div className="flex bg-bg rounded-2xl p-1 border border-border">
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${
              viewMode === "list"
                ? "bg-navy text-white shadow-sm"
                : "text-text-secondary"
            }`}
          >
            <span className="material-icons-round text-sm">format_list_bulleted</span>
            List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${
              viewMode === "map"
                ? "bg-navy text-white shadow-sm"
                : "text-text-secondary"
            }`}
          >
            <span className="material-icons-round text-sm">map</span>
            Map View
          </button>
        </div>
      </section>

      {/* Sort & Filter */}
      <div className="px-5 flex justify-between items-center mb-4">
        <p className="text-xs uppercase text-text-secondary tracking-wider font-semibold">
          Sorted by Proximity
        </p>
        <button className="text-xs text-crimson font-semibold flex items-center gap-1">
          Filters <span className="material-icons-round text-sm">tune</span>
        </button>
      </div>

      {/* Venue Results */}
      <section className="px-5 space-y-3">
        {result.venues.map((venue, i) => (
          <Link
            key={i}
            href="/venue/space-karaoke"
            className="flex gap-4 bg-white p-4 rounded-2xl items-center shadow-sm border border-border hover:shadow-md transition-shadow"
          >
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-navy/10">
              <img
                src={`https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&q=60&sig=${i}`}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-1 bg-navy/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {venue.distance}
              </div>
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-sm text-navy">{venue.name}</h4>
              {venue.available ? (
                <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="material-icons-round text-xs">check_circle</span>
                  {venue.waitTime || "Available Now"}
                </p>
              ) : (
                <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <span className="material-icons-round text-xs">radio_button_unchecked</span>
                  In Library
                </p>
              )}
              {venue.special && (
                <div className="mt-1.5 bg-crimson/10 text-crimson text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                  <span className="material-icons-round text-xs">local_bar</span>
                  {venue.special}
                </div>
              )}
              {!venue.special && (
                <div className="mt-1.5 bg-border/50 text-text-muted text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1">
                  <span className="material-icons-round text-xs">info</span>
                  No Specials Today
                </div>
              )}
            </div>
            <button className="flex-shrink-0 text-text-muted">
              <span className="material-icons-round">favorite_border</span>
            </button>
          </Link>
        ))}
      </section>

      {/* View on Map CTA */}
      <section className="px-5 mt-6">
        <Link
          href="/map"
          className="w-full bg-navy text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md"
        >
          <span className="material-icons-round">map</span>
          View on Map
        </Link>
      </section>

      </div>
      <BottomNav />
    </div>
  );
}
