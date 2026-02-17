-- Migration 029: Singer Highlights System
-- Per-event "Singer of the Night" + Weekly/Monthly featured singers

CREATE TABLE public.singer_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.venue_events(id) ON DELETE SET NULL,
  singer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  highlighted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  highlight_type TEXT NOT NULL DEFAULT 'singer_of_night',
  title TEXT,
  notes TEXT,
  song_title TEXT,
  song_artist TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_singer_highlights_venue ON public.singer_highlights(venue_id);
CREATE INDEX idx_singer_highlights_singer ON public.singer_highlights(singer_user_id);
CREATE INDEX idx_singer_highlights_active ON public.singer_highlights(is_active, highlight_type);
CREATE INDEX idx_singer_highlights_date ON public.singer_highlights(event_date DESC);

ALTER TABLE public.singer_highlights ENABLE ROW LEVEL SECURITY;

-- Public read (shown on TV, public pages, homepage)
CREATE POLICY "singer_highlights_public_read"
  ON public.singer_highlights FOR SELECT USING (true);

-- KJs and owners can create highlights for their venues
CREATE POLICY "singer_highlights_create"
  ON public.singer_highlights FOR INSERT
  WITH CHECK (
    auth.uid() = highlighted_by
    AND (
      EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.venue_staff
        WHERE venue_staff.venue_id = singer_highlights.venue_id
          AND venue_staff.user_id = auth.uid()
          AND venue_staff.accepted_at IS NOT NULL
      )
    )
  );

-- Creators can update their highlights
CREATE POLICY "singer_highlights_creator_update"
  ON public.singer_highlights FOR UPDATE
  USING (auth.uid() = highlighted_by);

-- Creators can delete their highlights
CREATE POLICY "singer_highlights_creator_delete"
  ON public.singer_highlights FOR DELETE
  USING (auth.uid() = highlighted_by);
