-- ============================================================
-- best-item.co.jp Supabase スキーマ
-- Supabase の SQL Editor に貼り付けて実行してください
-- ============================================================

-- カテゴリ（化粧水・プロテイン等）
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,   -- 例: kosui, protein
  name        TEXT NOT NULL,          -- 例: 化粧水・美容液
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 商品マスター（楽天から取得）
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rakuten_item_id  TEXT UNIQUE,
  name             TEXT NOT NULL,
  price            INTEGER,
  url              TEXT,
  affiliate_url    TEXT,
  image_url        TEXT,
  review_count     INTEGER DEFAULT 0,
  review_average   REAL    DEFAULT 0,
  shop_name        TEXT,
  description      TEXT,
  genre_name       TEXT,
  last_fetched_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 記事（1記事 = 1キーワードの比較ページ）
CREATE TABLE articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID REFERENCES categories(id),
  slug             TEXT UNIQUE NOT NULL,  -- URLのパス: /kosui/osusume/
  target_keyword   TEXT NOT NULL,         -- 例: 化粧水 おすすめ
  title            TEXT NOT NULL,
  h1               TEXT,
  meta_description TEXT,
  status           TEXT DEFAULT 'draft',  -- draft | review | published
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 記事コンテンツ（セクション単位でAI生成テキストを保存）
CREATE TABLE article_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   UUID REFERENCES articles(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,   -- intro | criteria | product_reviews | faq | conclusion
  sort_order   INTEGER DEFAULT 0,
  content      TEXT,            -- Markdown テキスト
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 記事×商品（ランキング・AI生成レビュー）
CREATE TABLE article_products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id       UUID REFERENCES articles(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES products(id),
  rank             INTEGER NOT NULL,      -- 1〜25
  ai_review        TEXT,                  -- AI生成の商品紹介文
  ai_features      TEXT,                  -- AI生成の特徴・ポイント
  ai_recommended_for TEXT,               -- AI生成のおすすめな人
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, rank)
);

-- インデックス
CREATE INDEX idx_articles_status      ON articles(status);
CREATE INDEX idx_articles_category    ON articles(category_id);
CREATE INDEX idx_article_products_art ON article_products(article_id);
CREATE INDEX idx_products_review      ON products(review_count DESC);

-- Row Level Security（公開記事は全員読み取り可）
ALTER TABLE articles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "public_read_sections" ON article_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles a WHERE a.id = article_id AND a.status = 'published')
  );

CREATE POLICY "public_read_article_products" ON article_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles a WHERE a.id = article_id AND a.status = 'published')
  );

CREATE POLICY "public_read_products"   ON products    FOR SELECT USING (true);
CREATE POLICY "public_read_categories" ON categories  FOR SELECT USING (true);

-- サービスロール（管理画面・パイプライン）は全操作許可
CREATE POLICY "service_all_articles"    ON articles         FOR ALL USING (true);
CREATE POLICY "service_all_sections"    ON article_sections FOR ALL USING (true);
CREATE POLICY "service_all_art_prod"    ON article_products FOR ALL USING (true);
CREATE POLICY "service_all_products"    ON products         FOR ALL USING (true);
CREATE POLICY "service_all_categories"  ON categories       FOR ALL USING (true);
