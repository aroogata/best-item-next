-- draft_articles に内部リンク管理フィールドを追加
-- 形式: [{"text": "リンクテキスト", "url": "/article-slug/"}, ...]
ALTER TABLE draft_articles ADD COLUMN IF NOT EXISTS related_links_json JSONB DEFAULT '[]'::jsonb;
