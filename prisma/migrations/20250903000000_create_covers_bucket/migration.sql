-- Create covers storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers', 
  true, -- Public bucket for serving cover images
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for covers bucket
-- Policy: Admin users can upload files
CREATE POLICY "Admin users can upload covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Anyone can read files (public bucket)
CREATE POLICY "Anyone can read covers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Policy: Admin users can delete files
CREATE POLICY "Admin users can delete covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);