"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from "@/components/ui/map";
import { venues } from "@/lib/mock-data";

export default function MapPage() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        {/* Map Area */}
        <div className="relative h-[65vh]">
          {viewMode === "map" ? (
            <Map
              center={[-73.99, 40.73]}
              zoom={12}
              styles={{
                dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
              }}
            >
              <MapControls
                position="bottom-right"
                showZoom
                showLocate
                className="bottom-14 right-3"
              />

              {venues.map((venue) => (
                <MapMarker
                  key={venue.id}
                  longitude={venue.longitude}
                  latitude={venue.latitude}
                  onClick={() =>
                    setSelectedVenue(
                      venue.id === selectedVenue ? null : venue.id
                    )
                  }
                >
                  <MarkerContent>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                          venue.id === selectedVenue
                            ? "bg-primary scale-125 shadow-primary/50"
                            : "bg-accent shadow-accent/30"
                        }`}
                      >
                        <span className="material-icons-round text-white text-sm">
                          mic
                        </span>
                      </div>
                      <span className="glass-card text-white text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 whitespace-nowrap">
                        {venue.name}
                      </span>
                      {venue.isLive && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-dark animate-pulse" />
                      )}
                    </div>
                  </MarkerContent>

                  <MarkerPopup
                    className="!bg-card-dark !border-border !text-white !p-0 overflow-hidden rounded-xl w-64"
                    closeButton
                  >
                    <Link href={`/venue/${venue.id}`} className="block">
                      <div className="h-28 relative overflow-hidden">
                        <img
                          src={venue.image}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                        {venue.isLive && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <span className="w-1 h-1 bg-white rounded-full animate-pulse" />{" "}
                            LIVE
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent opacity-60" />
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-sm text-white">
                            {venue.name}
                          </h3>
                          <span className="flex items-center text-primary text-xs font-bold">
                            <span className="material-icons-round text-xs mr-0.5">
                              star
                            </span>
                            {venue.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {venue.neighborhood}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          {!venue.coverCharge ? (
                            <span className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold">
                              No Cover
                            </span>
                          ) : (
                            <span className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold">
                              {venue.coverCharge}
                            </span>
                          )}
                          {venue.hasDrinkSpecials && (
                            <span className="bg-accent/10 text-accent text-[9px] px-2 py-0.5 rounded-full font-bold">
                              Specials
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted ml-auto">
                            {venue.priceRange}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </MarkerPopup>
                </MapMarker>
              ))}
            </Map>
          ) : (
            /* List View */
            <div className="pt-20 px-5 space-y-3 overflow-y-auto h-full">
              {venues.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/venue/${venue.id}`}
                  className="block glass-card rounded-2xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={venue.image}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-white">{venue.name}</h3>
                      <p className="text-xs text-text-secondary">
                        {venue.neighborhood}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center text-primary text-xs font-bold">
                          <span className="material-icons-round text-sm mr-0.5">
                            star
                          </span>
                          {venue.rating}
                        </div>
                        <span className="text-xs text-text-secondary">
                          {venue.priceRange}
                        </span>
                        {venue.isLive && (
                          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <span className="w-1 h-1 bg-white rounded-full animate-pulse" />{" "}
                            LIVE
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="material-icons-round text-text-muted self-center">
                      chevron_right
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Toggle */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
            <div className="flex glass-card rounded-full p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  viewMode === "map"
                    ? "bg-primary text-black"
                    : "text-text-secondary"
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-black"
                    : "text-text-secondary"
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="absolute top-32 left-5 right-5 z-20">
            <SearchBar placeholder="Search venues, songs, or neighborhoods" />
          </div>
        </div>

        {/* Bottom label */}
        <div className="px-5 mt-4">
          <p className="text-xs text-text-secondary text-center">
            {venues.length} venues near you &bull; Tap a pin to see details
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
