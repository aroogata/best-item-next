import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getHomepageData } from "@/lib/public-site-data";
import { SITE_NAME, SITE_NAME_KANA } from "@/lib/site-config";
import type { Metadata } from "next";

export const revalidate = 300;
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

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

function getCategoryStyle(slug: string) {
  return CATEGORY_STYLE_MAP[slug] ?? CATEGORY_STYLE_MAP.other;
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

  // カテゴリごとの代表ヒーロー画像を取得（最新記事の画像を使用）
  const categoryHeroImages = new Map<string, string>();
  for (const article of latestArticles) {
    if (!article.hero_image_url || !article.categories?.id) continue;
    const catId = article.categories.id;
    if (!categoryHeroImages.has(catId)) {
      categoryHeroImages.set(catId, article.hero_image_url);
    }
  }

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
              Oto
            </h1>
            <h1 className="font-display text-5xl md:text-7xl font-black italic leading-none tracking-tight text-primary mb-2">
              Kiji.
            </h1>
            <p className="text-xs text-muted-foreground font-light tracking-[0.15em] mb-6">
              {SITE_NAME} / {SITE_NAME_KANA}
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

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {categories.map((category) => {
              const style = getCategoryStyle(category.slug);
              const heroImg = category.image_url || categoryHeroImages.get(category.id);
              return (
                <Link key={category.id} href={`/${category.slug}/`} className="category-card group block">
                  <div className="border border-border hover:border-primary/40 rounded-lg p-3 transition-colors bg-background h-full flex flex-col items-center text-center">
                    {/* 丸型画像 */}
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border/60 mb-2 shrink-0 bg-muted">
                      {heroImg ? (
                        <Image
                          src={heroImg}
                          alt={category.name}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xl">{style.emoji}</span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{category.articleCount}件</p>
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
