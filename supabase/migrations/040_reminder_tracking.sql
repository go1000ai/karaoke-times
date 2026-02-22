-- Track when reminders were last sent to avoid duplicates
ALTER TABLE public.event_reminders
  ADD COLUMN IF NOT EXISTS last_24h_reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_4h_reminder_at TIMESTAMPTZ;
