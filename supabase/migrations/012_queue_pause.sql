-- Add queue pause flag to venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS queue_paused BOOLEAN NOT NULL DEFAULT false;

-- RPC to toggle queue pause — SECURITY DEFINER so KJ staff can call it
-- without needing UPDATE access to the venues table
CREATE OR REPLACE FUNCTION public.toggle_queue_pause(p_venue_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  caller UUID := auth.uid();
  is_authorized BOOLEAN;
  new_value BOOLEAN;
BEGIN
  -- Check: caller is venue owner OR accepted KJ staff
  SELECT EXISTS (
    SELECT 1 FROM public.venues WHERE id = p_venue_id AND owner_id = caller
    UNION ALL
    SELECT 1 FROM public.venue_staff WHERE venue_id = p_venue_id AND user_id = caller AND accepted_at IS NOT NULL
  ) INTO is_authorized;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Not authorized to manage this venue queue';
  END IF;

  UPDATE public.venues
    SET queue_paused = NOT queue_paused
    WHERE id = p_venue_id
    RETURNING queue_paused INTO new_value;

  RETURN new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
