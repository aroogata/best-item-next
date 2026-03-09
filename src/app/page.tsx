import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/* ── Categories — asymmetric editorial layout, not uniform grid ── */
const featured = {
  href: "/skincare/",
  label: "化粧水",
  en: "Skincare",
  tagline: "肌の土台を、丁寧に選ぶ。",
  desc: "プチプラから百貨店コスメまで、配合成分・保湿力・使用感で徹底比較。あなたの肌タイプに合う一本を。",
  emoji: "💧",
  bg: "bg-[#f0ebe3]",
};

const secondary = [
  {
    href: "/supplement/",
    label: "サプリメント",
    en: "Supplement",
    tagline: "目的別に選ぶ、正しい栄養補給。",
    emoji: "💊",
    bg: "bg-[#f7f0ed]",
  },
  {
    href: "/haircare/",
    label: "ヘアケア",
    en: "Haircare",
    tagline: "髪質から逆引きする選び方。",
    emoji: "✨",
    bg: "bg-[#eff3f0]",
  },
];

const rest = [
  { href: "/makeup/", label: "メイクアップ", en: "Makeup", emoji: "💄" },
  { href: "/oral/", label: "オーラルケア", en: "Oral Care", emoji: "🦷" },
  { href: "/household/", label: "生活用品", en: "Household", emoji: "🏠" },
];

type Article = {
  id: string;
  slug: string;
  title: string;
  hero_image_url: string | null;
  published_at: string | null;
  categories: { name: string; slug: string } | null;
};

async function getPublishedArticles(): Promise<Article[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("id, slug, title, hero_image_url, published_at, categories(name, slug)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12);
    // Supabase returns categories as array from join; normalize to single object
    return ((data ?? []) as unknown[]).map((a: unknown) => {
      const item = a as Record<string, unknown>;
      const cats = item.categories as Array<{ name: string; slug: string }> | null;
      return {
        ...item,
        categories: Array.isArray(cats) ? (cats[0] ?? null) : cats,
      } as Article;
    });
  } catch {
    return [];
  }
}

function ArticleCard({ article }: { article: Article }) {
  const slug = article.slug.replace(/^\/|\/$/g, "");
  const catName = article.categories?.name ?? "";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <Link href={`/${slug}/`} className="group block border border-border hover:border-primary/40 transition-colors bg-background">
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
      <div className="p-4">
        {catName && (
          <p className="text-[9px] tracking-[0.2em] uppercase text-primary font-medium mb-1.5">
            {catName}
          </p>
        )}
        <h3
          className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors"
          style={{ overflowWrap: "break-word" }}
        >
          {article.title}
        </h3>
        {date && (
          <p className="text-[10px] text-muted-foreground font-light mt-2">{date}</p>
        )}
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const articles = await getPublishedArticles();

  return (
    <div className="bg-background">

      {/* ── Hero ── */}
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
              Best
            </h1>
            <h1 className="font-display text-5xl md:text-7xl font-black italic leading-none tracking-tight text-primary mb-6">
              Item.
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-sm leading-relaxed font-light">
              楽天市場の人気商品を、データと専門知識で厳選。
              <br />
              化粧水・サプリメント・ヘアケアの比較ランキング。
            </p>
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

      {/* ── Latest Articles ── */}
      {articles.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 py-12 border-b border-border/60">
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-light">
              Latest Articles
            </h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] tracking-[0.15em] uppercase text-primary font-medium">
              {articles.length}件
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {articles.map((article) => (
              <div key={article.id} className="bg-background">
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Category Grid ── */}
      <section className="max-w-6xl mx-auto px-5 py-12">

        <div className="flex items-baseline gap-4 mb-8">
          <h2 className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-light">
            Category
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Asymmetric: 1 large + 2 stacked */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">

          <Link href={featured.href} className="md:col-span-2 category-card group block">
            <div className={`${featured.bg} h-full min-h-[280px] p-8 md:p-12 flex flex-col justify-between`}>
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-medium mb-1">
                  {featured.en}
                </p>
                <h3 className="font-display text-4xl md:text-5xl font-black italic text-foreground mb-2 leading-tight">
                  {featured.label}
                </h3>
                <p className="text-sm text-muted-foreground font-light mt-3 max-w-xs leading-relaxed">
                  {featured.desc}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <span className="text-xs tracking-[0.15em] uppercase text-primary font-medium">
                  ランキングを見る
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <div className="flex flex-col gap-px">
            {secondary.map((cat) => (
              <Link key={cat.href} href={cat.href} className="category-card group block flex-1">
                <div className={`${cat.bg} h-full min-h-[138px] p-6 flex flex-col justify-between`}>
                  <div>
                    <p className="text-[9px] tracking-[0.22em] uppercase text-primary/70 font-medium mb-1">
                      {cat.en}
                    </p>
                    <h3 className="font-display text-2xl font-bold italic text-foreground">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-light">
                      {cat.tagline}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all self-end" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Horizontal strip */}
        <div className="flex flex-col sm:flex-row border border-border border-t-0">
          {rest.map((cat, i) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`flex-1 group flex items-center justify-between px-6 py-4 hover:bg-secondary/60 transition-colors ${
                i < rest.length - 1 ? "border-b sm:border-b-0 sm:border-r border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{cat.emoji}</span>
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-light">
                    {cat.en}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── About pull-quote ── */}
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
              100+
            </span>
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground text-center">
              Products
            </p>
          </div>
          <div className="md:border-l border-border md:pl-8">
            <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-medium mb-3">
              About
            </p>
            <p className="text-base md:text-lg font-light text-foreground leading-relaxed max-w-xl">
              楽天市場の商品データとAI技術を組み合わせ、
              レビュー数・成分・価格帯を多角的に分析。
              <span className="font-semibold text-primary">本当に良い商品だけ</span>を、
              あなたの元へ届けます。
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
