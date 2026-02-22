"use client";

import { useState, useTransition } from "react";
import { deleteVenue, assignVenueOwner } from "../actions";
import Link from "next/link";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  owner_id: string | null;
  is_private_room: boolean;
  queue_paused: boolean;
  accessibility: string | null;
  created_at: string;
  profiles: any;
  _event_count: number;
  _review_count: number;
  _avg_rating: string | null;
  _promo_count: number;
  _media_count: number;
}

interface Owner {
  id: string;
  display_name: string | null;
}

export function VenuesList({ venues: initialVenues, owners }: { venues: Venue[]; owners: Owner[] }) {
  const [venues, setVenues] = useState(initialVenues);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [accessFilter, setAccessFilter] = useState("");

  const filteredVenues = venues.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      v.neighborhood.toLowerCase().includes(search.toLowerCase());
    if (ownerFilter === "assigned" && !v.owner_id) return false;
    if (ownerFilter === "unassigned" && v.owner_id) return false;
    if (accessFilter === "unknown" && v.accessibility) return false;
    if (accessFilter && accessFilter !== "unknown" && v.accessibility !== accessFilter) return false;
    return matchesSearch;
  });

  function handleDelete(venueId: string, name: string) {
    if (!confirm(`Delete venue "${name}" and all its events? This cannot be undone.`)) return;
    setProcessingId(venueId);
    startTransition(async () => {
      const result = await deleteVenue(venueId);
      if (result.success) {
        setVenues((prev) => prev.filter((v) => v.id !== venueId));
      }
      setProcessingId(null);
    });
  }

  function handleOwnerChange(venueId: string, ownerId: string) {
    setProcessingId(venueId);
    startTransition(async () => {
      const result = await assignVenueOwner(venueId, ownerId || null);
      if (result.success) {
        setVenues((prev) => prev.map((v) => (v.id === venueId ? { ...v, owner_id: ownerId || null } : v)));
      }
      setProcessingId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Venues</h1>
          <p className="text-text-secondary text-sm">{venues.length} venues in database</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues by name, city, or neighborhood..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
          />
        </div>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value as typeof ownerFilter)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
        >
          <option value="all">All</option>
          <option value="assigned">Has Owner</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
        >
          <option value="">All Accessibility</option>
          <option value="full">Full Access</option>
          <option value="partial">Partial Access</option>
          <option value="none">No Access</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {/* Venues List */}
      <div className="space-y-3">
        {filteredVenues.map((venue) => (
          <div key={venue.id} className="glass-card rounded-2xl p-4 md:p-5">
            {/* Venue name + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-bold">{venue.name}</h3>
              {venue.is_private_room && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">Private Room</span>
              )}
              {venue.queue_paused && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Queue Paused</span>
              )}
              {venue.accessibility === "full" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 flex items-center gap-0.5">
                  <span className="material-icons-round text-[10px]">accessible</span>
                  Full
                </span>
              )}
              {venue.accessibility === "partial" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center gap-0.5">
                  <span className="material-icons-round text-[10px]">accessible</span>
                  Partial
                </span>
              )}
              {venue.accessibility === "none" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-0.5">
                  <span className="material-icons-round text-[10px]">not_accessible</span>
                  None
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {venue.address} — {venue.neighborhood ? `${venue.neighborhood}, ` : ""}{venue.city}, {venue.state}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                {venue._event_count} events
              </span>
              {venue._review_count > 0 && (
                <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-icons-round text-yellow-400 text-xs">star</span>
                  {venue._avg_rating} ({venue._review_count})
                </span>
              )}
              {venue._promo_count > 0 && (
                <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                  {venue._promo_count} promos
                </span>
              )}
              {venue._media_count > 0 && (
                <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                  {venue._media_count} media
                </span>
              )}
            </div>

            {/* Owner + Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20 flex-wrap">
              <span className="text-xs text-text-muted">Owner:</span>
              <select
                value={venue.owner_id || ""}
                onChange={(e) => handleOwnerChange(venue.id, e.target.value)}
                disabled={isPending && processingId === venue.id}
                className="text-xs bg-card-dark border border-border rounded-lg px-2 py-1 text-white disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.display_name || o.id.slice(0, 8)}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <Link
                  href={`/venue/${venue.id}`}
                  className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <span className="material-icons-round text-primary text-sm">visibility</span>
                </Link>
                <button
                  onClick={() => handleDelete(venue.id, venue.name)}
                  disabled={isPending && processingId === venue.id}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons-round text-red-400 text-sm">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredVenues.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No venues match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
