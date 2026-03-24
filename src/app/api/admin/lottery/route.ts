import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/lottery - キャンペーン作成 / 抽選実行 / ギフト発行
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "create") return createCampaign(body);
  if (action === "draw") return drawWinners(body);
  if (action === "fulfill") return fulfillGift(body);
  if (action === "fulfill_exchange") return fulfillExchange(body);

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function createCampaign(body: {
  title: string; description?: string; entry_cost: number;
  prize_description: string; prize_amount: number;
  max_winners: number; entry_end: string;
}) {
  const { data, error } = await supabase.from("lottery_campaigns").insert({
    title: body.title,
    description: body.description || "",
    entry_cost: body.entry_cost,
    prize_description: body.prize_description,
    prize_amount: body.prize_amount,
    max_winners: body.max_winners,
    entry_end: body.entry_end,
    status: "open",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, campaign: data });
}

async function drawWinners(body: { campaign_id: string }) {
  const { campaign_id } = body;

  const { data: campaign } = await supabase
    .from("lottery_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "open" && campaign.status !== "closed") {
    return NextResponse.json({ error: "Already drawn" }, { status: 400 });
  }

  // 全エントリーを取得
  const { data: entries } = await supabase
    .from("lottery_entries")
    .select("id, user_id")
    .eq("campaign_id", campaign_id);

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: "No entries" }, { status: 400 });
  }

  // ランダム抽選
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, campaign.max_winners);

  // 当選者をマーク
  for (const winner of winners) {
    await supabase.from("lottery_entries")
      .update({ is_winner: true })
      .eq("id", winner.id);
  }

  // キャンペーンステータス更新
  await supabase.from("lottery_campaigns").update({
    status: "drawn",
    drawn_at: new Date().toISOString(),
  }).eq("id", campaign_id);

  return NextResponse.json({
    ok: true,
    total_entries: entries.length,
    winners: winners.map((w) => w.user_id),
  });
}

async function fulfillGift(body: { entry_id: string; gift_url: string }) {
  const { entry_id, gift_url } = body;

  const { error } = await supabase.from("lottery_entries")
    .update({ gift_url })
    .eq("id", entry_id)
    .eq("is_winner", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

async function fulfillExchange(body: { exchange_id: string; gift_url?: string; gift_code?: string }) {
  const { exchange_id, gift_url, gift_code } = body;

  const { error } = await supabase.from("gift_exchanges").update({
    status: "completed",
    gift_url: gift_url || null,
    gift_code: gift_code || null,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", exchange_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/admin/lottery - 管理用一覧
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "campaigns";

  if (type === "campaigns") {
    const { data } = await supabase
      .from("lottery_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    return NextResponse.json({ campaigns: data || [] });
  }

  if (type === "exchanges") {
    const { data } = await supabase
      .from("gift_exchanges")
      .select("*, user_profiles(display_name, avatar_url, rank)")
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ exchanges: data || [] });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
