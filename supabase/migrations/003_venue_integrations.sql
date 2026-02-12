-- POS integrations (Toast, SkyTab, etc.) per venue
CREATE TABLE IF NOT EXISTS public.venue_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'toast', 'skytab', etc.
  client_id TEXT,
  client_secret TEXT,
  restaurant_guid TEXT, -- Toast-specific restaurant identifier
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}', -- provider-specific settings
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(venue_id, provider)
);

-- Cached menu items pulled from POS
CREATE TABLE IF NOT EXISTS public.pos_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- which POS it came from
  external_id TEXT, -- ID from the POS system
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT, -- 'drink', 'food', 'special', etc.
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false, -- bar owners can mark as "featured special"
  sort_order INT DEFAULT 0,
  raw_data JSONB, -- full original item data from POS
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_integrations_venue ON public.venue_integrations(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos_menu_items_venue ON public.pos_menu_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_pos_menu_items_featured ON public.pos_menu_items(venue_id, is_featured) WHERE is_featured = true;

-- RLS for venue_integrations (sensitive — only venue owner)
ALTER TABLE public.venue_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrations_select ON public.venue_integrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

CREATE POLICY integrations_insert ON public.venue_integrations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

CREATE POLICY integrations_update ON public.venue_integrations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

CREATE POLICY integrations_delete ON public.venue_integrations FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

-- RLS for pos_menu_items (public read, owner write)
ALTER TABLE public.pos_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY menu_items_select ON public.pos_menu_items FOR SELECT
  USING (true); -- public read

CREATE POLICY menu_items_insert ON public.pos_menu_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

CREATE POLICY menu_items_update ON public.pos_menu_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

CREATE POLICY menu_items_delete ON public.pos_menu_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));
