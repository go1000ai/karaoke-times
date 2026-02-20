"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";
import QueueStatus from "@/components/QueueStatus";
import SongRequestModal from "@/components/SongRequestModal";
import { useAuth } from "@/components/AuthProvider";
import { venues, karaokeEvents } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { AddToCalendar } from "@/components/AddToCalendar";

interface FeaturedSpecial {
  id: string;
  name: string;
  price: number | null;
  category: string;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

interface SupabaseVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string | null;
  is_private_room: boolean;
}

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mockVenue = venues.find((v) => v.id === id);
  const venueEvents = mockVenue ? karaokeEvents.filter((e) => e.venueName === mockVenue.name) : [];
  const event = karaokeEvents.find((e) => e.id === id) || venueEvents[0];
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSongRequest, setShowSongRequest] = useState(false);
  const [specials, setSpecials] = useState<FeaturedSpecial[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dbVenue, setDbVenue] = useState<SupabaseVenue | null>(null);
  const [loading, setLoading] = useState(!mockVenue);

  // Resolved venue: mock data first, then Supabase fallback
  const venue = mockVenue || (dbVenue ? {
    id: dbVenue.id,
    name: dbVenue.name,
    address: dbVenue.address,
    city: dbVenue.city,
    state: dbVenue.state,
    neighborhood: dbVenue.neighborhood || "",
    image: null as string | null,
    isPrivateRoom: dbVenue.is_private_room,
    latitude: null as number | null,
    longitude: null as number | null,
  } : null);

  const phone = event?.phone || "";

  // Fetch venue from Supabase when not found in mock data
  useEffect(() => {
    if (mockVenue) return;
    const supabase = createClient();
    supabase
      .from("venues")
      .select("id, name, address, city, state, neighborhood, is_private_room")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setDbVenue(data as SupabaseVenue);
        setLoading(false);
      });
  }, [id, mockVenue]);

  // Fetch featured specials from POS
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("pos_menu_items")
      .select("id, name, price, category")
      .eq("venue_id", id)
      .eq("is_featured", true)
      .eq("is_available", true)
      .order("category")
      .then(({ data }) => {
        if (data?.length) setSpecials(data as FeaturedSpecial[]);
      });

    // Fetch reviews
    supabase
      .from("reviews")
      .select("id, rating, text, is_anonymous, created_at, profiles(display_name)")
      .eq("venue_id", id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data?.length) setReviews(data as unknown as Review[]);
      });

    // Check favorite status
    if (user) {
      supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("venue_id", id)
        .single()
        .then(({ data }) => {
          if (data) setIsFavorite(true);
        });
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) return;
    const supabase = createClient();
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("venue_id", id);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, venue_id: id });
      setIsFavorite(true);
    }
  };

  const handleDirections = () => {
    if (!venue) return;
    const address = encodeURIComponent(`${venue.address}, ${venue.city}, ${venue.state}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons-round text-4xl text-primary animate-pulse">mic</span>
          <p className="text-text-muted text-sm mt-2">Loading venue...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons-round text-4xl text-text-muted">search_off</span>
          <p className="text-white font-bold mt-2">Venue not found</p>
          <Link href="/" className="text-primary text-sm mt-2 inline-block">Back to Home</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-44 md:pb-24 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="relative h-56 mt-20 bg-gradient-to-br from-primary/20 via-card-dark to-accent/10 flex items-center justify-center">
          {venue.image ? (
            <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-icons-round text-6xl text-primary/30">mic</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/30 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
            >
              <span className="material-icons-round text-white">arrow_back</span>
            </button>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
                <span className="material-icons-round text-white">share</span>
              </button>
              <button
                onClick={toggleFavorite}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
              >
                <span className={`material-icons-round ${isFavorite ? "text-accent" : "text-white"}`}>
                  {isFavorite ? "favorite" : "favorite_border"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Venue Info */}
        <div className="px-5 -mt-6 relative z-10">
          <h1 className="text-2xl font-extrabold text-white">{venue.name}</h1>
          <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
            <span className="material-icons-round text-sm">location_on</span>
            {venue.neighborhood ? `${venue.neighborhood}, ` : ""}{venue.city}
          </p>
          {venue.isPrivateRoom && (
            <span className="inline-flex items-center gap-1 mt-2 bg-purple-500/10 text-purple-400 text-xs px-3 py-1 rounded-full font-bold">
              <span className="material-icons-round text-sm">door_sliding</span>
              Private Room
            </span>
          )}
        </div>

        {/* About / Event Info */}
        <section className="px-5 mt-5">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-round text-primary">info</span>
              <h3 className="font-bold text-white">About This Venue</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {event?.notes || `${venue.name} is a popular karaoke spot located in ${venue.city}. Come enjoy live karaoke and great vibes.`}
            </p>
            {event && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2.5 py-1 rounded-full font-bold">
                  <span className="material-icons-round text-xs">event</span>
                  {event.dayOfWeek}
                </span>
                {event.startTime && (
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2.5 py-1 rounded-full font-bold">
                    <span className="material-icons-round text-xs">schedule</span>
                    {event.startTime}{event.endTime ? ` - ${event.endTime}` : ""}
                  </span>
                )}
                {event.dj && event.dj !== "Open" && (
                  <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-[10px] px-2.5 py-1 rounded-full font-bold">
                    <span className="material-icons-round text-xs">headphones</span>
                    KJ: {event.dj}
                  </span>
                )}
                {event.startTime && (
                  <AddToCalendar
                    title={`${event.eventName || "Karaoke Night"} at ${venue.name}`}
                    venueId={venue.id}
                    venueName={venue.name}
                    description={`${event.dj && event.dj !== "Open" ? `KJ: ${event.dj}. ` : ""}${event.notes || ""}`}
                    location={`${venue.name}, ${venue.address || ""}, ${venue.city}`}
                    dayOfWeek={event.dayOfWeek}
                    startTime={event.startTime}
                    endTime={event.endTime || event.startTime}
                    compact
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* All Event Nights (if venue has multiple) */}
        {venueEvents.length > 1 && (
          <section className="px-5 mt-5">
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-round text-primary">calendar_month</span>
                <h3 className="font-bold text-white">Karaoke Schedule</h3>
              </div>
              <div className="space-y-2">
                {venueEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm text-white font-semibold">{ev.dayOfWeek}</p>
                      <p className="text-xs text-text-muted">{ev.eventName}{ev.dj && ev.dj !== "Open" ? ` — KJ: ${ev.dj}` : ""}</p>
                    </div>
                    <span className="text-xs text-text-secondary">{ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <section className="px-5 mt-5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDirections}
              className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-all"
            >
              <span className="material-icons-round text-primary text-2xl">directions</span>
              <span className="text-xs text-text-secondary font-semibold">Directions</span>
            </button>
            <a
              href={`tel:${phone}`}
              className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-all"
            >
              <span className="material-icons-round text-primary text-2xl">call</span>
              <span className="text-xs text-text-secondary font-semibold">Call</span>
            </a>
            {user ? (
              <button
                onClick={() => setShowSongRequest(true)}
                className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-accent/30 transition-all border-accent/20"
              >
                <span className="material-icons-round text-accent text-2xl">queue_music</span>
                <span className="text-xs text-accent font-semibold">Request Song</span>
              </button>
            ) : (
              <Link
                href="/signin"
                className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-all"
              >
                <span className="material-icons-round text-text-muted text-2xl">queue_music</span>
                <span className="text-xs text-text-muted font-semibold">Login to Sing</span>
              </Link>
            )}
          </div>
        </section>

        {/* Live Queue Status */}
        <section className="px-5 mt-5">
          <QueueStatus venueName={event?.venueName || venue.name} />
          <Link
            href={`/venue/${id}/queue`}
            className="mt-3 flex items-center justify-center gap-2 text-primary text-sm font-bold py-3 glass-card rounded-xl hover:bg-primary/5 transition-colors"
          >
            <span className="material-icons-round text-lg">queue_music</span>
            View Full Queue
            <span className="material-icons-round text-base">arrow_forward</span>
          </Link>
        </section>

        {/* Drink & Food Specials from POS */}
        {specials.length > 0 && (
          <section className="px-5 mt-5">
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-round text-orange-400">local_bar</span>
                <h3 className="font-bold text-white">Specials</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {specials.map((s) => (
                  <div key={s.id} className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3">
                    <p className="text-white text-sm font-semibold">{s.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-text-muted text-xs">{s.category}</span>
                      {s.price && (
                        <span className="text-orange-400 font-bold text-sm">${s.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Location & Directions */}
        <section className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-round text-accent">location_on</span>
            <h3 className="font-bold text-white">Location</h3>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4">
              <p className="text-sm text-white font-medium">{venue.address}</p>
              <p className="text-xs text-text-secondary mt-1">
                {venue.neighborhood ? `${venue.neighborhood}, ` : ""}{venue.city}, {venue.state}
              </p>
              {event?.crossStreet && (
                <p className="text-xs text-text-muted mt-0.5">Cross: {event.crossStreet}</p>
              )}
            </div>
            <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
              <button
                onClick={() => {
                  const addr = encodeURIComponent(`${venue.address}, ${venue.city}, ${venue.state}`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=driving`, "_blank");
                }}
                className="py-3 flex flex-col items-center gap-1 hover:bg-white/5 transition-colors"
              >
                <span className="material-icons-round text-primary text-lg">directions_car</span>
                <span className="text-[10px] text-text-muted">Drive</span>
              </button>
              <button
                onClick={() => {
                  const addr = encodeURIComponent(`${venue.address}, ${venue.city}, ${venue.state}`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=transit`, "_blank");
                }}
                className="py-3 flex flex-col items-center gap-1 hover:bg-white/5 transition-colors"
              >
                <span className="material-icons-round text-primary text-lg">directions_transit</span>
                <span className="text-[10px] text-text-muted">Transit</span>
              </button>
              <button
                onClick={() => {
                  const addr = encodeURIComponent(`${venue.address}, ${venue.city}, ${venue.state}`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=walking`, "_blank");
                }}
                className="py-3 flex flex-col items-center gap-1 hover:bg-white/5 transition-colors"
              >
                <span className="material-icons-round text-primary text-lg">directions_walk</span>
                <span className="text-[10px] text-text-muted">Walk</span>
              </button>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-primary">rate_review</span>
              <h3 className="font-bold text-white">Reviews</h3>
            </div>
            {user ? (
              <Link href={`/review/${venue.id}`} className="text-xs text-primary font-semibold">
                Leave a Review
              </Link>
            ) : (
              <Link href="/signin" className="text-xs text-text-muted font-semibold">
                Login to Review
              </Link>
            )}
          </div>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-icons-round text-primary text-sm">person</span>
                      </div>
                      <span className="font-semibold text-sm text-white">
                        {review.is_anonymous ? "Anonymous" : review.profiles?.display_name || "User"}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 text-center">
              <span className="material-icons-round text-3xl text-text-muted mb-2">rate_review</span>
              <p className="text-text-secondary text-sm">No reviews yet. Be the first!</p>
            </div>
          )}
        </section>

        {/* Report */}
        <section className="px-5 mt-6 mb-6">
          <p className="text-xs text-text-muted text-center mb-2">
            Something not right with this listing?
          </p>
          <button className="text-accent text-xs font-semibold flex items-center justify-center gap-1 w-full">
            <span className="material-icons-round text-sm">flag</span>
            Report a Problem
          </button>
        </section>

        {/* Bottom CTA */}
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-5 z-40 md:bottom-6">
          {user ? (
            <button
              onClick={() => setShowSongRequest(true)}
              className="w-full bg-accent text-white font-bold py-4 rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 hover:shadow-accent/40 transition-all"
            >
              <span className="material-icons-round">queue_music</span>
              Request a Song
            </button>
          ) : (
            <Link
              href="/signin"
              className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-primary/40 transition-all"
            >
              <span className="material-icons-round">login</span>
              Login to Request Songs
            </Link>
          )}
        </div>
      </div>

      {/* Song Request Modal */}
      {showSongRequest && (
        <SongRequestModal
          venueId={id}
          venueName={venue.name}
          onClose={() => setShowSongRequest(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
