-- Add accessibility field to venues
-- Values: 'full', 'partial', 'none', or NULL (unknown)
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS accessibility TEXT DEFAULT NULL
  CHECK (accessibility IN ('full', 'partial', 'none'));
