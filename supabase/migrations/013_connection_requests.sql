-- Allow KJs to insert their own connection requests (not just venue owners)
DROP POLICY IF EXISTS staff_insert ON public.venue_staff;
CREATE POLICY staff_insert ON public.venue_staff FOR INSERT
  WITH CHECK (
    -- Owner inviting a KJ to their venue
    EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
    -- OR a user requesting connection for themselves
    OR auth.uid() = user_id
  );
