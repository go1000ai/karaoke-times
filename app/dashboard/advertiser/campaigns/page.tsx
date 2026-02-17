"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const PLACEMENT_TYPES = [
  { value: "kj_profile", label: "KJ Profile Page" },
  { value: "event_listing", label: "Event Listing" },
  { value: "tv_display", label: "TV Display" },
];

interface Campaign {
  id: string;
  placement_type: string;
  headline: string | null;
  body_text: string | null;
  image_url: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertiserId, setAdvertiserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function load() {
      // Get advertiser profile
      const { data: profile } = await supabase
        .from("advertiser_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (profile) {
        setAdvertiserId(profile.id);
        const { data } = await supabase
          .from("ad_placements")
          .select("*")
          .eq("advertiser_id", profile.id)
          .order("created_at", { ascending: false });
        setCampaigns(data || []);
      }
      setLoading(false);
    }

    load();
  }, [user, supabase]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!advertiserId) return;
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("ad_placements").insert({
      advertiser_id: advertiserId,
      placement_type: form.get("placement_type") as string,
      headline: (form.get("headline") as string) || null,
      body_text: (form.get("body_text") as string) || null,
      link_url: (form.get("link_url") as string) || null,
      start_date: (form.get("start_date") as string) || null,
      end_date: (form.get("end_date") as string) || null,
    });

    if (!error) {
      setShowForm(false);
      const { data } = await supabase
        .from("ad_placements")
        .select("*")
        .eq("advertiser_id", advertiserId)
        .order("created_at", { ascending: false });
      setCampaigns(data || []);
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("ad_placements").update({ is_active: !currentActive }).eq("id", id);
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!advertiserId) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <span className="material-icons-round text-4xl text-text-muted mb-3 block">business</span>
        <p className="text-text-secondary text-sm mb-4">Set up your company profile first before creating campaigns.</p>
        <a href="/dashboard/advertiser/profile" className="text-primary font-semibold text-sm hover:underline">
          Go to Company Profile
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Campaigns</h1>
          <p className="text-text-secondary text-sm">Create and manage your ad placements.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-1.5"
        >
          <span className="material-icons-round text-lg">add</span>
          New Campaign
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card rounded-2xl p-6 mb-8 space-y-4">
          <h3 className="text-sm font-bold text-white">New Ad Placement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Placement Type
              </label>
              <select
                name="placement_type"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {PLACEMENT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Headline
              </label>
              <input
                name="headline"
                type="text"
                placeholder="Ad headline"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Link URL
              </label>
              <input
                name="link_url"
                type="url"
                placeholder="https://..."
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                Start Date
              </label>
              <input
                name="start_date"
                type="date"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
                End Date
              </label>
              <input
                name="end_date"
                type="date"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              Body Text
            </label>
            <textarea
              name="body_text"
              rows={2}
              placeholder="Ad description..."
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Campaign"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-text-muted font-semibold text-sm px-6 py-2.5 rounded-xl hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {campaigns.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <span className="material-icons-round text-4xl text-text-muted mb-3 block">campaign</span>
          <p className="text-text-secondary text-sm">No campaigns yet. Create your first ad placement to start reaching KJs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className={`glass-card rounded-xl p-4 ${!c.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{c.headline || "Untitled Campaign"}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {c.placement_type.replace(/_/g, " ")}
                    {c.start_date && ` &middot; ${new Date(c.start_date).toLocaleDateString()}`}
                    {c.end_date && ` - ${new Date(c.end_date).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(c.id, c.is_active)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    c.is_active
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-card-dark text-text-muted hover:text-white"
                  }`}
                >
                  {c.is_active ? "Active" : "Paused"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
