"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/components/AuthProvider";
import { getKJBySlug, type KJProfile } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";

interface KJReview {
  id: string;
  rating: number;
  text: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

export default function KJProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const kj = getKJBySlug(slug);
  const { user } = useAuth();
  const [reviews, setReviews] = useState<KJReview[]>([]);

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();
    supabase
      .from("kj_reviews")
      .select("id, rating, text, is_anonymous, created_at, profiles(display_name)")
      .eq("kj_slug", slug)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data?.length) setReviews(data as unknown as KJReview[]);
      });
  }, [slug]);

  if (!kj) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons-round text-text-muted text-6xl mb-4 block">person_off</span>
          <h1 className="text-xl font-extrabold text-white mb-2">KJ Not Found</h1>
          <p className="text-text-secondary text-sm mb-6">This KJ profile doesn&apos;t exist.</p>
          <Link href="/" className="text-primary font-bold text-sm">Back to Home</Link>
        </div>
      </div>
    );
  }

  // Get unique venues
  const uniqueVenues = Array.from(
    new Map(kj.events.map((e) => [e.venueName, e])).values()
  );

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      {/* Header */}
      <header className="pt-20 px-5 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <span className="material-icons-round text-white">arrow_back</span>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-accent font-bold">KJ Profile</p>
        </div>

        {/* KJ Hero */}
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-round text-accent text-4xl">headphones</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">{kj.name}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-bold">
              <span className="material-icons-round text-sm">storefront</span>
              {kj.venueCount} {kj.venueCount === 1 ? "Venue" : "Venues"}
            </span>
            <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-3 py-1.5 rounded-full font-bold">
              <span className="material-icons-round text-sm">event</span>
              {kj.events.length} {kj.events.length === 1 ? "Night" : "Nights"} / Week
            </span>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <StarRating rating={Math.round(avgRating)} size="sm" />
              <span className="text-xs text-text-muted">
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Schedule */}
        <section className="px-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-round text-primary">calendar_today</span>
            <h2 className="font-bold text-white">Weekly Schedule</h2>
          </div>
          <div className="space-y-3">
            {kj.events.map((event, i) => (
              <Link
                key={`${event.venueId}-${i}`}
                href={`/venue/${event.venueId}`}
                className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  {event.image ? (
                    <img src={event.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="material-icons-round text-primary text-xl">mic</span>
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors">
                    {event.venueName}
                  </p>
                  <p className="text-accent text-xs font-bold uppercase tracking-wider truncate">
                    {event.eventName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {event.dayOfWeek}
                    </span>
                    <span className="text-text-muted text-xs">
                      {event.startTime}{event.endTime ? ` - ${event.endTime}` : ""}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5 truncate">
                    {event.neighborhood || event.city}
                  </p>
                </div>
                <span className="material-icons-round text-text-muted text-lg flex-shrink-0 group-hover:text-primary transition-colors">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Venues at a glance */}
        {uniqueVenues.length > 1 && (
          <section className="px-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-round text-accent">storefront</span>
              <h2 className="font-bold text-white">Venues</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {uniqueVenues.map((venue) => (
                <Link
                  key={venue.venueId}
                  href={`/venue/${venue.venueId}`}
                  className="glass-card rounded-xl p-3 hover:border-primary/30 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto mb-2">
                    {venue.image ? (
                      <img src={venue.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="material-icons-round text-primary">mic</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-bold truncate">{venue.venueName}</p>
                  <p className="text-text-muted text-[10px] truncate">{venue.neighborhood || venue.city}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-primary">rate_review</span>
              <h2 className="font-bold text-white">Reviews</h2>
              {reviews.length > 0 && (
                <span className="text-xs text-text-muted font-bold bg-white/5 px-2 py-0.5 rounded-full">
                  {reviews.length}
                </span>
              )}
            </div>
            {user ? (
              <Link href={`/kj/${slug}/review`} className="text-xs text-primary font-semibold">
                Leave a Review
              </Link>
            ) : (
              <Link href="/signin" className="text-xs text-text-muted font-semibold">
                Login to Review
              </Link>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3">
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
                  {review.text && (
                    <p className="text-sm text-text-secondary mt-2 leading-relaxed">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <span className="material-icons-round text-text-muted text-3xl mb-2 block">rate_review</span>
              <p className="text-text-muted text-sm">No reviews yet. Be the first to review this KJ!</p>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
