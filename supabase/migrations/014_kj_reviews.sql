-- KJ Reviews table
CREATE TABLE public.kj_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kj_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL DEFAULT '',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_kj_reviews_slug ON public.kj_reviews(kj_slug);
CREATE INDEX idx_kj_reviews_user ON public.kj_reviews(user_id);

-- RLS
ALTER TABLE public.kj_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY kj_reviews_read ON public.kj_reviews
  FOR SELECT USING (true);

CREATE POLICY kj_reviews_insert ON public.kj_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY kj_reviews_delete ON public.kj_reviews
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
