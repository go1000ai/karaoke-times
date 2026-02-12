"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

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

      const { data: staffData } = await supabase
        .from("venue_staff")
        .select("*, profiles(display_name, id)")
        .eq("venue_id", venue.id)
        .order("invited_at");

      setStaff((staffData as unknown as StaffMember[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [user, supabase]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId || !user || !inviteEmail.trim()) return;

    setInviting(true);
    setError("");
    setMessage("");

    // Look up user by email
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name");

    // We need to find user by email — check auth.users via a different approach
    // Since we can't query auth.users from client, we'll look for a profile
    // that matches. For now, search by checking if the email exists as a user.

    // Use the admin lookup — but we're on client side. Let's try signing in check.
    // Actually the simplest approach: try to find the user in profiles by checking
    // if an account with that email exists. We'll use a server action for this.

    // For now, let's create the invite even if the user hasn't signed up yet.
    // We'll store the email and when they sign up, they'll see the invite.

    // Check if email already has an account
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
      // Refresh staff list
      const { data: staffData } = await supabase
        .from("venue_staff")
        .select("*, profiles(display_name, id)")
        .eq("venue_id", venueId)
        .order("invited_at");
      setStaff((staffData as unknown as StaffMember[]) || []);
    }
  };

  const handleRemove = async (staffId: string) => {
    await supabase.from("venue_staff").delete().eq("id", staffId);
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

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

      {/* Invite Form */}
      <div className="glass-card rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-icons-round text-accent">person_add</span>
          <h2 className="font-bold text-white">Connect a KJ</h2>
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
        {message && <p className="text-green-400 text-sm mt-2">{message}</p>}
        <p className="text-text-muted text-xs mt-3">
          The KJ needs to have a Karaoke Times account. They&apos;ll get access to manage your queue and TV display.
        </p>
      </div>

      {/* Staff List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white">Connected Staff</h2>
          <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">
            {staff.length}
          </span>
        </div>

        {staff.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-icons-round text-4xl text-text-muted mb-2">group</span>
            <p className="text-text-muted text-sm">No KJs connected yet. Invite one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <div key={member.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="material-icons-round text-accent">person</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {member.profiles?.display_name || "Invited KJ"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-accent font-bold uppercase">{member.role}</span>
                      {member.accepted_at ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-text-muted hover:text-red-400 transition-colors"
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
