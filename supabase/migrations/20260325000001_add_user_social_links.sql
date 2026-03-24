-- ユーザーソーシャルリンク
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_x TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_instagram TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_note TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS custom_link_1_label TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS custom_link_1_url TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS custom_link_2_label TEXT DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS custom_link_2_url TEXT DEFAULT '';
