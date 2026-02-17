"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const GENRE_OPTIONS = [
  "Pop", "R&B", "Hip-Hop", "Rock", "Country", "Latin",
  "Jazz", "Soul", "Dance", "80s", "90s", "2000s", "Broadway", "K-Pop",
];

const EQUIPMENT_OPTIONS = [
  "VirtualDJ", "Karaoke Cloud Pro", "Laptop + Mixer", "Wireless Mics",
  "PA System", "Subwoofer", "Lighting Rig", "Fog Machine", "TV Display",
];

export default function KJProfileEditPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from("kj_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (data) {
        setProfile(data);
        setSelectedGenres(data.genres || []);
        setSelectedEquipment(data.equipment || []);
      }
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
    const stageName = form.get("stage_name") as string;
    const slug = (form.get("slug") as string)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const values = {
      stage_name: stageName,
      slug,
      bio: (form.get("bio") as string) || null,
      genres: selectedGenres.length > 0 ? selectedGenres : null,
      equipment: selectedEquipment.length > 0 ? selectedEquipment : null,
    };

    let error;
    if (profile) {
      ({ error } = await supabase
        .from("kj_profiles")
        .update(values)
        .eq("id", profile.id));
    } else {
      ({ error } = await supabase
        .from("kj_profiles")
        .insert({ ...values, user_id: user.id }));
    }

    setSaving(false);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        setMessage("That slug is already taken. Try a different one.");
      } else {
        setMessage(error.message);
      }
    } else {
      setMessage("Saved!");
      if (!profile) {
        // Reload to get the new profile
        const { data } = await supabase
          .from("kj_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (data) setProfile(data);
      }
    }
    setTimeout(() => setMessage(""), 4000);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
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
      <h1 className="text-2xl font-extrabold text-white mb-1">KJ Profile</h1>
      <p className="text-text-secondary text-sm mb-8">
        Set up your public KJ profile. This is how singers and venues will find you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Stage Name *
            </label>
            <input
              name="stage_name"
              type="text"
              required
              defaultValue={profile?.stage_name || ""}
              placeholder="DJ Mike, KJ Sarah, etc."
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Profile URL Slug *
            </label>
            <div className="flex items-center gap-0">
              <span className="bg-card-dark border border-r-0 border-border rounded-l-xl py-3 px-3 text-xs text-text-muted">
                /kj/
              </span>
              <input
                name="slug"
                type="text"
                required
                defaultValue={profile?.slug || ""}
                placeholder="dj-mike"
                className="flex-1 bg-card-dark border border-border rounded-r-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              Lowercase letters, numbers, and dashes only.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
            Bio
          </label>
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile?.bio || ""}
            placeholder="Tell people about yourself — your style, how long you've been KJing, what makes your nights special..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        {/* Genres */}
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
            Music Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                  selectedGenres.includes(genre)
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-card-dark text-text-muted border border-border hover:border-purple-500/20 hover:text-purple-400"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
            Equipment & Software
          </label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleEquipment(item)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                  selectedEquipment.includes(item)
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-card-dark text-text-muted border border-border hover:border-blue-500/20 hover:text-blue-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
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

      {/* Preview link */}
      {profile?.slug && (
        <div className="mt-8 glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Your Public Profile</p>
            <p className="text-sm text-primary font-semibold mt-0.5">
              karaoke-times.vercel.app/kj/{profile.slug}
            </p>
          </div>
          <a
            href={`/kj/${profile.slug}`}
            target="_blank"
            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
          >
            <span className="material-icons-round text-base">open_in_new</span>
            Preview
          </a>
        </div>
      )}
    </div>
  );
}
