import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/ugc-sidebar?article_id=xxx
export async function GET(request: NextRequest) {
  // アクティブユーザー TOP5（ポイント順）
  const { data: activeUsers } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url, rank, points, review_count, poll_count")
    .gt("points", 0)
    .order("points", { ascending: false })
    .limit(5);

  // 最新のレビュー
  const { data: recentReviews } = await supabase
    .from("user_reviews")
    .select("id, comment, nickname, user_id, created_at, article_id, articles(slug, title)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(3);

  // 最新の質問
  const { data: recentQuestions } = await supabase
    .from("article_questions")
    .select("id, question, nickname, user_id, created_at, article_id, articles(slug, title)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(3);

  // 統合してソート
  const recentActivity = [
    ...(recentReviews || []).map((r: any) => ({
      id: r.id,
      type: "review" as const,
      text: r.comment,
      nickname: r.nickname,
      user_id: r.user_id,
      article_slug: r.articles?.slug || "",
      article_title: r.articles?.title || "",
      created_at: r.created_at,
    })),
    ...(recentQuestions || []).map((q: any) => ({
      id: q.id,
      type: "question" as const,
      text: q.question,
      nickname: q.nickname,
      user_id: q.user_id,
      article_slug: q.articles?.slug || "",
      article_title: q.articles?.title || "",
      created_at: q.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return NextResponse.json({
    activeUsers: activeUsers || [],
    recentActivity,
  });
}
