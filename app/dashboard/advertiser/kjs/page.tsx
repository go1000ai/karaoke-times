"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { kjs } from "@/lib/mock-data";

export default function BrowseKJsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dbKJs, setDbKJs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function load() {
      // Load database-backed KJ profiles
      const { data } = await supabase
        .from("kj_profiles")
        .select("*")
        .eq("is_active", true)
        .order("stage_name");
      setDbKJs(data || []);
      setLoading(false);
    }

    load();
  }, [user, supabase]);

  // Combine DB KJ profiles with mock data KJs
  const allKJs = [
    ...dbKJs.map((kj) => ({
      slug: kj.slug,
      name: kj.stage_name,
      venueCount: 0,
      source: "db" as const,
      userId: kj.user_id,
    })),
    ...kjs
      .filter((kj) => !dbKJs.find((dk) => dk.slug === kj.slug))
      .map((kj) => ({
        slug: kj.slug,
        name: kj.name,
        venueCount: kj.venueCount,
        source: "mock" as const,
        userId: null,
      })),
  ];

  const filtered = searchQuery.length >= 2
    ? allKJs.filter((kj) => kj.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allKJs;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Browse KJs</h1>
      <p className="text-text-secondary text-sm mb-6">
        Find KJs to propose ad placements to. They'll see your proposal and can accept or decline.
      </p>

      <input
        type="text"
        placeholder="Search KJs by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((kj) => (
          <div key={kj.slug} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-round text-accent">headphones</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{kj.name}</p>
              <p className="text-xs text-text-muted">
                {kj.venueCount > 0 ? `${kj.venueCount} venue${kj.venueCount > 1 ? "s" : ""}` : "KJ"}
              </p>
            </div>
            <a
              href={`/kj/${kj.slug}`}
              target="_blank"
              className="text-xs font-semibold text-primary hover:underline flex-shrink-0"
            >
              View Profile
            </a>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-text-secondary text-sm">No KJs found matching your search.</p>
        </div>
      )}
    </div>
  );
}
