import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardProfilePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, role, website, address, social_links")
    .eq("id", user.id)
    .single();

  // Song history
  const { data: songHistory, count: totalSongs } = await supabase
    .from("song_queue")
    .select("id, song_title, artist, status, requested_at, venue_id", { count: "exact" })
    .eq("user_id", user.id)
    .in("status", ["completed", "now_singing", "waiting", "up_next"])
    .order("requested_at", { ascending: false })
    .limit(10);

  // Favorites count
  const { count: favCount } = await supabase
    .from("favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Reviews count
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Check if user is a KJ
  const { data: staffRecord } = await supabase
    .from("venue_staff")
    .select("id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  const isKJ = !!staffRecord;

  // Fetch KJ profile if exists
  const { data: kjProfile } = isKJ
    ? await supabase
        .from("kj_profiles")
        .select("slug, stage_name, bio, photo_url, genres, equipment")
        .eq("user_id", user.id)
        .single()
    : { data: null };

  const displayName =
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Singer";

  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  const socialLinks = (profile?.social_links as { instagram?: string; twitter?: string; tiktok?: string; facebook?: string }) || {};

  return (
    <div>
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-24 h-24 rounded-full border-2 border-primary/30 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-card-dark flex items-center justify-center border-2 border-primary/30">
              <span className="material-icons-round text-4xl text-primary">person</span>
            </div>
          )}
        </div>
        <h1 className="text-xl font-extrabold text-white">{displayName}</h1>
        <p className="text-sm text-text-secondary">{user.email}</p>
        {profile?.role === "venue_owner" && (
          <span className="mt-2 bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="material-icons-round text-xs">storefront</span> Venue Owner
          </span>
        )}

        {/* Social links */}
        {(profile?.website || Object.values(socialLinks).some(Boolean)) && (
          <div className="flex items-center gap-3 mt-3">
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" title="Website">
                <span className="material-icons-round text-xl">language</span>
              </a>
            )}
            {socialLinks.instagram && (
              <a href={socialLinks.instagram.startsWith("http") ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" title="Instagram">
                <span className="material-icons-round text-xl">photo_camera</span>
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter.startsWith("http") ? socialLinks.twitter : `https://x.com/${socialLinks.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" title="Twitter / X">
                <span className="material-icons-round text-xl">tag</span>
              </a>
            )}
            {socialLinks.tiktok && (
              <a href={socialLinks.tiktok.startsWith("http") ? socialLinks.tiktok : `https://tiktok.com/@${socialLinks.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" title="TikTok">
                <span className="material-icons-round text-xl">music_note</span>
              </a>
            )}
            {socialLinks.facebook && (
              <a href={socialLinks.facebook.startsWith("http") ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" title="Facebook">
                <span className="material-icons-round text-xl">people</span>
              </a>
            )}
          </div>
        )}

        <Link
          href="/dashboard/my-profile/edit"
          className="mt-3 flex items-center gap-1.5 bg-card-dark border border-border text-text-secondary text-sm font-semibold px-4 py-2 rounded-full hover:border-primary/30 hover:text-white transition-colors"
        >
          <span className="material-icons-round text-base">edit</span>
          Edit Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 glass-card rounded-2xl overflow-hidden mb-6">
        <div className="py-4 text-center border-r border-border">
          <p className="text-xl font-extrabold text-primary">{totalSongs || 0}</p>
          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Songs Sung</p>
        </div>
        <div className="py-4 text-center border-r border-border">
          <p className="text-xl font-extrabold text-primary">{favCount || 0}</p>
          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Favorites</p>
        </div>
        <div className="py-4 text-center">
          <p className="text-xl font-extrabold text-primary">{reviewCount || 0}</p>
          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Reviews</p>
        </div>
      </div>

      {/* KJ Profile Section */}
      {isKJ && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="material-icons-round text-accent text-xl">headphones</span>
            KJ Profile
          </h2>

          {kjProfile ? (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-3">
                {kjProfile.photo_url ? (
                  <img src={kjProfile.photo_url} alt="" className="w-14 h-14 rounded-full object-cover border border-accent/20" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="material-icons-round text-accent text-2xl">headphones</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{kjProfile.stage_name}</p>
                  <p className="text-text-muted text-xs">karaoke-times.vercel.app/kj/{kjProfile.slug}</p>
                </div>
              </div>
              {kjProfile.bio && (
                <p className="text-text-secondary text-sm mb-3">{kjProfile.bio}</p>
              )}
              {kjProfile.genres && (kjProfile.genres as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(kjProfile.genres as string[]).map((g: string) => (
                    <span key={g} className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              )}
              <Link
                href="/dashboard/my-profile/kj"
                className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline"
              >
                <span className="material-icons-round text-base">edit</span>
                Edit KJ Profile
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 text-center">
              <span className="material-icons-round text-3xl text-text-muted mb-2 block">headphones</span>
              <p className="text-text-secondary text-sm mb-3">
                Set up your public KJ profile so singers and venues can find you.
              </p>
              <Link
                href="/dashboard/my-profile/kj"
                className="inline-flex items-center gap-1.5 bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <span className="material-icons-round text-lg">add</span>
                Create KJ Profile
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Song History */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
          <span className="material-icons-round text-accent text-xl">queue_music</span>
          My Songs
        </h2>

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
                    {song.status === "completed" ? "check_circle" : song.status === "now_singing" ? "mic" : "hourglass_top"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{song.song_title}</p>
                  <p className="text-xs text-text-secondary truncate">{song.artist}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {song.status === "completed" ? (
                    <span className="text-[10px] text-green-400 font-bold uppercase">Sang</span>
                  ) : song.status === "now_singing" ? (
                    <span className="text-[10px] text-accent font-bold uppercase animate-pulse">Live</span>
                  ) : (
                    <span className="text-[10px] text-primary font-bold uppercase">In Queue</span>
                  )}
                  <p className="text-[10px] text-text-muted">
                    {new Date(song.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center">
            <span className="material-icons-round text-3xl text-text-muted mb-2">mic_off</span>
            <p className="text-text-secondary text-sm">No songs yet. Find a venue and request your first song!</p>
            <Link href="/" className="mt-3 inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
              Explore Venues
              <span className="material-icons-round text-sm">arrow_forward</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
