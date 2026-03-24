import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/moderation?filter=flagged|all|approved&type=all|reviews|comments|questions|answers&page=1
export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get("filter") || "flagged";
  const type = request.nextUrl.searchParams.get("type") || "all";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const perPage = 30;
  const offset = (page - 1) * perPage;

  const items: any[] = [];

  const shouldFetch = (t: string) => type === "all" || type === t;

  // レビュー
  if (shouldFetch("reviews")) {
    let q = supabase
      .from("user_reviews")
      .select("id, comment, nickname, rating, user_id, is_approved, is_flagged, created_at, article_id, product_id", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filter === "flagged") q = q.eq("is_flagged", true);
    else if (filter === "pending") q = q.eq("is_approved", false);

    const { data, count } = await q.range(offset, offset + perPage - 1);
    if (data) {
      items.push(...data.map((r: any) => ({ ...r, _type: "review", _count: count })));
    }
  }

  // アンケートコメント
  if (shouldFetch("comments")) {
    let q = supabase
      .from("poll_comments")
      .select("id, comment, nickname, user_id, is_approved, is_flagged, created_at, poll_id", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filter === "flagged") q = q.eq("is_flagged", true);
    else if (filter === "pending") q = q.eq("is_approved", false);

    const { data, count } = await q.range(offset, offset + perPage - 1);
    if (data) {
      items.push(...data.map((r: any) => ({ ...r, _type: "comment", _count: count })));
    }
  }

  // 質問
  if (shouldFetch("questions")) {
    let q = supabase
      .from("article_questions")
      .select("id, question, nickname, user_id, is_approved, is_flagged, created_at, article_id", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filter === "flagged") q = q.eq("is_flagged", true);
    else if (filter === "pending") q = q.eq("is_approved", false);

    const { data, count } = await q.range(offset, offset + perPage - 1);
    if (data) {
      items.push(...data.map((r: any) => ({ ...r, _type: "question", _count: count })));
    }
  }

  // 回答
  if (shouldFetch("answers")) {
    let q = supabase
      .from("article_answers")
      .select("id, answer, nickname, user_id, is_approved, is_flagged, created_at, question_id", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filter === "flagged") q = q.eq("is_flagged", true);
    else if (filter === "pending") q = q.eq("is_approved", false);

    const { data, count } = await q.range(offset, offset + perPage - 1);
    if (data) {
      items.push(...data.map((r: any) => ({ ...r, _type: "answer", _count: count })));
    }
  }

  // 日付順にソート
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // フラグ付き件数カウント
  const [r1, r2, r3, r4] = await Promise.all([
    supabase.from("user_reviews").select("id", { count: "exact", head: true }).eq("is_flagged", true),
    supabase.from("poll_comments").select("id", { count: "exact", head: true }).eq("is_flagged", true),
    supabase.from("article_questions").select("id", { count: "exact", head: true }).eq("is_flagged", true),
    supabase.from("article_answers").select("id", { count: "exact", head: true }).eq("is_flagged", true),
  ]);
  const flaggedCount = (r1.count || 0) + (r2.count || 0) + (r3.count || 0) + (r4.count || 0);

  return NextResponse.json({ items, flaggedCount, page, perPage });
}

// POST /api/admin/moderation - 承認 / 削除
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, type, id } = body;

  if (!action || !type || !id) {
    return NextResponse.json({ error: "action, type, id are required" }, { status: 400 });
  }

  const tableMap: Record<string, string> = {
    review: "user_reviews",
    comment: "poll_comments",
    question: "article_questions",
    answer: "article_answers",
  };

  const table = tableMap[type];
  if (!table) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (action === "approve") {
    const { error } = await supabase
      .from(table)
      .update({ is_approved: true, is_flagged: false })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "approved" });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "deleted" });
  }

  if (action === "flag") {
    const { error } = await supabase
      .from(table)
      .update({ is_approved: false, is_flagged: true })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "flagged" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
