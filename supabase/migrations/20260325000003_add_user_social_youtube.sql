-- ユーザープロフィールにYouTubeチャンネルリンクを追加
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_youtube TEXT DEFAULT '';
