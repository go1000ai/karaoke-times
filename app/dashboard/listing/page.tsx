"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export default function ListingPage() {
  const { user } = useAuth();
  const [venue, setVenue] = useState<Record<string, string | boolean | null> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("venues")
      .select("*")
      .eq("owner_id", user.id)
      .single()
      .then(({ data }) => setVenue(data));
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!venue) return;
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("venues")
      .update({
        name: form.get("name"),
        address: form.get("address"),
        city: form.get("city"),
        state: form.get("state"),
        neighborhood: form.get("neighborhood"),
        cross_street: form.get("cross_street"),
        phone: form.get("phone"),
        website: (form.get("website") as string) || null,
        description: form.get("description"),
      })
      .eq("id", venue.id);

    setSaving(false);
    setMessage(error ? error.message : "Saved!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (!venue) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fields = [
    { name: "name", label: "Venue Name", type: "text" },
    { name: "address", label: "Address", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "state", label: "State", type: "text" },
    { name: "neighborhood", label: "Neighborhood", type: "text" },
    { name: "cross_street", label: "Cross Street", type: "text" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "website", label: "Website", type: "url" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Edit Listing</h1>
      <p className="text-text-secondary text-sm mb-8">Update your venue information visible to customers.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
              {field.label}
            </label>
            <input
              name={field.name}
              type={field.type}
              defaultValue={(venue[field.name] as string) || ""}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={(venue.description as string) || ""}
            placeholder="Tell customers about your venue, the vibe, specials..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-black font-bold text-sm px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
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
