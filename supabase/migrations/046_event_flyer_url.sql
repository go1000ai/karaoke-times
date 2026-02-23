-- Add flyer_url column to venue_events for custom flyer uploads
ALTER TABLE public.venue_events
  ADD COLUMN IF NOT EXISTS flyer_url TEXT;
