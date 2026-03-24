import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/reviews?article_id=xxx&fingerprint=xxx
export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("article_id");
  const fingerprint = request.nextUrl.searchParams.get("fingerprint") || "";

  if (!articleId) {
    return NextResponse.json({ error: "article_id is required" }, { status: 400 });
  }

  // 承認済みレビューを取得（認証ユーザーはプロフィール情報付き）
  const { data: reviews, error } = await supabase
    .from("user_reviews")
    .select("id, product_id, rating, comment, nickname, user_id, created_at, user_profiles(display_name, avatar_url, rank)")
    .eq("article_id", articleId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ユーザーが既にレビューした商品を確認
  let reviewedProductIds: string[] = [];
  if (fingerprint) {
    const { data: myReviews } = await supabase
      .from("user_reviews")
      .select("product_id")
      .eq("article_id", articleId)
      .eq("voter_fingerprint", fingerprint);

    if (myReviews) {
      reviewedProductIds = myReviews.map((r) => r.product_id);
    }
  }

  // 商品ごとの集計
  const productStats: Record<string, { avg: number; count: number }> = {};
  for (const r of reviews || []) {
    if (!productStats[r.product_id]) {
      productStats[r.product_id] = { avg: 0, count: 0 };
    }
    productStats[r.product_id].count++;
    productStats[r.product_id].avg += r.rating;
  }
  for (const pid of Object.keys(productStats)) {
    productStats[pid].avg = Math.round((productStats[pid].avg / productStats[pid].count) * 10) / 10;
  }

  return NextResponse.json({
    reviews: reviews || [],
    reviewedProductIds,
    productStats,
  });
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { article_id, product_id, rating, comment, nickname, fingerprint, user_id } = body;

  if (!article_id || !product_id || !rating || !comment || !fingerprint) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const trimmedComment = comment.trim();
  if (trimmedComment.length < 2 || trimmedComment.length > 300) {
    return NextResponse.json({ error: "レビューは2〜300文字で入力してください" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "評価は1〜5で選択してください" }, { status: 400 });
  }

  // NGワードチェック
  const { data: ngWords } = await supabaseAdmin.from("ng_words").select("word");
  let isFlagged = false;
  if (ngWords) {
    const lower = trimmedComment.toLowerCase();
    for (const ng of ngWords) {
      if (lower.includes(ng.word.toLowerCase())) {
        isFlagged = true;
        break;
      }
    }
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("user_reviews")
    .insert({
      article_id,
      product_id,
      rating: Math.round(rating),
      comment: trimmedComment,
      nickname: (nickname || "").trim().slice(0, 20) || "匿名",
      voter_fingerprint: fingerprint,
      user_id: user_id || null,
      is_approved: !isFlagged,
      is_flagged: isFlagged,
    })
    .select("id, product_id, rating, comment, nickname, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "この商品には既にレビュー済みです" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 認証ユーザーにポイント付与
  let pointsAwarded = 0;
  if (user_id && inserted) {
    try {
      const ptRes = await fetch(new URL("/api/points", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, action: "review", reference_id: inserted.id }),
      });
      const ptData = await ptRes.json();
      pointsAwarded = ptData.points || 0;
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({
    ok: true,
    review: inserted,
    is_flagged: isFlagged,
    points_awarded: pointsAwarded,
    message: isFlagged ? "レビューは確認後に公開されます"
      : pointsAwarded > 0 ? `レビューを投稿しました (+${pointsAwarded}pt)`
      : "レビューを投稿しました",
  });
}
