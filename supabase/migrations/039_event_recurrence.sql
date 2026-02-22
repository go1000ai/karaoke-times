-- Add recurrence_type to venue_events
-- 'weekly' is the existing implicit default (day_of_week based)
ALTER TABLE public.venue_events
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT NOT NULL DEFAULT 'weekly'
  CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly', 'one_time'));
