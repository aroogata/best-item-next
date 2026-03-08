import Image from "next/image";
import { ExternalLink, Check, AlertCircle } from "lucide-react";

interface Product {
  rank: number;
  name: string;
  price: number | null;
  image_url: string | null;
  affiliate_url: string | null;
  review_average: number;
  review_count: number;
  ai_review: string | null;
  ai_features: string | null;
  ai_recommended_for: string | null;
  ai_cons?: string | null;
  ai_not_recommended_for?: string | null;
}

function StarRating({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span aria-label={`${value}点`} className="flex items-center gap-1">
      <span className="text-sm tracking-tight">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? "star-filled" : "star-empty"}>★</span>
        ))}
      </span>
      <span className="text-xs font-semibold text-foreground">{value.toFixed(1)}</span>
    </span>
  );
}

function RankLabel({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-[9px] tracking-[0.2em] uppercase text-primary font-medium">Rank</span>
        <span className="font-display font-black italic text-4xl text-primary leading-none">#1</span>
      </div>
    );
  }
  if (rank <= 3) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-medium">Rank</span>
        <span className="font-display font-black italic text-3xl text-foreground leading-none">#{rank}</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground/60 font-light">No.</span>
      <span className="font-display font-bold text-xl text-muted-foreground leading-none">{rank}</span>
    </div>
  );
}

/** 箇条書きテキスト（• or ・ で始まる行）をリスト表示 */
function BulletList({ text, icon }: { text: string; icon: "check" | "alert" }) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[•・]\s*/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <ul className="space-y-1">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-snug">
          {icon === "check" ? (
            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const isTop1 = product.rank === 1;
  const isTop3 = product.rank <= 3;

  return (
    <article
      id={`rank-${product.rank}`}
      className={`relative overflow-hidden ${
        isTop1
          ? "border-l-2 border-primary bg-card shadow-sm"
          : isTop3
          ? "bg-card border border-border/80"
          : "bg-card border border-border/50"
      }`}
    >
      {/* Ghost rank number */}
      <span
        className="font-display font-black absolute -right-3 -bottom-4 leading-none select-none pointer-events-none"
        style={{
          fontSize: "clamp(5rem, 10vw, 7rem)",
          WebkitTextStroke: "1px oklch(0.41 0.12 15 / 0.06)",
          color: "transparent",
          opacity: isTop3 ? 1 : 0.6,
        }}
        aria-hidden
      >
        {product.rank}
      </span>

      <div className="relative p-4 md:p-6">
        {/* Header row: image + name + rank + price */}
        <div className="flex gap-4 md:gap-6">
          {/* Product image */}
          <div className="shrink-0">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                width={isTop1 ? 112 : 88}
                height={isTop1 ? 112 : 88}
                className="object-contain bg-secondary"
                unoptimized
                style={{ width: isTop1 ? 112 : 88, height: isTop1 ? 112 : 88 }}
              />
            ) : (
              <div
                className="bg-muted flex items-center justify-center text-muted-foreground/30 text-xs"
                style={{ width: isTop1 ? 112 : 88, height: isTop1 ? 112 : 88 }}
              >
                No Image
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <RankLabel rank={product.rank} />
            </div>
            <h3 className={`font-semibold leading-snug mb-2 ${isTop1 ? "text-base md:text-lg" : "text-sm md:text-base"} text-foreground`}>
              {product.name}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <StarRating value={product.review_average} />
              <span className="text-xs text-muted-foreground">
                {product.review_count.toLocaleString()}件
              </span>
            </div>
            {product.price && (
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`font-bold ${isTop1 ? "text-xl" : "text-lg"} text-foreground`}>
                  ¥{product.price.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground font-light">(税込)</span>
              </div>
            )}
          </div>
        </div>

        {/* Main review text */}
        {product.ai_review && (
          <p className="mt-4 text-sm text-foreground/80 leading-relaxed">
            {product.ai_review}
          </p>
        )}

        {/* Pros / Cons grid */}
        {(product.ai_features || product.ai_cons) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {product.ai_features && (
              <div className="bg-emerald-50/60 border border-emerald-100 p-3">
                <p className="text-[10px] tracking-[0.12em] uppercase text-emerald-700 font-medium mb-2">
                  良いところ
                </p>
                <BulletList text={product.ai_features} icon="check" />
              </div>
            )}
            {product.ai_cons && (
              <div className="bg-amber-50/60 border border-amber-100 p-3">
                <p className="text-[10px] tracking-[0.12em] uppercase text-amber-700 font-medium mb-2">
                  気になるところ
                </p>
                <BulletList text={product.ai_cons} icon="alert" />
              </div>
            )}
          </div>
        )}

        {/* Recommended for / Not recommended */}
        {(product.ai_recommended_for || product.ai_not_recommended_for) && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {product.ai_recommended_for && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] tracking-[0.12em] uppercase text-primary font-semibold whitespace-nowrap mt-0.5">
                  こんな人に
                </span>
                <p className="text-xs text-foreground/80 leading-snug">
                  {product.ai_recommended_for}
                </p>
              </div>
            )}
            {product.ai_not_recommended_for && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground font-semibold whitespace-nowrap mt-0.5">
                  向かない人
                </span>
                <p className="text-xs text-muted-foreground leading-snug">
                  {product.ai_not_recommended_for}
                </p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {product.affiliate_url && (
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold tracking-[0.1em] uppercase transition-colors ${
              isTop1
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            <ExternalLink className="h-3 w-3" />
            詳細・購入はこちら
          </a>
        )}
      </div>
    </article>
  );
}
