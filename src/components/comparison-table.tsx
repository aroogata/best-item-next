import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

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
    <span className="whitespace-nowrap text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? "star-filled" : "star-empty"}>★</span>
      ))}
      <span className="ml-1 text-xs font-semibold text-foreground">{value.toFixed(1)}</span>
    </span>
  );
}

const RANK_STYLES: Record<number, { cell: string; badge: string; label: string }> = {
  1: {
    cell: "bg-amber-50/60",
    badge: "bg-amber-400 text-white font-black",
    label: "BEST",
  },
  2: {
    cell: "bg-gray-50/60",
    badge: "bg-gray-400 text-white font-black",
    label: "2位",
  },
  3: {
    cell: "bg-orange-50/60",
    badge: "bg-orange-400 text-white font-black",
    label: "3位",
  },
};

export function ComparisonTable({
  products,
  keyword,
}: {
  products: Product[];
  keyword: string;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-4 mb-4">
        <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
          Comparison
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
          {keyword} {products.length}選
        </span>
      </div>

      {/* Horizontally scrollable on mobile */}
      <div className="overflow-x-auto rounded-none border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground hover:bg-foreground">
              <TableHead className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium w-14 text-center">
                順位
              </TableHead>
              <TableHead className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium min-w-[260px]">
                商品
              </TableHead>
              <TableHead className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium w-28 text-right">
                価格
              </TableHead>
              <TableHead className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium w-36">
                評価
              </TableHead>
              <TableHead className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium min-w-[140px]">
                こんな人に
              </TableHead>
              <TableHead className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium w-28 text-center">
                購入
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const style = RANK_STYLES[p.rank];
              return (
                <TableRow
                  key={p.rank}
                  className={`${style?.cell ?? ""} hover:brightness-[0.97] transition-all border-b border-border/50`}
                >
                  {/* Rank */}
                  <TableCell className="text-center py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      {style ? (
                        <>
                          <span
                            className={`font-display font-black italic text-2xl leading-none ${
                              p.rank === 1 ? "text-amber-500" : p.rank === 2 ? "text-gray-400" : "text-orange-500"
                            }`}
                          >
                            #{p.rank}
                          </span>
                          <span
                            className={`text-[9px] tracking-[0.1em] px-1.5 py-0.5 rounded-sm ${style.badge}`}
                          >
                            {style.label}
                          </span>
                        </>
                      ) : (
                        <span className="font-display font-bold text-lg text-muted-foreground">
                          {p.rank}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Product image + name */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            width={64}
                            height={64}
                            className="object-contain bg-white border border-border/40"
                            unoptimized
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted flex items-center justify-center text-muted-foreground/30 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold leading-snug line-clamp-2 ${p.rank === 1 ? "text-sm" : "text-xs"} text-foreground`}>
                          {p.name}
                        </p>
                        {p.ai_features && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                            {p.ai_features}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right py-3">
                    {p.price ? (
                      <div>
                        <span className="font-bold text-sm text-foreground">
                          ¥{p.price.toLocaleString()}
                        </span>
                        <span className="block text-[9px] text-muted-foreground font-light">税込</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Rating */}
                  <TableCell className="py-3">
                    <div>
                      <Stars value={p.review_average} />
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {p.review_count.toLocaleString()}件
                      </p>
                    </div>
                  </TableCell>

                  {/* Recommended for */}
                  <TableCell className="py-3">
                    {p.ai_recommended_for ? (
                      <p className="text-xs text-foreground leading-snug">
                        {p.ai_recommended_for}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* CTA */}
                  <TableCell className="text-center py-3">
                    {p.affiliate_url ? (
                      <a
                        href={p.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase px-3 py-2 transition-colors ${
                          p.rank === 1
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        詳細
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2 text-right font-light">
        ※ 価格は楽天市場の表示価格（税込）。最新の価格はリンク先でご確認ください。
      </p>
    </section>
  );
}
