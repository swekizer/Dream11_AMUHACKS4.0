-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for fundraiser-images bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'fundraiser-images');

CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fundraiser-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fundraiser-images' 
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'fundraiser-images' 
  AND auth.uid() = owner
);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fundraiser-images' 
  AND auth.uid() = owner
);