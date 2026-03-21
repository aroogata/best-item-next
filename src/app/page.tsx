import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CATEGORY_STYLE_MAP: Record<
  string,
  {
    bg: string;
    eyebrow: string;
    emoji: string;
    fallbackDescription: string;
  }
> = {
  skincare: {
    bg: "bg-[#f0ebe3]",
    eyebrow: "Skincare",
    emoji: "💧",
    fallbackDescription: "成分や保湿力、使用感から肌に合う一本を比較します。",
  },
  supplement: {
    bg: "bg-[#f7f0ed]",
    eyebrow: "Supplement",
    emoji: "💊",
    fallbackDescription: "目的別に必要な栄養補給を比較して選びやすくまとめます。",
  },
  haircare: {
    bg: "bg-[#eff3f0]",
    eyebrow: "Haircare",
    emoji: "✨",
    fallbackDescription: "髪質や悩みごとに、続けやすいヘアケアを比較します。",
  },
  makeup: {
    bg: "bg-[#f5ece8]",
    eyebrow: "Makeup",
    emoji: "💄",
    fallbackDescription: "仕上がり、落ちにくさ、使い心地を軸に比較します。",
  },
  oral: {
    bg: "bg-[#edf4f7]",
    eyebrow: "Oral Care",
    emoji: "🦷",
    fallbackDescription: "口臭ケアやホワイトニングなどオーラル商材を比較します。",
  },
  household: {
    bg: "bg-[#f3f1ea]",
    eyebrow: "Household",
    emoji: "🏠",
    fallbackDescription: "毎日の生活用品を、使いやすさとコスパで比較します。",
  },
  "beauty-appliance": {
    bg: "bg-[#efeaf4]",
    eyebrow: "Beauty Appliance",
    emoji: "🪞",
    fallbackDescription: "美容家電を、機能性と続けやすさで見比べます。",
  },
  kitchen: {
    bg: "bg-[#f7f2e8]",
    eyebrow: "Kitchen",
    emoji: "🍳",
    fallbackDescription: "キッチン家電を、使い勝手と手入れのしやすさで比較します。",
  },
  sleep: {
    bg: "bg-[#edf0f7]",
    eyebrow: "Sleep",
    emoji: "🛏️",
    fallbackDescription: "睡眠環境を整える寝具や関連アイテムを比較します。",
  },
  other: {
    bg: "bg-[#f2efec]",
    eyebrow: "Other",
    emoji: "📚",
    fallbackDescription: "カテゴリ横断で比較記事を整理しています。",
  },
};

type Article = {
  id: string;
  slug: string;
  title: string;
  hero_image_url: string | null;
  published_at: string | null;
  categories: { id?: string; name: string; slug: string } | null;
};

type CategoryDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  articleCount: number;
  latestArticle: { slug: string; title: string } | null;
};

function normalizeCategory(
  category: { id?: string; name: string; slug: string } | Array<{ id?: string; name: string; slug: string }> | null
) {
  if (!category) return null;
  return Array.isArray(category) ? (category[0] ?? null) : category;
}

function getCategoryStyle(slug: string) {
  return CATEGORY_STYLE_MAP[slug] ?? CATEGORY_STYLE_MAP.other;
}

async function getHomepageData(): Promise<{
  latestArticles: Article[];
  categories: CategoryDirectoryItem[];
}> {
  try {
    const supabase = await createClient();
    const [latestRes, categoriesRes, categoryArticlesRes] = await Promise.all([
      supabase
        .from("articles")
        .select("id, slug, title, hero_image_url, published_at, categories(id, name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(90)
        .throwOnError(),
      supabase
        .from("categories")
        .select("id, slug, name, description, sort_order, parent_category_id")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
        .throwOnError(),
      supabase
        .from("articles")
        .select("id, slug, title, published_at, category_id, categories(id, name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .throwOnError(),
    ]);

    const latestArticles = ((latestRes.data ?? []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id),
      slug: String(item.slug),
      title: String(item.title),
      hero_image_url: item.hero_image_url ? String(item.hero_image_url) : null,
      published_at: item.published_at ? String(item.published_at) : null,
      categories: normalizeCategory(
        item.categories as { id?: string; name: string; slug: string } | Array<{ id?: string; name: string; slug: string }> | null
      ),
    }));

    const categoryMeta = new Map<
      string,
      { articleCount: number; latestArticle: { slug: string; title: string; published_at: string | null } | null }
    >();

    for (const row of (categoryArticlesRes.data ?? []) as Array<Record<string, unknown>>) {
      const category = normalizeCategory(
        row.categories as { id?: string; name: string; slug: string } | Array<{ id?: string; name: string; slug: string }> | null
      );
      const categoryId = category?.id ?? (row.category_id ? String(row.category_id) : null);
      if (!categoryId) continue;

      const current = categoryMeta.get(categoryId) ?? { articleCount: 0, latestArticle: null };
      categoryMeta.set(categoryId, {
        articleCount: current.articleCount + 1,
        latestArticle:
          current.latestArticle ??
          (row.slug && row.title
            ? {
                slug: String(row.slug),
                title: String(row.title),
                published_at: row.published_at ? String(row.published_at) : null,
              }
            : null),
      });
    }

    // 子カテゴリの記事数を親カテゴリに集計する
    const categoryList = (categoriesRes.data ?? []) as Array<Record<string, unknown>>;
    for (const category of categoryList) {
      const parentId = category.parent_category_id ? String(category.parent_category_id) : null;
      if (!parentId) continue;
      const childMeta = categoryMeta.get(String(category.id));
      if (!childMeta || childMeta.articleCount === 0) continue;
      const parentMeta = categoryMeta.get(parentId) ?? { articleCount: 0, latestArticle: null };
      // published_at を比較してより新しい記事を latestArticle として保持する
      const parentDate = parentMeta.latestArticle?.published_at ?? null;
      const childDate = childMeta.latestArticle?.published_at ?? null;
      const mergedLatest =
        parentDate && childDate
          ? parentDate >= childDate
            ? parentMeta.latestArticle
            : childMeta.latestArticle
          : (parentMeta.latestArticle ?? childMeta.latestArticle);
      categoryMeta.set(parentId, {
        articleCount: parentMeta.articleCount + childMeta.articleCount,
        latestArticle: mergedLatest,
      });
    }

    const categories = categoryList
      .map((category) => {
        const meta = categoryMeta.get(String(category.id));
        return {
          id: String(category.id),
          slug: String(category.slug),
          name: String(category.name),
          description: category.description ? String(category.description) : null,
          sort_order: Number(category.sort_order ?? 0),
          articleCount: meta?.articleCount ?? 0,
          latestArticle: meta?.latestArticle ?? null,
        } satisfies CategoryDirectoryItem;
      });

    return { latestArticles, categories };
  } catch (error) {
    console.error("Failed to load homepage data", error);
    return { latestArticles: [], categories: [] };
  }
}

function ArticleCard({ article }: { article: Article }) {
  const slug = article.slug.replace(/^\/|\/$/g, "");
  const catName = article.categories?.name ?? "";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Tokyo",
      })
    : null;

  return (
    <Link
      href={`/${slug}/`}
      className="group block border border-border hover:border-primary/40 transition-colors bg-background"
    >
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

      <div className="p-4">
        {catName && (
          <p className="text-[9px] tracking-[0.2em] uppercase text-primary font-medium mb-1.5">{catName}</p>
        )}
        <h3
          className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors"
          style={{ overflowWrap: "break-word" }}
        >
          {article.title}
        </h3>
        {date && <p className="text-[10px] text-muted-foreground font-light mt-2">{date}</p>}
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const { latestArticles, categories } = await getHomepageData();
  const heroCategories = categories.slice(0, 10);
  const leadCategory = categories[0] ?? null;
  const supportCategories = categories.slice(1, 3);

  return (
    <div className="bg-background">
      <section className="relative noise-overlay overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 50%, oklch(0.41 0.12 15 / 0.06) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 flex flex-col md:flex-row items-start md:items-end gap-8">
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-medium mb-5">
              Ranking &amp; Review
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-black italic leading-none tracking-tight text-foreground mb-2">
              Awesome
            </h1>
            <h1 className="font-display text-5xl md:text-7xl font-black italic leading-none tracking-tight text-primary mb-2">
              Item.
            </h1>
            <p className="text-xs text-muted-foreground font-light tracking-[0.15em] mb-6">
              オーサムアイテム
            </p>
            <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed font-light">
              楽天市場の人気商品を、データと専門知識で厳選。
              <br />
              カテゴリから比較記事を探して、自分に合う一品をすばやく見つけられます。
            </p>

            {heroCategories.length > 0 && (
              <div className="mt-8">
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-light mb-3">
                  Browse Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {heroCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/${category.slug}/`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <span>{getCategoryStyle(category.slug).emoji}</span>
                      <span>{category.name}</span>
                      <span className="text-[10px] text-muted-foreground">{category.articleCount}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 hidden md:flex flex-col items-end">
            <span
              className="font-display font-black text-[9rem] leading-none select-none"
              style={{
                WebkitTextStroke: "1.5px oklch(0.41 0.12 15 / 0.15)",
                color: "transparent",
              }}
            >
              No.1
            </span>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
              Curated Selection
            </p>
          </div>
        </div>
      </section>

      {leadCategory && (
        <section className="max-w-6xl mx-auto px-5 py-12 border-b border-border/60">
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-light">
              Category Guide
            </h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-primary font-medium">
              全{categories.length}カテゴリ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/${leadCategory.slug}/`} className="md:col-span-2 category-card group block">
              <div className={`${getCategoryStyle(leadCategory.slug).bg} h-full min-h-[280px] border border-border p-8 md:p-12 flex flex-col justify-between`}>
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-medium mb-1">
                    {getCategoryStyle(leadCategory.slug).eyebrow}
                  </p>
                  <h2 className="font-display text-4xl md:text-5xl font-black italic text-foreground mb-3 leading-tight">
                    {leadCategory.name}
                  </h2>
                  <p className="text-sm text-muted-foreground font-light max-w-md leading-relaxed">
                    {leadCategory.description || getCategoryStyle(leadCategory.slug).fallbackDescription}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 mt-8">
                  <div>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-primary font-medium">
                      {leadCategory.articleCount} Articles
                    </p>
                    {leadCategory.latestArticle && (
                      <p className="text-sm text-foreground mt-2 line-clamp-2">
                        最新: {leadCategory.latestArticle.title}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <div className="flex flex-col gap-4">
              {supportCategories.map((category) => (
                <Link key={category.id} href={`/${category.slug}/`} className="category-card group block flex-1">
                  <div className={`${getCategoryStyle(category.slug).bg} h-full min-h-[138px] border border-border p-6 flex flex-col justify-between`}>
                    <div>
                      <p className="text-[9px] tracking-[0.22em] uppercase text-primary/70 font-medium mb-1">
                        {getCategoryStyle(category.slug).eyebrow}
                      </p>
                      <h3 className="font-display text-2xl font-bold italic text-foreground">{category.name}</h3>
                      <p className="text-xs text-muted-foreground mt-2 font-light line-clamp-2">
                        {category.description || getCategoryStyle(category.slug).fallbackDescription}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
                        {category.articleCount}件
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categories.map((category) => {
              const style = getCategoryStyle(category.slug);
              return (
                <Link key={category.id} href={`/${category.slug}/`} className="category-card group block bg-background">
                  <div className={`h-full border border-border p-6 ${style.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] tracking-[0.22em] uppercase text-primary/70 font-medium mb-2">
                          {style.eyebrow}
                        </p>
                        <h3 className="text-xl font-semibold text-foreground">{category.name}</h3>
                      </div>
                      <span className="text-2xl">{style.emoji}</span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed">
                      {category.description || style.fallbackDescription}
                    </p>
                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] tracking-[0.16em] uppercase text-primary font-medium">
                          {category.articleCount} Articles
                        </p>
                        {category.latestArticle && (
                          <p className="mt-2 text-sm text-foreground line-clamp-2">
                            {category.latestArticle.title}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {latestArticles.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 py-12 border-b border-border/60">
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-light">
              Latest Articles
            </h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-primary font-medium">
              {latestArticles.length}件
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-background">
            {latestArticles.map((article) => (
              <div key={article.id} className="bg-background">
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 py-14 flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0">
            <span
              className="font-display font-black leading-none select-none"
              style={{
                fontSize: "clamp(4rem, 10vw, 7rem)",
                WebkitTextStroke: "1px oklch(0.65 0.08 68 / 0.4)",
                color: "transparent",
              }}
            >
              {categories.length}+
            </span>
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground text-center">
              Categories
            </p>
          </div>
          <div className="md:border-l border-border md:pl-8">
            <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-medium mb-3">
              About
            </p>
            <p className="text-base md:text-lg font-light text-foreground leading-relaxed max-w-xl">
              楽天市場の商品データとAI技術を組み合わせ、
              レビュー数・成分・価格帯を多角的に分析。
              <span className="font-semibold text-primary">カテゴリから探して比較する</span>流れを、
              もっとわかりやすく整えています。
            </p>
            <p className="mt-3 text-xs text-muted-foreground font-light">
              運営: ベンジー株式会社 ／ 楽天アフィリエイトプログラム参加
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
