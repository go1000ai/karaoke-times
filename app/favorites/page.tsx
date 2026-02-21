"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { karaokeEvents, type KaraokeEvent } from "@/lib/mock-data";

const FAVORITES_KEY = "kt-favorites";

function loadLocalFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLocalFavorites(favs: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

interface SupabaseFavorite {
  id: string;
  venue_id: string;
  venues: {
    id: string;
    name: string;
    address: string | null;
    neighborhood: string | null;
    city: string;
    state: string;
  };
}

interface FavoriteItem {
  key: string;
  name: string;
  subtitle: string;
  detail: string;
  image: string | null;
  href: string;
  source: "local" | "supabase";
  sourceId: string;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [localFavIds, setLocalFavIds] = useState<Set<string>>(new Set());
  const [supabaseFavs, setSupabaseFavs] = useState<SupabaseFavorite[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLocalFavIds(loadLocalFavorites());

    if (user) {
      const supabase = createClient();
      supabase
        .from("favorites")
        .select("id, venue_id, venues(id, name, address, neighborhood, city, state)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setSupabaseFavs(data as unknown as SupabaseFavorite[]);
          setLoaded(true);
        });
    } else {
      setLoaded(true);
    }
  }, [user]);

  // Build unified list: localStorage mock events + Supabase venues (deduplicated by venue name)
  const allFavorites: FavoriteItem[] = [];
  const seenNames = new Set<string>();

  // Add Supabase favorites first (these are the "real" persistent ones)
  for (const fav of supabaseFavs) {
    if (!fav.venues) continue;
    const name = fav.venues.name.toLowerCase();
    seenNames.add(name);
    allFavorites.push({
      key: `sb-${fav.id}`,
      name: fav.venues.name,
      subtitle: "",
      detail: `${fav.venues.neighborhood ? `${fav.venues.neighborhood}, ` : ""}${fav.venues.city}`,
      image: null,
      href: `/venue/${fav.venues.id}`,
      source: "supabase",
      sourceId: fav.id,
    });
  }

  // Add localStorage mock-data favorites (skip if already in Supabase by name)
  const localEvents: KaraokeEvent[] = karaokeEvents.filter((e) => localFavIds.has(e.id));
  for (const event of localEvents) {
    const name = event.venueName.toLowerCase();
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    allFavorites.push({
      key: `local-${event.id}`,
      name: event.venueName,
      subtitle: event.eventName,
      detail: `${event.dayOfWeek}${event.startTime ? ` at ${event.startTime}` : ""}${event.neighborhood ? ` \u2022 ${event.neighborhood}` : ""}`,
      image: event.image || null,
      href: `/venue/${event.id}`,
      source: "local",
      sourceId: event.id,
    });
  }

  const removeFavorite = useCallback(async (item: FavoriteItem) => {
    if (item.source === "local") {
      setLocalFavIds((prev) => {
        const next = new Set(prev);
        next.delete(item.sourceId);
        saveLocalFavorites(next);
        return next;
      });
    } else if (item.source === "supabase" && user) {
      const supabase = createClient();
      await supabase.from("favorites").delete().eq("id", item.sourceId);
      setSupabaseFavs((prev) => prev.filter((f) => f.id !== item.sourceId));
    }
  }, [user]);

  if (!loaded) {
    return (
      <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        <header className="pt-20 px-5 mb-6">
          <h1 className="text-2xl font-extrabold text-white">My Favorites</h1>
          <p className="text-sm text-text-secondary">
            {allFavorites.length > 0
              ? `${allFavorites.length} saved venue${allFavorites.length === 1 ? "" : "s"}`
              : "Venues you\u2019ve saved"}
          </p>
        </header>

        {allFavorites.length > 0 ? (
          <section className="px-5 space-y-3">
            {allFavorites.map((item) => (
              <div
                key={item.key}
                className="flex gap-4 glass-card p-4 rounded-2xl items-center hover:border-primary/30 transition-all"
              >
                <Link
                  href={item.href}
                  className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="material-icons-round text-primary text-2xl">mic</span>
                    </div>
                  )}
                </Link>

                <Link href={item.href} className="flex-grow min-w-0">
                  <h4 className="font-bold text-sm text-white">{item.name}</h4>
                  {item.subtitle && (
                    <p className="text-xs text-accent font-bold uppercase tracking-wider">
                      {item.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-text-muted mt-0.5">{item.detail}</p>
                </Link>

                <button
                  onClick={() => removeFavorite(item)}
                  className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
                  title="Remove from favorites"
                >
                  <span className="material-icons-round text-red-400 text-lg">favorite</span>
                </button>
              </div>
            ))}
          </section>
        ) : (
          <section className="px-5 py-20 text-center">
            <span className="material-icons-round text-6xl text-border mb-4">favorite_border</span>
            <h2 className="text-base font-bold text-white mb-1">No favorites yet</h2>
            <p className="text-text-secondary text-sm mb-4">
              Explore venues and tap the heart to save your picks!
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              <span className="material-icons-round text-lg">map</span>
              View Map
            </Link>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
