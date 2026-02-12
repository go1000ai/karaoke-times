"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OwnerSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [venueName, setVenueName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/signin/owner");
    return null;
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim()) return;

    setSubmitting(true);
    setError("");
    const supabase = createClient();

    // Update profile to venue_owner role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: "venue_owner",
        display_name: displayName.trim() || user.user_metadata?.full_name || user.email?.split("@")[0],
      })
      .eq("id", user.id);

    if (profileError) {
      setSubmitting(false);
      setError("Failed to set up your account. Please try again.");
      return;
    }

    // Create venue
    const { error: venueError } = await supabase.from("venues").insert({
      owner_id: user.id,
      name: venueName.trim(),
      city: "New York",
      state: "New York",
    });

    setSubmitting(false);

    if (venueError) {
      setError("Failed to create venue. Please try again.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[30%] bg-accent/8 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/logo.png"
              alt="Karaoke Times"
              className="w-40 h-auto mx-auto mb-4 drop-shadow-2xl"
            />
          </Link>
          <div className="flex items-center justify-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4 mx-auto w-fit">
            <span className="material-icons-round text-accent text-sm">star</span>
            <span className="text-accent text-xs font-bold uppercase tracking-widest">Business Setup</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mb-2">Set Up Your Venue</h1>
          <p className="text-sm text-text-secondary">
            One more step — tell us about your venue to get started.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user.user_metadata?.full_name || "Your name"}
              className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Venue / Bar Name *
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Karaoke Duet 53"
              required
              className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-text-muted"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !venueName.trim()}
            className="w-full bg-accent text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-icons-round">rocket_launch</span>
                Launch My Dashboard
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center mt-6">
          You can add your address, photos, events, and more from the dashboard.
        </p>
      </div>
    </div>
  );
}
