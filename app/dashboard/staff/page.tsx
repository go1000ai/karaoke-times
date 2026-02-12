"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  profiles: { display_name: string | null; id: string } | null;
}

export default function StaffPage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  const fetchStaff = useCallback(async (vid: string) => {
    const { data: staffData } = await supabase
      .from("venue_staff")
      .select("*, profiles(display_name, id)")
      .eq("venue_id", vid)
      .order("invited_at");
    setStaff((staffData as unknown as StaffMember[]) || []);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!venue) { setLoading(false); return; }
      setVenueId(venue.id);
      await fetchStaff(venue.id);
      setLoading(false);
    };

    fetchData();
  }, [user, supabase, fetchStaff]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId || !user || !inviteEmail.trim()) return;

    setInviting(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/invite-kj", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), venueId }),
    });

    const result = await response.json();
    setInviting(false);

    if (!response.ok) {
      setError(result.error || "Failed to send invite.");
    } else {
      setMessage(result.message || "Invite sent!");
      setInviteEmail("");
      fetchStaff(venueId);
    }
  };

  const handleRemove = async (staffId: string) => {
    await supabase.from("venue_staff").delete().eq("id", staffId);
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

  // Accept or reject a KJ's connection request
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
    if (venueId) fetchStaff(venueId);
  };

  // Derived lists
  const pendingKJRequests = staff.filter(
    (s) => !s.accepted_at && s.invited_by === s.user_id
  );
  const pendingOwnerInvites = staff.filter(
    (s) => !s.accepted_at && s.invited_by !== s.user_id
  );
  const activeStaff = staff.filter((s) => s.accepted_at);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Staff & KJs</h1>
      <p className="text-text-secondary text-sm mb-8">
        Connect a KJ to your venue. They&apos;ll get access to the song queue, TV display, and bar specials.
      </p>

      {/* Status message */}
      {message && (
        <div className="mb-6 glass-card rounded-xl p-3 text-center">
          <p className="text-sm font-semibold text-primary">{message}</p>
        </div>
      )}

      {/* Invite Form */}
      <div className="glass-card rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-icons-round text-accent">person_add</span>
          <h2 className="font-bold text-white">Invite a KJ</h2>
        </div>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => { setInviteEmail(e.target.value); setError(""); setMessage(""); }}
            placeholder="KJ's email address"
            required
            className="flex-1 bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={inviting}
            className="bg-accent text-white font-bold text-sm px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-accent/20 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {inviting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Invite"
            )}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <p className="text-text-muted text-xs mt-3">
          The KJ needs to have a Karaoke Times account. They&apos;ll receive an email and can accept from their dashboard.
        </p>
      </div>

      {/* Pending KJ Requests (KJ-initiated, waiting for owner to accept) */}
      {pendingKJRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-icons-round text-accent text-lg">person_add</span>
            KJ Requests
            <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">{pendingKJRequests.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingKJRequests.map((req) => (
              <div key={req.id} className="glass-card rounded-xl p-4 border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-accent">person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {req.profiles?.display_name || "KJ"}
                      </p>
                      <p className="text-text-muted text-xs">Wants to connect as your KJ</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRespond(req.id, "accept")}
                      disabled={responding === req.id}
                      className="bg-primary text-black font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, "reject")}
                      disabled={responding === req.id}
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

      {/* Pending Invites (owner-initiated, waiting for KJ to accept) */}
      {pendingOwnerInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-icons-round text-amber-400 text-lg">schedule</span>
            Pending Invites
          </h2>
          <div className="space-y-3">
            {pendingOwnerInvites.map((invite) => (
              <div key={invite.id} className="glass-card rounded-xl p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-amber-400">person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {invite.profiles?.display_name || "Invited KJ"}
                      </p>
                      <p className="text-text-muted text-xs">Waiting for them to accept</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(invite.id)}
                    className="text-text-muted text-xs font-bold px-3 py-2 rounded-lg hover:bg-white/5 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Staff */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white flex items-center gap-2">
            <span className="material-icons-round text-green-400 text-lg">check_circle</span>
            Connected Staff
          </h2>
          <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">
            {activeStaff.length}
          </span>
        </div>

        {activeStaff.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-icons-round text-4xl text-text-muted mb-2">group</span>
            <p className="text-text-muted text-sm">No KJs connected yet. Invite one above or wait for a KJ to request access.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeStaff.map((member) => (
              <div key={member.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons-round text-primary">person</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {member.profiles?.display_name || "KJ"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-accent font-bold uppercase">{member.role}</span>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Connected {new Date(member.accepted_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-text-muted hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <span className="material-icons-round">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What KJs Get */}
      <div className="mt-8 glass-card rounded-2xl p-5">
        <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">What your KJ gets access to</p>
        <div className="space-y-2.5">
          {[
            { icon: "queue_music", text: "Live song queue — see requests, manage the lineup" },
            { icon: "tv", text: "TV display — show the queue on bar screens" },
            { icon: "campaign", text: "Bar specials — display promotions on the TV" },
            { icon: "notifications", text: "Notifications — get alerts for new song requests" },
          ].map((feature) => (
            <div key={feature.icon} className="flex items-center gap-3">
              <span className="material-icons-round text-accent text-lg">{feature.icon}</span>
              <span className="text-sm text-text-secondary">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
