import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 交換レート定義
const EXCHANGE_RATES = [
  { points: 500, amount: 50, label: "50円分ギフト" },
  { points: 1000, amount: 100, label: "100円分ギフト" },
  { points: 2500, amount: 300, label: "300円分ギフト" },
  { points: 5000, amount: 500, label: "500円分ギフト" },
];

// GET /api/exchange?user_id=xxx
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("points, rank")
    .eq("id", userId)
    .single();

  const { data: history } = await supabase
    .from("gift_exchanges")
    .select("id, points_spent, gift_amount, status, gift_url, created_at, completed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    points: profile?.points || 0,
    rank: profile?.rank || "bronze",
    rates: EXCHANGE_RATES,
    history: history || [],
  });
}

// POST /api/exchange - 交換申請
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, points_to_spend } = body;

  if (!user_id || !points_to_spend) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const rate = EXCHANGE_RATES.find((r) => r.points === points_to_spend);
  if (!rate) {
    return NextResponse.json({ error: "無効な交換レートです" }, { status: 400 });
  }

  // ポイント残高チェック
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("points")
    .eq("id", user_id)
    .single();

  if (!profile || profile.points < rate.points) {
    return NextResponse.json({ error: "ポイントが不足しています" }, { status: 400 });
  }

  // 処理中の申請がないかチェック
  const { data: pending } = await supabase
    .from("gift_exchanges")
    .select("id")
    .eq("user_id", user_id)
    .in("status", ["pending", "processing"])
    .limit(1);

  if (pending && pending.length > 0) {
    return NextResponse.json({ error: "処理中の交換申請があります。完了後に再度お試しください。" }, { status: 409 });
  }

  // ポイント差引
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      points: profile.points - rate.points,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user_id);

  if (updateError) {
    return NextResponse.json({ error: "ポイント更新に失敗しました" }, { status: 500 });
  }

  // ポイント履歴
  await supabase.from("point_transactions").insert({
    user_id,
    action: "gift_exchange",
    points: -rate.points,
    description: `${rate.label}に交換 (-${rate.points}pt)`,
  });

  // 交換申請作成
  const { data: exchange, error: exchangeError } = await supabase
    .from("gift_exchanges")
    .insert({
      user_id,
      points_spent: rate.points,
      gift_type: "giftee",
      gift_amount: rate.amount,
      status: "pending",
    })
    .select("id, points_spent, gift_amount, status, created_at")
    .single();

  if (exchangeError) {
    // ポイント復元
    await supabase.from("user_profiles").update({
      points: profile.points,
    }).eq("id", user_id);
    return NextResponse.json({ error: "交換申請の作成に失敗しました" }, { status: 500 });
  }

  // TODO: giftee API連携時はここで自動発行
  // const giftUrl = await issueGifteeGift(rate.amount);
  // await supabase.from("gift_exchanges").update({ status: "completed", gift_url: giftUrl, completed_at: new Date().toISOString() }).eq("id", exchange.id);

  return NextResponse.json({
    ok: true,
    exchange,
    remaining_points: profile.points - rate.points,
    message: "交換申請を受け付けました。ギフトURLは準備でき次第マイページに表示されます。",
  });
}
