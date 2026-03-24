-- ポイント交換 + 月次抽選

-- ────────────────────────────────────────
-- ギフト交換申請
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  gift_type TEXT NOT NULL DEFAULT 'giftee',
  gift_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  gift_url TEXT,
  gift_code TEXT,
  giftee_order_id TEXT,
  admin_note TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gift_exchanges_user ON gift_exchanges(user_id);
CREATE INDEX idx_gift_exchanges_status ON gift_exchanges(status);

-- ────────────────────────────────────────
-- 抽選キャンペーン
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lottery_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  entry_cost INTEGER NOT NULL DEFAULT 1000,
  prize_description TEXT NOT NULL,
  prize_amount INTEGER NOT NULL DEFAULT 500,
  max_winners INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'drawn', 'fulfilled')),
  entry_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  entry_end TIMESTAMPTZ NOT NULL,
  drawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────
-- 抽選エントリー
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lottery_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES lottery_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  gift_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

CREATE INDEX idx_lottery_entries_campaign ON lottery_entries(campaign_id);
CREATE INDEX idx_lottery_entries_user ON lottery_entries(user_id);

-- ────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────
ALTER TABLE gift_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own exchanges"
  ON gift_exchanges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages exchanges"
  ON gift_exchanges FOR ALL USING (true);

CREATE POLICY "Anyone can read open campaigns"
  ON lottery_campaigns FOR SELECT USING (true);
CREATE POLICY "Service role manages campaigns"
  ON lottery_campaigns FOR ALL USING (true);

CREATE POLICY "Users can read own entries"
  ON lottery_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages entries"
  ON lottery_entries FOR ALL USING (true);
