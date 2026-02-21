"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const defaultRole = searchParams.get("role"); // ?role=owner pre-selects owner toggle

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"user" | "kj" | "venue_owner">(
    defaultRole === "owner" ? "venue_owner" : "user"
  );
  const [venueName, setVenueName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(urlError ? "Sign in failed. Please try again." : "");
  const [success, setSuccess] = useState("");

  // After login, redirect based on role
  useEffect(() => {
    if (!loading && user) {
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          router.push(data?.role === "admin" ? "/admin" : "/dashboard");
        });
    }
  }, [user, loading, router]);

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName || email.split("@")[0],
            role: selectedRole,
          },
        },
      });

      if (signUpError) {
        setSubmitting(false);
        setError(signUpError.message);
        return;
      }

      // If email confirmation is disabled, user is immediately available
      if (data.user && data.session) {
        // Set role and display name in profiles table
        await supabase
          .from("profiles")
          .update({
            role: selectedRole,
            display_name: displayName || email.split("@")[0],
          })
          .eq("id", data.user.id);

        // Create venue for owners
        if (selectedRole === "venue_owner" && venueName.trim()) {
          await supabase.from("venues").insert({
            owner_id: data.user.id,
            name: venueName.trim(),
            city: "New York",
            state: "New York",
          });
        }

        setSubmitting(false);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        router.push(profileData?.role === "admin" ? "/admin" : "/dashboard");
      } else {
        setSubmitting(false);
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
        setPassword("");
      }
    } else {
      // Login
      const { error: loginError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setSubmitting(false);
        setError(loginError.message);
        return;
      }

      setSubmitting(false);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        router.push(profile?.role === "admin" ? "/admin" : "/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-bg-dark">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=60')",
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
        {/* Logo — links back to home */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="Karaoke Times"
            className="w-64 h-auto mb-4 drop-shadow-2xl hover:scale-105 transition-transform"
          />
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-2 neon-glow-green">
          New York City Edition
        </p>
        <p className="text-sm text-text-secondary text-center mb-8">
          The ultimate directory for singers, KJs, and nightlife enthusiasts.
        </p>

        {/* Error / Success Messages */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="w-full bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-4 text-center">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-3 mb-5">
          {mode === "signup" && (
            <>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />

              {/* Role selection */}
              <p className="text-xs text-text-muted uppercase tracking-wider font-bold pt-1">I am a...</p>
              <div className="space-y-2">
                {([
                  { id: "user" as const, label: "Singer", icon: "mic", desc: "Find karaoke nights & join the queue" },
                  { id: "kj" as const, label: "KJ (Karaoke Jockey)", icon: "headphones", desc: "Manage queues, events & connect with venues" },
                  { id: "venue_owner" as const, label: "Venue / Bar Owner", icon: "storefront", desc: "List your venue, manage events & invite KJs" },
                ]).map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl py-3 px-4 text-left transition-all border cursor-pointer ${
                      selectedRole === role.id
                        ? role.id === "user"
                          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                          : "bg-accent/10 border-accent/40 ring-1 ring-accent/20"
                        : "bg-card-dark border-border hover:border-white/20"
                    }`}
                  >
                    <span className={`material-icons-round text-lg ${
                      selectedRole === role.id
                        ? role.id === "user" ? "text-primary" : "text-accent"
                        : "text-text-muted"
                    }`}>{role.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${selectedRole === role.id ? "text-white" : "text-text-secondary"}`}>
                        {role.label}
                      </p>
                      <p className="text-[10px] text-text-muted">{role.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedRole === role.id
                        ? role.id === "user" ? "border-primary bg-primary" : "border-accent bg-accent"
                        : "border-text-muted"
                    }`}>
                      {selectedRole === role.id && (
                        <span className="material-icons-round text-white text-[10px]">check</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Venue name — shows when venue owner is selected */}
              {selectedRole === "venue_owner" && (
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Venue / Bar name"
                  className="w-full bg-card-dark border border-accent/20 rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-text-muted"
                />
              )}
            </>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="Email address"
            required
            className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Password"
            required
            minLength={6}
            className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={submitting || (mode === "signup" && selectedRole === "venue_owner" && !venueName.trim())}
            className={`w-full font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer ${
              mode === "signup" && selectedRole !== "user"
                ? "bg-accent text-white hover:shadow-accent/30"
                : "bg-primary text-black hover:shadow-primary/30"
            }`}
          >
            {submitting ? (
              <div className={`w-5 h-5 border-2 ${mode === "signup" && selectedRole !== "user" ? "border-white" : "border-black"} border-t-transparent rounded-full animate-spin`} />
            ) : mode === "login" ? (
              "Log In"
            ) : selectedRole === "venue_owner" ? (
              <>
                <span className="material-icons-round text-xl">rocket_launch</span>
                Create Business Account
              </>
            ) : selectedRole === "kj" ? (
              <>
                <span className="material-icons-round text-xl">headphones</span>
                Create KJ Account
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* OAuth Buttons */}
        <button
          onClick={() => handleOAuthSignIn("google")}
          className="w-full glass-card text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 mb-3 hover:border-primary/30 transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <button
          disabled
          className="w-full bg-white/30 text-white/40 font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 mb-5 cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.08 4.48-3.74 4.25z" />
          </svg>
          Continue with Apple — Coming Soon
        </button>

        {/* Toggle Login / Sign Up */}
        <p className="text-sm text-text-secondary">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                className="text-primary font-semibold hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="text-primary font-semibold hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </p>

        <p className="text-[10px] text-text-muted mt-6 text-center leading-relaxed">
          By continuing, you agree to Karaoke Times&apos;{" "}
          <a href="/terms" className="underline hover:text-primary transition-colors">Terms of Service</a> and{" "}
          <a href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
