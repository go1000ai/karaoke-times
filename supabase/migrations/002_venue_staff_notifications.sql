-- Venue staff (KJs, managers linked to venues)
CREATE TABLE IF NOT EXISTS public.venue_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'kj',
  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(venue_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_staff_venue ON public.venue_staff(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_staff_user ON public.venue_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

-- RLS for venue_staff
ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_select ON public.venue_staff FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

CREATE POLICY staff_insert ON public.venue_staff FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

CREATE POLICY staff_update ON public.venue_staff FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()) OR auth.uid() = user_id);

CREATE POLICY staff_delete ON public.venue_staff FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid()));

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_select ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notif_insert ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notif_update ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notif_delete ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Update song_queue policy to allow KJ staff to manage queue
DROP POLICY IF EXISTS "Venue owners can manage queue for their venues" ON public.song_queue;
CREATE POLICY "Venue owners and KJs can manage queue" ON public.song_queue FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.venue_staff WHERE venue_id = song_queue.venue_id AND user_id = auth.uid() AND accepted_at IS NOT NULL)
    OR auth.uid() = user_id
  );
