"use client";

import { useState } from "react";

interface StarRatingProps {
  rating?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ rating = 0, interactive = false, onRate, size = "md" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  const sizeClass = size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer" : "cursor-default"} transition-colors`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRate?.(star)}
        >
          <span className={`material-icons-round ${sizeClass} ${star <= displayRating ? "text-gold" : "text-border"}`}>
            {star <= displayRating ? "star" : "star_border"}
          </span>
        </button>
      ))}
    </div>
  );
}
