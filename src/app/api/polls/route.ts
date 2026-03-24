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

// GET /api/polls?article_id=xxx&fingerprint=xxx
export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("article_id");
  const fingerprint = request.nextUrl.searchParams.get("fingerprint") || "";

  if (!articleId) {
    return NextResponse.json({ error: "article_id is required" }, { status: 400 });
  }

  // アンケートと選択肢を取得
  const { data: polls, error: pollError } = await supabase
    .from("article_polls")
    .select(`
      id, question, poll_type, total_votes, created_at,
      poll_options (id, label, sort_order, vote_count)
    `)
    .eq("article_id", articleId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (pollError) {
    return NextResponse.json({ error: pollError.message }, { status: 500 });
  }

  // ユーザーの既存投票を確認
  let votedPollIds: Record<string, string> = {};
  if (fingerprint && polls && polls.length > 0) {
    const pollIds = polls.map((p) => p.id);
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("poll_id, option_id")
      .eq("voter_fingerprint", fingerprint)
      .in("poll_id", pollIds);

    if (votes) {
      for (const v of votes) {
        votedPollIds[v.poll_id] = v.option_id;
      }
    }
  }

  // 承認済みコメント取得
  const pollIds = (polls || []).map((p) => p.id);
  let comments: Record<string, Array<{ id: string; comment: string; nickname: string; option_id: string | null; created_at: string }>> = {};
  if (pollIds.length > 0) {
    const { data: cmts } = await supabase
      .from("poll_comments")
      .select("id, poll_id, option_id, comment, nickname, user_id, created_at, user_profiles(display_name, avatar_url, rank)")
      .eq("is_approved", true)
      .in("poll_id", pollIds)
      .order("created_at", { ascending: false })
      .limit(20);

    if (cmts) {
      for (const c of cmts) {
        if (!comments[c.poll_id]) comments[c.poll_id] = [];
        comments[c.poll_id].push({
          id: c.id,
          comment: c.comment,
          nickname: c.nickname || "",
          option_id: c.option_id,
          created_at: c.created_at,
        });
      }
    }
  }

  // レスポンス整形
  const result = (polls || []).map((poll) => ({
    ...poll,
    poll_options: [...(poll.poll_options || [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
    user_voted_option_id: votedPollIds[poll.id] || null,
    comments: comments[poll.id] || [],
  }));

  return NextResponse.json({ polls: result });
}

// POST /api/polls - 投票 or コメント
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "vote") {
    return handleVote(body, request);
  } else if (action === "comment") {
    return handleComment(body);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function handleVote(
  body: { poll_id: string; option_id: string; fingerprint: string; user_id?: string },
  request: NextRequest
) {
  const { poll_id, option_id, fingerprint, user_id } = body;
  if (!poll_id || !option_id || !fingerprint) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // service role で投票を挿入（RLSバイパス）
  const { error } = await supabaseAdmin
    .from("poll_votes")
    .insert({
      poll_id,
      option_id,
      voter_fingerprint: fingerprint,
      user_id: user_id || null,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_voted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 最新の投票数を返す
  const { data: options } = await supabase
    .from("poll_options")
    .select("id, label, sort_order, vote_count")
    .eq("poll_id", poll_id)
    .order("sort_order");

  const { data: poll } = await supabase
    .from("article_polls")
    .select("total_votes")
    .eq("id", poll_id)
    .single();

  // 認証ユーザーにポイント付与
  let pointsAwarded = 0;
  if (user_id) {
    try {
      const ptRes = await fetch(new URL("/api/points", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, action: "poll_vote", reference_id: poll_id }),
      });
      const ptData = await ptRes.json();
      pointsAwarded = ptData.points || 0;
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({
    ok: true,
    options: options || [],
    total_votes: poll?.total_votes || 0,
    points_awarded: pointsAwarded,
  });
}

async function handleComment(body: {
  poll_id: string;
  option_id?: string;
  comment: string;
  nickname?: string;
  fingerprint: string;
}) {
  const { poll_id, option_id, comment, nickname, fingerprint } = body;
  if (!poll_id || !comment || !fingerprint) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const trimmed = comment.trim();
  if (trimmed.length < 2 || trimmed.length > 500) {
    return NextResponse.json({ error: "コメントは2〜500文字で入力してください" }, { status: 400 });
  }

  // NGワードチェック
  const { data: ngWords } = await supabaseAdmin
    .from("ng_words")
    .select("word");

  let isFlagged = false;
  if (ngWords) {
    const lowerComment = trimmed.toLowerCase();
    for (const ng of ngWords) {
      if (lowerComment.includes(ng.word.toLowerCase())) {
        isFlagged = true;
        break;
      }
    }
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("poll_comments")
    .insert({
      poll_id,
      option_id: option_id || null,
      comment: trimmed,
      nickname: (nickname || "").trim().slice(0, 20) || "匿名",
      voter_fingerprint: fingerprint,
      is_approved: !isFlagged,
      is_flagged: isFlagged,
    })
    .select("id, comment, nickname, option_id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    comment: inserted,
    is_flagged: isFlagged,
    message: isFlagged
      ? "コメントは確認後に公開されます"
      : "コメントを投稿しました",
  });
}
