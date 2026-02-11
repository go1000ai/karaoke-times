"use client";

import { use, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import StarRating from "@/components/StarRating";
import { venues, reviews } from "@/lib/mock-data";

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const venue = venues.find((v) => v.id === id) || venues[0];
  const [isFavorite, setIsFavorite] = useState(venue.isFavorite);

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <TopNav />
      <div className="max-w-4xl mx-auto">
      {/* Hero Image */}
      <div className="relative h-64">
        <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        <div className="absolute top-12 left-4 right-4 flex justify-between">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
          >
            <span className="material-icons-round text-navy">arrow_back</span>
          </Link>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md">
              <span className="material-icons-round text-navy">share</span>
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
            >
              <span className={`material-icons-round ${isFavorite ? "text-crimson" : "text-navy"}`}>
                {isFavorite ? "favorite" : "favorite_border"}
              </span>
            </button>
          </div>
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold text-center">
            Venue Details
          </p>
        </div>
      </div>

      {/* Venue Info */}
      <div className="px-5 -mt-6 relative z-10">
        <h1 className="text-2xl font-extrabold text-navy">{venue.name}</h1>
        <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
          <span className="material-icons-round text-sm">location_on</span>
          {venue.neighborhood}
        </p>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <span className="material-icons-round text-gold text-lg">star</span>
            <span className="font-bold text-navy">{venue.rating}</span>
            <span className="text-xs text-text-secondary">{venue.reviewCount} Reviews</span>
          </div>
          <span className="text-sm text-text-secondary">&bull;</span>
          <span className="text-sm font-semibold text-navy">{venue.priceRange}</span>
        </div>
      </div>

      {/* Open Times */}
      <section className="px-5 mt-6">
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-round text-gold">schedule</span>
            <h3 className="font-bold text-navy">Open Times</h3>
            {venue.isOpen && (
              <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Open until 4:00 AM
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Tonight</span>
              <span className="font-semibold text-navy">{venue.hours.today}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Mon - Thu</span>
              <span className="text-text-secondary">{venue.hours.monThu}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Fri - Sat</span>
              <span className="text-text-secondary">{venue.hours.friSat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Sun</span>
              <span className="text-text-secondary">{venue.hours.sun}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tonight's Specials */}
      {venue.specials.length > 0 && (
        <section className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-round text-crimson">local_bar</span>
            <h3 className="font-bold text-navy">Tonight&apos;s Specials</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {venue.specials.map((special, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 border ${
                  special.type === "Happy Hour"
                    ? "bg-gold/5 border-gold/30"
                    : "bg-crimson/5 border-crimson/30"
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider ${
                    special.type === "Happy Hour" ? "text-gold" : "text-crimson"
                  }`}
                >
                  {special.type}
                </span>
                <p className="font-bold text-navy text-sm mt-1">{special.title}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">{special.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      {venue.recentlyPlayed.length > 0 && (
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-navy">Recently Played</h3>
            <span className="text-xs text-crimson font-semibold">View History</span>
          </div>
          <div className="space-y-3">
            {venue.recentlyPlayed.map((song, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                  <span className="material-icons-round text-navy">music_note</span>
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-navy">{song.title}</p>
                  <p className="text-xs text-text-secondary">{song.artist}</p>
                </div>
                <span className="text-[10px] text-text-muted">{song.timeAgo}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location Mini Map */}
      <section className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-icons-round text-crimson">location_on</span>
          <h3 className="font-bold text-navy">Location</h3>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
          <div className="h-32 bg-bg relative">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=40"
              alt="Map"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-icons-round text-crimson text-4xl">location_on</span>
            </div>
          </div>
          <div className="p-3 bg-white">
            <p className="text-sm text-navy font-medium">{venue.address}</p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-gold">rate_review</span>
            <h3 className="font-bold text-navy">User Reviews</h3>
          </div>
          <Link href={`/review/${venue.id}`} className="text-xs text-crimson font-semibold">
            Leave a Review
          </Link>
        </div>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center">
                    <span className="material-icons-round text-navy text-sm">person</span>
                  </div>
                  <span className="font-semibold text-sm text-navy">{review.author}</span>
                </div>
                <span className="text-[10px] text-text-muted">{review.timeAgo}</span>
              </div>
              <StarRating rating={review.rating} size="sm" />
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Report / Feedback */}
      <section className="px-5 mt-6">
        <p className="text-xs text-text-muted text-center mb-2">
          Something not right with this listing?
        </p>
        <Link
          href={`/report/${venue.id}`}
          className="text-crimson text-xs font-semibold flex items-center justify-center gap-1"
        >
          <span className="material-icons-round text-sm">flag</span>
          Report a Problem
        </Link>
      </section>

      {/* Book CTA */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-5 z-40">
        <button className="w-full bg-navy text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-navy-light transition-colors">
          <span className="material-icons-round">event_seat</span>
          Book a Room
        </button>
      </div>

      </div>
      <BottomNav />
    </div>
  );
}
