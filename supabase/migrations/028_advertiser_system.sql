-- Migration 028: Advertiser System
-- Adds advertiser role, profiles, ad placements, and KJ-advertiser relationships

-- ═══════════════════════════════════════════════════════════════
-- 1. Add 'advertiser' to user_role enum
-- ═══════════════════════════════════════════════════════════════
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'advertiser';

-- ═══════════════════════════════════════════════════════════════
-- 2. Advertiser profiles
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.advertiser_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_advertiser_profiles_user ON public.advertiser_profiles(user_id);
CREATE INDEX idx_advertiser_profiles_category ON public.advertiser_profiles(category);

-- ═══════════════════════════════════════════════════════════════
-- 3. Ad placements (what advertisers create)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
  placement_type TEXT NOT NULL DEFAULT 'kj_profile',
  image_url TEXT,
  link_url TEXT,
  headline TEXT,
  body_text TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_placements_advertiser ON public.ad_placements(advertiser_id);
CREATE INDEX idx_ad_placements_type ON public.ad_placements(placement_type);

-- ═══════════════════════════════════════════════════════════════
-- 4. KJ-Advertiser ad slots (linking ads to KJs)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.kj_ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kj_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ad_placement_id UUID NOT NULL REFERENCES public.ad_placements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kj_user_id, ad_placement_id)
);

CREATE INDEX idx_kj_ad_slots_kj ON public.kj_ad_slots(kj_user_id);
CREATE INDEX idx_kj_ad_slots_placement ON public.kj_ad_slots(ad_placement_id);
CREATE INDEX idx_kj_ad_slots_status ON public.kj_ad_slots(status);

-- ═══════════════════════════════════════════════════════════════
-- 5. RLS policies
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.advertiser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kj_ad_slots ENABLE ROW LEVEL SECURITY;

-- Advertiser profiles: public read
CREATE POLICY "advertiser_profiles_public_read"
  ON public.advertiser_profiles FOR SELECT USING (true);

CREATE POLICY "advertiser_profiles_owner_insert"
  ON public.advertiser_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "advertiser_profiles_owner_update"
  ON public.advertiser_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Ad placements: public read, advertiser manages own
CREATE POLICY "ad_placements_public_read"
  ON public.ad_placements FOR SELECT USING (true);

CREATE POLICY "ad_placements_advertiser_insert"
  ON public.ad_placements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.advertiser_profiles
    WHERE id = advertiser_id AND user_id = auth.uid()
  ));

CREATE POLICY "ad_placements_advertiser_update"
  ON public.ad_placements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.advertiser_profiles
    WHERE id = advertiser_id AND user_id = auth.uid()
  ));

CREATE POLICY "ad_placements_advertiser_delete"
  ON public.ad_placements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.advertiser_profiles
    WHERE id = advertiser_id AND user_id = auth.uid()
  ));

-- KJ ad slots: KJ and advertiser can view
CREATE POLICY "kj_ad_slots_read"
  ON public.kj_ad_slots FOR SELECT
  USING (
    auth.uid() = kj_user_id
    OR EXISTS (
      SELECT 1 FROM public.ad_placements ap
      JOIN public.advertiser_profiles adv ON adv.id = ap.advertiser_id
      WHERE ap.id = ad_placement_id AND adv.user_id = auth.uid()
    )
  );

-- Advertisers can propose ad slots to KJs
CREATE POLICY "kj_ad_slots_advertiser_insert"
  ON public.kj_ad_slots FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ad_placements ap
    JOIN public.advertiser_profiles adv ON adv.id = ap.advertiser_id
    WHERE ap.id = ad_placement_id AND adv.user_id = auth.uid()
  ));

-- KJs can accept/reject ad slots
CREATE POLICY "kj_ad_slots_kj_update"
  ON public.kj_ad_slots FOR UPDATE
  USING (auth.uid() = kj_user_id);

-- ═══════════════════════════════════════════════════════════════
-- 6. Updated_at trigger
-- ═══════════════════════════════════════════════════════════════
CREATE TRIGGER set_advertiser_updated_at
  BEFORE UPDATE ON public.advertiser_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
