CREATE TABLE IF NOT EXISTS event_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  venue_name text,
  day_of_week text NOT NULL,
  start_time text NOT NULL,
  end_time text,
  location text,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders" ON event_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" ON event_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON event_reminders
  FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX event_reminders_unique ON event_reminders (user_id, venue_id, day_of_week);
