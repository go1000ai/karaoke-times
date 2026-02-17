-- Migration 032: KJ Private Bookings
-- Stores private/corporate/party gigs that KJs book outside regular venue events.

CREATE TABLE IF NOT EXISTS public.kj_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kj_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL DEFAULT 'private'
    CHECK (booking_type IN ('private', 'corporate', 'party', 'wedding', 'other')),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  location TEXT,
  notes TEXT,
  price TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kj_bookings_user ON public.kj_bookings(kj_user_id);
CREATE INDEX IF NOT EXISTS idx_kj_bookings_date ON public.kj_bookings(event_date);

-- RLS
ALTER TABLE public.kj_bookings ENABLE ROW LEVEL SECURITY;

-- KJs can read their own bookings
DROP POLICY IF EXISTS "kj_select_own_bookings" ON public.kj_bookings;
CREATE POLICY "kj_select_own_bookings"
  ON public.kj_bookings FOR SELECT
  USING (kj_user_id = auth.uid());

-- KJs can create their own bookings
DROP POLICY IF EXISTS "kj_insert_own_bookings" ON public.kj_bookings;
CREATE POLICY "kj_insert_own_bookings"
  ON public.kj_bookings FOR INSERT
  WITH CHECK (kj_user_id = auth.uid());

-- KJs can update their own bookings
DROP POLICY IF EXISTS "kj_update_own_bookings" ON public.kj_bookings;
CREATE POLICY "kj_update_own_bookings"
  ON public.kj_bookings FOR UPDATE
  USING (kj_user_id = auth.uid());

-- KJs can delete their own bookings
DROP POLICY IF EXISTS "kj_delete_own_bookings" ON public.kj_bookings;
CREATE POLICY "kj_delete_own_bookings"
  ON public.kj_bookings FOR DELETE
  USING (kj_user_id = auth.uid());
