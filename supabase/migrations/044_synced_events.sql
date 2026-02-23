-- Store CSV-synced event data (replaces filesystem writes on Vercel)
CREATE TABLE IF NOT EXISTS public.synced_events (
  id TEXT PRIMARY KEY DEFAULT 'latest',
  events_json JSONB NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  day_count INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.synced_events ENABLE ROW LEVEL SECURITY;

-- Admin-only writes, public reads (events are public data)
CREATE POLICY "Anyone can read synced events"
  ON synced_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage synced events"
  ON synced_events FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
