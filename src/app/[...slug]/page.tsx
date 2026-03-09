import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { ComparisonTable } from "@/components/comparison-table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, ChevronRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://best-item.co.jp";
const SITE_NAME = "Best Item";
const PUBLISHER_NAME = "ベンジー株式会社";
const AUTHOR_NAME = "Best Item 編集部";

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

  const canonicalUrl = `${SITE_URL}${fullSlug}`;
  const heroImageUrl: string | null = (article as { hero_image_url?: string | null }).hero_image_url ?? null;

  return {
    title: article.title,
    description: article.meta_description ?? undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article.title,
      description: article.meta_description ?? undefined,
      type: "article",
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "ja_JP",
      publishedTime: article.published_at ?? undefined,
      authors: [AUTHOR_NAME],
      images: heroImageUrl
        ? [{ url: heroImageUrl, width: 1200, height: 630, alt: article.title }]
        : [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.meta_description ?? undefined,
      images: heroImageUrl ? [heroImageUrl] : undefined,
    },
  };
}

function getSection(sections: Array<{ section_type: string; content: string | null }>, type: string) {
  return sections.find((s) => s.section_type === type)?.content ?? null;
}

/** FAQ markdown から Q&A ペアを抽出 */
function parseFaqPairs(faqMarkdown: string): Array<{ q: string; a: string }> {
  const pairs: Array<{ q: string; a: string }> = [];
  // パターン: **Q.** or **Q1.** or ## Q. or 単純な Q: などに対応
  const blocks = faqMarkdown.split(/\n(?=\*\*Q[\d．.。]?[\s．.。]|##\s*Q[\d．.。]?[\s．.。]|Q[\d．.。][\s：:．.。])/i);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const qLine = lines[0].replace(/^\*{1,2}|\*{1,2}$|^#+\s*/g, "").replace(/^Q[\d．.。]?[\s：:．.。]*/i, "").trim();
    const aRaw = lines
      .slice(1)
      .join("\n")
      .replace(/^\*{1,2}A[\d．.。]?[\s：:．.。]*/im, "")
      .replace(/^\*{1,2}|\*{1,2}$/gm, "")
      .trim();
    if (qLine && aRaw) pairs.push({ q: qLine, a: aRaw });
  }
  return pairs.slice(0, 10); // max 10 pairs
}

/** JSON-LD を script タグとして返す */
function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
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
  const canonicalUrl = `${SITE_URL}${fullSlug}`;
  const categoryName = article.categories?.name ?? "商品比較";
  const categoryPath = article.categories?.slug ? `/${article.categories.slug}/` : null;

  // ── JSON-LD: Article ──
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.meta_description ?? "",
    "url": canonicalUrl,
    "datePublished": article.published_at ?? new Date().toISOString(),
    "dateModified": article.published_at ?? new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": AUTHOR_NAME,
      "url": `${SITE_URL}/about/`,
    },
    "publisher": {
      "@type": "Organization",
      "name": PUBLISHER_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/logo.png`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    ...(heroImageUrl ? { "image": { "@type": "ImageObject", "url": heroImageUrl } } : {}),
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".article-speakable"],
    },
    "about": {
      "@type": "Thing",
      "name": article.target_keyword,
    },
    "reviewCount": products.length,
  };

  // ── JSON-LD: BreadcrumbList ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "TOP", "item": SITE_URL },
      ...(categoryPath
        ? [{ "@type": "ListItem", "position": 2, "name": categoryName, "item": `${SITE_URL}${categoryPath}` }]
        : []),
      {
        "@type": "ListItem",
        "position": categoryPath ? 3 : 2,
        "name": article.title,
        "item": canonicalUrl,
      },
    ],
  };

  // ── JSON-LD: FAQPage ──
  const faqPairs = faq ? parseFaqPairs(faq) : [];
  const faqSchema = faqPairs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqPairs.map(({ q, a }) => ({
          "@type": "Question",
          "name": q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": a.replace(/\*\*/g, "").replace(/\*/g, "").slice(0, 600),
          },
        })),
      }
    : null;

  return (
    <div>
      {/* ── JSON-LD ── */}
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* ── Hero image ── */}
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
              {categoryName}
            </p>
            <h1 className="font-display text-2xl md:text-4xl font-black italic text-white leading-tight drop-shadow-lg">
              {article.h1 ?? article.title}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="パンくずリスト" className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary transition-colors">TOP</Link>
          {article.categories && (
            <>
              <ChevronRight className="h-3 w-3" />
              {categoryPath
                ? <Link href={categoryPath} className="hover:text-primary transition-colors">{categoryName}</Link>
                : <span>{categoryName}</span>
              }
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
                {categoryName}
              </Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-black italic font-display text-foreground leading-tight mb-3">
              {article.h1 ?? article.title}
            </h1>
          </header>
        )}

        {/* Editorial meta */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          {publishedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={article.published_at ?? undefined}>{publishedDate}更新</time>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary">BI</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">{AUTHOR_NAME}</p>
              <p className="text-[10px] text-muted-foreground">商品調査・比較担当</p>
            </div>
          </div>
        </div>

        {/* 調査数バナー */}
        {products.length > 0 && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 px-4 py-3 mb-6">
            <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground/80">
              <span className="font-bold text-primary">{products.length}件</span>を実際に調査・比較しました
            </p>
          </div>
        )}

        {/* E-E-A-T: 評価基準バナー */}
        <div className="flex items-start gap-3 bg-secondary border border-border/60 px-4 py-3 mb-6 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p>
            本記事は楽天市場の口コミ・評価・価格・成分情報をもとに、
            <Link href="/about/" className="text-primary underline underline-offset-2 hover:no-underline">編集部の評価基準</Link>
            に従い独立した比較を行っています。アフィリエイト広告を含みます。
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Intro — speakable マーク付き */}
        {intro && (
          <section className="mb-8 article-content article-speakable text-foreground/80 text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown>{intro}</ReactMarkdown>
          </section>
        )}

        {/* 比較テーブル */}
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
            <div className="article-content text-foreground/80 text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown>{criteria}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Products 詳細レビュー */}
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

        {/* FAQ — speakable + FAQPage schema のソース */}
        {faq && (
          <section className="mb-10" aria-label="よくある質問">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                FAQ
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <h3 className="font-black text-lg text-foreground mb-4 border-l-2 border-primary pl-3">
              よくある質問
            </h3>
            <div className="article-content article-speakable text-foreground/80 text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown>{faq}</ReactMarkdown>
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
            <div className="article-content text-foreground/80 text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown>{conclusion}</ReactMarkdown>
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
