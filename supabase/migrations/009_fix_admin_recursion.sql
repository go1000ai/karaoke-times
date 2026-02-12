-- Fix infinite recursion in admin RLS policies on profiles table.
--
-- The admin policies in 008 query profiles to check if auth.uid() is admin,
-- but that triggers the same RLS policies again → infinite loop.
-- Fix: use a SECURITY DEFINER function that bypasses RLS to check admin status.

-- 1. Create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop the recursive policies on profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- 3. Recreate them using the safe helper function
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4. Also fix admin policies on other tables that reference profiles
-- (these don't cause recursion but are cleaner with the helper function)
DROP POLICY IF EXISTS "Admins can read all venues" ON venues;
DROP POLICY IF EXISTS "Admins can update all venues" ON venues;
DROP POLICY IF EXISTS "Admins can delete venues" ON venues;
DROP POLICY IF EXISTS "Admins can manage all events" ON venue_events;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON room_bookings;
DROP POLICY IF EXISTS "Admins can manage all reminders" ON event_reminders;

CREATE POLICY "Admins can read all venues"
  ON venues FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update all venues"
  ON venues FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can manage all events"
  ON venue_events FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can manage all bookings"
  ON room_bookings FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can manage all reminders"
  ON event_reminders FOR ALL TO authenticated USING (public.is_admin());
