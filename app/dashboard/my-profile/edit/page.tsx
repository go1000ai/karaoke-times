"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  social_links: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    facebook?: string;
  };
  featured_singer_opt_in: boolean;
  contest_opt_in: boolean;
}

export default function DashboardEditProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [featuredOptIn, setFeaturedOptIn] = useState(false);
  const [contestOptIn, setContestOptIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, address, phone, website, social_links, featured_singer_opt_in, contest_opt_in")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            ...data,
            social_links: data.social_links || {},
            featured_singer_opt_in: data.featured_singer_opt_in || false,
            contest_opt_in: data.contest_opt_in || false,
          } as ProfileData);
          setFeaturedOptIn(data.featured_singer_opt_in || false);
          setContestOptIn(data.contest_opt_in || false);
        }
      });
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);

    const rawLinks = {
      instagram: (form.get("instagram") as string)?.trim(),
      twitter: (form.get("twitter") as string)?.trim(),
      tiktok: (form.get("tiktok") as string)?.trim(),
      facebook: (form.get("facebook") as string)?.trim(),
    };
    const social_links = Object.fromEntries(
      Object.entries(rawLinks).filter(([, v]) => v)
    );

    const updateData: Record<string, unknown> = {
      display_name: (form.get("display_name") as string)?.trim() || null,
      address: (form.get("address") as string)?.trim() || null,
      phone: (form.get("phone") as string)?.trim() || null,
      website: (form.get("website") as string)?.trim() || null,
      social_links,
      featured_singer_opt_in: featuredOptIn,
      contest_opt_in: contestOptIn,
    };

    // Set agreed_at timestamps when opting in for the first time
    if (featuredOptIn && !profile?.featured_singer_opt_in) {
      updateData.featured_singer_agreed_at = new Date().toISOString();
    }
    if (contestOptIn && !profile?.contest_opt_in) {
      updateData.contest_agreed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    setSaving(false);
    setMessage(error ? error.message : "Saved!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const socialFields = [
    { name: "instagram", label: "Instagram", icon: "photo_camera", placeholder: "@handle or URL" },
    { name: "twitter", label: "Twitter / X", icon: "tag", placeholder: "@handle or URL" },
    { name: "tiktok", label: "TikTok", icon: "music_note", placeholder: "@handle or URL" },
    { name: "facebook", label: "Facebook", icon: "people", placeholder: "Profile URL" },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/my-profile"
        className="inline-flex items-center gap-1 text-text-muted hover:text-white transition-colors mb-6"
      >
        <span className="material-icons-round text-xl">arrow_back</span>
        <span className="text-sm">Back to Profile</span>
      </Link>

      <h1 className="text-2xl font-extrabold text-white mb-1">Edit Profile</h1>
      <p className="text-text-secondary text-sm mb-8">
        Update your personal information and social links.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="space-y-5">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Display Name
            </label>
            <input
              name="display_name"
              type="text"
              defaultValue={profile.display_name || ""}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white opacity-60 cursor-not-allowed"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Managed through your login provider
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-5">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Address
            </label>
            <input
              name="address"
              type="text"
              defaultValue={profile.address || ""}
              placeholder="City, State or full address"
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Phone Number
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={profile.phone || ""}
              placeholder="(555) 123-4567"
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Website
            </label>
            <input
              name="website"
              type="url"
              defaultValue={profile.website || ""}
              placeholder="https://yoursite.com"
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>
        </section>

        {/* Social Media */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-icons-round text-primary text-lg">share</span>
            Social Media
          </h3>
          {socialFields.map((field) => (
            <div key={field.name}>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span className="material-icons-round text-sm">{field.icon}</span>
                {field.label}
              </label>
              <input
                name={field.name}
                type="text"
                defaultValue={
                  (profile.social_links as Record<string, string | undefined>)?.[field.name] || ""
                }
                placeholder={field.placeholder}
                className="w-full bg-bg-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />
            </div>
          ))}
        </section>

        {/* Opportunities — Featured Singer & Contest Opt-In */}
        <section className="glass-card rounded-2xl p-5 space-y-4 border-yellow-400/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-icons-round text-yellow-400 text-lg">star</span>
            Opportunities
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Opt in to be featured on Karaoke Times and compete in singing contests.
            Read the full{" "}
            <Link href="/terms/featured-singer" className="text-primary hover:underline font-semibold" target="_blank">
              Terms &amp; Conditions
            </Link>{" "}
            before opting in.
          </p>

          {/* Featured Singer Opt-In */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={featuredOptIn}
                onChange={(e) => setFeaturedOptIn(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border-2 border-border bg-bg-dark peer-checked:bg-yellow-400 peer-checked:border-yellow-400 transition-all flex items-center justify-center">
                {featuredOptIn && (
                  <span className="material-icons-round text-black text-sm">check</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                I want to be a Featured Singer
              </p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Get featured on Karaoke Times, YouTube, and social media. Your performances, name,
                and likeness may be used for promotion across our platforms.
              </p>
            </div>
          </label>

          {/* Contest Opt-In */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={contestOptIn}
                onChange={(e) => setContestOptIn(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border-2 border-border bg-bg-dark peer-checked:bg-yellow-400 peer-checked:border-yellow-400 transition-all flex items-center justify-center">
                {contestOptIn && (
                  <span className="material-icons-round text-black text-sm">check</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                I want to join singing contests
              </p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Compete in borough-level, city-wide, and national singing contests. Winners get
                featured and promoted across all Karaoke Times platforms.
              </p>
            </div>
          </label>

          {(featuredOptIn || contestOptIn) && (
            <p className="text-[11px] text-yellow-400/70 flex items-start gap-1.5">
              <span className="material-icons-round text-xs mt-0.5">info</span>
              By saving, you agree to the{" "}
              <Link href="/terms/featured-singer" className="underline hover:text-yellow-400" target="_blank">
                Featured Singer &amp; Contest Terms
              </Link>.
            </p>
          )}
        </section>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-black font-bold text-sm px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {message && (
            <p
              className={`text-sm font-semibold ${
                message === "Saved!" ? "text-primary" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
