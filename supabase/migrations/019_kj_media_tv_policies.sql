-- Allow connected KJs (venue_staff) to manage venue_media and update TV settings
-- KJs need to upload flyers/images, toggle show_on_tv, and save TV display settings

-- venue_media: allow KJs to insert
CREATE POLICY "Connected KJs can upload media"
  ON public.venue_media FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.venue_staff
    WHERE venue_staff.venue_id = venue_media.venue_id
      AND venue_staff.user_id = auth.uid()
      AND venue_staff.accepted_at IS NOT NULL
  ));

-- venue_media: allow KJs to update (toggle show_on_tv, etc.)
CREATE POLICY "Connected KJs can update media"
  ON public.venue_media FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.venue_staff
    WHERE venue_staff.venue_id = venue_media.venue_id
      AND venue_staff.user_id = auth.uid()
      AND venue_staff.accepted_at IS NOT NULL
  ));

-- venue_media: allow KJs to delete
CREATE POLICY "Connected KJs can delete media"
  ON public.venue_media FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.venue_staff
    WHERE venue_staff.venue_id = venue_media.venue_id
      AND venue_staff.user_id = auth.uid()
      AND venue_staff.accepted_at IS NOT NULL
  ));

-- venues: allow KJs to update venue TV settings
CREATE POLICY "Connected KJs can update venue TV settings"
  ON public.venues FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.venue_staff
    WHERE venue_staff.venue_id = venues.id
      AND venue_staff.user_id = auth.uid()
      AND venue_staff.accepted_at IS NOT NULL
  ));
