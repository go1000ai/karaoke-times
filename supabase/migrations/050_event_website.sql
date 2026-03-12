-- Add website field to venue_events for event-specific URLs
ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS website TEXT;
