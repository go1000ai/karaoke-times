-- Storage bucket policies for venue-media
-- Allow any authenticated user to upload, read, and delete from venue-media bucket

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload venue media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'venue-media');

-- Allow anyone to read venue media (public)
CREATE POLICY "Anyone can view venue media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'venue-media');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update venue media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'venue-media');

-- Allow authenticated users to delete venue media
CREATE POLICY "Authenticated users can delete venue media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'venue-media');
