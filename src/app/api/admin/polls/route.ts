import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/polls?q=keyword&page=1
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("article_polls")
    .select("id, question, poll_type, is_active, total_votes, created_at, article_id, articles(slug, title), poll_options(id, label, sort_order, vote_count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (q) {
    query = query.ilike("question", `%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ polls: data || [], total: count || 0, page, perPage });
}

// POST /api/admin/polls - アンケート操作
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "toggle") return togglePoll(body);
  if (action === "delete") return deletePoll(body);
  if (action === "update_question") return updateQuestion(body);
  if (action === "update_option") return updateOption(body);
  if (action === "delete_option") return deleteOption(body);
  if (action === "add_option") return addOption(body);

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function togglePoll(body: { poll_id: string; is_active: boolean }) {
  const { error } = await supabase
    .from("article_polls")
    .update({ is_active: body.is_active })
    .eq("id", body.poll_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function deletePoll(body: { poll_id: string }) {
  const { error } = await supabase
    .from("article_polls")
    .delete()
    .eq("id", body.poll_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function updateQuestion(body: { poll_id: string; question: string }) {
  const { error } = await supabase
    .from("article_polls")
    .update({ question: body.question.trim() })
    .eq("id", body.poll_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function updateOption(body: { option_id: string; label: string }) {
  const { error } = await supabase
    .from("poll_options")
    .update({ label: body.label.trim() })
    .eq("id", body.option_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function deleteOption(body: { option_id: string }) {
  const { error } = await supabase
    .from("poll_options")
    .delete()
    .eq("id", body.option_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function addOption(body: { poll_id: string; label: string; sort_order: number }) {
  const { error } = await supabase
    .from("poll_options")
    .insert({ poll_id: body.poll_id, label: body.label.trim(), sort_order: body.sort_order });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
