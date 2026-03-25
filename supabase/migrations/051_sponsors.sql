-- Sponsors / Partners table for homepage showcase
-- Admin-managed: liquor brands, equipment vendors, general sponsors

CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  link_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tagline TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsors ADD CONSTRAINT sponsors_category_check
  CHECK (category IN ('liquor', 'equipment', 'general', 'venue', 'entertainment'));

-- Public read (homepage carousel)
CREATE POLICY "sponsors_public_read"
  ON public.sponsors FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "sponsors_admin_all"
  ON public.sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION update_sponsors_updated_at();
