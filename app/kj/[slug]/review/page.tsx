"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/components/AuthProvider";
import { getKJBySlug } from "@/lib/mock-data";
import { createKJReview } from "@/lib/data/kjs";

const ratingLabels: Record<number, string> = {
  1: '"Needs Work"',
  2: '"It Was Okay"',
  3: '"Solid Night Out"',
  4: '"Great Vibes!"',
  5: '"Absolute Banger!"',
};

export default function KJReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const kj = getKJBySlug(slug);
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!kj) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons-round text-text-muted text-6xl mb-4 block">person_off</span>
          <h1 className="text-xl font-extrabold text-white mb-2">KJ Not Found</h1>
          <Link href="/" className="text-primary font-bold text-sm">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons-round text-text-muted text-6xl mb-4 block">lock</span>
          <h1 className="text-xl font-extrabold text-white mb-2">Login Required</h1>
          <p className="text-text-secondary text-sm mb-4">Sign in to leave a review.</p>
          <Link href="/signin" className="text-primary font-bold text-sm">Sign In</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!text.trim() && rating === 0) return;
    setSubmitting(true);
    setError("");

    const result = await createKJReview({
      kjSlug: slug,
      userId: user.id,
      rating,
      text: text.trim(),
      isAnonymous: anonymous,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/kj/${slug}`);
    }
  };

  return (
    <div className="min-h-screen pb-8 bg-bg-dark">
      {/* Header */}
      <header className="pt-20 px-5 flex justify-between items-center mb-8">
        <Link href={`/kj/${slug}`} className="text-accent text-sm font-semibold">
          Cancel
        </Link>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold neon-glow-green">New Review</p>
          <h1 className="text-lg font-extrabold text-white">{kj.name}</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-primary text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "..." : "Post"}
        </button>
      </header>

      {/* Rating */}
      <section className="px-5 flex flex-col items-center mb-8">
        <p className="text-xs uppercase tracking-widest text-accent font-bold mb-3 neon-glow-pink">
          Rate This KJ
        </p>
        <StarRating rating={rating} interactive onRate={setRating} size="lg" />
        <p className="text-sm font-bold text-primary mt-2 neon-glow-green">
          {ratingLabels[rating] || ""}
        </p>
      </section>

      {/* Review Text */}
      <section className="px-5 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How was the vibe? Song selection? Energy?"
          rows={5}
          className="w-full bg-card-dark border border-border rounded-2xl py-4 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted resize-none"
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

      {/* Error */}
      {error && (
        <section className="px-5 mb-4">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </section>
      )}

      {/* Submit */}
      <section className="px-5">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-primary/40 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Submit Review
              <span className="material-icons-round">send</span>
            </>
          )}
        </button>
      </section>
    </div>
  );
}
