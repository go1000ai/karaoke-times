-- KJ terms agreement tracking on venue connections
ALTER TABLE public.venue_staff ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ;

-- Event skip table: allows KJs/owners/admins to skip one week
CREATE TABLE IF NOT EXISTS public.event_skips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.venue_events(id) ON DELETE CASCADE,
  skip_date DATE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, skip_date)
);

ALTER TABLE public.event_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event skips"
  ON public.event_skips FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create skips"
  ON public.event_skips FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Skip creators can delete their skips"
  ON public.event_skips FOR DELETE USING (auth.uid() = created_by);
