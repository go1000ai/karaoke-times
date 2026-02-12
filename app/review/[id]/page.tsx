"use client";

import { use, useState } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import ImageUpload from "@/components/ImageUpload";
import { venues } from "@/lib/mock-data";

const ratingLabels: Record<number, string> = {
  1: '"Needs Work"',
  2: '"It Was Okay"',
  3: '"Solid Night Out"',
  4: '"Great Vibes!"',
  5: '"Absolute Banger!"',
};

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const venue = venues.find((v) => v.id === id) || venues[0];
  const [rating, setRating] = useState(5);
  const [anonymous, setAnonymous] = useState(false);

  return (
    <div className="min-h-screen pb-8 bg-bg-dark">
      {/* Header */}
      <header className="pt-20 px-5 flex justify-between items-center mb-8">
        <Link href={`/venue/${venue.id}`} className="text-accent text-sm font-semibold">
          Cancel
        </Link>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold neon-glow-green">New Review</p>
          <h1 className="text-lg font-extrabold text-white">{venue.name}</h1>
        </div>
        <button className="text-primary text-sm font-semibold">Post</button>
      </header>

      {/* Rating */}
      <section className="px-5 flex flex-col items-center mb-8">
        <p className="text-xs uppercase tracking-widest text-accent font-bold mb-3 neon-glow-pink">
          Rate Your Vibes
        </p>
        <StarRating rating={rating} interactive onRate={setRating} size="lg" />
        <p className="text-sm font-bold text-primary mt-2 neon-glow-green">
          {ratingLabels[rating] || ""}
        </p>
      </section>

      {/* Review Text */}
      <section className="px-5 mb-6">
        <textarea
          placeholder="Tell us about the vibes and the sound system..."
          rows={5}
          className="w-full bg-card-dark border border-border rounded-2xl py-4 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted resize-none"
        />
      </section>

      {/* Photo Upload */}
      <section className="px-5 mb-6">
        <h3 className="font-bold text-white mb-3">Add Photos</h3>
        <ImageUpload
          label="Upload Photos"
          multiple
          maxFiles={6}
          maxSize="10MB"
        />
      </section>

      {/* Anonymous Toggle */}
      <section className="px-5 mb-8">
        <div className="flex items-center justify-between glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="material-icons-round text-text-secondary">visibility_off</span>
            <div>
              <p className="text-sm font-semibold text-white">Post Anonymously</p>
              <p className="text-xs text-text-secondary">Hide your profile from public view</p>
            </div>
          </div>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              anonymous ? "bg-primary" : "bg-border"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-transform ${
                anonymous ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Submit */}
      <section className="px-5">
        <button className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-primary/40 transition-all">
          Submit Review
          <span className="material-icons-round">send</span>
        </button>
      </section>
    </div>
  );
}
