-- Prevent duplicate events (same venue + day + name + start time)
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_events_no_dupes
  ON venue_events (venue_id, day_of_week, event_name, start_time);
