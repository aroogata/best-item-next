-- UGC Phase 2: ひとことレビュー + 購入者Q&A

-- ────────────────────────────────────────
-- ひとことレビュー（商品単位）
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  nickname TEXT DEFAULT '匿名',
  voter_fingerprint TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_reviews_article ON user_reviews(article_id);
CREATE INDEX idx_user_reviews_product ON user_reviews(product_id);
CREATE INDEX idx_user_reviews_approved ON user_reviews(article_id, is_approved);
CREATE UNIQUE INDEX idx_user_reviews_unique ON user_reviews(product_id, voter_fingerprint);

-- ────────────────────────────────────────
-- 購入者Q&A（記事単位）
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  nickname TEXT DEFAULT '匿名',
  voter_fingerprint TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_questions_article ON article_questions(article_id);

CREATE TABLE IF NOT EXISTS article_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES article_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  nickname TEXT DEFAULT '匿名',
  voter_fingerprint TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_answers_question ON article_answers(question_id);

-- ────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_answers ENABLE ROW LEVEL SECURITY;

-- 公開読み取り: 承認済みのみ
CREATE POLICY "Anyone can read approved reviews"
  ON user_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can insert reviews"
  ON user_reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read approved questions"
  ON article_questions FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can insert questions"
  ON article_questions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read approved answers"
  ON article_answers FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can insert answers"
  ON article_answers FOR INSERT WITH CHECK (true);
