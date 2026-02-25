"use client";

import { useState, useTransition } from "react";
import { deleteVenue, assignVenueOwner, updateVenue } from "../actions";
import Link from "next/link";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Venue>>({});

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

  function startEdit(venue: Venue) {
    setEditingId(venue.id);
    setEditForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      zip_code: venue.zip_code || "",
      neighborhood: venue.neighborhood,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function handleSaveEdit(venueId: string) {
    setProcessingId(venueId);
    startTransition(async () => {
      const result = await updateVenue(venueId, {
        name: editForm.name,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        zip_code: editForm.zip_code || "",
        neighborhood: editForm.neighborhood,
      });
      if (result.success) {
        setVenues((prev) =>
          prev.map((v) =>
            v.id === venueId
              ? { ...v, name: editForm.name || v.name, address: editForm.address || v.address, city: editForm.city || v.city, state: editForm.state || v.state, zip_code: editForm.zip_code || "", neighborhood: editForm.neighborhood || v.neighborhood }
              : v
          )
        );
        setEditingId(null);
        setEditForm({});
      }
      setProcessingId(null);
    });
  }

  const inputClass = "bg-card-dark border border-border rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted";

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
            {editingId === venue.id ? (
              /* ─── Edit Mode ─── */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Name</label>
                    <input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Address</label>
                    <input
                      value={editForm.address || ""}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">City</label>
                    <input
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">State</label>
                    <input
                      value={editForm.state || ""}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Zip Code</label>
                    <input
                      value={editForm.zip_code || ""}
                      onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })}
                      placeholder="e.g. 10001"
                      maxLength={5}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Neighborhood</label>
                    <input
                      value={editForm.neighborhood || ""}
                      onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSaveEdit(venue.id)}
                    disabled={isPending && processingId === venue.id}
                    className="px-4 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/80 transition-colors disabled:opacity-50"
                  >
                    {isPending && processingId === venue.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ─── View Mode ─── */
              <>
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
                  {venue.address} — {venue.neighborhood ? `${venue.neighborhood}, ` : ""}{venue.city}, {venue.state}{venue.zip_code ? ` ${venue.zip_code}` : ""}
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
                    <button
                      onClick={() => startEdit(venue)}
                      className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                      title="Edit venue"
                    >
                      <span className="material-icons-round text-blue-400 text-sm">edit</span>
                    </button>
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
              </>
            )}
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
