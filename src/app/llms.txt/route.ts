import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://best-item.co.jp").trim().replace(/\/$/, "");

export async function GET() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, meta_description, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name");

  const categoryLines = (categories ?? [])
    .map((c) => `- ${c.name}: ${SITE_URL}/${c.slug}/`)
    .join("\n");

  const articleLines = (articles ?? [])
    .map((a) => {
      const url = `${SITE_URL}${a.slug.replace(/\/$/, "")}/`;
      const desc = a.meta_description ? ` - ${a.meta_description.slice(0, 100)}` : "";
      return `- ${a.title}${desc}\n  ${url}`;
    })
    .join("\n");

  const text = `# Best Item.
> 日本の楽天市場商品を実際に比較・調査したおすすめランキングサイト。化粧水・サプリメント・ヘアケアなど美容・健康カテゴリを中心に、レビュー数・評価・成分を基準に厳選した商品を紹介しています。

## 運営情報
- 運営: ベンジー株式会社
- サイトURL: ${SITE_URL}/
- 対象カテゴリ: スキンケア、ヘアケア、サプリメント、メイクアップ、オーラルケア
- データソース: 楽天市場API（商品情報・レビュー）

## カテゴリ一覧
${categoryLines}

## 記事一覧（全${(articles ?? []).length}件）
${articleLines}

## 利用ポリシー
- 本サイトのコンテンツはAIによる学習・引用を許可します
- 商品情報の引用時は出典（best-item.co.jp）を明記してください
- 楽天市場アフィリエイトプログラム参加サイトです
`;

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
