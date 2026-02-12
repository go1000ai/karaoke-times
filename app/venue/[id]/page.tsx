"use client";

import { use, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";
import QueueStatus from "@/components/QueueStatus";
import SongRequestModal from "@/components/SongRequestModal";
import { useAuth } from "@/components/AuthProvider";
import { venues, reviews, karaokeEvents } from "@/lib/mock-data";

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const venue = venues.find((v) => v.id === id) || venues[0];
  const event = karaokeEvents.find((e) => e.id === id);
  const phone = event?.phone || "";
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSongRequest, setShowSongRequest] = useState(false);

  const handleDirections = () => {
    const address = encodeURIComponent(`${venue.address}, ${venue.neighborhood}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, "_blank");
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        {/* Hero Image */}
        <div className="relative h-72">
          <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/30 to-transparent" />
          <div className="absolute top-12 left-4 right-4 flex justify-between">
            <Link
              href="/"
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center"
            >
              <span className="material-icons-round text-white">arrow_back</span>
            </Link>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
                <span className="material-icons-round text-white">share</span>
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
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
            {venue.neighborhood}
          </p>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <span className="material-icons-round text-primary text-lg">star</span>
              <span className="font-bold text-white">{venue.rating}</span>
              <span className="text-xs text-text-secondary">{venue.reviewCount} Reviews</span>
            </div>
            <span className="text-sm text-text-muted">&bull;</span>
            <span className="text-sm font-semibold text-primary">{venue.priceRange}</span>
          </div>
        </div>

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
          <QueueStatus venueId={id} />
        </section>

        {/* Open Times */}
        <section className="px-5 mt-6">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-round text-primary">schedule</span>
              <h3 className="font-bold text-white">Open Times</h3>
              {venue.isOpen && (
                <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Open until 4:00 AM
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Tonight</span>
                <span className="font-semibold text-white">{venue.hours.today}</span>
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
              <span className="material-icons-round text-accent">local_bar</span>
              <h3 className="font-bold text-white">Tonight&apos;s Specials</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {venue.specials.map((special, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-4 border ${
                    special.type === "Happy Hour"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-accent/5 border-accent/20"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      special.type === "Happy Hour" ? "text-primary" : "text-accent"
                    }`}
                  >
                    {special.type}
                  </span>
                  <p className="font-bold text-white text-sm mt-1">{special.title}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{special.detail}</p>
                </div>
              ))}
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
              <p className="text-xs text-text-secondary mt-1">{venue.neighborhood}</p>
            </div>
            <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
              <button
                onClick={() => {
                  const addr = encodeURIComponent(`${venue.address}, ${venue.neighborhood}`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=driving`, "_blank");
                }}
                className="py-3 flex flex-col items-center gap-1 hover:bg-white/5 transition-colors"
              >
                <span className="material-icons-round text-primary text-lg">directions_car</span>
                <span className="text-[10px] text-text-muted">Drive</span>
              </button>
              <button
                onClick={() => {
                  const addr = encodeURIComponent(`${venue.address}, ${venue.neighborhood}`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=transit`, "_blank");
                }}
                className="py-3 flex flex-col items-center gap-1 hover:bg-white/5 transition-colors"
              >
                <span className="material-icons-round text-primary text-lg">directions_transit</span>
                <span className="text-[10px] text-text-muted">Transit</span>
              </button>
              <button
                onClick={() => {
                  const addr = encodeURIComponent(`${venue.address}, ${venue.neighborhood}`);
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
              <h3 className="font-bold text-white">User Reviews</h3>
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
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-icons-round text-primary text-sm">person</span>
                    </div>
                    <span className="font-semibold text-sm text-white">{review.author}</span>
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
