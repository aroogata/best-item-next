import Image from "next/image";
import { MapPin, Clock, ExternalLink, Check } from "lucide-react";

interface Shop {
  rank: number;
  name: string;
  price: number | null;
  image_url: string | null;
  affiliate_url: string | null;
  review_average: number | null;
  review_count: number | null;
  shop_name: string | null;        // address が格納されている
  description: string | null;      // "ジャンル | 営業時間: ... | 定休日: ..." 形式
  ai_review: string | null;
  ai_features: string | null;      // おすすめポイント（箇条書き）
  ai_cons: string | null;          // アクセス情報
  ai_recommended_for: string | null;
  ai_not_recommended_for?: string | null;
}

function StarRating({ value, count }: { value: number; count: number | null }) {
  const filled = Math.round(value);
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <span className="text-sm tracking-tight">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? "star-filled" : "star-empty"}>★</span>
        ))}
      </span>
      <span className="text-xs font-semibold text-foreground">{value.toFixed(1)}</span>
      {count != null && count > 0 && (
        <span className="text-xs text-muted-foreground">({count.toLocaleString()}件)</span>
      )}
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

function BulletList({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[•・]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-1">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-foreground/95 leading-snug">
          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/** description 文字列から "フィールド名: 値" を抽出 */
function parseDescription(desc: string | null) {
  if (!desc) return { genre: null, hours: null, holiday: null };
  const parts = desc.split(" | ");
  const genre = parts[0] && !parts[0].includes(":") ? parts[0] : null;
  const hours = parts.find((p) => p.startsWith("営業時間:"))?.replace("営業時間:", "").trim() ?? null;
  const holiday = parts.find((p) => p.startsWith("定休日:"))?.replace("定休日:", "").trim() ?? null;
  return { genre, hours, holiday };
}

export function LocalShopCard({ shop }: { shop: Shop }) {
  const isTop1 = shop.rank === 1;
  const isTop3 = shop.rank <= 3;
  const { genre, hours, holiday } = parseDescription(shop.description);

  return (
    <article
      id={`rank-${shop.rank}`}
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
        {shop.rank}
      </span>

      <div className="relative p-4 md:p-6">
        {/* Header row */}
        <div className="flex gap-4 md:gap-6">
          {/* Shop image */}
          <div className="shrink-0">
            {shop.image_url ? (
              <Image
                src={shop.image_url}
                alt={shop.name}
                width={isTop1 ? 112 : 88}
                height={isTop1 ? 112 : 88}
                className="object-cover bg-secondary"
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

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <RankLabel rank={shop.rank} />
            </div>
            <h3 className={`font-semibold leading-snug mb-2 ${isTop1 ? "text-base md:text-lg" : "text-sm md:text-base"} text-foreground`}>
              {shop.name}
            </h3>
            {genre && (
              <p className="text-[10px] text-muted-foreground mb-1.5">{genre}</p>
            )}
            {shop.review_average != null && shop.review_average > 0 && (
              <StarRating value={shop.review_average} count={shop.review_count} />
            )}
          </div>
        </div>

        {/* Shop details */}
        <div className="mt-3 space-y-1.5 text-xs text-foreground/80">
          {shop.shop_name && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span>{shop.shop_name}</span>
            </div>
          )}
          {hours && (
            <div className="flex items-start gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span>{hours}{holiday ? `　定休日: ${holiday}` : ""}</span>
            </div>
          )}
          {shop.ai_cons && !hours && (
            <div className="flex items-start gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{shop.ai_cons}</span>
            </div>
          )}
        </div>

        {/* AI review */}
        {shop.ai_review && (
          <p className="mt-4 text-sm text-foreground/95 leading-relaxed">
            {shop.ai_review}
          </p>
        )}

        {/* Highlights */}
        {shop.ai_features && (
          <div className="mt-4 bg-emerald-50/60 border border-emerald-100 p-3">
            <p className="text-[10px] tracking-[0.12em] uppercase text-emerald-700 font-medium mb-2">
              おすすめポイント
            </p>
            <BulletList text={shop.ai_features} />
          </div>
        )}

        {/* Recommended for */}
        {shop.ai_recommended_for && (
          <div className="mt-3 flex items-start gap-2">
            <span className="text-[9px] tracking-[0.12em] uppercase text-primary font-semibold whitespace-nowrap mt-0.5">
              こんな人に
            </span>
            <p className="text-xs text-foreground/95 leading-snug">
              {shop.ai_recommended_for}
            </p>
          </div>
        )}

        {/* Website CTA */}
        {shop.affiliate_url && (
          <a
            href={shop.affiliate_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold tracking-[0.1em] uppercase transition-colors ${
              isTop1
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            <ExternalLink className="h-3 w-3" />
            公式サイトを見る
          </a>
        )}
      </div>
    </article>
  );
}
