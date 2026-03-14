ALTER TABLE draft_articles
  ADD COLUMN IF NOT EXISTS manual_title TEXT,
  ADD COLUMN IF NOT EXISTS manual_meta_description TEXT;
