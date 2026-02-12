-- ============================================
-- Karaoke Times — Initial Database Schema
-- ============================================

-- Custom enum types
CREATE TYPE public.user_role AS ENUM ('user', 'venue_owner');
CREATE TYPE public.media_type AS ENUM ('image', 'video');
CREATE TYPE public.song_status AS ENUM ('waiting', 'up_next', 'now_singing', 'completed', 'skipped');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- ─── PROFILES ───
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'user',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── VENUES ───
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'New York',
  state TEXT NOT NULL DEFAULT 'New York',
  neighborhood TEXT NOT NULL DEFAULT '',
  cross_street TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  description TEXT,
  is_private_room BOOLEAN NOT NULL DEFAULT false,
  booking_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── VENUE EVENTS ───
CREATE TABLE public.venue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  event_name TEXT NOT NULL DEFAULT '',
  dj TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── VENUE MEDIA ───
CREATE TABLE public.venue_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type public.media_type NOT NULL DEFAULT 'image',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── VENUE PROMOS ───
CREATE TABLE public.venue_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── SONG QUEUE ───
CREATE TABLE public.song_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  status public.song_status NOT NULL DEFAULT 'waiting',
  position INTEGER NOT NULL DEFAULT 0,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ─── REVIEWS ───
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL DEFAULT '',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── REVIEW PHOTOS ───
CREATE TABLE public.review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── FAVORITES ───
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, venue_id)
);

-- ─── ROOM BOOKINGS ───
CREATE TABLE public.room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ───
CREATE INDEX idx_venue_events_venue ON public.venue_events(venue_id);
CREATE INDEX idx_venue_events_day ON public.venue_events(day_of_week);
CREATE INDEX idx_venue_media_venue ON public.venue_media(venue_id);
CREATE INDEX idx_venue_promos_venue ON public.venue_promos(venue_id);
CREATE INDEX idx_song_queue_venue ON public.song_queue(venue_id);
CREATE INDEX idx_song_queue_status ON public.song_queue(venue_id, status);
CREATE INDEX idx_reviews_venue ON public.reviews(venue_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_venue ON public.favorites(venue_id);
CREATE INDEX idx_room_bookings_venue ON public.room_bookings(venue_id);
CREATE INDEX idx_room_bookings_user ON public.room_bookings(user_id);

-- ─── ROW LEVEL SECURITY ───

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are viewable by everyone"
  ON public.venues FOR SELECT
  USING (true);

CREATE POLICY "Venue owners can insert venues"
  ON public.venues FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Venue owners can update their own venues"
  ON public.venues FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Venue owners can delete their own venues"
  ON public.venues FOR DELETE
  USING (auth.uid() = owner_id);

-- Venue Events
ALTER TABLE public.venue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue events are viewable by everyone"
  ON public.venue_events FOR SELECT
  USING (true);

CREATE POLICY "Venue owners can manage their events"
  ON public.venue_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Venue owners can update their events"
  ON public.venue_events FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Venue owners can delete their events"
  ON public.venue_events FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

-- Venue Media
ALTER TABLE public.venue_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue media is viewable by everyone"
  ON public.venue_media FOR SELECT
  USING (true);

CREATE POLICY "Venue owners can manage their media"
  ON public.venue_media FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Venue owners can update their media"
  ON public.venue_media FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Venue owners can delete their media"
  ON public.venue_media FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

-- Venue Promos
ALTER TABLE public.venue_promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue promos are viewable by everyone"
  ON public.venue_promos FOR SELECT
  USING (true);

CREATE POLICY "Venue owners can manage their promos"
  ON public.venue_promos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Venue owners can update their promos"
  ON public.venue_promos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Venue owners can delete their promos"
  ON public.venue_promos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

-- Song Queue
ALTER TABLE public.song_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Song queue is viewable by everyone"
  ON public.song_queue FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can request songs"
  ON public.song_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own requests"
  ON public.song_queue FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can manage queue for their venues"
  ON public.song_queue FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ) OR auth.uid() = user_id);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Review Photos
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review photos are viewable by everyone"
  ON public.review_photos FOR SELECT
  USING (true);

CREATE POLICY "Review authors can add photos"
  ON public.review_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reviews WHERE id = review_id AND user_id = auth.uid()
  ));

CREATE POLICY "Review authors can delete their photos"
  ON public.review_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.reviews WHERE id = review_id AND user_id = auth.uid()
  ));

-- Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Room Bookings
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON public.room_bookings FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create bookings"
  ON public.room_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own bookings"
  ON public.room_bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can manage bookings for their venues"
  ON public.room_bookings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()
  ));

-- ─── ENABLE REALTIME ───
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_queue;

-- ─── UPDATED_AT TRIGGER ───
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
