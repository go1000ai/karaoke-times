"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { karaokeEvents, type KaraokeEvent } from "@/lib/mock-data";

const FAVORITES_KEY = "kt-favorites";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
}

export default function DashboardFavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavoriteIds(loadFavorites());
    setLoaded(true);
  }, []);

  const removeFavorite = useCallback((eventId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      saveFavorites(next);
      return next;
    });
  }, []);

  const favoriteEvents: KaraokeEvent[] = karaokeEvents.filter((e) =>
    favoriteIds.has(e.id)
  );

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">My Favorite Venues</h1>
      <p className="text-sm text-text-secondary mb-6">
        {favoriteEvents.length > 0
          ? `${favoriteEvents.length} saved venue${favoriteEvents.length === 1 ? "" : "s"}`
          : "Venues you\u2019ve saved"}
      </p>

      {favoriteEvents.length > 0 ? (
        <div className="space-y-3">
          {favoriteEvents.map((event) => (
            <div
              key={event.id}
              className="flex gap-4 glass-card p-4 rounded-2xl items-center hover:border-primary/30 transition-all"
            >
              {/* Image */}
              <Link
                href={`/venue/${event.id}`}
                className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
              >
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.venueName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons-round text-primary text-2xl">mic</span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <Link href={`/venue/${event.id}`} className="flex-grow min-w-0">
                <h4 className="font-bold text-sm text-white">{event.venueName}</h4>
                <p className="text-xs text-accent font-bold uppercase tracking-wider">
                  {event.eventName}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {event.dayOfWeek} {event.startTime ? `at ${event.startTime}` : ""}
                  {event.neighborhood ? ` \u2022 ${event.neighborhood}` : ""}
                </p>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/dashboard/request-song?venue=${event.id}`}
                  className="bg-accent text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1 hover:shadow-lg hover:shadow-accent/20 transition-all"
                >
                  <span className="material-icons-round text-sm">queue_music</span>
                  Sing
                </Link>
                <button
                  onClick={() => removeFavorite(event.id)}
                  className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  title="Remove from favorites"
                >
                  <span className="material-icons-round text-red-400 text-lg">favorite</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-icons-round text-5xl text-border mb-4">
            favorite_border
          </span>
          <h2 className="text-base font-bold text-white mb-1">No favorites yet</h2>
          <p className="text-text-secondary text-sm mb-4">
            Explore venues and tap the heart to save your picks!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            <span className="material-icons-round text-lg">explore</span>
            Explore Venues
          </Link>
        </div>
      )}
    </div>
  );
}
