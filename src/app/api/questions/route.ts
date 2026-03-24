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

// GET /api/questions?article_id=xxx
export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("article_id");
  if (!articleId) {
    return NextResponse.json({ error: "article_id is required" }, { status: 400 });
  }

  const { data: questions, error } = await supabase
    .from("article_questions")
    .select(`
      id, question, nickname, user_id, helpful_count, created_at,
      user_profiles(display_name, avatar_url, rank),
      article_answers (id, answer, nickname, user_id, helpful_count, created_at, user_profiles(display_name, avatar_url, rank))
    `)
    .eq("article_id", articleId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: questions || [] });
}

// POST /api/questions
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "question") return handleQuestion(body);
  if (action === "answer") return handleAnswer(body);
  if (action === "helpful") return handleHelpful(body);

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function handleQuestion(body: {
  article_id: string; question: string; nickname?: string; fingerprint: string;
}) {
  const { article_id, question, nickname, fingerprint } = body;
  if (!article_id || !question?.trim() || !fingerprint) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const trimmed = question.trim();
  if (trimmed.length < 5 || trimmed.length > 500) {
    return NextResponse.json({ error: "質問は5〜500文字で入力してください" }, { status: 400 });
  }

  const { data: ngWords } = await supabaseAdmin.from("ng_words").select("word");
  let isFlagged = false;
  if (ngWords) {
    const lower = trimmed.toLowerCase();
    for (const ng of ngWords) {
      if (lower.includes(ng.word.toLowerCase())) { isFlagged = true; break; }
    }
  }

  const { data, error } = await supabaseAdmin
    .from("article_questions")
    .insert({
      article_id,
      question: trimmed,
      nickname: (nickname || "").trim().slice(0, 20) || "匿名",
      voter_fingerprint: fingerprint,
      is_approved: !isFlagged,
      is_flagged: isFlagged,
    })
    .select("id, question, nickname, helpful_count, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, question: data, is_flagged: isFlagged,
    message: isFlagged ? "質問は確認後に公開されます" : "質問を投稿しました",
  });
}

async function handleAnswer(body: {
  question_id: string; answer: string; nickname?: string; fingerprint: string;
}) {
  const { question_id, answer, nickname, fingerprint } = body;
  if (!question_id || !answer?.trim() || !fingerprint) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const trimmed = answer.trim();
  if (trimmed.length < 2 || trimmed.length > 1000) {
    return NextResponse.json({ error: "回答は2〜1000文字で入力してください" }, { status: 400 });
  }

  const { data: ngWords } = await supabaseAdmin.from("ng_words").select("word");
  let isFlagged = false;
  if (ngWords) {
    const lower = trimmed.toLowerCase();
    for (const ng of ngWords) {
      if (lower.includes(ng.word.toLowerCase())) { isFlagged = true; break; }
    }
  }

  const { data, error } = await supabaseAdmin
    .from("article_answers")
    .insert({
      question_id,
      answer: trimmed,
      nickname: (nickname || "").trim().slice(0, 20) || "匿名",
      voter_fingerprint: fingerprint,
      is_approved: !isFlagged,
      is_flagged: isFlagged,
    })
    .select("id, answer, nickname, helpful_count, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true, answer: data, is_flagged: isFlagged,
    message: isFlagged ? "回答は確認後に公開されます" : "回答を投稿しました",
  });
}

async function handleHelpful(body: { type: "question" | "answer"; id: string }) {
  const { type, id } = body;
  const table = type === "question" ? "article_questions" : "article_answers";

  const { error } = await supabaseAdmin.rpc("increment_helpful", { table_name: table, row_id: id });
  if (error) {
    // fallback: direct update
    await supabaseAdmin.from(table).update({ helpful_count: supabaseAdmin.rpc("", {}) as any }).eq("id", id);
    // simplified: just increment
    const { data: current } = await supabaseAdmin.from(table).select("helpful_count").eq("id", id).single();
    if (current) {
      await supabaseAdmin.from(table).update({ helpful_count: (current.helpful_count || 0) + 1 }).eq("id", id);
    }
  }

  return NextResponse.json({ ok: true });
}
