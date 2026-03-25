-- Add instagram handle to venues
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS instagram TEXT;
