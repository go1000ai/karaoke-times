"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES = [
  { value: "liquor_brand", label: "Liquor Brand" },
  { value: "microphone", label: "Microphone / Audio" },
  { value: "equipment", label: "DJ / Karaoke Equipment" },
  { value: "general", label: "General" },
];

export default function AdvertiserProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from("advertiser_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      setProfile(data);
      setLoading(false);
    }

    load();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const values = {
      company_name: form.get("company_name") as string,
      description: (form.get("description") as string) || null,
      website: (form.get("website") as string) || null,
      category: form.get("category") as string,
    };

    let error;
    if (profile) {
      ({ error } = await supabase
        .from("advertiser_profiles")
        .update(values)
        .eq("id", profile.id));
    } else {
      ({ error } = await supabase
        .from("advertiser_profiles")
        .insert({ ...values, user_id: user.id }));
    }

    setSaving(false);
    setMessage(error ? error.message : "Saved!");
    setTimeout(() => setMessage(""), 3000);
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
      <h1 className="text-2xl font-extrabold text-white mb-1">Company Profile</h1>
      <p className="text-text-secondary text-sm mb-8">
        Set up your advertiser profile. This information is shown to KJs when you propose ad placements.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
            Company Name
          </label>
          <input
            name="company_name"
            type="text"
            required
            defaultValue={profile?.company_name || ""}
            className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
            Category
          </label>
          <select
            name="category"
            defaultValue={profile?.category || "general"}
            className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
            Website
          </label>
          <input
            name="website"
            type="url"
            defaultValue={profile?.website || ""}
            placeholder="https://"
            className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={profile?.description || ""}
            placeholder="Tell KJs about your brand and products..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-black font-bold text-sm px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
          </button>
          {message && (
            <p className={`text-sm font-semibold ${message === "Saved!" ? "text-primary" : "text-red-400"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
