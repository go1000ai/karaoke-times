-- Migration 033: KJ Booking Requests
-- Extends kj_bookings so singers and venue owners can request/book KJs.

-- Who submitted the request (NULL for KJ-created bookings)
ALTER TABLE public.kj_bookings
  ADD COLUMN IF NOT EXISTS requested_by UUID
  CONSTRAINT kj_bookings_requested_by_fkey
  REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Source of the booking
ALTER TABLE public.kj_bookings
  ADD COLUMN IF NOT EXISTS request_source TEXT NOT NULL DEFAULT 'kj_created'
  CHECK (request_source IN ('kj_created', 'singer_request', 'owner_request'));

-- Venue context for owner requests
ALTER TABLE public.kj_bookings
  ADD COLUMN IF NOT EXISTS venue_id UUID
  REFERENCES public.venues(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kj_bookings_requested_by ON public.kj_bookings(requested_by);
CREATE INDEX IF NOT EXISTS idx_kj_bookings_venue ON public.kj_bookings(venue_id);

-- Add 'declined' to status constraint
ALTER TABLE public.kj_bookings DROP CONSTRAINT IF EXISTS kj_bookings_status_check;
ALTER TABLE public.kj_bookings ADD CONSTRAINT kj_bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'declined'));

-- Update RLS policies

-- SELECT: KJ sees own bookings + requester sees their requests
DROP POLICY IF EXISTS "kj_select_own_bookings" ON public.kj_bookings;
DROP POLICY IF EXISTS "kj_select_bookings" ON public.kj_bookings;
CREATE POLICY "kj_select_bookings"
  ON public.kj_bookings FOR SELECT
  USING (
    kj_user_id = auth.uid()
    OR requested_by = auth.uid()
  );

-- INSERT: KJ creating own OR requester submitting a request
DROP POLICY IF EXISTS "kj_insert_own_bookings" ON public.kj_bookings;
DROP POLICY IF EXISTS "kj_insert_bookings" ON public.kj_bookings;
CREATE POLICY "kj_insert_bookings"
  ON public.kj_bookings FOR INSERT
  WITH CHECK (
    kj_user_id = auth.uid()
    OR requested_by = auth.uid()
  );

-- UPDATE: KJ can update their own bookings (unchanged from 032)

-- DELETE: KJ can delete own bookings + requester can cancel pending requests
DROP POLICY IF EXISTS "kj_delete_own_bookings" ON public.kj_bookings;
DROP POLICY IF EXISTS "kj_delete_bookings" ON public.kj_bookings;
CREATE POLICY "kj_delete_bookings"
  ON public.kj_bookings FOR DELETE
  USING (
    kj_user_id = auth.uid()
    OR (requested_by = auth.uid() AND status = 'pending')
  );
