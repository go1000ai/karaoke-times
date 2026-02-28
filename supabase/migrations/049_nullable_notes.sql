-- Allow notes to be NULL (optional field) — prevents insert failures when
-- the form is submitted without notes.  Keep the empty-string default so
-- existing behaviour is unchanged for rows that omit the column.
ALTER TABLE public.venue_events ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE public.venue_events ALTER COLUMN notes SET DEFAULT '';

-- Back-fill any accidental NULLs (shouldn't exist, but just in case)
UPDATE public.venue_events SET notes = '' WHERE notes IS NULL;
