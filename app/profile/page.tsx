import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SignOutProfileButton } from "./SignOutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, role, website, address, social_links")
    .eq("id", user.id)
    .single();

  // Song history — recent songs sung
  const { data: songHistory, count: totalSongs } = await supabase
    .from("song_queue")
    .select("id, song_title, artist, status, requested_at, venue_id", {
      count: "exact",
    })
    .eq("user_id", user.id)
    .in("status", ["completed", "now_singing", "waiting", "up_next"])
    .order("requested_at", { ascending: false })
    .limit(10);

  // Favorites
  const { data: favorites, count: favCount } = await supabase
    .from("favorites")
    .select(
      "id, venue_id, venues(id, name, neighborhood, city)",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  // Upcoming bookings
  const { data: bookings } = await supabase
    .from("room_bookings")
    .select("id, date, start_time, end_time, party_size, status, venues(name)")
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"])
    .order("date", { ascending: true })
    .limit(5);

  // Reviews count
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const displayName =
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Singer";

  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  const socialLinks = (profile?.social_links as { instagram?: string; twitter?: string; tiktok?: string; facebook?: string }) || {};

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="pt-20 pb-6 flex flex-col items-center px-5">
          <div className="relative mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full border-2 border-primary/30 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-card-dark flex items-center justify-center border-2 border-primary/30">
                <span className="material-icons-round text-4xl text-primary">
                  person
                </span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-white">{displayName}</h1>
          <p className="text-sm text-text-secondary">{user.email}</p>
          {profile?.role === "venue_owner" && (
            <span className="mt-2 bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-icons-round text-xs">storefront</span>{" "}
              Venue Owner
            </span>
          )}

          {/* Social links & website */}
          {(profile?.website || Object.values(socialLinks).some(Boolean)) && (
            <div className="flex items-center gap-3 mt-3">
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors"
                  title="Website"
                >
                  <span className="material-icons-round text-xl">language</span>
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram.startsWith("http") ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors"
                  title="Instagram"
                >
                  <span className="material-icons-round text-xl">photo_camera</span>
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter.startsWith("http") ? socialLinks.twitter : `https://x.com/${socialLinks.twitter.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors"
                  title="Twitter / X"
                >
                  <span className="material-icons-round text-xl">tag</span>
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok.startsWith("http") ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors"
                  title="TikTok"
                >
                  <span className="material-icons-round text-xl">music_note</span>
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook.startsWith("http") ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-primary transition-colors"
                  title="Facebook"
                >
                  <span className="material-icons-round text-xl">people</span>
                </a>
              )}
            </div>
          )}

          {/* Edit Profile button */}
          <Link
            href="/profile/edit"
            className="mt-3 flex items-center gap-1.5 bg-card-dark border border-border text-text-secondary text-sm font-semibold px-4 py-2 rounded-full hover:border-primary/30 hover:text-white transition-colors"
          >
            <span className="material-icons-round text-base">edit</span>
            Edit Profile
          </Link>
        </div>

        {/* Stats */}
        <section className="px-5 mb-6">
          <div className="grid grid-cols-3 glass-card rounded-2xl overflow-hidden">
            <div className="py-4 text-center border-r border-border">
              <p className="text-xl font-extrabold text-primary">
                {totalSongs || 0}
              </p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                Songs Sung
              </p>
            </div>
            <div className="py-4 text-center border-r border-border">
              <p className="text-xl font-extrabold text-primary">
                {favCount || 0}
              </p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                Favorites
              </p>
            </div>
            <div className="py-4 text-center">
              <p className="text-xl font-extrabold text-primary">
                {reviewCount || 0}
              </p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                Reviews
              </p>
            </div>
          </div>
        </section>

        {/* Song History */}
        <section className="px-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-icons-round text-accent text-xl">
                queue_music
              </span>
              My Songs
            </h2>
          </div>

          {songHistory && songHistory.length > 0 ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              {songHistory.map((song, i) => (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < songHistory.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-accent">
                      {song.status === "completed"
                        ? "check_circle"
                        : song.status === "now_singing"
                        ? "mic"
                        : "hourglass_top"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {song.song_title}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {song.status === "completed" ? (
                      <span className="text-[10px] text-green-400 font-bold uppercase">
                        Sang
                      </span>
                    ) : song.status === "now_singing" ? (
                      <span className="text-[10px] text-accent font-bold uppercase animate-pulse">
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] text-primary font-bold uppercase">
                        In Queue
                      </span>
                    )}
                    <p className="text-[10px] text-text-muted">
                      {new Date(song.requested_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center">
              <span className="material-icons-round text-3xl text-text-muted mb-2">
                mic_off
              </span>
              <p className="text-text-secondary text-sm">
                No songs yet. Find a venue and request your first song!
              </p>
              <Link
                href="/map"
                className="mt-3 inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
              >
                View Map
                <span className="material-icons-round text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>
          )}
        </section>

        {/* Favorites */}
        <section className="px-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-icons-round text-accent text-xl">
                favorite
              </span>
              Favorite Venues
            </h2>
            {(favCount || 0) > 6 && (
              <Link
                href="/favorites"
                className="text-xs text-primary font-semibold"
              >
                View All
              </Link>
            )}
          </div>

          {favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favorites.map((fav) => {
                const venue = fav.venues as unknown as {
                  id: string;
                  name: string;
                  neighborhood: string;
                  city: string;
                } | null;
                if (!venue) return null;
                return (
                  <Link
                    key={fav.id}
                    href={`/venue/${venue.id}`}
                    className="glass-card rounded-2xl p-4 hover:border-primary/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <span className="material-icons-round text-primary">
                        nightlife
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">
                      {venue.name}
                    </p>
                    <p className="text-[10px] text-text-secondary truncate">
                      {venue.neighborhood || venue.city}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center">
              <span className="material-icons-round text-3xl text-text-muted mb-2">
                favorite_border
              </span>
              <p className="text-text-secondary text-sm">
                No favorites yet. Tap the heart on any venue to save it!
              </p>
            </div>
          )}
        </section>

        {/* Upcoming Bookings */}
        <section className="px-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-icons-round text-accent text-xl">
                event
              </span>
              My Bookings
            </h2>
          </div>

          {bookings && bookings.length > 0 ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              {bookings.map((booking, i) => {
                const venue = booking.venues as unknown as {
                  name: string;
                } | null;
                return (
                  <div
                    key={booking.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i < bookings.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        booking.status === "confirmed"
                          ? "bg-green-500/10"
                          : "bg-primary/10"
                      }`}
                    >
                      <span
                        className={`material-icons-round ${
                          booking.status === "confirmed"
                            ? "text-green-400"
                            : "text-primary"
                        }`}
                      >
                        {booking.status === "confirmed"
                          ? "check_circle"
                          : "schedule"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {venue?.name || "Private Room"}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {new Date(booking.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {booking.start_time}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          booking.status === "confirmed"
                            ? "text-green-400"
                            : "text-primary"
                        }`}
                      >
                        {booking.status}
                      </span>
                      <p className="text-[10px] text-text-muted">
                        {booking.party_size} guests
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center">
              <span className="material-icons-round text-3xl text-text-muted mb-2">
                event_busy
              </span>
              <p className="text-text-secondary text-sm">
                No upcoming bookings.
              </p>
            </div>
          )}
        </section>

        {/* Sign Out */}
        <section className="px-5 mt-6 pb-8">
          <SignOutProfileButton />
        </section>
      </div>
    </div>
  );
}
