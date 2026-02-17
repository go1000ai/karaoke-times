-- Migration 030: Database-backed KJ Profiles
-- Replaces mock-data-derived KJ directory with real profiles

CREATE TABLE public.kj_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  stage_name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  genres TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kj_profiles_slug ON public.kj_profiles(slug);
CREATE INDEX idx_kj_profiles_user ON public.kj_profiles(user_id);

ALTER TABLE public.kj_profiles ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "kj_profiles_public_read"
  ON public.kj_profiles FOR SELECT USING (true);

-- KJs can create their profile
CREATE POLICY "kj_profiles_owner_insert"
  ON public.kj_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- KJs can update their profile
CREATE POLICY "kj_profiles_owner_update"
  ON public.kj_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_kj_profile_updated_at
  BEFORE UPDATE ON public.kj_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
