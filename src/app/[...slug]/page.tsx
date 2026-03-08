import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { ComparisonTable } from "@/components/comparison-table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, ChevronRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function getArticle(slug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select(`*, categories(*), article_sections(*), article_products(*, products(*))`)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fullSlug = "/" + slug.join("/") + "/";
  const article = await getArticle(fullSlug);
  if (!article) return { title: "ページが見つかりません" };

  return {
    title: article.title,
    description: article.meta_description ?? undefined,
    openGraph: {
      title: article.title,
      description: article.meta_description ?? undefined,
      type: "article",
    },
  };
}

function getSection(sections: Array<{ section_type: string; content: string | null }>, type: string) {
  return sections.find((s) => s.section_type === type)?.content ?? null;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = "/" + slug.join("/") + "/";
  const article = await getArticle(fullSlug);

  if (!article) {
    notFound();
  }

  const sections: Array<{ section_type: string; content: string | null; sort_order: number }> =
    [...(article.article_sections ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  const products = [...(article.article_products ?? [])].sort((a, b) => a.rank - b.rank).map(
    (ap: {
      rank: number;
      ai_review: string | null;
      ai_features: string | null;
      ai_recommended_for: string | null;
      ai_cons?: string | null;
      ai_not_recommended_for?: string | null;
      products: {
        name: string;
        price: number | null;
        image_url: string | null;
        affiliate_url: string | null;
        review_average: number;
        review_count: number;
      };
    }) => ({
      rank: ap.rank,
      name: ap.products.name,
      price: ap.products.price,
      image_url: ap.products.image_url,
      affiliate_url: ap.products.affiliate_url,
      review_average: ap.products.review_average,
      review_count: ap.products.review_count,
      ai_review: ap.ai_review,
      ai_features: ap.ai_features,
      ai_recommended_for: ap.ai_recommended_for,
      ai_cons: ap.ai_cons ?? null,
      ai_not_recommended_for: ap.ai_not_recommended_for ?? null,
    })
  );

  const intro = getSection(sections, "intro");
  const criteria = getSection(sections, "criteria");
  const faq = getSection(sections, "faq");
  const conclusion = getSection(sections, "conclusion");

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const heroImageUrl: string | null = (article as { hero_image_url?: string | null }).hero_image_url ?? null;

  return (
    <div>
      {/* ── Hero image: full-width, editorial ── */}
      {heroImageUrl && (
        <div className="relative w-full h-56 md:h-80 overflow-hidden bg-secondary">
          <Image
            src={heroImageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 md:px-10 md:pb-8">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/70 mb-2">
              {article.categories?.name ?? "記事"}
            </p>
            <h1 className="font-display text-2xl md:text-4xl font-black italic text-white leading-tight drop-shadow-lg">
              {article.h1 ?? article.title}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary transition-colors">TOP</Link>
          {article.categories && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>{article.categories.name}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground/60 truncate">{article.title}</span>
        </nav>

        {/* Article header (hero画像なし時のみタイトル表示) */}
        {!heroImageUrl && (
          <header className="mb-6">
            {article.categories && (
              <Badge variant="secondary" className="mb-3 text-primary bg-primary/5 border-primary/20">
                {article.categories.name}
              </Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-black italic font-display text-foreground leading-tight mb-3">
              {article.h1 ?? article.title}
            </h1>
          </header>
        )}

        {/* Editorial meta: 更新日 + 編集部表記 */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          {publishedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <time>{publishedDate}更新</time>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary">BI</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">Best Item 編集部</p>
              <p className="text-[10px] text-muted-foreground">商品調査・比較担当</p>
            </div>
          </div>
        </div>

        {/* 検証数バナー */}
        {products.length > 0 && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 px-4 py-3 mb-6">
            <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground/80">
              <span className="font-bold text-primary">{products.length}件</span>を実際に調査・比較しました
            </p>
          </div>
        )}

        <Separator className="mb-8" />

        {/* Intro */}
        {intro && (
          <section className="mb-8 article-content text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
            {intro}
          </section>
        )}

        {/* ── 比較テーブル（商品画像付き）── */}
        {products.length > 0 && (
          <ComparisonTable products={products} keyword={article.target_keyword} />
        )}

        {/* Criteria */}
        {criteria && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                How to Choose
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <h3 className="font-black text-lg text-foreground mb-3 border-l-2 border-primary pl-3">
              {article.target_keyword}の選び方・比較ポイント
            </h3>
            <div className="article-content text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
              {criteria}
            </div>
          </section>
        )}

        {/* Products — 詳細レビューカード */}
        {products.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Reviews
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
                詳細レビュー
              </span>
            </div>
            <div className="space-y-4">
              {products.map((product) => (
                <ProductCard key={product.rank} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {faq && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                FAQ
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <h3 className="font-black text-lg text-foreground mb-4 border-l-2 border-primary pl-3">
              よくある質問
            </h3>
            <div className="article-content text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
              {faq}
            </div>
          </section>
        )}

        {/* Conclusion */}
        {conclusion && (
          <section className="mb-8 bg-secondary/50 border border-border p-5">
            <div className="flex items-baseline gap-4 mb-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Summary
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <h3 className="font-black text-base text-foreground mb-3">まとめ</h3>
            <div className="article-content text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
              {conclusion}
            </div>
          </section>
        )}

        {/* Affiliate disclosure */}
        <div className="mt-10 pt-6 border-t text-xs text-muted-foreground text-center space-y-1">
          <p>※ 当サイトは楽天アフィリエイトプログラムに参加しています。</p>
          <p>※ 価格は掲載時点のものです。最新の価格はリンク先でご確認ください。</p>
        </div>
      </div>
    </div>
  );
}
