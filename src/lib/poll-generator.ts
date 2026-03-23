/**
 * 記事公開時にAIでアンケートを自動生成し、Supabaseに保存する。
 */

interface PollQuestion {
  question: string;
  options: string[];
}

/**
 * OpenRouter API経由でアンケート質問を生成する。
 */
async function generatePollWithAI(
  title: string,
  keyword: string,
  productNames: string[]
): Promise<PollQuestion[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[poll-generator] OPENROUTER_API_KEY not set, skipping AI poll generation");
    return [];
  }

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
      Authorization: `Bearer ${apiKey}`,
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
    console.error("[poll-generator] AI API error:", res.status);
    return [];
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  // JSONパース（コードブロック除去）
  const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  try {
    const polls = JSON.parse(cleaned) as PollQuestion[];
    return polls.filter(
      (p) => p.question && Array.isArray(p.options) && p.options.length >= 2
    );
  } catch {
    console.error("[poll-generator] Failed to parse AI response:", cleaned);
    return [];
  }
}

/**
 * 記事公開時にアンケートを生成してSupabaseに保存する。
 * 既にアンケートがある場合はスキップ。
 */
export async function generateAndSavePoll(
  articleId: string,
  title: string,
  keyword: string,
  productNames: string[],
  supabaseBaseUrl: string,
  serviceRoleKey: string
): Promise<{ created: number }> {
  const restBase = `${supabaseBaseUrl}/rest/v1`;
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  // 既存アンケートチェック
  const existingRes = await fetch(
    `${restBase}/article_polls?article_id=eq.${articleId}&select=id&limit=1`,
    { headers, cache: "no-store" }
  );
  if (existingRes.ok) {
    const existing = await existingRes.json();
    if (existing.length > 0) {
      return { created: 0 };
    }
  }

  const polls = await generatePollWithAI(title, keyword, productNames);
  if (polls.length === 0) return { created: 0 };

  let created = 0;
  for (const poll of polls.slice(0, 2)) {
    // アンケート挿入
    const pollRes = await fetch(`${restBase}/article_polls`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        article_id: articleId,
        question: poll.question,
        poll_type: "single_choice",
        is_active: true,
      }),
    });

    if (!pollRes.ok) {
      console.error("[poll-generator] Failed to create poll:", await pollRes.text());
      continue;
    }

    const pollData = (await pollRes.json()) as Array<{ id: string }> | { id: string };
    const pollId = Array.isArray(pollData) ? pollData[0]?.id : pollData.id;
    if (!pollId) continue;

    // 選択肢挿入
    for (const [index, label] of poll.options.entries()) {
      await fetch(`${restBase}/poll_options`, {
        method: "POST",
        headers: { ...headers, Prefer: "" },
        body: JSON.stringify({
          poll_id: pollId,
          label,
          sort_order: index,
        }),
      });
    }
    created++;
  }

  return { created };
}
