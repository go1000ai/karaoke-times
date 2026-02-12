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
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profiles: any;
  _event_count: number;
}

interface Owner {
  id: string;
  display_name: string | null;
}

export function VenuesList({
  venues: initialVenues,
  owners,
}: {
  venues: Venue[];
  owners: Owner[];
}) {
  const [venues, setVenues] = useState(initialVenues);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      v.neighborhood.toLowerCase().includes(search.toLowerCase())
  );

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
        setVenues((prev) =>
          prev.map((v) =>
            v.id === venueId
              ? { ...v, owner_id: ownerId || null }
              : v
          )
        );
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

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search venues by name, city, or neighborhood..."
          className="w-full bg-card-dark border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
        />
      </div>

      {/* Venues List */}
      <div className="space-y-3">
        {filteredVenues.map((venue) => (
          <div
            key={venue.id}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{venue.name}</h3>
                  <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                    {venue._event_count} events
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {venue.address} — {venue.neighborhood ? `${venue.neighborhood}, ` : ""}{venue.city}, {venue.state}
                </p>

                {/* Owner Assignment */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-text-muted">Owner:</span>
                  <select
                    value={venue.owner_id || ""}
                    onChange={(e) => handleOwnerChange(venue.id, e.target.value)}
                    disabled={isPending && processingId === venue.id}
                    className="text-xs bg-card-dark border border-border rounded-lg px-2 py-1 text-white disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.display_name || o.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
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
