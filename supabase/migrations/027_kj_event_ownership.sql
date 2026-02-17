-- Migration 027: KJ Event Ownership + Enhanced Venue Listing Fields
-- Transfers event management to KJs and adds detailed venue attributes

-- ═══════════════════════════════════════════════════════════════
-- 1. Add kj_user_id to venue_events
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.venue_events
  ADD COLUMN IF NOT EXISTS kj_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_venue_events_kj ON public.venue_events(kj_user_id);

-- ═══════════════════════════════════════════════════════════════
-- 2. Add event_id to venue_promos (event-scoped promos)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.venue_promos
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.venue_events(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. Add event_id to venue_media (event-scoped media)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.venue_media
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.venue_events(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════
-- 4. Enhanced venue listing fields (each IF NOT EXISTS for safety)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS hours_of_operation JSONB DEFAULT '{}';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS venue_type TEXT DEFAULT 'karaoke_night';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS restrictions JSONB DEFAULT '[]';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS custom_rules TEXT[] DEFAULT '{}';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS age_restriction TEXT DEFAULT 'all_ages';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS dress_code TEXT DEFAULT 'casual';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS cover_charge TEXT DEFAULT 'free';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS drink_minimum TEXT DEFAULT 'none';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS parking TEXT DEFAULT 'street';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS capacity TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS food_available BOOLEAN DEFAULT true;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS happy_hour_details TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 5. RLS: KJ event management policies
-- ═══════════════════════════════════════════════════════════════

-- KJs can create events at venues they're connected to
DROP POLICY IF EXISTS "kj_insert_events" ON public.venue_events;
CREATE POLICY "kj_insert_events"
  ON public.venue_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venue_staff
      WHERE venue_staff.venue_id = venue_events.venue_id
        AND venue_staff.user_id = auth.uid()
        AND venue_staff.accepted_at IS NOT NULL
    )
  );

-- KJs can update their own events
DROP POLICY IF EXISTS "kj_update_own_events" ON public.venue_events;
CREATE POLICY "kj_update_own_events"
  ON public.venue_events FOR UPDATE
  USING (kj_user_id = auth.uid());

-- KJs can delete their own events
DROP POLICY IF EXISTS "kj_delete_own_events" ON public.venue_events;
CREATE POLICY "kj_delete_own_events"
  ON public.venue_events FOR DELETE
  USING (kj_user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 6. RLS: KJ promo management policies
-- ═══════════════════════════════════════════════════════════════

-- KJs can create promos at connected venues
DROP POLICY IF EXISTS "kj_insert_promos" ON public.venue_promos;
CREATE POLICY "kj_insert_promos"
  ON public.venue_promos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venue_staff
      WHERE venue_staff.venue_id = venue_promos.venue_id
        AND venue_staff.user_id = auth.uid()
        AND venue_staff.accepted_at IS NOT NULL
    )
  );

-- KJs can update promos linked to their events
DROP POLICY IF EXISTS "kj_update_event_promos" ON public.venue_promos;
CREATE POLICY "kj_update_event_promos"
  ON public.venue_promos FOR UPDATE
  USING (
    event_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.venue_events
      WHERE venue_events.id = venue_promos.event_id
        AND venue_events.kj_user_id = auth.uid()
    )
  );

-- KJs can delete promos linked to their events
DROP POLICY IF EXISTS "kj_delete_event_promos" ON public.venue_promos;
CREATE POLICY "kj_delete_event_promos"
  ON public.venue_promos FOR DELETE
  USING (
    event_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.venue_events
      WHERE venue_events.id = venue_promos.event_id
        AND venue_events.kj_user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 7. RLS: KJ venue listing update (limited fields)
-- ═══════════════════════════════════════════════════════════════

-- KJs can update venue listing details for connected venues
DROP POLICY IF EXISTS "kj_update_venue_listing" ON public.venues;
CREATE POLICY "kj_update_venue_listing"
  ON public.venues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_staff
      WHERE venue_staff.venue_id = venues.id
        AND venue_staff.user_id = auth.uid()
        AND venue_staff.accepted_at IS NOT NULL
    )
  );
