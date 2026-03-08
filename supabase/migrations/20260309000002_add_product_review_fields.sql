-- article_products に詳細レビューフィールドを追加
ALTER TABLE article_products
  ADD COLUMN IF NOT EXISTS ai_cons TEXT,                 -- 気になるところ（デメリット）
  ADD COLUMN IF NOT EXISTS ai_not_recommended_for TEXT;  -- おすすめできない人
