-- ============================================================
-- 画像ストレージ: article-images バケット + hero_image_url カラム
-- ============================================================

-- articles テーブルに hero_image_url を追加
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- Supabase Storage バケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,          -- 公開バケット
  5242880,       -- 5MB 上限
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 公開読み取りポリシー
CREATE POLICY "public_read_article_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

-- サービスロール: アップロード・削除許可
CREATE POLICY "service_upload_article_images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'article-images');

CREATE POLICY "service_delete_article_images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'article-images');
