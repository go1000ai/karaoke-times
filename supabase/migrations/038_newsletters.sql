-- Newsletter send history
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_by UUID REFERENCES public.profiles(id),
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletters"
  ON newsletters FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
