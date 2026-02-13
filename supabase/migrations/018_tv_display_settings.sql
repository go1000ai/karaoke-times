-- Add TV display settings as a JSONB column on venues
-- KJs/owners can toggle which content panels appear on the TV display
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS tv_display_settings JSONB DEFAULT '{
  "show_specials": true,
  "show_promos": true,
  "show_media": true,
  "show_event": true,
  "show_queue": true,
  "show_qr": true,
  "slide_interval": 8
}'::jsonb;

-- Add show_on_tv flag to venue_media so KJs can pick which images/videos display
ALTER TABLE public.venue_media
ADD COLUMN IF NOT EXISTS show_on_tv BOOLEAN NOT NULL DEFAULT false;

-- Add a label/caption for media items shown on TV
ALTER TABLE public.venue_media
ADD COLUMN IF NOT EXISTS label TEXT;
