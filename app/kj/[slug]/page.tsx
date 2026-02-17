"use client";

import { use, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";
import { AdBanner } from "@/components/AdBanner";
import { useAuth } from "@/components/AuthProvider";
import { getKJBySlug, type KJProfile } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { requestKJBooking } from "@/app/dashboard/bookings/booking-actions";

interface KJReview {
  id: string;
  rating: number;
  text: string;
  is_anonymous: boolean;
  created_at: string;
  profiles: { display_name: string | null } | null;
}

interface DBKJProfile {
  user_id: string;
  slug: string;
  stage_name: string;
  bio: string | null;
  photo_url: string | null;
  genres: string[] | null;
  equipment: string[] | null;
  social_links: Record<string, string> | null;
}

interface DBEvent {
  id: string;
  day_of_week: string;
  event_name: string | null;
  start_time: string;
  end_time: string;
  venue: { id: string; name: string } | null;
}

export default function KJProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const mockKJ = getKJBySlug(slug);
  const { user } = useAuth();
  const [reviews, setReviews] = useState<KJReview[]>([]);
  const [dbProfile, setDbProfile] = useState<DBKJProfile | null>(null);
  const [dbEvents, setDbEvents] = useState<DBEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Try to load DB KJ profile first
  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();

    // Fetch DB KJ profile
    supabase
      .from("kj_profiles")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data) {
          setDbProfile(data as DBKJProfile);
          // Fetch events for this KJ
          supabase
            .from("venue_events")
            .select("id, day_of_week, event_name, start_time, end_time, venue:venues!venue_id(id, name)")
            .eq("kj_user_id", data.user_id)
            .eq("is_active", true)
            .order("day_of_week")
            .then(({ data: events }) => {
              if (events) setDbEvents(events as unknown as DBEvent[]);
            });
        }
        setLoaded(true);
      });

    // Fetch user display name for pre-filling booking form
    if (user) {
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.display_name) setDisplayName(data.display_name);
        });
    }

    // Fetch reviews regardless
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

  // If neither DB profile nor mock data found
  if (loaded && !dbProfile && !mockKJ) {
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

  // Show loading before we know
  if (!loaded && !mockKJ) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Use DB profile if available, fall back to mock
  const kjName = dbProfile?.stage_name || mockKJ?.name || "KJ";
  const kjBio = dbProfile?.bio;
  const kjPhoto = dbProfile?.photo_url;
  const kjGenres = dbProfile?.genres;
  const kjEquipment = dbProfile?.equipment;
  const kjUserId = dbProfile?.user_id;

  // Events: prefer DB events, fall back to mock
  const hasDBEvents = dbEvents.length > 0;

  // For mock KJ data
  const mockEvents = mockKJ?.events || [];
  const uniqueVenues = mockKJ
    ? Array.from(new Map(mockEvents.map((e) => [e.venueName, e])).values())
    : [];

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
          {kjPhoto ? (
            <img
              src={kjPhoto}
              alt={kjName}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-accent/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons-round text-accent text-4xl">headphones</span>
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-white mb-1">{kjName}</h1>

          {kjBio && (
            <p className="text-text-secondary text-sm max-w-md mx-auto mt-2 leading-relaxed">{kjBio}</p>
          )}

          <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
            {mockKJ && (
              <>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-bold">
                  <span className="material-icons-round text-sm">storefront</span>
                  {mockKJ.venueCount} {mockKJ.venueCount === 1 ? "Venue" : "Venues"}
                </span>
                <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-3 py-1.5 rounded-full font-bold">
                  <span className="material-icons-round text-sm">event</span>
                  {mockKJ.events.length} {mockKJ.events.length === 1 ? "Night" : "Nights"} / Week
                </span>
              </>
            )}
          </div>

          {/* Genres */}
          {kjGenres && kjGenres.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {kjGenres.map((g) => (
                <span key={g} className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Equipment */}
          {kjEquipment && kjEquipment.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {kjEquipment.map((e) => (
                <span key={e} className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {e}
                </span>
              ))}
            </div>
          )}

          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <StarRating rating={Math.round(avgRating)} size="sm" />
              <span className="text-xs text-text-muted">
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Book This KJ */}
          {dbProfile && (
            <div className="mt-4">
              {user ? (
                <button
                  onClick={() => { setShowBookingForm(!showBookingForm); setBookingSubmitted(false); setBookingError(null); }}
                  className="bg-accent text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 mx-auto hover:shadow-lg hover:shadow-accent/30 transition-all"
                >
                  <span className="material-icons-round text-lg">event_available</span>
                  {showBookingForm ? "Cancel" : "Book This KJ"}
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 bg-white/5 text-text-secondary font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <span className="material-icons-round text-lg">login</span>
                  Sign In to Book
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Booking Form */}
        {showBookingForm && dbProfile && (
          <section className="px-5 mb-6">
            {bookingSubmitted ? (
              <div className="glass-card rounded-2xl p-6 text-center border border-green-500/20">
                <span className="material-icons-round text-green-400 text-4xl mb-2 block">check_circle</span>
                <p className="text-white font-bold mb-1">Booking Request Sent!</p>
                <p className="text-text-secondary text-sm">
                  {kjName} will review your request and get back to you.
                </p>
                <button
                  onClick={() => { setShowBookingForm(false); setBookingSubmitted(false); }}
                  className="mt-4 text-primary font-semibold text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-6 border border-accent/20">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="material-icons-round text-accent">event_available</span>
                  Book {kjName}
                </h3>
                {bookingError && (
                  <div className="bg-red-500/10 text-red-400 text-sm px-4 py-2 rounded-xl mb-4">
                    {bookingError}
                  </div>
                )}
                <form
                  action={(formData: FormData) => {
                    formData.set("kj_user_id", dbProfile.user_id);
                    formData.set("request_source", "singer_request");
                    startTransition(async () => {
                      const result = await requestKJBooking(formData);
                      if (result?.error) {
                        setBookingError(result.error);
                      } else {
                        setBookingSubmitted(true);
                      }
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Your Name *</label>
                      <input
                        name="client_name"
                        required
                        defaultValue={displayName || ""}
                        placeholder="Your name"
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Event Type</label>
                      <select
                        name="booking_type"
                        defaultValue="private"
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                      >
                        <option value="private">Private Party</option>
                        <option value="corporate">Corporate Event</option>
                        <option value="party">Birthday Party</option>
                        <option value="wedding">Wedding</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Event Date *</label>
                      <input
                        name="event_date"
                        type="date"
                        required
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Start Time *</label>
                      <input
                        name="start_time"
                        type="text"
                        required
                        placeholder="7:00 PM"
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">End Time</label>
                      <input
                        name="end_time"
                        type="text"
                        placeholder="11:00 PM"
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Location</label>
                      <input
                        name="location"
                        type="text"
                        placeholder="Venue or address"
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Your Email</label>
                      <input
                        name="client_email"
                        type="email"
                        placeholder="email@example.com"
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Your Phone</label>
                      <input
                        name="client_phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">Notes / Special Requests</label>
                    <textarea
                      name="notes"
                      placeholder="Any details about your event..."
                      rows={2}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Send Request
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {/* Sponsor Ads */}
        {kjUserId && (
          <section className="px-5 mb-6">
            <AdBanner kjUserId={kjUserId} placementType="kj_profile" />
          </section>
        )}

        {/* DB Events Schedule */}
        {hasDBEvents && (
          <section className="px-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-round text-primary">calendar_today</span>
              <h2 className="font-bold text-white">Weekly Schedule</h2>
            </div>
            <div className="space-y-3">
              {dbEvents.map((event) => (
                <div key={event.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-primary text-xl">mic</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-white text-sm truncate">
                      {event.venue?.name || "Venue"}
                    </p>
                    <p className="text-accent text-xs font-bold uppercase tracking-wider truncate">
                      {event.event_name || "Karaoke Night"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {event.day_of_week}
                      </span>
                      <span className="text-text-muted text-xs">
                        {event.start_time} - {event.end_time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mock Schedule (fallback) */}
        {!hasDBEvents && mockKJ && (
          <section className="px-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-round text-primary">calendar_today</span>
              <h2 className="font-bold text-white">Weekly Schedule</h2>
            </div>
            <div className="space-y-3">
              {mockEvents.map((event, i) => (
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
        )}

        {/* Venues at a glance (mock only) */}
        {!hasDBEvents && uniqueVenues.length > 1 && (
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
