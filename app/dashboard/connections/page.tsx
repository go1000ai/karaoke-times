"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

interface VenueInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string;
}

interface StaffRecord {
  id: string;
  venue_id: string;
  user_id: string;
  role: string;
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  venues: VenueInfo;
}

interface SearchVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [activeConnections, setActiveConnections] = useState<StaffRecord[]>([]);
  const [pendingInvites, setPendingInvites] = useState<StaffRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchVenue[]>([]);
  const [searching, setSearching] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Check if user is an owner
    const { data: ownedVenue } = await supabase
      .from("venues")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (ownedVenue) {
      setIsOwner(true);
      setLoading(false);
      return;
    }

    // KJ: fetch all staff records for this user
    const { data: records } = await supabase
      .from("venue_staff")
      .select("id, venue_id, user_id, role, invited_by, invited_at, accepted_at, venues(id, name, address, city, neighborhood)")
      .eq("user_id", user.id)
      .order("invited_at", { ascending: false });

    const all = (records as unknown as StaffRecord[]) ?? [];

    setActiveConnections(all.filter((r) => r.accepted_at));
    setPendingInvites(all.filter((r) => !r.accepted_at && r.invited_by !== user.id));
    setPendingRequests(all.filter((r) => !r.accepted_at && r.invited_by === user.id));
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounced venue search
  const searchVenues = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("venues")
      .select("id, name, address, city, neighborhood")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(8);
    setSearchResults((data as SearchVenue[]) ?? []);
    setSearching(false);
  }, [supabase]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchVenues(value), 350);
  };

  // Request connection to a venue
  const handleRequest = async (venueId: string) => {
    setRequesting(venueId);
    setMessage("");
    const res = await fetch("/api/request-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId }),
    });
    const result = await res.json();
    setRequesting(null);

    if (res.ok) {
      setMessage(result.message);
      setSearchQuery("");
      setSearchResults([]);
      await fetchData();
    } else {
      setMessage(result.error || "Failed to send request.");
    }
    setTimeout(() => setMessage(""), 4000);
  };

  // Accept or reject an invite
  const handleRespond = async (staffId: string, action: "accept" | "reject") => {
    setResponding(staffId);
    const res = await fetch("/api/respond-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, action }),
    });
    const result = await res.json();
    setResponding(null);
    setMessage(result.message || result.error);
    setTimeout(() => setMessage(""), 4000);
    await fetchData();
  };

  // Cancel a pending request (KJ-initiated)
  const handleCancel = async (staffId: string) => {
    setResponding(staffId);
    await supabase.from("venue_staff").delete().eq("id", staffId);
    setResponding(null);
    setMessage("Request cancelled.");
    setTimeout(() => setMessage(""), 3000);
    await fetchData();
  };

  // Check if venue is already connected or pending
  const getVenueStatus = (venueId: string): "connected" | "pending" | null => {
    if (activeConnections.some((c) => c.venue_id === venueId)) return "connected";
    if (pendingInvites.some((c) => c.venue_id === venueId)) return "pending";
    if (pendingRequests.some((c) => c.venue_id === venueId)) return "pending";
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Owner view
  if (isOwner) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Your Venue</h1>
        <p className="text-text-secondary text-sm mb-8">
          You own this venue. Manage staff from the{" "}
          <Link href="/dashboard/staff" className="text-primary hover:underline">Staff & KJs</Link> page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Connections</h1>
      <p className="text-text-secondary text-sm mb-8">
        Search for venues and request connections, or manage invites from bar owners.
      </p>

      {/* Status message */}
      {message && (
        <div className="mb-6 glass-card rounded-xl p-3 text-center">
          <p className="text-sm font-semibold text-primary">{message}</p>
        </div>
      )}

      {/* Search for Venues */}
      <div className="glass-card rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-icons-round text-primary">search</span>
          <h2 className="font-bold text-white">Find a Venue</h2>
        </div>
        <div className="relative">
          <span className="material-icons-round text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">
            storefront
          </span>
          <input
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search by venue name..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 pl-11 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
            >
              <span className="material-icons-round text-lg">close</span>
            </button>
          )}
        </div>

        {searching && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((venue) => {
              const status = getVenueStatus(venue.id);
              return (
                <div key={venue.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-dark">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{venue.name}</p>
                    <p className="text-text-muted text-xs truncate">
                      {venue.address}{venue.neighborhood ? ` · ${venue.neighborhood}` : ""}{venue.city ? `, ${venue.city}` : ""}
                    </p>
                  </div>
                  {status === "connected" ? (
                    <span className="text-xs text-green-400 font-bold px-3 py-1.5 bg-green-400/10 rounded-lg flex-shrink-0">Connected</span>
                  ) : status === "pending" ? (
                    <span className="text-xs text-amber-400 font-bold px-3 py-1.5 bg-amber-400/10 rounded-lg flex-shrink-0">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleRequest(venue.id)}
                      disabled={requesting === venue.id}
                      className="text-xs text-primary font-bold px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {requesting === venue.id ? "Sending..." : "Request"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <p className="text-text-muted text-sm mt-3 text-center">No venues found for &ldquo;{searchQuery}&rdquo;</p>
        )}

        <p className="text-text-muted text-xs mt-3">
          Search for a bar or venue and request to connect as their KJ.
        </p>
      </div>

      {/* Pending Invites (from bar owners) */}
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-icons-round text-accent text-lg">mail</span>
            Pending Invites
            <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">{pendingInvites.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="glass-card rounded-xl p-4 border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-accent">storefront</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{invite.venues.name}</p>
                      <p className="text-text-muted text-xs truncate">
                        {invite.venues.address}{invite.venues.city ? `, ${invite.venues.city}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRespond(invite.id, "accept")}
                      disabled={responding === invite.id}
                      className="bg-primary text-black font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(invite.id, "reject")}
                      disabled={responding === invite.id}
                      className="bg-white/5 text-text-muted font-bold text-xs px-3 py-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Pending Requests (KJ-initiated, waiting for owner) */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-icons-round text-amber-400 text-lg">schedule</span>
            Pending Requests
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="glass-card rounded-xl p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-amber-400">storefront</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{req.venues.name}</p>
                      <p className="text-text-muted text-xs">Waiting for bar owner to accept</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={responding === req.id}
                    className="text-text-muted text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/5 hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Connections */}
      <div>
        <h2 className="font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-icons-round text-green-400 text-lg">check_circle</span>
          Active Connections
          <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">{activeConnections.length}</span>
        </h2>

        {activeConnections.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-icons-round text-4xl text-text-muted mb-2">hub</span>
            <p className="text-text-muted text-sm">No active connections yet. Search for a venue above or wait for an invite.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeConnections.map((conn) => (
              <div key={conn.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-primary">storefront</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-white text-sm truncate">{conn.venues.name}</p>
                    <p className="text-text-muted text-xs truncate">
                      {conn.venues.address}{conn.venues.neighborhood ? ` · ${conn.venues.neighborhood}` : ""}{conn.venues.city ? `, ${conn.venues.city}` : ""}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Connected {new Date(conn.accepted_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Link
                    href={`/venue/${conn.venue_id}`}
                    className="text-text-muted hover:text-primary transition-colors flex-shrink-0"
                  >
                    <span className="material-icons-round">open_in_new</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
