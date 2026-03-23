"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

interface Product {
  rank: number;
  name: string;
  price: number | null;
  image_url: string | null;
  affiliate_url: string | null;
  review_average: number;
  review_count: number;
  ai_recommended_for: string | null;
  ai_features: string | null;
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span aria-label={`${value}点`} className="flex items-center gap-0.5 flex-wrap">
      <span className="text-sm leading-none">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? "star-filled" : "star-empty"}>★</span>
        ))}
      </span>
      <span className="text-xs font-semibold text-foreground ml-0.5">{value.toFixed(1)}</span>
    </span>
  );
}

const RANK_STYLES: Record<number, { cell: string; badge: string; label: string; numColor: string }> = {
  1: { cell: "bg-amber-50/60",  badge: "bg-amber-400 text-white font-black",  label: "BEST", numColor: "text-amber-500" },
  2: { cell: "bg-gray-50/40",   badge: "bg-gray-400 text-white font-black",   label: "2位",  numColor: "text-gray-400" },
  3: { cell: "bg-orange-50/40", badge: "bg-orange-400 text-white font-black", label: "3位",  numColor: "text-orange-500" },
};

export function ComparisonTable({
  products,
  keyword,
  showHeader = true,
  pageSize = 10,
}: {
  products: Product[];
  keyword: string;
  showHeader?: boolean;
  pageSize?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;
  const Wrapper = showHeader ? "section" : "div";
  return (
    <Wrapper className="mb-10">
      {/* Section header */}
      {showHeader && (
        <div className="flex items-baseline gap-4 mb-4">
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
            Comparison
          </h2>
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
            {keyword} {products.length}選
          </span>
        </div>
      )}

      {/* Table wrapper — horizontal scroll on narrow screens */}
      <div className="relative overflow-x-auto border border-border">
        <table className="w-full border-collapse" style={{ minWidth: "560px" }}>
          <thead>
            <tr className="bg-foreground">
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-center py-2.5 px-2 w-[52px]">
                順位
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-left py-2.5 px-2">
                商品
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-right py-2.5 px-2 w-[76px]">
                価格
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-left py-2.5 px-2 w-[96px]">
                評価
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-left py-2.5 px-2 w-[140px]">
                こんな人に
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((p) => {
              const style = RANK_STYLES[p.rank];
              const imgSize = p.rank === 1 ? 64 : 52;

              return (
                <tr
                  key={p.rank}
                  className={`${style?.cell ?? ""} border-b border-border/40 hover:brightness-[0.97] transition-all`}
                >
                  {/* 順位 */}
                  <td className="text-center py-3 px-2 align-top">
                    {style ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`font-display font-black italic text-2xl leading-none ${style.numColor}`}>
                          #{p.rank}
                        </span>
                        <span className={`text-[9px] tracking-[0.1em] px-1 py-0.5 ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                    ) : (
                      <span className="font-display font-bold text-base text-muted-foreground">
                        {p.rank}
                      </span>
                    )}
                  </td>

                  {/* 商品: [画像+詳細ボタン（縦積み)] + [商品名テキスト] */}
                  <td className="py-3 px-2 align-top">
                    <div className="flex items-start gap-2.5">

                      {/* 左ブロック: 画像(リンク) + 詳細ボタン — 縦積み */}
                      <div className="shrink-0 flex flex-col items-center gap-1.5">
                        {/* 画像タップ → アフィリリンク */}
                        {p.affiliate_url ? (
                          <a
                            href={p.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="block"
                            aria-label={`${p.name}の詳細を見る`}
                          >
                            {p.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p.name}
                                width={imgSize}
                                height={imgSize}
                                className="object-contain bg-white border border-border/40 hover:opacity-90 transition-opacity"
                                style={{ width: imgSize, height: imgSize }}
                                unoptimized
                              />
                            ) : (
                              <div
                                className="bg-muted flex items-center justify-center text-muted-foreground/30 text-[9px]"
                                style={{ width: imgSize, height: imgSize }}
                              >
                                No Img
                              </div>
                            )}
                          </a>
                        ) : (
                          p.image_url ? (
                            <Image
                              src={p.image_url}
                              alt={p.name}
                              width={imgSize}
                              height={imgSize}
                              className="object-contain bg-white border border-border/40"
                              style={{ width: imgSize, height: imgSize }}
                              unoptimized
                            />
                          ) : (
                            <div
                              className="bg-muted flex items-center justify-center text-muted-foreground/30 text-[9px]"
                              style={{ width: imgSize, height: imgSize }}
                            >
                              No Img
                            </div>
                          )
                        )}

                        {/* 詳細ボタン — 画像の真下に配置 */}
                        {p.affiliate_url && (
                          <a
                            href={p.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            style={{ width: imgSize }}
                            className={`flex items-center justify-center gap-0.5 text-[9px] font-semibold tracking-[0.05em] py-1 transition-colors ${
                              p.rank === 1
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            }`}
                          >
                            <ExternalLink className="h-2 w-2 shrink-0" />
                            詳細
                          </a>
                        )}
                      </div>

                      {/* 右ブロック: 商品名 */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold leading-snug text-foreground ${
                            p.rank === 1 ? "text-xs" : "text-[11px]"
                          }`}
                          style={{ overflowWrap: "break-word", wordBreak: "break-all" }}
                        >
                          {p.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 価格 */}
                  <td className="text-right py-3 px-2 align-top">
                    {p.price ? (
                      <>
                        <span className="font-bold text-sm text-foreground whitespace-nowrap">
                          ¥{p.price.toLocaleString()}
                        </span>
                        <span className="block text-[9px] text-muted-foreground font-light">税込</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* 評価 */}
                  <td className="py-3 px-2 align-top">
                    <Stars value={p.review_average} />
                    <p className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">
                      {p.review_count.toLocaleString()}件
                    </p>
                  </td>

                  {/* こんな人に */}
                  <td className="py-3 px-2 align-top">
                    {p.ai_recommended_for ? (
                      <p
                        className="text-[11px] text-foreground leading-snug"
                        style={{ overflowWrap: "break-word" }}
                      >
                        {p.ai_recommended_for}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* フェードアウト効果 */}
        {hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {/* 続きを見るボタン */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => Math.min(c + pageSize, products.length))}
          className="w-full py-2.5 mt-1 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors rounded"
        >
          続きを見る（残り{products.length - visibleCount}件）
        </button>
      )}

      <p className="text-[10px] text-muted-foreground mt-2 text-right font-light">
        ※ 価格は楽天市場の表示価格（税込）。最新の価格はリンク先でご確認ください。
      </p>
    </Wrapper>
  );
}
