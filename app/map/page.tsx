"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { venues } from "@/lib/mock-data";
import { haversine, geocodeZip } from "@/lib/geo";
import {
  Map,
  useMap,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from "@/components/ui/map";

const NYC_CENTER: [number, number] = [-73.935242, 40.730610];
const RADIUS_OPTIONS = [1, 3, 5, 10, 25, 50] as const;

type VenueWithDistance = (typeof venues)[number] & { distance?: number };

export default function MapPage() {
  return (
    <Suspense>
      <MapPageContent />
    </Suspense>
  );
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const initialZip = searchParams.get("zip") || "";
  const [search, setSearch] = useState("");
  const [zipCode, setZipCode] = useState(initialZip);
  const [radius, setRadius] = useState<number>(initialZip ? 50 : 5);
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const didAutoSearch = useRef(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // Store a flyTo callback that the inner MapController sets
  const flyToRef = useRef<
    ((opts: { center: [number, number]; zoom: number; duration: number }) => void) | null
  >(null);

  // Auto-search when arriving with ?zip= param (e.g. from home page)
  useEffect(() => {
    if (initialZip && /^\d{5}$/.test(initialZip) && !didAutoSearch.current) {
      didAutoSearch.current = true;
      (async () => {
        setIsGeocoding(true);
        const result = await geocodeZip(initialZip);
        if (result) {
          setSearchCenter({ lat: result.latitude, lng: result.longitude });
          flyToRef.current?.({
            center: [result.longitude, result.latitude],
            zoom: 9,
            duration: 1500,
          });
        }
        setIsGeocoding(false);
      })();
    }
  }, [initialZip]);

  // Filter venues by text search and optional radius
  const filteredVenues: VenueWithDistance[] = venues
    .map((v) => {
      let distance: number | undefined;
      if (searchCenter && v.latitude && v.longitude) {
        distance = haversine(
          searchCenter.lat,
          searchCenter.lng,
          v.latitude,
          v.longitude
        );
      }
      return { ...v, distance };
    })
    .filter((v) => {
      const matchesText =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.neighborhood.toLowerCase().includes(search.toLowerCase()) ||
        v.city.toLowerCase().includes(search.toLowerCase());
      const withinRadius =
        !searchCenter || (v.distance !== undefined && v.distance <= radius);
      return matchesText && withinRadius;
    })
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined)
        return a.distance - b.distance;
      return 0;
    });

  const mappableVenues = filteredVenues.filter(
    (v) => v.latitude !== null && v.longitude !== null
  );

  const handleZipSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) return;

    setIsGeocoding(true);
    setGeocodeError("");

    const result = await geocodeZip(zipCode.trim());
    if (result) {
      setSearchCenter({ lat: result.latitude, lng: result.longitude });
      const zoom =
        radius <= 1 ? 15 : radius <= 3 ? 13 : radius <= 5 ? 12 : radius <= 10 ? 11 : 10;
      flyToRef.current?.({
        center: [result.longitude, result.latitude],
        zoom,
        duration: 1500,
      });
    } else {
      setGeocodeError("Couldn't find that zip code. Try another.");
    }
    setIsGeocoding(false);
  };

  const handleClearSearch = () => {
    setZipCode("");
    setSearchCenter(null);
    setGeocodeError("");
    flyToRef.current?.({ center: NYC_CENTER, zoom: 10, duration: 1500 });
  };

  const handleLocate = useCallback(
    (coords: { longitude: number; latitude: number }) => {
      setUserLocation(coords);
    },
    []
  );

  const handleVenueClick = (venue: VenueWithDistance) => {
    if (venue.latitude && venue.longitude) {
      setSelectedVenueId(venue.id);
      flyToRef.current?.({
        center: [venue.longitude, venue.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark flex flex-col">
      {/* Map */}
      <div className="h-[45vh] md:h-[50vh] relative">
        <Map center={NYC_CENTER} zoom={10}>
          <MapController flyToRef={flyToRef} />
          <MapControls position="bottom-right" showZoom showLocate onLocate={handleLocate} />

          {userLocation && (
            <MapMarker longitude={userLocation.longitude} latitude={userLocation.latitude}>
              <MarkerContent className="z-10">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500 animate-ping opacity-40" />
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {mappableVenues.map((venue) => (
            <MapMarker
              key={venue.id}
              longitude={venue.longitude!}
              latitude={venue.latitude!}
              onClick={() =>
                setSelectedVenueId(selectedVenueId === venue.id ? null : venue.id)
              }
            >
              <MarkerContent>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    selectedVenueId === venue.id
                      ? "bg-primary scale-125"
                      : "bg-card-dark border border-primary/50 hover:border-primary"
                  }`}
                >
                  <span
                    className={`material-icons-round text-sm ${
                      selectedVenueId === venue.id ? "text-bg-dark" : "text-primary"
                    }`}
                  >
                    {venue.isPrivateRoom ? "meeting_room" : "mic"}
                  </span>
                </div>
              </MarkerContent>
              <MarkerPopup closeButton>
                <div className="min-w-[180px] bg-card-dark rounded-lg p-3">
                  <h3 className="font-bold text-sm text-white mb-1">{venue.name}</h3>
                  <p className="text-xs text-text-secondary mb-0.5">{venue.address}</p>
                  <p className="text-xs text-text-muted mb-2">
                    {venue.neighborhood ? `${venue.neighborhood}, ` : ""}
                    {venue.city}
                  </p>
                  {venue.distance !== undefined && (
                    <p className="text-xs text-primary mb-2">
                      {venue.distance.toFixed(1)} mi away
                    </p>
                  )}
                  <Link
                    href={`/venue/${venue.id}`}
                    className="block text-center text-xs font-semibold bg-primary text-bg-dark rounded-lg py-1.5 hover:bg-primary/90 transition-colors"
                  >
                    View venue
                  </Link>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>
      </div>

      {/* Search & List */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <header className="pt-5 px-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-extrabold text-white">Venue Map</h1>
              <p className="text-xs text-text-secondary">
                {filteredVenues.length} of {venues.length} venues
              </p>
            </div>
            {searchCenter && (
              <button
                onClick={handleClearSearch}
                className="text-xs text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>

          {/* Zip code + radius */}
          <form onSubmit={handleZipSearch} className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                location_on
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Zip code"
                className="w-full bg-card-dark border border-border rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />
            </div>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="bg-card-dark border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} mi
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isGeocoding || zipCode.length < 5}
              className="bg-primary text-bg-dark font-semibold rounded-xl px-4 py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGeocoding ? "..." : "Search"}
            </button>
          </form>
          {geocodeError && (
            <p className="text-xs text-red-400 mb-2">{geocodeError}</p>
          )}

          {/* Text filter */}
          <div className="relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, neighborhood..."
              className="w-full bg-card-dark/80 backdrop-blur-md border border-border rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>
        </header>

        <section className="px-5 space-y-2.5 pb-4">
          {filteredVenues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.id}`}
              className="block w-full text-left glass-card rounded-2xl p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-primary text-xl">
                    {venue.isPrivateRoom ? "meeting_room" : "mic"}
                  </span>
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-sm text-white">{venue.name}</h3>
                  <p className="text-xs text-text-secondary">
                    {venue.neighborhood ? `${venue.neighborhood}, ` : ""}
                    {venue.city}, {venue.state}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {venue.distance !== undefined && (
                    <span className="text-xs font-medium text-primary">
                      {venue.distance < 0.1
                        ? "<0.1 mi"
                        : `${venue.distance.toFixed(1)} mi`}
                    </span>
                  )}
                  <span className="text-text-muted">
                    <span className="material-icons-round text-lg">chevron_right</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {filteredVenues.length === 0 && (
            <div className="text-center py-12">
              <span className="material-icons-round text-4xl text-text-muted mb-2">
                search_off
              </span>
              <p className="text-text-secondary text-sm">
                No venues found{searchCenter ? " within this radius" : ""}
              </p>
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}

/**
 * Renders inside the Map component's context to capture the MapLibre instance.
 * Exposes flyTo to the parent via a ref.
 */
function MapController({
  flyToRef,
}: {
  flyToRef: React.RefObject<
    ((opts: { center: [number, number]; zoom: number; duration: number }) => void) | null
  >;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (map && isLoaded) {
      (flyToRef as React.MutableRefObject<typeof flyToRef.current>).current = (opts) =>
        map.flyTo(opts);
    }
    return () => {
      (flyToRef as React.MutableRefObject<typeof flyToRef.current>).current = null;
    };
  }, [map, isLoaded, flyToRef]);

  return null;
}
