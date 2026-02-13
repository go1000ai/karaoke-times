"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import {
  karaokeEvents,
  searchKJs,
  getKJSlugForName,
  type KaraokeEvent,
  type KJProfile,
} from "@/lib/mock-data";
import { haversine, geocodeZip } from "@/lib/geo";

const RADIUS_OPTIONS = [1, 3, 5, 10, 25];

type VenueWithDistance = KaraokeEvent & { distance?: number };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(5);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchFilter, setSearchFilter] = useState<"all" | "kjs" | "venues">("all");
  const [zipError, setZipError] = useState("");

  // --- Text search ---
  const q = query.toLowerCase().trim();
  let venueResults: VenueWithDistance[] =
    q.length > 0
      ? karaokeEvents.filter(
          (e) =>
            e.venueName.toLowerCase().includes(q) ||
            e.eventName.toLowerCase().includes(q) ||
            e.neighborhood.toLowerCase().includes(q) ||
            e.city.toLowerCase().includes(q) ||
            e.dj.toLowerCase().includes(q) ||
            e.address.toLowerCase().includes(q) ||
            e.dayOfWeek.toLowerCase().includes(q) ||
            e.notes.toLowerCase().includes(q)
        )
      : searchCenter
        ? [...karaokeEvents]
        : [];

  // --- KJ search ---
  const kjResults: KJProfile[] = q.length >= 2 ? searchKJs(query) : [];

  // --- Zip + radius filter ---
  if (searchCenter) {
    venueResults = venueResults
      .filter((e) => e.latitude && e.longitude)
      .map((e) => ({
        ...e,
        distance: haversine(searchCenter.lat, searchCenter.lng, e.latitude!, e.longitude!),
      }))
      .filter((e) => e.distance! <= radius)
      .sort((a, b) => a.distance! - b.distance!);
  }

  const hasResults = venueResults.length > 0 || kjResults.length > 0;
  const hasInput = q.length > 0 || !!searchCenter;

  async function handleZipSearch() {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setZipError("Enter a valid 5-digit zip code");
      return;
    }
    setZipError("");
    setIsGeocoding(true);
    const result = await geocodeZip(trimmed);
    setIsGeocoding(false);
    if (result) {
      setSearchCenter({ lat: result.latitude, lng: result.longitude });
    } else {
      setZipError("Could not find that zip code");
    }
  }

  function clearZip() {
    setZip("");
    setSearchCenter(null);
    setZipError("");
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="pt-20 px-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <span className="material-icons-round text-white">arrow_back</span>
            </Link>
            <h1 className="text-xl font-extrabold text-white">Search</h1>
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search venues, KJs, or neighborhoods..."
              className="w-full bg-card-dark border border-border rounded-2xl py-3.5 pl-12 pr-24 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="w-6 h-6 bg-border rounded-full flex items-center justify-center"
                >
                  <span className="material-icons-round text-sm text-text-secondary">close</span>
                </button>
              )}
              {query ? (
                <span className="bg-primary text-black text-xs font-bold px-4 py-1.5 rounded-full">
                  Go
                </span>
              ) : (
                <span className="bg-primary/40 text-black/60 text-xs font-bold px-4 py-1.5 rounded-full">
                  Go
                </span>
              )}
            </div>
          </div>

          {/* Zip + Radius Row */}
          <div className="flex items-center gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleZipSearch();
              }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                  location_on
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value.replace(/\D/g, ""));
                    setZipError("");
                  }}
                  placeholder="Zip code"
                  className="w-32 bg-card-dark border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
                />
              </div>
              <button
                type="submit"
                disabled={isGeocoding}
                className="bg-primary text-black text-xs font-bold px-3 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
              >
                {isGeocoding ? (
                  <span className="material-icons-round text-sm animate-spin">refresh</span>
                ) : (
                  <span className="material-icons-round text-sm">search</span>
                )}
              </button>
            </form>

            {searchCenter && (
              <button
                onClick={clearZip}
                className="text-text-muted text-xs font-bold hover:text-white transition-colors flex items-center gap-1"
              >
                <span className="material-icons-round text-sm">close</span>
                Clear
              </button>
            )}

            {/* Radius pills */}
            {searchCenter && (
              <div className="flex gap-1 ml-auto overflow-x-auto hide-scrollbar">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                      radius === r
                        ? "bg-primary text-black shadow-lg shadow-primary/30"
                        : "glass-card text-text-secondary hover:text-white hover:border-primary/30"
                    }`}
                  >
                    {r} mi
                  </button>
                ))}
              </div>
            )}
          </div>

          {zipError && (
            <p className="text-accent text-xs mt-2">{zipError}</p>
          )}
        </header>

        {/* Filter tabs */}
        {hasInput && hasResults && (
          <div className="flex gap-2 px-5 mb-4">
            {([
              { key: "all" as const, label: "All", count: venueResults.length + kjResults.length },
              { key: "kjs" as const, label: "KJs", count: kjResults.length },
              { key: "venues" as const, label: "Venues", count: venueResults.length },
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
        <div className="px-5">
          {!hasInput ? (
            /* Empty state — no search yet */
            <div className="text-center py-20">
              <span className="material-icons-round text-text-muted text-6xl mb-4 block">search</span>
              <p className="text-text-secondary text-lg mb-1">Find your next karaoke night</p>
              <p className="text-text-muted text-sm">Search by name, neighborhood, or enter a zip code for nearby venues</p>
            </div>
          ) : !hasResults ? (
            /* No results */
            <div className="text-center py-20">
              <span className="material-icons-round text-text-muted text-6xl mb-4 block">search_off</span>
              <p className="text-white font-semibold mb-1">No results</p>
              <p className="text-text-secondary text-sm">
                {searchCenter
                  ? `No venues found within ${radius} miles. Try a larger radius.`
                  : `Nothing found for \u201c${query}\u201d`}
              </p>
            </div>
          ) : (
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
              {venueResults.length > 0 && searchFilter !== "kjs" && (
                <div>
                  {searchFilter === "all" && (
                    <p className="text-xs uppercase tracking-wider text-primary font-bold mb-3 flex items-center gap-1.5">
                      <span className="material-icons-round text-sm">storefront</span>
                      Venues ({venueResults.length})
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {venueResults.map((event) => (
                      <Link
                        key={event.id}
                        href={`/venue/${event.id}`}
                        className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
                      >
                        <div className="flex gap-3 p-3">
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                            {event.image ? (
                              <img src={event.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <span className="material-icons-round text-primary text-2xl">mic</span>
                              </div>
                            )}
                            {event.distance !== undefined && (
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {event.distance < 0.1
                                  ? "<0.1 mi"
                                  : `${event.distance.toFixed(1)} mi`}
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
                              {event.dj && event.dj !== "Open" && (() => {
                                const kjSlug = getKJSlugForName(event.dj);
                                return kjSlug ? (
                                  <Link
                                    href={`/kj/${kjSlug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-accent font-bold truncate hover:underline"
                                  >
                                    {event.dj}
                                  </Link>
                                ) : (
                                  <span className="text-[10px] text-text-muted truncate">
                                    {event.dj}
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="text-[10px] text-text-muted mt-1 truncate">
                              {event.neighborhood || event.city}
                              {event.startTime ? ` \u2022 ${event.startTime}` : ""}
                              {event.endTime ? ` - ${event.endTime}` : ""}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View on Map CTA */}
        {hasResults && searchCenter && (
          <section className="px-5 mt-6">
            <Link
              href={`/map?zip=${zip}`}
              className="w-full bg-primary text-black font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all text-sm"
            >
              <span className="material-icons-round text-xl">map</span>
              View on Map
            </Link>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
