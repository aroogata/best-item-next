-- Add images_json column to draft_article_products for staging local shop image galleries
ALTER TABLE draft_article_products ADD COLUMN IF NOT EXISTS images_json TEXT;
