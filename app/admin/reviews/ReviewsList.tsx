"use client";

import { useState, useTransition } from "react";
import { deleteReview } from "../actions";

interface VenueReview {
  id: string;
  venue_id: string;
  rating: number;
  text: string | null;
  is_anonymous: boolean;
  created_at: string;
  venues: { name: string } | null;
  profiles: { display_name: string | null } | null;
}

interface KJReview {
  id: string;
  kj_slug: string;
  rating: number;
  text: string | null;
  is_anonymous: boolean;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

export function ReviewsList({
  venueReviews: initialVenue,
  kjReviews: initialKJ,
  totalCount,
  avgRating,
  thisWeekCount,
}: {
  venueReviews: VenueReview[];
  kjReviews: KJReview[];
  totalCount: number;
  avgRating: string;
  thisWeekCount: number;
}) {
  const [venueReviews, setVenueReviews] = useState(initialVenue);
  const [kjReviews, setKJReviews] = useState(initialKJ);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"venue" | "kj">("venue");
  const [ratingFilter, setRatingFilter] = useState(0);

  function handleDelete(reviewId: string, type: "venue" | "kj") {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setProcessingId(reviewId);
    startTransition(async () => {
      const result = await deleteReview(reviewId, type);
      if (result.success) {
        if (type === "venue") {
          setVenueReviews((prev) => prev.filter((r) => r.id !== reviewId));
        } else {
          setKJReviews((prev) => prev.filter((r) => r.id !== reviewId));
        }
      }
      setProcessingId(null);
    });
  }

  const currentReviews = tab === "venue" ? venueReviews : kjReviews;
  const filtered = currentReviews.filter((r) => {
    if (ratingFilter > 0 && r.rating !== ratingFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Reviews</h1>
          <p className="text-text-secondary text-sm">{totalCount} total reviews</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <span className="material-icons-round text-yellow-400">star</span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white">{avgRating}</p>
            <p className="text-xs text-text-muted">Avg Rating</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-icons-round text-primary">rate_review</span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white">{totalCount}</p>
            <p className="text-xs text-text-muted">Total</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
            <span className="material-icons-round text-green-400">trending_up</span>
          </div>
          <div>
            <p className="text-lg font-extrabold text-white">{thisWeekCount}</p>
            <p className="text-xs text-text-muted">This Week</p>
          </div>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("venue")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === "venue" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            Venue Reviews ({venueReviews.length})
          </button>
          <button
            onClick={() => setTab("kj")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === "kj" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-text-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            KJ Reviews ({kjReviews.length})
          </button>
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(Number(e.target.value))}
          className="bg-card-dark border border-border rounded-xl px-3 py-2 text-sm text-white cursor-pointer"
        >
          <option value={0}>All Ratings</option>
          <option value={1}>1 Star</option>
          <option value={2}>2 Stars</option>
          <option value={3}>3 Stars</option>
          <option value={4}>4 Stars</option>
          <option value={5}>5 Stars</option>
        </select>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {filtered.map((review: any) => (
          <div key={review.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold truncate">
                    {tab === "venue"
                      ? review.venues?.name || "Unknown Venue"
                      : review.kj_slug || "Unknown KJ"}
                  </p>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`material-icons-round text-xs ${i < review.rating ? "text-yellow-400" : "text-white/10"}`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  {review.rating <= 2 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Low</span>
                  )}
                </div>
                <p className="text-sm text-text-muted line-clamp-2">{review.text || "No comment"}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted/60">
                  <span>by {review.is_anonymous ? "Anonymous" : review.profiles?.display_name || "Unknown"}</span>
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(review.id, tab)}
                disabled={isPending && processingId === review.id}
                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <span className="material-icons-round text-red-400 text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">rate_review</span>
            <p className="text-text-secondary text-sm">No reviews found</p>
          </div>
        )}
      </div>
    </div>
  );
}
