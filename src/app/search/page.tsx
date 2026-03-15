import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import Link from "next/link";
import { Search } from "lucide-react";

const PER_PAGE = 10;
const MAX_RESULTS = 30;

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  published_at: string | null;
  categories: { name: string; slug: string } | null;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  return {
    title: query ? `「${query}」の検索結果` : "記事検索",
    description: query
      ? `「${query}」に関連するBest Itemの記事一覧です。`
      : "Best Itemの記事をキーワードで検索できます。",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = (q ?? "").trim();
  const currentPage = Math.max(1, Math.min(3, parseInt(page ?? "1", 10) || 1));
  const offset = (currentPage - 1) * PER_PAGE;

  let articles: ArticleRow[] = [];
  let totalCapped = 0;

  if (query.length >= 2) {
    const supabase = createPublicClient();

    // 最大 MAX_RESULTS+1 件取得して上限に達したか判定
    const { data, count } = await supabase
      .from("articles")
      .select("id, slug, title, meta_description, published_at, categories(name, slug)", {
        count: "exact",
      })
      .eq("status", "published")
      .or(`title.ilike.%${query}%,meta_description.ilike.%${query}%`)
      .order("published_at", { ascending: false })
      .range(offset, offset + PER_PAGE - 1);

    articles = (data ?? []) as unknown as ArticleRow[];
    totalCapped = Math.min(count ?? 0, MAX_RESULTS);
  }

  const totalPages = Math.min(3, Math.ceil(totalCapped / PER_PAGE));
  const hasResults = articles.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ── ページタイトル ── */}
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
          Search
        </h1>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
          記事検索
        </span>
      </div>

      {/* ── 検索フォーム ── */}
      <form action="/search" method="GET" className="mb-8">
        <div className="relative">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="タイトル・説明文で検索…"
            autoComplete="off"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={!query}
            className="w-full h-11 pl-4 pr-12 border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            aria-label="検索"
            className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* ── 検索実行済み ── */}
      {query.length >= 2 && (
        <>
          {/* 件数表示 */}
          <p className="text-xs text-muted-foreground mb-6">
            「{query}」の検索結果：
            <span className="font-semibold text-foreground ml-1">
              {totalCapped}件
            </span>
            {totalCapped >= MAX_RESULTS && (
              <span className="ml-1">（上位 {MAX_RESULTS} 件を表示）</span>
            )}
          </p>

          {hasResults ? (
            <>
              <div className="divide-y divide-border/60">
                {articles.map((article) => {
                  const slug = article.slug.startsWith("/") ? article.slug : `/${article.slug}`;
                  return (
                    <article key={article.id} className="py-5">
                      <Link href={slug} className="group block space-y-1">
                        <h2 className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </h2>
                        {article.meta_description && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {article.meta_description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                          {article.categories && (
                            <span className="text-primary font-medium">
                              {article.categories.name}
                            </span>
                          )}
                          {article.published_at && (
                            <>
                              {article.categories && <span>·</span>}
                              <time dateTime={article.published_at}>
                                {new Date(article.published_at).toLocaleDateString("ja-JP")}
                              </time>
                            </>
                          )}
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {/* ── ページネーション ── */}
              {totalPages > 1 && (
                <nav
                  aria-label="検索結果ページ"
                  className="flex items-center justify-center gap-1.5 mt-10"
                >
                  {currentPage > 1 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                      className="px-4 py-2 text-sm border border-border hover:border-primary hover:text-primary transition-colors"
                    >
                      前へ
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
                      aria-current={p === currentPage ? "page" : undefined}
                      className={`w-9 h-9 flex items-center justify-center text-sm border transition-colors ${
                        p === currentPage
                          ? "border-primary bg-primary text-primary-foreground font-semibold"
                          : "border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                  {currentPage < totalPages && (
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                      className="px-4 py-2 text-sm border border-border hover:border-primary hover:text-primary transition-colors"
                    >
                      次へ
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                「{query}」に一致する記事が見つかりませんでした。
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                別のキーワードで試してみてください。
              </p>
            </div>
          )}
        </>
      )}

      {/* 2文字未満の警告 */}
      {query.length === 1 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          2文字以上入力してください。
        </p>
      )}
    </div>
  );
}
