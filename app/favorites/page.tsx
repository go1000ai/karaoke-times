"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface FavoriteVenue {
  id: string;
  venue_id: string;
  venues: {
    id: string;
    name: string;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("favorites")
      .select("id, venue_id, venues(id, name, address, neighborhood, city, state)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setFavorites((data as unknown as FavoriteVenue[]) || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        <header className="pt-20 px-5 mb-6">
          <h1 className="text-2xl font-extrabold text-white">My Favorites</h1>
          <p className="text-sm text-text-secondary">Venues you&apos;ve saved</p>
        </header>

        {!user ? (
          <section className="px-5 py-20 text-center">
            <span className="material-icons-round text-6xl text-border mb-4">favorite_border</span>
            <p className="text-text-secondary text-sm mb-3">Sign in to save your favorite venues!</p>
            <Link href="/signin" className="text-primary text-sm font-semibold inline-block">
              Sign In
            </Link>
          </section>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length > 0 ? (
          <section className="px-5 space-y-3">
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                href={`/venue/${fav.venues.id}`}
                className="flex gap-4 glass-card p-4 rounded-2xl items-center hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-primary">mic</span>
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-sm text-white">{fav.venues.name}</h4>
                  <p className="text-xs text-text-secondary">
                    {fav.venues.neighborhood ? `${fav.venues.neighborhood}, ` : ""}
                    {fav.venues.city}
                  </p>
                </div>
                <span className="material-icons-round text-accent">favorite</span>
              </Link>
            ))}
          </section>
        ) : (
          <section className="px-5 py-20 text-center">
            <span className="material-icons-round text-6xl text-border mb-4">favorite_border</span>
            <p className="text-text-secondary text-sm">No favorites yet. Explore venues to save your picks!</p>
            <Link href="/" className="text-primary text-sm font-semibold mt-2 inline-block">
              Explore Venues
            </Link>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
