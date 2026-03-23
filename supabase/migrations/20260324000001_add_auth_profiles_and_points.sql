-- 認証UGC Phase 1: ユーザープロフィール + ポイントシステム

-- ────────────────────────────────────────
-- ユーザープロフィール（auth.usersと1:1）
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  provider TEXT NOT NULL DEFAULT 'email',
  points INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'bronze',
  review_count INTEGER NOT NULL DEFAULT 0,
  poll_count INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  answer_count INTEGER NOT NULL DEFAULT 0,
  helpful_received INTEGER NOT NULL DEFAULT 0,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────
-- ポイント履歴
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT DEFAULT '',
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_action ON point_transactions(user_id, action);

-- ────────────────────────────────────────
-- 既存UGCテーブルに user_id カラム追加（NULLable = 匿名投稿も継続）
-- ────────────────────────────────────────
ALTER TABLE poll_votes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE poll_comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE user_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE article_questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE article_answers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- プロフィール: 誰でも読める、本人のみ更新
CREATE POLICY "Anyone can read profiles"
  ON user_profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role inserts profiles"
  ON user_profiles FOR INSERT WITH CHECK (true);

-- ポイント履歴: 本人のみ読める、サービスロールのみ挿入
CREATE POLICY "Users can read own points"
  ON point_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts points"
  ON point_transactions FOR INSERT WITH CHECK (true);

-- ────────────────────────────────────────
-- 新規ユーザー登録時に自動プロフィール作成トリガー
-- ────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url, provider, points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    100  -- 初回ログインボーナス
  )
  ON CONFLICT (id) DO NOTHING;

  -- 初回ログインボーナスのポイント履歴
  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (NEW.id, 'signup_bonus', 100, '初回ログインボーナス')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users への INSERT トリガー
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ────────────────────────────────────────
-- ランク自動更新関数
-- ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET rank = CASE
    WHEN NEW.points >= 2000 THEN 'platinum'
    WHEN NEW.points >= 500 THEN 'gold'
    WHEN NEW.points >= 100 THEN 'silver'
    ELSE 'bronze'
  END,
  updated_at = now()
  WHERE id = NEW.id AND rank != CASE
    WHEN NEW.points >= 2000 THEN 'platinum'
    WHEN NEW.points >= 500 THEN 'gold'
    WHEN NEW.points >= 100 THEN 'silver'
    ELSE 'bronze'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_points_changed ON user_profiles;
CREATE TRIGGER on_profile_points_changed
  AFTER UPDATE OF points ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rank();
