ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_category
  ON categories(parent_category_id);
