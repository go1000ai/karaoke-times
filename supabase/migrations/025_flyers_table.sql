-- Saved flyers table
CREATE TABLE IF NOT EXISTS flyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  event_date TEXT,
  theme TEXT,
  image_path TEXT NOT NULL,
  copy_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;

-- Users can read their own flyers
CREATE POLICY "Users can view own flyers"
  ON flyers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own flyers
CREATE POLICY "Users can insert own flyers"
  ON flyers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own flyers
CREATE POLICY "Users can delete own flyers"
  ON flyers FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for generated flyers
INSERT INTO storage.buckets (id, name, public)
VALUES ('flyers', 'flyers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for flyers bucket
CREATE POLICY "Authenticated users can upload flyers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'flyers');

CREATE POLICY "Anyone can view flyers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'flyers');

CREATE POLICY "Users can delete own flyers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'flyers' AND (storage.foldername(name))[1] = auth.uid()::text);
