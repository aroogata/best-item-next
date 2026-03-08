import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, ChevronRight } from "lucide-react";
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
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Title overlay on image */}
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

      {/* Article header (ヒーロー画像がない場合のみタイトルを表示) */}
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
          {publishedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <time>{publishedDate}更新</time>
            </div>
          )}
        </header>
      )}

      <Separator className="mb-8" />

      {/* Intro */}
      {intro && (
        <section className="mb-8 prose-sm max-w-none article-content text-gray-700 leading-relaxed whitespace-pre-wrap">
          {intro}
        </section>
      )}

      {/* Quick rank TOC */}
      {products.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
          <h2 className="font-bold text-base text-gray-900 mb-3">
            📋 この記事でご紹介する商品 （{products.length}選）
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {products.slice(0, 10).map((p) => (
              <li key={p.rank}>
                <a
                  href={`#rank-${p.rank}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors py-0.5"
                >
                  <span className="text-primary font-bold w-5 text-right shrink-0">
                    {p.rank}.
                  </span>
                  <span className="line-clamp-1 text-gray-700">{p.name}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Criteria */}
      {criteria && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-primary pl-3">
            {article.target_keyword}の選び方・比較ポイント
          </h2>
          <div className="article-content text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {criteria}
          </div>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-primary pl-3">
            {article.target_keyword} おすすめ{products.length}選
          </h2>
          <div className="space-y-5">
            {products.map((product) => (
              <ProductCard key={product.rank} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-primary pl-3">
            よくある質問
          </h2>
          <div className="space-y-3 article-content text-sm text-gray-700 whitespace-pre-wrap">
            {faq}
          </div>
        </section>
      )}

      {/* Conclusion */}
      {conclusion && (
        <section className="mb-8 bg-gray-50 rounded-xl p-5 border">
          <h2 className="text-lg font-bold text-gray-900 mb-3">まとめ</h2>
          <div className="article-content text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {conclusion}
          </div>
        </section>
      )}

      {/* Affiliate disclosure */}
      <div className="mt-10 pt-6 border-t text-xs text-muted-foreground text-center">
        <p>※ 当サイトは楽天アフィリエイトプログラムに参加しています。</p>
        <p>※ 価格は記事執筆時点のものです。最新の価格はリンク先でご確認ください。</p>
      </div>
    </div>
    </div>
  );
}
