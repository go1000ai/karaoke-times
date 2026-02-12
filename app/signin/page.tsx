"use client";

import { Suspense, useState } from "react";
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

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(urlError ? "Sign in failed. Please try again." : "");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName || email.split("@")[0],
          },
        },
      });

      setSubmitting(false);
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setSubmitting(false);
      if (error) {
        setError(error.message);
      }
      // If successful, the onAuthStateChange in AuthProvider will redirect
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
        {/* Logo */}
        <img
          src="/logo.png"
          alt="Karaoke Times"
          className="w-64 h-auto mb-4 drop-shadow-2xl"
        />
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
          onClick={() => handleOAuthSignIn("apple")}
          className="w-full bg-white text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 mb-5 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="black" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.08 4.48-3.74 4.25z" />
          </svg>
          Continue with Apple
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-3 mb-5">
          {mode === "signup" && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
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
            disabled={submitting}
            className="w-full bg-primary text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              "Log In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

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

        {/* Business Access */}
        <div className="flex items-center gap-3 w-full mt-6 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted uppercase tracking-widest">Business Access</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={() => handleOAuthSignIn("google")}
          className="text-primary text-sm font-semibold flex items-center gap-2 hover:underline neon-glow-green cursor-pointer"
        >
          <span className="material-icons-round text-lg">star</span>
          KJ & Venue Owner Login
        </button>

        <p className="text-[10px] text-text-muted mt-6 text-center leading-relaxed">
          By continuing, you agree to Karaoke Times&apos;{" "}
          <span className="underline">Terms of Service</span> and{" "}
          <span className="underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
