import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { ComparisonTable } from "@/components/comparison-table";
import { LocalShopCard } from "@/components/local-shop-card";
import { LocalComparisonTable } from "@/components/local-comparison-table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Calendar, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArticlePoll } from "@/components/article-poll";
import { ProductReviews } from "@/components/product-reviews";
import { ArticleQA } from "@/components/article-qa";
import { UserRanking } from "@/components/user-ranking";
import { ArticleTOC } from "@/components/article-toc";
import { PointsPromo } from "@/components/points-promo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://awesome-item.com";
const SITE_NAME = "オーサムアイテム";
const PUBLISHER_NAME = "ベンジー株式会社";
const AUTHOR_NAME = "緒方亜朗";
const AUTHOR_NOTE_URL = "https://note.com/tumorikabu";
const AUTHOR_X_URL = "https://x.com/creditcardbook7";
const LOCAL_ARTICLE_CATEGORY_SLUGS = new Set(["omiyage"]);

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Resolve supported category routes.
 * Accepts `/category/` and `/category/osusume/`; returns null for other patterns.
 */
function resolveCategorySlug(slug: string[]) {
  if (slug.length === 1) return slug[0];
  if (slug.length === 2 && slug[1] === "osusume") return slug[0];
  return null;
}

async function getPopularArticles() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("id, slug, title, hero_image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getAllCategories() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name");
    return data ?? [];
  } catch {
    return [];
  }
}

async function getRelatedArticles(categoryId: string, currentSlug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("id, slug, title, hero_image_url, published_at")
      .eq("category_id", categoryId)
      .eq("status", "published")
      .neq("slug", currentSlug)
      .order("published_at", { ascending: false })
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getCategoryBySlug(categorySlug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("slug", categorySlug)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

async function getCategoryPage(categorySlug: string) {
  try {
    const supabase = await createClient();
    const cat = await getCategoryBySlug(categorySlug);
    if (!cat) return null;

    // 子カテゴリを取得
    const { data: childCats } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("parent_category_id", cat.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    const childCategoryIds = (childCats ?? []).map((c: { id: string }) => c.id);
    const allCategoryIds = [cat.id, ...childCategoryIds];

    // このカテゴリ＋子カテゴリの記事を取得
    const { data: arts } = await supabase
      .from("articles")
      .select("id, slug, title, hero_image_url, published_at, meta_description, category_id")
      .in("category_id", allCategoryIds)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    // 子カテゴリごとの記事数を Map で集計（O(n)）
    const articleCountByCategory = new Map<string, number>();
    for (const article of (arts ?? []) as Array<{ category_id: string }>) {
      articleCountByCategory.set(
        article.category_id,
        (articleCountByCategory.get(article.category_id) ?? 0) + 1
      );
    }
    const subcategories = (childCats ?? []).map((child: { id: string; name: string; slug: string }) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      articleCount: articleCountByCategory.get(child.id) ?? 0,
    }));

    return { category: cat, articles: arts ?? [], subcategories };
  } catch {
    return null;
  }
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
  if (!article) {
    const categorySlug = resolveCategorySlug(slug);
    if (!categorySlug) return { title: "ページが見つかりません" };
    const category = await getCategoryBySlug(categorySlug);
    if (!category) return { title: "ページが見つかりません" };

    const canonicalUrl = `${SITE_URL}/${categorySlug}`;
    const title = category.name;
    const description = `${category.name}カテゴリのおすすめ商品比較記事一覧です。`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        type: "website",
        url: canonicalUrl,
        siteName: SITE_NAME,
        locale: "ja_JP",
        images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: SITE_NAME }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  }

  const canonicalUrl = `${SITE_URL}${fullSlug.replace(/\/+$/, '')}`;
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

  // Q1. ... A. ... 形式（改行2つで区切られた段落）
  const blocks = faqMarkdown.split(/\n\n(?=Q\d)/);
  for (const block of blocks) {
    const qMatch = block.match(/^Q\d*[.．。]?\s*(.+)/m);
    const aMatch = block.match(/A[.．。]?\s*([\s\S]+)/);
    if (qMatch && aMatch) {
      const q = qMatch[1].replace(/\*\*/g, "").trim();
      const a = aMatch[1].replace(/\*\*/g, "").trim();
      if (q && a) pairs.push({ q, a });
    }
  }

  // フォールバック: **Q.** 形式
  if (pairs.length === 0) {
    const fbBlocks = faqMarkdown.split(/\n(?=\*{1,2}Q)/);
    for (const block of fbBlocks) {
      const lines = block.trim().split("\n");
      const qLine = lines[0].replace(/^\*{1,2}|\*{1,2}$|^#+\s*/g, "").replace(/^Q[\d]*[.．。]?\s*/i, "").trim();
      const aRaw = lines.slice(1).join("\n")
        .replace(/^\*{1,2}A[.．。]?\s*/i, "").replace(/^\*{1,2}|\*{1,2}$/g, "").trim();
      if (qLine && aRaw) pairs.push({ q: qLine, a: aRaw });
    }
  }

  return pairs.slice(0, 10);
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
    const categorySlug = resolveCategorySlug(slug);
    if (!categorySlug) {
      notFound();
    }

    const catPage = await getCategoryPage(categorySlug);
    if (catPage) {
      return <CategoryPage category={catPage.category} articles={catPage.articles} subcategories={catPage.subcategories} />;
    }
    notFound();
  }

  const sections: Array<{ section_type: string; content: string | null; sort_order: number }> =
    [...(article.article_sections ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  const products = [...(article.article_products ?? [])].sort((a, b) => a.rank - b.rank).map(
    (ap: {
      rank: number;
      product_id: string;
      ai_review: string | null;
      ai_features: string | null;
      ai_recommended_for: string | null;
      ai_cons?: string | null;
      ai_not_recommended_for?: string | null;
      products: {
        name: string;
        price: number | null;
        image_url: string | null;
        images_json?: string | null;
        affiliate_url: string | null;
        review_average: number | null;
        review_count: number | null;
        shop_name?: string | null;
        description?: string | null;
      };
    }) => ({
      rank: ap.rank,
      product_id: ap.product_id,
      name: ap.products.name,
      price: ap.products.price,
      image_url: ap.products.image_url,
      images_json: ap.products.images_json ?? null,
      affiliate_url: ap.products.affiliate_url,
      review_average: ap.products.review_average,
      review_count: ap.products.review_count,
      shop_name: ap.products.shop_name ?? null,
      description: ap.products.description ?? null,
      ai_review: ap.ai_review,
      ai_features: ap.ai_features,
      ai_recommended_for: ap.ai_recommended_for,
      ai_cons: ap.ai_cons ?? null,
      ai_not_recommended_for: ap.ai_not_recommended_for ?? null,
    })
  );

  const isLocalArticle = Boolean(
    (article.categories?.slug && LOCAL_ARTICLE_CATEGORY_SLUGS.has(article.categories.slug))
    || fullSlug.startsWith("/local/")
  );

  // ローカル記事: 店舗（rank 1-100）とお土産商品（rank 101+）を分離
  const shopProducts = isLocalArticle ? products.filter((p) => p.rank <= 100) : products;
  const souvenirProducts = isLocalArticle ? products.filter((p) => p.rank > 100) : [];
  // お土産商品を連番1〜で正規化（ComparisonTable・ProductCard共通）
  const normalizedSouvenirs = souvenirProducts.map((p, i) => ({
    ...p,
    rank: i + 1,
    review_average: p.review_average ?? 0,
    review_count: p.review_count ?? 0,
  }));
  const standardProducts = isLocalArticle
    ? []
    : shopProducts.map((product) => ({
        ...product,
        review_average: product.review_average ?? 0,
        review_count: product.review_count ?? 0,
      }));

  const intro = getSection(sections, "intro");
  const criteria = getSection(sections, "criteria");
  const faq = getSection(sections, "faq");
  const conclusion = getSection(sections, "conclusion");
  const references = getSection(sections, "references");
  const relatedLinksRaw = getSection(sections, "related_links");
  const relatedLinks: Array<{ text: string; url: string }> = relatedLinksRaw
    ? (() => { try { return JSON.parse(relatedLinksRaw) } catch { return [] } })()
    : [];
  // 解説記事（コンテンツ記事）用汎用フォーマット: content_markdown を優先、なければ section_1-5 にフォールバック
  const contentMarkdown = getSection(sections, "content_markdown");
  // content_markdown があればコンテンツ記事（解説記事）として扱う
  const isContentArticle = !!contentMarkdown;
  const contentSections = contentMarkdown
    ? null
    : ([1, 2, 3, 4, 5]
        .map((i) => getSection(sections, `section_${i}`))
        .filter(Boolean) as string[]);
  const productIntro = contentMarkdown ? null : getSection(sections, "product_intro");

  // 関連記事（同カテゴリの他記事）
  const categoryId: string | null = (article as { category_id?: string | null }).category_id ?? null;
  const relatedArticles = categoryId
    ? await getRelatedArticles(categoryId, fullSlug)
    : [];

  const [popularArticles, allCategories] = await Promise.all([
    getPopularArticles(),
    getAllCategories(),
  ]);

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const heroImageUrl: string | null = (article as { hero_image_url?: string | null }).hero_image_url ?? null;
  const canonicalUrl = `${SITE_URL}${fullSlug.replace(/\/+$/, '')}`;
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
      "@type": "Person",
      "name": AUTHOR_NAME,
      "url": AUTHOR_NOTE_URL,
      "sameAs": [AUTHOR_NOTE_URL, AUTHOR_X_URL],
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0 max-w-4xl">
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
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-primary">緒</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">{AUTHOR_NAME}（ベンジー株式会社）</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>編集・商品調査担当</span>
                <a href={AUTHOR_NOTE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline underline-offset-2">note</a>
                <a href={AUTHOR_X_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline underline-offset-2">X</a>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Intro — speakable マーク付き */}
        {intro && (
          <section className="mb-8 article-content article-speakable text-foreground/95 text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>
          </section>
        )}

        {/* E-E-A-T: 評価基準バナー（比較記事のみ） */}
        {!isContentArticle && (
          <div className="flex items-start gap-3 bg-secondary border border-border/60 px-4 py-3 mb-6 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {isLocalArticle ? (
              <p>
                本記事はGoogle Places・各店舗公式サイト等の情報をもとに、
                <Link href="/about/" className="text-primary underline underline-offset-2 hover:no-underline">編集部の評価基準</Link>
                に従い独立した比較を行っています。
              </p>
            ) : (
              <p>
                本記事は楽天市場の口コミ・評価・価格・成分情報をもとに、
                <Link href="/about/" className="text-primary underline underline-offset-2 hover:no-underline">編集部の評価基準</Link>
                に従い独立した比較を行っています。アフィリエイト広告を含みます。
              </p>
            )}
          </div>
        )}

        {/* 目次 */}
        <ArticleTOC hasProducts={standardProducts.length > 0} isContentArticle={isContentArticle} />

        {/* ポイントプログラム案内（未ログインユーザーのみ） */}
        <PointsPromo />

        {/* 比較テーブル（比較記事のみ） */}
        {!isContentArticle && shopProducts.length > 0 && (
          isLocalArticle
            ? <LocalComparisonTable shops={shopProducts} keyword={article.target_keyword} />
            : <ComparisonTable products={standardProducts} keyword={article.target_keyword} />
        )}

        {/* Criteria（比較記事のみ） */}
        {!isContentArticle && criteria && (
          <section id="article-criteria" className="mb-10">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                How to Choose
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <h3 className="font-black text-lg text-foreground mb-3 border-l-2 border-primary pl-3">
              {isLocalArticle
                ? `${article.target_keyword}エリアガイド`
                : `${article.target_keyword}の選び方・比較ポイント`}
            </h3>
            <div className="article-content text-foreground/95 text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{criteria}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* 詳細レビュー（比較記事のみ） */}
        {!isContentArticle && shopProducts.length > 0 && (
          <section id="article-products" className="mb-10">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                {isLocalArticle ? "Shops" : "Reviews"}
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
                {isLocalArticle ? "店舗詳細" : "詳細レビュー"}
              </span>
            </div>
            <div className="space-y-4">
              {isLocalArticle
                ? shopProducts.map((shop) => (
                    <LocalShopCard key={shop.rank} shop={shop} />
                  ))
                : standardProducts.map((product) => (
                    <ProductCard key={product.rank} product={product} articleId={article.id} />
                  ))
              }
            </div>
          </section>
        )}

        {/* 関連おすすめ商品（ローカル記事のみ・楽天商品） */}
        {normalizedSouvenirs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Related Products
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
                関連おすすめ商品
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">楽天市場で購入できる地元の名物・お土産をご紹介します。</p>
            <ComparisonTable
              products={normalizedSouvenirs}
              keyword={article.target_keyword}
              showHeader={false}
            />
          </section>
        )}

        {/* 関連おすすめ商品 詳細（ローカル記事のみ） */}
        {normalizedSouvenirs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Souvenir Details
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
                関連商品 詳細
              </span>
            </div>
            <div className="space-y-4">
              {normalizedSouvenirs.map((product) => (
                <ProductCard key={product.rank} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 解説セクション（コンテンツ記事）: content_markdown（汎用フォーマット）を優先 */}
        {contentMarkdown && (
          <section id="article-body" className="mb-10 article-content text-foreground/95 text-sm leading-relaxed prose prose-sm max-w-none [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4 [&_img]:block [&_table]:w-full [&_table]:border-collapse [&_th]:bg-secondary [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_tr:nth-child(even)_td]:bg-muted/30">
            {contentMarkdown.trimStart().startsWith("<") ? (
              <div dangerouslySetInnerHTML={{ __html: contentMarkdown }} />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentMarkdown}</ReactMarkdown>
            )}
          </section>
        )}

        {/* 解説セクション（旧フォーマット: section_1-5 個別保存）フォールバック */}
        {!contentMarkdown && contentSections && contentSections.length > 0 && (
          <div className="mb-2">
            {contentSections.map((sectionContent, idx) => (
              <section key={idx} className="mb-10 article-content text-foreground/95 text-sm leading-relaxed prose prose-sm max-w-none [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sectionContent}</ReactMarkdown>
              </section>
            ))}
          </div>
        )}

        {/* 関連おすすめ商品紹介（コンテンツ記事・旧フォーマットのみ） */}
        {productIntro && (
          <section className="mb-10 article-content text-foreground/95 text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{productIntro}</ReactMarkdown>
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
            <div className="article-content article-speakable text-foreground/95 text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{faq}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Conclusion */}
        {conclusion && (
          <section id="article-conclusion" className="mb-8 bg-secondary/50 border border-border p-5">
            <div className="flex items-baseline gap-4 mb-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Summary
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <h3 className="font-black text-base text-foreground mb-3">まとめ</h3>
            <div className="article-content text-foreground/95 text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{conclusion}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* UGC アンケート */}
        <div id="article-poll">
          <ArticlePoll articleId={article.id} />
        </div>

        {/* UGC ひとことレビュー */}
        <div id="article-reviews">
          {standardProducts.length > 0 && (
            <ProductReviews
              articleId={article.id}
              products={standardProducts.map((p) => ({
                product_id: (p as any).product_id,
                name: p.name,
                rank: p.rank,
              }))}
            />
          )}
        </div>

        {/* UGC みんなのランキング */}
        <div id="article-ranking">
          <UserRanking articleId={article.id} />
        </div>

        {/* UGC Q&A */}
        <div id="article-qa">
          <ArticleQA articleId={article.id} />
        </div>

        {references && (
          <section className="mb-8 border border-border/60 p-5 bg-muted/20">
            <div className="flex items-baseline gap-4 mb-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                References
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="article-content text-foreground/70 text-xs leading-relaxed prose prose-xs max-w-none [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary/80 [&_blockquote]:text-muted-foreground [&_blockquote]:text-[10px] [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-2 [&_blockquote]:my-0.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{references}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* 内部リンク（関連記事へのリンク） */}
        {relatedLinks.length > 0 && (
          <section className="mb-8 border border-border/60 p-5 bg-muted/20">
            <div className="flex items-baseline gap-4 mb-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Related Articles
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <ul className="space-y-2">
              {relatedLinks.map((link, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-primary text-xs">→</span>
                  <Link
                    href={link.url}
                    className="text-sm text-primary hover:underline underline-offset-2 transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* コンテンツ記事: おすすめ商品（記事末尾に配置） */}
        {isContentArticle && standardProducts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Related Products
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
                この記事に関連するおすすめ商品
              </span>
            </div>
            <div className="flex items-start gap-3 bg-secondary border border-border/60 px-4 py-3 mb-6 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                本記事は楽天市場の口コミ・評価・価格情報をもとに、
                <Link href="/about/" className="text-primary underline underline-offset-2 hover:no-underline">編集部の評価基準</Link>
                に従い独立した比較を行っています。アフィリエイト広告を含みます。
              </p>
            </div>
            <ComparisonTable products={standardProducts} keyword={article.target_keyword} showHeader={false} />
            <div id="article-products" className="space-y-4 mt-6">
              {standardProducts.map((product) => (
                <ProductCard key={product.rank} product={product} articleId={article.id} />
              ))}
            </div>
          </section>
        )}

        {/* 関連記事 */}
        {relatedArticles.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border/60">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
                Related Articles
              </h2>
              <div className="flex-1 h-px bg-border" />
              {categoryPath && (
                <Link
                  href={categoryPath}
                  className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-primary font-medium hover:opacity-70 transition-opacity"
                >
                  一覧を見る <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-background">
              {relatedArticles.map((rel) => {
                const relSlug = rel.slug.replace(/^\/|\/$/g, "");
                const relDate = rel.published_at
                  ? new Date(rel.published_at).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
                  : null;
                return (
                  <Link
                    key={rel.id}
                    href={`/${relSlug}/`}
                    className="group block bg-background hover:bg-secondary/40 transition-colors"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-muted relative">
                      {rel.hero_image_url ? (
                        <Image
                          src={rel.hero_image_url}
                          alt={rel.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-[10px] tracking-widest uppercase">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {rel.title}
                      </p>
                      {relDate && (
                        <p className="text-[10px] text-muted-foreground mt-2">{relDate}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Affiliate disclosure */}
        <div className="mt-10 pt-6 border-t text-xs text-muted-foreground text-center space-y-1">
          {isLocalArticle ? (
            <>
              <p>※ 掲載情報は取材時点または各店舗の公開情報をもとにしています。</p>
              <p>※ 営業時間・定休日・提供内容は最新情報を各店舗の公式案内でご確認ください。</p>
            </>
          ) : (
            <>
              <p>※ 当サイトは楽天アフィリエイトプログラムに参加しています。</p>
              <p>※ 価格は掲載時点のものです。最新の価格はリンク先でご確認ください。</p>
            </>
          )}
        </div>
          </div>{/* end main */}

          {/* ── Sidebar（PC専用）── */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 space-y-6 sticky top-4">
            {/* 広告スロット① */}
            <div className="overflow-hidden">
              {/* Google AdSense コードをここに挿入（準備中はバナー表示） */}
              <Link href="/" className="block">
                <Image
                  src="/banner-bestitem-top.png"
                  alt="楽天おすすめランキング - オーサムアイテム"
                  width={300}
                  height={250}
                  className="w-full h-auto"
                />
              </Link>
            </div>

            {/* カテゴリ一覧 */}
            {allCategories.length > 0 && (
              <div className="border border-border/60 bg-card p-4">
                <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground font-light mb-3">
                  Category
                </p>
                <ul className="space-y-1">
                  {allCategories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/${cat.slug}/`}
                        className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors py-1"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 人気記事ランキング */}
            {popularArticles.length > 0 && (
              <div className="border border-border/60 bg-card p-4">
                <p className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground font-light mb-3">
                  Popular
                </p>
                <p className="text-xs font-semibold text-foreground mb-3">人気記事ランキング</p>
                <ol className="space-y-3">
                  {popularArticles.map((art, i) => {
                    const artSlug = art.slug.replace(/^\/|\/$/g, "");
                    return (
                      <li key={art.id} className="flex gap-2 items-start">
                        <span className={`font-display font-black italic text-lg leading-none shrink-0 mt-0.5 ${i === 0 ? "text-primary" : i < 3 ? "text-foreground/70" : "text-muted-foreground/50"}`}>
                          {i + 1}
                        </span>
                        <Link
                          href={`/${artSlug}/`}
                          className="text-xs text-foreground/80 hover:text-primary transition-colors leading-snug line-clamp-2"
                        >
                          {art.title}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* 広告スロット② */}
            <div className="overflow-hidden">
              {/* Google AdSense コードをここに挿入（準備中はバナー表示） */}
              <Link href="/" className="block">
                <Image
                  src="/banner-bestitem-bottom.png"
                  alt="成分・レビューで徹底比較 - オーサムアイテム"
                  width={300}
                  height={250}
                  className="w-full h-auto"
                />
              </Link>
            </div>
          </aside>
        </div>{/* end flex */}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// カテゴリページ
// ────────────────────────────────────────────────

type CategoryArticle = {
  id: string;
  slug: string;
  title: string;
  hero_image_url: string | null;
  published_at: string | null;
  meta_description: string | null;
};

type Subcategory = {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
};

function CategoryPage({
  category,
  articles,
  subcategories = [],
}: {
  category: { name: string; slug: string };
  articles: CategoryArticle[];
  subcategories?: Subcategory[];
}) {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-b border-border/60 bg-background">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <nav className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{category.name}</span>
          </nav>
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-medium mb-2">
            Category
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black italic text-foreground">
            {category.name}
          </h1>
          <p className="text-sm text-muted-foreground font-light mt-3">
            {articles.length}件の記事
          </p>
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="max-w-4xl mx-auto px-5 pt-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-medium mb-4">Subcategories</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/${sub.slug}/`}
                className="flex items-center justify-between border border-border hover:border-primary/40 transition-colors px-4 py-3 bg-background"
              >
                <span className="text-sm font-medium text-foreground">{sub.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{sub.articleCount}件</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Article grid */}
      <div className="max-w-4xl mx-auto px-5 py-10">
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-sm">現在この カテゴリの記事はありません。</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-background">
            {articles.map((article) => {
              const slug = article.slug.replace(/^\/|\/$/g, "");
              const date = article.published_at
                ? new Date(article.published_at).toLocaleDateString("ja-JP", {
                    year: "numeric", month: "long", day: "numeric",
                  })
                : null;

              return (
                <Link
                  key={article.id}
                  href={`/${slug}/`}
                  className="group block bg-background border-border hover:border-primary/40 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/9] overflow-hidden bg-muted relative">
                    {article.hero_image_url ? (
                      <Image
                        src={article.hero_image_url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs tracking-widest uppercase">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="p-5">
                    <h2
                      className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2"
                      style={{ overflowWrap: "break-word" }}
                    >
                      {article.title}
                    </h2>
                    {article.meta_description && (
                      <p className="text-[11px] text-muted-foreground font-light leading-relaxed line-clamp-2 mb-3">
                        {article.meta_description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {date && (
                        <span className="text-[10px] text-muted-foreground">{date}</span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-primary font-medium tracking-[0.1em] uppercase ml-auto">
                        記事を読む
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
