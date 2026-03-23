import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const POINT_RULES: Record<string, number> = {
  poll_vote: 10,
  review: 30,
  review_with_photo: 50,
  question: 10,
  answer: 20,
  helpful_received: 5,
  profile_complete: 50,
};

const COUNT_FIELDS: Record<string, string> = {
  poll_vote: "poll_count",
  review: "review_count",
  review_with_photo: "review_count",
  question: "question_count",
  answer: "answer_count",
};

// POST /api/points - ポイント付与
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, action, reference_id } = body;

  if (!user_id || !action) {
    return NextResponse.json({ error: "user_id and action are required" }, { status: 400 });
  }

  const points = POINT_RULES[action];
  if (!points) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // 重複付与チェック（同一アクション+リファレンスID）
  if (reference_id) {
    const { data: existing } = await supabaseAdmin
      .from("point_transactions")
      .select("id")
      .eq("user_id", user_id)
      .eq("action", action)
      .eq("reference_id", reference_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, points: 0, message: "already_awarded" });
    }
  }

  // ポイント履歴を挿入
  const { error: txError } = await supabaseAdmin
    .from("point_transactions")
    .insert({
      user_id,
      action,
      points,
      description: `${action} +${points}pt`,
      reference_id: reference_id || null,
    });

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // プロフィールのポイント加算 + カウント更新
  const updates: Record<string, any> = {};
  const countField = COUNT_FIELDS[action];

  // 現在のプロフィールを取得
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("points, " + (countField || "points"))
    .eq("id", user_id)
    .single();

  if (profile) {
    updates.points = ((profile as any).points || 0) + points;
    if (countField) {
      updates[countField] = ((profile as any)[countField] || 0) + 1;
    }
    updates.updated_at = new Date().toISOString();

    await supabaseAdmin
      .from("user_profiles")
      .update(updates)
      .eq("id", user_id);
  }

  return NextResponse.json({ ok: true, points, total: updates.points || 0 });
}

// GET /api/points?user_id=xxx - ポイント履歴取得
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const { data: transactions } = await supabaseAdmin
    .from("point_transactions")
    .select("action, points, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("points, rank")
    .eq("id", userId)
    .single();

  return NextResponse.json({
    transactions: transactions || [],
    total_points: profile?.points || 0,
    rank: profile?.rank || "bronze",
  });
}
