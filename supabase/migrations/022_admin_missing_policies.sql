-- Add admin RLS policies for tables that were missing them

-- song_queue
CREATE POLICY "Admins can manage all queue"
  ON song_queue FOR ALL TO authenticated
  USING (public.is_admin());

-- venue_staff
CREATE POLICY "Admins can manage all staff"
  ON venue_staff FOR ALL TO authenticated
  USING (public.is_admin());

-- venue_media
CREATE POLICY "Admins can manage all media"
  ON venue_media FOR ALL TO authenticated
  USING (public.is_admin());

-- venue_promos
CREATE POLICY "Admins can manage all promos"
  ON venue_promos FOR ALL TO authenticated
  USING (public.is_admin());

-- kj_reviews
CREATE POLICY "Admins can manage all kj_reviews"
  ON kj_reviews FOR ALL TO authenticated
  USING (public.is_admin());

-- notifications
CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL TO authenticated
  USING (public.is_admin());

-- favorites (read only for admin)
CREATE POLICY "Admins can read all favorites"
  ON favorites FOR SELECT TO authenticated
  USING (public.is_admin());
