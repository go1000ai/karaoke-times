-- Add facebook URL to venues
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Add karaoke_type to venues: 'open_format' (default) or 'private_room'
-- Replaces the boolean is_private_room for richer classification
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS karaoke_type TEXT DEFAULT 'open_format';

-- Migrate existing is_private_room data
UPDATE public.venues SET karaoke_type = 'private_room' WHERE is_private_room = true;
