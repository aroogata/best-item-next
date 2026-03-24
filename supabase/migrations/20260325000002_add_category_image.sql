-- カテゴリ画像カラム追加
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- カテゴリ画像用ストレージバケット
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('category-images', 'category-images', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read category images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-images');

CREATE POLICY "Service role manages category images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'category-images');

CREATE POLICY "Service role updates category images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'category-images');

CREATE POLICY "Service role deletes category images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'category-images');
