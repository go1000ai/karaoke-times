-- Migration 031: Move restriction/rules fields to venue_events (per-event, KJ-managed)
-- The venue listing (owner) stays simple; event-specific rules live here.

ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS age_restriction TEXT DEFAULT 'all_ages';
ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS dress_code TEXT DEFAULT 'casual';
ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS cover_charge TEXT DEFAULT 'free';
ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS drink_minimum TEXT DEFAULT 'none';
ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS restrictions JSONB DEFAULT '[]';
ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS custom_rules TEXT[] DEFAULT '{}';
ALTER TABLE public.venue_events ADD COLUMN IF NOT EXISTS happy_hour_details TEXT;
