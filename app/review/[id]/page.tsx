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
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="pt-12 px-5 flex justify-between items-center mb-8">
        <Link href={`/venue/${venue.id}`} className="text-crimson text-sm font-semibold">
          Cancel
        </Link>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-crimson font-bold">New Review</p>
          <h1 className="text-lg font-extrabold text-navy">{venue.name}</h1>
        </div>
        <button className="text-navy text-sm font-semibold">Post</button>
      </header>

      {/* Rating */}
      <section className="px-5 flex flex-col items-center mb-8">
        <p className="text-xs uppercase tracking-widest text-crimson font-bold mb-3">
          Rate Your Vibes
        </p>
        <StarRating rating={rating} interactive onRate={setRating} size="lg" />
        <p className="text-sm font-bold text-gold mt-2">
          {ratingLabels[rating] || ""}
        </p>
      </section>

      {/* Review Text */}
      <section className="px-5 mb-6">
        <textarea
          placeholder="Tell us about the vibes and the sound system..."
          rows={5}
          className="w-full bg-white border border-border rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30 focus:border-crimson placeholder:text-text-muted shadow-sm resize-none"
        />
      </section>

      {/* Photo Upload */}
      <section className="px-5 mb-6">
        <h3 className="font-bold text-navy mb-3">Add Photos</h3>
        <ImageUpload
          label="Upload Photos"
          multiple
          maxFiles={6}
          maxSize="10MB"
        />
      </section>

      {/* Anonymous Toggle */}
      <section className="px-5 mb-8">
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-icons-round text-navy">visibility_off</span>
            <div>
              <p className="text-sm font-semibold text-navy">Post Anonymously</p>
              <p className="text-xs text-text-secondary">Hide your profile from public view</p>
            </div>
          </div>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              anonymous ? "bg-crimson" : "bg-border"
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
        <button className="w-full bg-crimson text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-crimson-light transition-colors">
          Submit Review
          <span className="material-icons-round">send</span>
        </button>
      </section>
    </div>
  );
}
