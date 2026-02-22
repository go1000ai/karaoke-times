-- Track whether newsletter was sent manually or by AI
ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'ai_generated', 'ai_auto'));

ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS admin_context TEXT;
