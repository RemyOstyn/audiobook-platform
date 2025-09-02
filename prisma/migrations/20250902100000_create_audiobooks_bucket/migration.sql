-- Create audiobooks storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audiobooks',
  'audiobooks', 
  false, -- Private bucket, requires authentication
  524288000, -- 500MB limit (500 * 1024 * 1024)
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/m4b']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for audiobooks bucket
-- Policy: Admin users can upload files
CREATE POLICY "Admin users can upload audiobooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audiobooks' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Admin users can read files
CREATE POLICY "Admin users can read audiobooks"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audiobooks'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Authenticated users can read files (for playback)
CREATE POLICY "Authenticated users can read audiobooks for playback"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'audiobooks');

-- Policy: Admin users can delete files
CREATE POLICY "Admin users can delete audiobooks"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audiobooks'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);