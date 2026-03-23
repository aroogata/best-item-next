-- NGワード初期データ
-- category: spam, abuse, personal_info, adult, fraud

INSERT INTO ng_words (word, category) VALUES
  -- スパム系
  ('http://', 'spam'),
  ('https://', 'spam'),
  ('www.', 'spam'),
  ('.com/', 'spam'),
  ('.jp/', 'spam'),
  ('.net/', 'spam'),
  ('LINE@', 'spam'),
  ('LINE追加', 'spam'),
  ('友達追加', 'spam'),
  ('無料プレゼント', 'spam'),
  ('今すぐクリック', 'spam'),
  ('限定無料', 'spam'),
  ('稼げる', 'spam'),
  ('儲かる', 'spam'),
  ('副業で月', 'spam'),
  ('即金', 'spam'),
  ('不労所得', 'spam'),
  ('ビットコイン', 'spam'),
  ('仮想通貨で', 'spam'),
  ('投資案件', 'spam'),

  -- 誹謗中傷・暴言
  ('死ね', 'abuse'),
  ('殺す', 'abuse'),
  ('ころす', 'abuse'),
  ('バカ', 'abuse'),
  ('アホ', 'abuse'),
  ('クズ', 'abuse'),
  ('ゴミ', 'abuse'),
  ('カス', 'abuse'),
  ('キモい', 'abuse'),
  ('きもい', 'abuse'),
  ('うざい', 'abuse'),
  ('消えろ', 'abuse'),
  ('失せろ', 'abuse'),
  ('ガイジ', 'abuse'),
  ('池沼', 'abuse'),
  ('障害者', 'abuse'),
  ('チョン', 'abuse'),
  ('シナ人', 'abuse'),

  -- 個人情報
  ('電話番号', 'personal_info'),
  ('携帯番号', 'personal_info'),
  ('住所は', 'personal_info'),
  ('自宅は', 'personal_info'),
  ('@gmail', 'personal_info'),
  ('@yahoo', 'personal_info'),
  ('@icloud', 'personal_info'),
  ('@hotmail', 'personal_info'),

  -- アダルト
  ('エロ', 'adult'),
  ('セックス', 'adult'),
  ('風俗', 'adult'),
  ('ソープ', 'adult'),
  ('デリヘル', 'adult'),
  ('パパ活', 'adult'),
  ('援交', 'adult'),
  ('裏垢', 'adult'),

  -- 詐欺・違法
  ('振込先', 'fraud'),
  ('口座番号', 'fraud'),
  ('闇金', 'fraud'),
  ('詐欺', 'fraud'),
  ('違法', 'fraud'),
  ('脱税', 'fraud'),
  ('マルチ商法', 'fraud'),
  ('ねずみ講', 'fraud')
ON CONFLICT (word) DO NOTHING;
