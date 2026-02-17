-- Migration 035: Add YouTube video support and singer consent to singer_highlights
-- Part of the Featured Singers Video Showcase feature

-- Add video URL and consent status columns
ALTER TABLE public.singer_highlights
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS consent_status TEXT NOT NULL DEFAULT 'pending';

-- Constrain consent values
ALTER TABLE public.singer_highlights
  ADD CONSTRAINT singer_highlights_consent_check
  CHECK (consent_status IN ('pending', 'approved', 'declined'));

-- Backfill: existing highlights get auto-approved so they don't disappear from homepage
UPDATE public.singer_highlights SET consent_status = 'approved' WHERE consent_status = 'pending';

-- Index for public queries filtering by consent
CREATE INDEX IF NOT EXISTS idx_singer_highlights_consent
  ON public.singer_highlights(consent_status)
  WHERE consent_status = 'approved';

-- Singers can update their own consent_status (approve/decline being featured)
CREATE POLICY "singer_highlights_singer_consent"
  ON public.singer_highlights FOR UPDATE
  USING (auth.uid() = singer_user_id)
  WITH CHECK (auth.uid() = singer_user_id);
