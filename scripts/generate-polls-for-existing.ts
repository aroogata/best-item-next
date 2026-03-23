/**
 * 既存の公開記事にアンケートを一括生成するスクリプト。
 *
 * Usage:
 *   npx tsx scripts/generate-polls-for-existing.ts [--dry-run] [--slug xxx]
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function generatePollWithAI(
  title: string,
  keyword: string,
  productNames: string[]
): Promise<Array<{ question: string; options: string[] }>> {
  const prompt = `あなたは日本語のおすすめ商品比較サイトのUGCアンケート設計者です。

以下の記事情報をもとに、読者が気軽に投票できるアンケートを1〜2問作ってください。

【記事タイトル】${title}
【ターゲットキーワード】${keyword}
【紹介商品】${productNames.slice(0, 8).join("、")}

【ルール】
- 1問あたり選択肢は3〜5個
- 選択肢は短く簡潔に（10文字以内が理想）
- 読者が「どれを選ぶか」迷うような、商品選びの軸になる質問にする
- 例: 「あなたが最も重視するポイントは？」「どの価格帯を検討していますか？」
- 商品名を直接選択肢にする質問も1問含めてよい
- JSON形式で出力してください

出力形式:
[
  {
    "question": "質問文",
    "options": ["選択肢1", "選択肢2", "選択肢3"]
  }
]

JSONのみ出力し、他の文章は一切含めないでください。`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    console.error("AI API error:", res.status);
    return [];
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned).filter(
      (p: { question: string; options: string[] }) =>
        p.question && Array.isArray(p.options) && p.options.length >= 2
    );
  } catch {
    console.error("JSON parse error:", cleaned);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const slugArg = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

  // 公開記事を取得
  let query = supabase
    .from("articles")
    .select(`
      id, slug, title, target_keyword,
      article_products (
        rank,
        products (name)
      )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (slugArg) {
    query = query.eq("slug", slugArg.startsWith("/") ? slugArg : `/${slugArg}/`);
  }

  const { data: articles, error } = await query;
  if (error) {
    console.error("Failed to fetch articles:", error.message);
    process.exit(1);
  }

  console.log(`Found ${articles?.length || 0} articles`);

  for (const article of articles || []) {
    // 既存アンケートチェック
    const { data: existing } = await supabase
      .from("article_polls")
      .select("id")
      .eq("article_id", article.id)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  SKIP ${article.slug} (already has polls)`);
      continue;
    }

    const productNames = (article.article_products || [])
      .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
      .map((ap: any) => ap.products?.name)
      .filter(Boolean);

    console.log(`  Processing: ${article.slug} (${productNames.length} products)`);

    if (dryRun) {
      console.log(`    [DRY RUN] Would generate polls for "${article.title}"`);
      continue;
    }

    const polls = await generatePollWithAI(
      article.title,
      article.target_keyword,
      productNames
    );

    if (polls.length === 0) {
      console.log(`    No polls generated`);
      continue;
    }

    for (const poll of polls.slice(0, 2)) {
      const { data: pollData, error: pollError } = await supabase
        .from("article_polls")
        .insert({
          article_id: article.id,
          question: poll.question,
          poll_type: "single_choice",
          is_active: true,
        })
        .select("id")
        .single();

      if (pollError || !pollData) {
        console.error(`    Poll insert error:`, pollError?.message);
        continue;
      }

      for (const [i, label] of poll.options.entries()) {
        await supabase.from("poll_options").insert({
          poll_id: pollData.id,
          label,
          sort_order: i,
        });
      }

      console.log(`    Created: "${poll.question}" (${poll.options.length} options)`);
    }

    // レート制限対策
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("Done!");
}

main();
