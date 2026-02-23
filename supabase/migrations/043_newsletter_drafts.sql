-- Newsletter drafts for save/edit before sending
CREATE TABLE IF NOT EXISTS public.newsletter_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  body_html TEXT,
  admin_context TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletter drafts"
  ON newsletter_drafts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
