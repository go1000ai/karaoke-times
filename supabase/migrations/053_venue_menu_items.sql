-- Store extracted menu items as JSON on venues
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS menu_items JSONB;
