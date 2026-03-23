"use client";

export function ArticleTOC({ hasProducts, isContentArticle }: { hasProducts: boolean; isContentArticle: boolean }) {
  const items = [
    ...(isContentArticle ? [{ id: "article-body", label: "解説" }] : []),
    ...(isContentArticle ? [] : [{ id: "article-criteria", label: "選び方" }]),
    ...(hasProducts ? [{ id: "article-products", label: "商品詳細" }] : []),
    { id: "article-conclusion", label: "まとめ" },
    { id: "article-poll", label: "アンケート" },
    ...(hasProducts ? [{ id: "article-reviews", label: "レビュー" }] : []),
    { id: "article-ranking", label: "ランキング" },
    { id: "article-qa", label: "Q&A" },
  ];

  return (
    <nav className="mb-6 border border-border/60 bg-secondary/30 rounded-lg p-3">
      <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium mb-2">目次</p>
      <div className="flex flex-wrap gap-x-1 gap-y-1">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="text-xs text-primary hover:underline underline-offset-2 px-2 py-0.5 bg-secondary/60 rounded border border-border/40 hover:bg-secondary transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
