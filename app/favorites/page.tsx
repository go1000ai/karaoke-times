import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { venues } from "@/lib/mock-data";

export default function FavoritesPage() {
  const favoriteVenues = venues.filter((v) => v.isFavorite);
  const allVenues = venues;

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
      <header className="pt-20 px-5 mb-6">
        <h1 className="text-2xl font-extrabold text-white">My Favorites</h1>
        <p className="text-sm text-text-secondary">Venues you&apos;ve saved</p>
      </header>

      {favoriteVenues.length > 0 ? (
        <section className="px-5 space-y-3">
          {allVenues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.id}`}
              className="flex gap-4 glass-card p-4 rounded-2xl items-center hover:border-primary/30 transition-all"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-sm text-white">{venue.name}</h4>
                <p className="text-xs text-text-secondary">{venue.neighborhood}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary text-xs font-bold flex items-center gap-0.5">
                    <span className="material-icons-round text-sm">star</span>
                    {venue.rating}
                  </span>
                  {venue.isLive && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
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
