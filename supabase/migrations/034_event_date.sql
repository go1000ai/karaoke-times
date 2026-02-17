-- Add optional event_date to venue_events
-- Events can have both day_of_week (recurring schedule) and event_date (specific date for flyers/one-offs)
ALTER TABLE public.venue_events
  ADD COLUMN IF NOT EXISTS event_date DATE;
