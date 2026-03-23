-- UGC: アンケート（選択式投票 + コメント）
-- article_polls: 記事ごとのアンケート質問
-- poll_options: 選択肢
-- poll_votes: 投票記録
-- poll_comments: 自由コメント
-- ng_words: NGワードフィルター

-- ────────────────────────────────────────
-- アンケート質問
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  poll_type TEXT NOT NULL DEFAULT 'single_choice',
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_polls_article_id ON article_polls(article_id);

-- ────────────────────────────────────────
-- 選択肢
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES article_polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);

-- ────────────────────────────────────────
-- 投票記録（重複投票防止用）
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES article_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, voter_fingerprint)
);

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);

-- ────────────────────────────────────────
-- 自由コメント（投票後の任意コメント）
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES article_polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  voter_fingerprint TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_poll_comments_poll_id ON poll_comments(poll_id);
CREATE INDEX idx_poll_comments_approved ON poll_comments(poll_id, is_approved);

-- ────────────────────────────────────────
-- NGワードリスト
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ng_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'spam',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────
-- RLS ポリシー
-- ────────────────────────────────────────
ALTER TABLE article_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ng_words ENABLE ROW LEVEL SECURITY;

-- 公開読み取り: アンケート・選択肢・承認済みコメント
CREATE POLICY "Anyone can read polls"
  ON article_polls FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read poll options"
  ON poll_options FOR SELECT USING (true);

CREATE POLICY "Anyone can read approved comments"
  ON poll_comments FOR SELECT USING (is_approved = true);

-- 匿名投票: anon/authenticated ユーザーが投票可能
CREATE POLICY "Anyone can vote"
  ON poll_votes FOR INSERT WITH CHECK (true);

-- 匿名コメント: anon/authenticated ユーザーがコメント可能
CREATE POLICY "Anyone can comment"
  ON poll_comments FOR INSERT WITH CHECK (true);

-- 管理者（service role）はng_wordsを管理
CREATE POLICY "Service role manages ng_words"
  ON ng_words FOR ALL USING (true);

-- vote_count / total_votes の自動更新トリガー
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- option の vote_count を更新
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = NEW.option_id;

  -- poll の total_votes を更新
  UPDATE article_polls
  SET total_votes = total_votes + 1,
      updated_at = now()
  WHERE id = NEW.poll_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_poll_vote_inserted
  AFTER INSERT ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_vote_counts();
