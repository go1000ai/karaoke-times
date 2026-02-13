"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { karaokeEvents, type KaraokeEvent } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { resolveVenueId } from "@/lib/resolve-venue-id";

const FAVORITES_KEY = "kt-favorites";
const SAVED_SONGS_KEY = "kt-saved-songs";

interface SupabaseVenue {
  id: string;
  name: string;
}

interface SongResult {
  trackName: string;
  artistName: string;
  artworkUrl100: string;
}

interface SavedSong {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  savedAt: string;
}

function loadFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function loadSavedSongs(): SavedSong[] {
  try {
    const raw = localStorage.getItem(SAVED_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSavedSongs(songs: SavedSong[]) {
  localStorage.setItem(SAVED_SONGS_KEY, JSON.stringify(songs));
}

export default function RequestSongPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Check if song or venue was pre-selected
  const preTitle = searchParams.get("title") || "";
  const preArtist = searchParams.get("artist") || "";
  const preVenueId = searchParams.get("venue") || "";
  const hasSongPrefill = !!(preTitle);
  const hasVenuePrefill = !!(preVenueId);

  // Determine starting step based on what's pre-filled
  const getInitialStep = (): "song" | "venue" | "confirm" => {
    if (hasSongPrefill && hasVenuePrefill) return "confirm";
    if (hasSongPrefill) return "venue";
    if (hasVenuePrefill) return "song"; // venue selected, pick a song
    return "song";
  };

  const [step, setStep] = useState<"song" | "venue" | "confirm">(getInitialStep());

  // Venue selection
  const [venueSearch, setVenueSearch] = useState("");
  const preVenue = preVenueId ? karaokeEvents.find((e) => e.id === preVenueId) || null : null;
  const [selectedVenue, setSelectedVenue] = useState<KaraokeEvent | null>(preVenue);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  // Supabase venues (real venues managed by KJs/owners)
  const [supabaseVenues, setSupabaseVenues] = useState<SupabaseVenue[]>([]);
  // When a Supabase venue is directly selected, store its UUID to avoid name resolution
  const [directVenueUUID, setDirectVenueUUID] = useState<string | null>(null);

  // Song selection
  const [mode, setMode] = useState<"search" | "manual" | "library">("library");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [songTitle, setSongTitle] = useState(preTitle);
  const [artist, setArtist] = useState(preArtist);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  useEffect(() => {
    setFavoriteIds(loadFavoriteIds());
    setSavedSongs(loadSavedSongs());

    // Fetch real venues from Supabase so singers can select the actual venue UUID
    const supabase = createClient();
    supabase
      .from("venues")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setSupabaseVenues(data as SupabaseVenue[]);
      });
  }, []);

  // Dedupe venues by name
  const uniqueVenues = karaokeEvents.reduce<KaraokeEvent[]>((acc, event) => {
    if (!acc.some((v) => v.venueName === event.venueName)) acc.push(event);
    return acc;
  }, []);

  const favoriteVenues = uniqueVenues.filter((v) => favoriteIds.has(v.id));
  const otherVenues = uniqueVenues.filter((v) => !favoriteIds.has(v.id));

  const filteredFavorites = venueSearch
    ? favoriteVenues.filter((v) =>
        v.venueName.toLowerCase().includes(venueSearch.toLowerCase()) ||
        v.neighborhood?.toLowerCase().includes(venueSearch.toLowerCase()))
    : favoriteVenues;

  const filteredOthers = venueSearch
    ? otherVenues.filter((v) =>
        v.venueName.toLowerCase().includes(venueSearch.toLowerCase()) ||
        v.neighborhood?.toLowerCase().includes(venueSearch.toLowerCase()))
    : otherVenues;

  // Filter Supabase venues that aren't already in mock data (avoid duplicates)
  const mockVenueNames = new Set(uniqueVenues.map((v) => v.venueName.toLowerCase()));
  const extraSupabaseVenues = supabaseVenues.filter(
    (v) => !mockVenueNames.has(v.name.toLowerCase())
  );
  const filteredSupabaseVenues = venueSearch
    ? extraSupabaseVenues.filter((v) =>
        v.name.toLowerCase().includes(venueSearch.toLowerCase()))
    : extraSupabaseVenues;

  // Also gather Supabase venues that DO match mock data names (so we can use their UUID)
  const supabaseByName = new Map(supabaseVenues.map((v) => [v.name.toLowerCase(), v.id]));

  // Song search
  const searchSongs = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=8`);
      const data = await res.json();
      setResults(data.results || []);
    } catch { setResults([]); }
    setSearching(false);
  }, []);

  const handleSearchInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSongs(value), 350);
  };

  const selectSong = (title: string, artistName: string) => {
    setSongTitle(title);
    setArtist(artistName);
    setQuery("");
    setResults([]);
    // If venue already selected, go straight to confirm
    setStep(selectedVenue ? "confirm" : "venue");
  };

  // Save to songbook from search results
  const saveToLibrary = (title: string, artistName: string, artwork?: string) => {
    const alreadySaved = savedSongs.some(
      (s) => s.title.toLowerCase() === title.toLowerCase() && s.artist.toLowerCase() === artistName.toLowerCase()
    );
    if (alreadySaved) return;

    const newSong: SavedSong = {
      id: crypto.randomUUID(),
      title,
      artist: artistName,
      artwork,
      savedAt: new Date().toISOString(),
    };
    const updated = [newSong, ...savedSongs];
    setSavedSongs(updated);
    saveSavedSongs(updated);
  };

  const isSaved = (title: string, artistName: string) =>
    savedSongs.some(
      (s) => s.title.toLowerCase() === title.toLowerCase() && s.artist.toLowerCase() === artistName.toLowerCase()
    );

  const handleSubmit = async () => {
    if (!user || !songTitle.trim() || !selectedVenue) return;

    setSubmitting(true);
    setError("");

    const supabase = createClient();

    // Use direct UUID if available, otherwise look up the Supabase UUID for the mock-data venue name
    const supabaseVenueId =
      directVenueUUID ||
      supabaseByName.get(selectedVenue.venueName.toLowerCase()) ||
      (await resolveVenueId(selectedVenue.venueName));
    if (!supabaseVenueId) {
      setError("Venue not found in database. Please try again.");
      setSubmitting(false);
      return;
    }

    const { data: lastInQueue } = await supabase
      .from("song_queue")
      .select("position")
      .eq("venue_id", supabaseVenueId)
      .in("status", ["waiting", "up_next", "now_singing"])
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = ((lastInQueue?.position as number) ?? 0) + 1;

    const { error: insertError } = await supabase.from("song_queue").insert({
      venue_id: supabaseVenueId,
      user_id: user.id,
      song_title: songTitle.trim(),
      artist: artist.trim(),
      position: nextPosition,
      status: "waiting",
    });

    setSubmitting(false);

    if (insertError) {
      setError("Failed to submit your request. Please try again.");
    } else {
      setQueuePosition(nextPosition);
      setSubmitted(true);
    }
  };

  const reset = () => {
    setStep("song");
    setSelectedVenue(null);
    setDirectVenueUUID(null);
    setSongTitle("");
    setArtist("");
    setQuery("");
    setResults([]);
    setMode("library");
    setSubmitted(false);
    setError("");
    setQueuePosition(null);
  };

  // Progress indicator
  const stepIndex = step === "song" ? 1 : step === "venue" ? 2 : 3;
  const steps = [
    { num: 1, label: "Song" },
    { num: 2, label: "Venue" },
    { num: 3, label: "Confirm" },
  ];

  // Success screen
  if (submitted) {
    return (
      <div>
        <div className="glass-card rounded-2xl p-10 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-icons-round text-primary text-4xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">You&apos;re In the Queue!</h1>
          <p className="text-text-secondary text-sm mb-2">
            Your song has been submitted to <span className="text-white font-semibold">{selectedVenue?.venueName}</span>.
          </p>
          {queuePosition !== null && (
            <p className="text-primary font-bold text-lg mb-6">Position #{queuePosition}</p>
          )}

          <div className="glass-card rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-accent">music_note</span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{songTitle}</p>
                <p className="text-text-muted text-xs truncate">{artist || "Unknown Artist"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <span className="material-icons-round text-lg">add</span>
              Request Another
            </button>
            <Link href="/dashboard/my-queue" className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/15 transition-colors">
              <span className="material-icons-round text-lg">format_list_numbered</span>
              View My Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Request a Song</h1>
      <p className="text-text-secondary text-sm mb-6">
        {hasVenuePrefill && step === "song"
          ? `Pick a song to sing at ${preVenue?.venueName || "this venue"}!`
          : hasSongPrefill && step === "venue"
          ? `Pick a venue to sing "${preTitle}" at!`
          : "Pick your song, choose a venue, and get in line to sing!"}
      </p>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${stepIndex >= s.num ? "bg-primary text-black" : "bg-white/10 text-text-muted"}`}>
              {stepIndex > s.num ? <span className="material-icons-round text-sm">check</span> : s.num}
            </div>
            <span className={`text-xs font-bold ${stepIndex >= s.num ? "text-white" : "text-text-muted"}`}>{s.label}</span>
            {i < 2 && <div className={`flex-1 h-0.5 rounded ${stepIndex > s.num ? "bg-primary" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {/* STEP: Pick a Song */}
      {step === "song" && (
        <div>
          {/* Venue header when pre-selected */}
          {selectedVenue && (
            <div className="flex items-center gap-3 glass-card rounded-xl p-3 mb-5 border-primary/20">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                {selectedVenue.image ? (
                  <img src={selectedVenue.image} alt={selectedVenue.venueName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons-round text-primary text-sm">mic</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Singing at</p>
                <p className="text-white font-bold text-sm truncate">{selectedVenue.venueName}</p>
              </div>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-1 bg-card-dark rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode("library")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${mode === "library" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-white"}`}
            >
              <span className="material-icons-round text-sm">library_music</span>
              My Songbook
            </button>
            <button
              onClick={() => setMode("search")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors ${mode === "search" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-white"}`}
            >
              Search Songs
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors ${mode === "manual" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-white"}`}
            >
              Manual
            </button>
          </div>

          {/* Library Mode */}
          {mode === "library" && (
            <>
              {savedSongs.length > 0 ? (
                <div className="space-y-2">
                  {savedSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => selectSong(song.title, song.artist)}
                      className="w-full flex items-center gap-3 glass-card rounded-xl p-4 hover:border-primary/30 transition-all text-left"
                    >
                      {song.artwork ? (
                        <img src={song.artwork} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-icons-round text-primary">music_note</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-sm truncate">{song.title}</p>
                        <p className="text-text-muted text-xs truncate">{song.artist || "Unknown Artist"}</p>
                      </div>
                      <span className="material-icons-round text-primary/50">chevron_right</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <span className="material-icons-round text-4xl text-text-muted mb-3">library_music</span>
                  <p className="text-white font-semibold mb-1">No saved songs</p>
                  <p className="text-text-muted text-sm mb-3">
                    Save songs to your favorites, or search for one now!
                  </p>
                  <button onClick={() => setMode("search")} className="text-primary text-sm font-bold">
                    Search for a Song
                  </button>
                </div>
              )}
            </>
          )}

          {/* Search Mode */}
          {mode === "search" && (
            <div>
              <div className="relative mb-3">
                <span className="material-icons-round text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">search</span>
                <input
                  value={query}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Search by song or artist..."
                  autoFocus
                  className="w-full bg-card-dark border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
                />
                {searching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((song, i) => (
                    <div key={`${song.trackName}-${song.artistName}-${i}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <button
                        onClick={() => selectSong(song.trackName, song.artistName)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      >
                        <img src={song.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-semibold truncate">{song.trackName}</p>
                          <p className="text-text-muted text-xs truncate">{song.artistName}</p>
                        </div>
                      </button>
                      {/* Save to library button */}
                      <button
                        onClick={() => saveToLibrary(song.trackName, song.artistName, song.artworkUrl100)}
                        disabled={isSaved(song.trackName, song.artistName)}
                        className="flex-shrink-0 p-1.5"
                        title={isSaved(song.trackName, song.artistName) ? "Already saved" : "Save to favorites"}
                      >
                        <span className={`material-icons-round text-lg ${isSaved(song.trackName, song.artistName) ? "text-primary" : "text-text-muted hover:text-primary"}`}>
                          {isSaved(song.trackName, song.artistName) ? "bookmark" : "bookmark_border"}
                        </span>
                      </button>
                      {/* Select button */}
                      <button
                        onClick={() => selectSong(song.trackName, song.artistName)}
                        className="flex-shrink-0"
                      >
                        <span className="material-icons-round text-primary/50 text-lg">arrow_forward</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-text-muted text-sm">No results found</p>
                  <button onClick={() => { setSongTitle(query); setMode("manual"); }} className="text-primary text-xs font-bold mt-2">
                    Type it manually instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Mode */}
          {mode === "manual" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Song Title *</label>
                <input
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Enter song name..."
                  autoFocus
                  className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Artist</label>
                <input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Who sings it?"
                  className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
                />
              </div>
              {songTitle.trim() && (
                <button
                  onClick={() => setStep(selectedVenue ? "confirm" : "venue")}
                  className="w-full bg-primary text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                >
                  {selectedVenue ? "Review & Submit" : "Next: Pick a Venue"}
                  <span className="material-icons-round text-lg">arrow_forward</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP: Pick a Venue */}
      {step === "venue" && (
        <div>
          {/* Selected Song Header */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3 mb-5">
            <span className="material-icons-round text-primary">music_note</span>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-bold truncate">{songTitle}</p>
              <p className="text-text-muted text-xs truncate">{artist || "Unknown Artist"}</p>
            </div>
            {!hasSongPrefill && (
              <button onClick={() => { setStep("song"); setSongTitle(""); setArtist(""); }} className="text-primary text-xs font-bold flex-shrink-0">
                Change
              </button>
            )}
          </div>

          {/* Venue Search */}
          <div className="relative mb-5">
            <span className="material-icons-round text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">search</span>
            <input
              value={venueSearch}
              onChange={(e) => setVenueSearch(e.target.value)}
              placeholder="Search venues..."
              className="w-full bg-card-dark border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>

          {/* Supabase venues (KJ-managed, live queue enabled) */}
          {filteredSupabaseVenues.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-icons-round text-sm">storefront</span>
                Live Venues
              </p>
              <div className="space-y-2">
                {filteredSupabaseVenues.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => {
                      // Create a mock-like event object for the confirm step
                      setSelectedVenue({
                        id: venue.id,
                        venueName: venue.name,
                        dayOfWeek: "",
                        eventName: "",
                        address: "",
                        city: "",
                        state: "",
                        neighborhood: "",
                        crossStreet: "",
                        phone: "",
                        dj: "",
                        startTime: "",
                        endTime: "",
                        notes: "",
                        image: null,
                        isPrivateRoom: false,
                        bookingUrl: null,
                        website: null,
                        latitude: null,
                        longitude: null,
                      });
                      setDirectVenueUUID(venue.id);
                      setStep("confirm");
                    }}
                    className="w-full flex items-center gap-4 glass-card rounded-xl p-4 hover:border-accent/30 transition-all text-left border-accent/10"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-accent">mic</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold text-sm truncate">{venue.name}</p>
                      <p className="text-accent text-[10px] font-bold">Live Queue</p>
                    </div>
                    <span className="material-icons-round text-accent/50">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favorite venues */}
          {filteredFavorites.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-icons-round text-sm">favorite</span>
                Your Favorites
              </p>
              <div className="space-y-2">
                {filteredFavorites.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => { setSelectedVenue(venue); setDirectVenueUUID(null); setStep("confirm"); }}
                    className="w-full flex items-center gap-4 glass-card rounded-xl p-4 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                      {venue.image ? (
                        <img src={venue.image} alt={venue.venueName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="material-icons-round text-primary">mic</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold text-sm truncate">{venue.venueName}</p>
                      <p className="text-text-muted text-xs truncate">
                        {venue.neighborhood || venue.city}
                        {venue.dayOfWeek ? ` \u2022 ${venue.dayOfWeek}s` : ""}
                      </p>
                    </div>
                    <span className="material-icons-round text-primary/50">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Venues */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
              {filteredFavorites.length > 0 || filteredSupabaseVenues.length > 0 ? "All Venues" : "Select a Venue"}
            </p>
            <div className="space-y-2">
              {filteredOthers.map((venue) => (
                <button
                  key={venue.id}
                  onClick={() => { setSelectedVenue(venue); setDirectVenueUUID(null); setStep("confirm"); }}
                  className="w-full flex items-center gap-4 glass-card rounded-xl p-4 hover:border-primary/30 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    {venue.image ? (
                      <img src={venue.image} alt={venue.venueName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="material-icons-round text-primary">mic</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate">{venue.venueName}</p>
                    <p className="text-text-muted text-xs truncate">
                      {venue.neighborhood || venue.city}
                      {venue.dayOfWeek ? ` \u2022 ${venue.dayOfWeek}s` : ""}
                    </p>
                  </div>
                  <span className="material-icons-round text-text-muted">chevron_right</span>
                </button>
              ))}
            </div>
          </div>

          {filteredFavorites.length === 0 && filteredOthers.length === 0 && filteredSupabaseVenues.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <span className="material-icons-round text-4xl text-text-muted mb-3">search_off</span>
              <p className="text-white font-semibold">No venues found</p>
              <p className="text-text-muted text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* STEP: Confirm & Submit */}
      {step === "confirm" && selectedVenue && (
        <div>
          <div className="glass-card rounded-2xl p-5 mb-5">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Song</p>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-accent text-2xl">music_note</span>
              </div>
              <div>
                <p className="text-white font-bold">{songTitle}</p>
                <p className="text-text-muted text-xs">{artist || "Unknown Artist"}</p>
              </div>
            </div>

            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Venue</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                {selectedVenue.image ? (
                  <img src={selectedVenue.image} alt={selectedVenue.venueName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons-round text-primary">mic</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-bold">{selectedVenue.venueName}</p>
                <p className="text-text-muted text-xs">
                  {selectedVenue.neighborhood || selectedVenue.city}
                  {selectedVenue.dayOfWeek ? ` \u2022 ${selectedVenue.dayOfWeek}s` : ""}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
              <span className="material-icons-round text-red-400 text-lg">error</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("venue")}
              className="flex-1 bg-white/10 text-white font-bold py-3.5 rounded-xl hover:bg-white/15 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-accent text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-icons-round text-lg">queue_music</span>
                  Get in Line!
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
