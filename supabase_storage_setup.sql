-- Create storage bucket for incident scans
-- Note: Create the bucket manually in the Supabase Dashboard first
-- Go to Storage > New Bucket > Name: "incident-scans" > Public: Yes

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access for Incident Scans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload incident scans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update incident scans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete incident scans" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public Access for Incident Scans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'incident-scans');

-- Allow anyone to upload
CREATE POLICY "Anyone can upload incident scans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'incident-scans');

-- Allow anyone to update
CREATE POLICY "Anyone can update incident scans"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'incident-scans');

-- Allow anyone to delete
CREATE POLICY "Anyone can delete incident scans"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'incident-scans');
