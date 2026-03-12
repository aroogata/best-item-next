ALTER TABLE draft_articles
  ADD COLUMN IF NOT EXISTS manual_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_draft_articles_manual_category
  ON draft_articles(manual_category_id);
