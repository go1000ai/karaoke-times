-- Allow admins to INSERT venues (currently only SELECT/UPDATE/DELETE exist for admin)
CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
