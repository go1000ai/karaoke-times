-- Add menu_url column to venues (was referenced in code but never migrated)
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS menu_url TEXT;
