-- ============================================================
-- Draft staging tables for linksurge-crawler -> best-item-next handoff
-- ============================================================

CREATE TABLE IF NOT EXISTS draft_articles (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug            TEXT UNIQUE NOT NULL,         -- /lotion-osusume/
  target_keyword         TEXT NOT NULL,
  search_keyword         TEXT,
  title                  TEXT,
  meta_description       TEXT,
  hero_image_url         TEXT,
  draft_status           TEXT DEFAULT 'pending',       -- pending | generating | done | error | redirect
  source_updated_at      TIMESTAMPTZ,
  last_synced_at         TIMESTAMPTZ DEFAULT NOW(),
  published_at           TIMESTAMPTZ,
  published_article_id   UUID REFERENCES articles(id) ON DELETE SET NULL,
  published_by           TEXT,
  published_to_supabase  BOOLEAN DEFAULT FALSE,
  error_message          TEXT,
  payload_json           JSONB DEFAULT '{}'::jsonb,    -- full raw payload from linksurge-crawler
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS draft_article_sections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_article_id UUID NOT NULL REFERENCES draft_articles(id) ON DELETE CASCADE,
  section_type     TEXT NOT NULL,                      -- intro | criteria | faq | conclusion | references
  sort_order       INTEGER DEFAULT 0,
  content          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draft_article_id, section_type)
);

CREATE TABLE IF NOT EXISTS draft_article_products (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_article_id          UUID NOT NULL REFERENCES draft_articles(id) ON DELETE CASCADE,
  rank                      INTEGER NOT NULL,
  rakuten_item_id           TEXT,
  name                      TEXT NOT NULL,
  price                     INTEGER,
  affiliate_url             TEXT,
  image_url                 TEXT,
  review_count              INTEGER DEFAULT 0,
  review_average            REAL DEFAULT 0,
  shop_name                 TEXT,
  description               TEXT,
  ai_review                 TEXT,
  ai_features               TEXT,
  ai_cons                   TEXT,
  ai_recommended_for        TEXT,
  ai_not_recommended_for    TEXT,
  raw_product_json          JSONB DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draft_article_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_draft_articles_status
  ON draft_articles(draft_status);

CREATE INDEX IF NOT EXISTS idx_draft_articles_published
  ON draft_articles(published_to_supabase);

CREATE INDEX IF NOT EXISTS idx_draft_articles_source_updated
  ON draft_articles(source_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_sections_article
  ON draft_article_sections(draft_article_id);

CREATE INDEX IF NOT EXISTS idx_draft_products_article
  ON draft_article_products(draft_article_id);

ALTER TABLE draft_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_article_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_article_products ENABLE ROW LEVEL SECURITY;

-- Public clients must not read crawler staging data.
CREATE POLICY "service_all_draft_articles"
  ON draft_articles FOR ALL USING (true);

CREATE POLICY "service_all_draft_article_sections"
  ON draft_article_sections FOR ALL USING (true);

CREATE POLICY "service_all_draft_article_products"
  ON draft_article_products FOR ALL USING (true);
