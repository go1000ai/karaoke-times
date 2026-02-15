-- Create flyer-uploads storage bucket (for style reference images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('flyer-uploads', 'flyer-uploads', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for flyer-uploads bucket
CREATE POLICY "Authenticated users can upload to flyer-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'flyer-uploads');

CREATE POLICY "Anyone can view flyer-uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'flyer-uploads');

CREATE POLICY "Users can delete own flyer-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'flyer-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
