"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const roles = [
  {
    id: "user",
    label: "Singer",
    icon: "mic",
    description: "Find karaoke nights, request songs, and join the queue.",
    color: "primary",
  },
  {
    id: "kj",
    label: "KJ (Karaoke Jockey)",
    icon: "headphones",
    description: "Manage song queues, events, and connect with venues.",
    color: "accent",
  },
  {
    id: "venue_owner",
    label: "Venue / Bar Owner",
    icon: "storefront",
    description: "List your venue, manage events, and invite KJs.",
    color: "accent",
  },
] as const;

type RoleId = (typeof roles)[number]["id"];

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<RoleId | null>(null);
  const [venueName, setVenueName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If not logged in, redirect to sign in
  if (!loading && !user) {
    router.push("/signin");
    return null;
  }

  const handleContinue = async () => {
    if (!selected || !user) return;
    setSubmitting(true);

    const supabase = createClient();

    // Update role in profiles
    await supabase
      .from("profiles")
      .update({ role: selected })
      .eq("id", user.id);

    // If venue owner, create their venue
    if (selected === "venue_owner" && venueName.trim()) {
      await supabase.from("venues").insert({
        owner_id: user.id,
        name: venueName.trim(),
        city: "New York",
        state: "New York",
      });
    }

    setSubmitting(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-bg-dark">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=60')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/80 via-bg-dark/60 to-bg-dark" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[30%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[20%] bg-accent/5 blur-[100px] rounded-full" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-md mx-auto py-12">
        {/* Logo */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="Karaoke Times"
            className="w-52 h-auto mb-4 drop-shadow-2xl"
          />
        </Link>

        <h1 className="text-xl font-bold text-white mb-1">Welcome!</h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          How will you be using Karaoke Times?
        </p>

        {/* Role cards */}
        <div className="w-full space-y-3 mb-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full flex items-center gap-4 rounded-2xl py-4 px-5 text-left transition-all border cursor-pointer ${
                selected === role.id
                  ? role.color === "accent"
                    ? "bg-accent/10 border-accent/40 ring-2 ring-accent/20"
                    : "bg-primary/10 border-primary/40 ring-2 ring-primary/20"
                  : "bg-card-dark border-border hover:border-white/20"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selected === role.id
                    ? role.color === "accent"
                      ? "bg-accent/20 text-accent"
                      : "bg-primary/20 text-primary"
                    : "bg-white/5 text-text-muted"
                }`}
              >
                <span className="material-icons-round text-xl">
                  {role.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold ${
                    selected === role.id ? "text-white" : "text-text-secondary"
                  }`}
                >
                  {role.label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {role.description}
                </p>
              </div>
              {/* Radio indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selected === role.id
                    ? role.color === "accent"
                      ? "border-accent bg-accent"
                      : "border-primary bg-primary"
                    : "border-text-muted"
                }`}
              >
                {selected === role.id && (
                  <span className="material-icons-round text-white text-sm">
                    check
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Venue name — shows when venue owner is selected */}
        {selected === "venue_owner" && (
          <input
            type="text"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Your venue / bar name"
            className="w-full bg-card-dark border border-accent/20 rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-text-muted mb-6"
          />
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected || submitting || (selected === "venue_owner" && !venueName.trim())}
          className={`w-full font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            selected === "venue_owner" || selected === "kj"
              ? "bg-accent text-white hover:shadow-accent/30"
              : "bg-primary text-black hover:shadow-primary/30"
          }`}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="material-icons-round text-xl">
                arrow_forward
              </span>
              Continue to Dashboard
            </>
          )}
        </button>

        <p className="text-[10px] text-text-muted mt-6 text-center">
          You can change your role anytime from your profile settings.
        </p>
      </div>
    </div>
  );
}
