-- Cache of verified YouTube karaoke tracks for songs.
-- When a KJ picks a good instrumental, save it so future requests auto-use it.
CREATE TABLE IF NOT EXISTS public.karaoke_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  track_type TEXT NOT NULL DEFAULT 'instrumental', -- instrumental, with_chorus, full
  selected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique per song+artist+type so we don't duplicate
  UNIQUE (song_title, artist, track_type)
);

-- Allow anyone to read, KJs/owners to insert/update
ALTER TABLE public.karaoke_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read karaoke tracks"
  ON public.karaoke_tracks FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert karaoke tracks"
  ON public.karaoke_tracks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update karaoke tracks"
  ON public.karaoke_tracks FOR UPDATE USING (auth.uid() IS NOT NULL);
