-- Featured Singer & Contest opt-in columns on profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS featured_singer_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_singer_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contest_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contest_agreed_at TIMESTAMPTZ;
