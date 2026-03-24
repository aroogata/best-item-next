"use client";

import Image from "next/image";
import { MapPin, Clock, ExternalLink, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

interface Shop {
  rank: number;
  name: string;
  price: number | null;
  image_url: string | null;
  images_json?: string | null;     // 複数画像のJSON配列
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
  product_id?: string;
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

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem("poll_fp");
  if (!fp) { fp = crypto.randomUUID(); localStorage.setItem("poll_fp", fp); }
  return fp;
}

function InteractiveStars({ rating, onSelect }: { rating: number; onSelect: (r: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onSelect(i)} className="text-base cursor-pointer hover:scale-110 transition-transform">
          {i <= rating ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}

type ReviewItem = { id: string; rating: number; comment: string; nickname: string; created_at: string };

function InlineReviewForm({ productId, articleId, productName }: { productId: string; articleId: string; productName: string }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadedReviews, setLoadedReviews] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (loadedReviews) return;
    fetch(`/api/reviews?article_id=${articleId}&fingerprint=${getFingerprint()}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          const productReviews = (data.reviews || []).filter((r: any) => r.product_id === productId);
          setReviews(productReviews);
        }
        setLoadedReviews(true);
      })
      .catch(() => setLoadedReviews(true));
  }, [articleId, productId, loadedReviews]);

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);
  const avgRating = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim() || submitting) return;
    setSubmitting(true);
    const fp = getFingerprint();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: articleId, product_id: productId, rating,
        comment: comment.trim(),
        nickname: profile?.display_name || "",
        fingerprint: fp,
        user_id: user?.id || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setDone(true);
      setMsg(data.message || "レビューありがとうございます！");
    } else {
      setMsg(data.error || "エラーが発生しました");
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-3">
      {reviews.length > 0 && (
        <div className="bg-secondary/30 border border-border/40 rounded-lg p-2.5 mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold text-foreground">ユーザーレビュー</span>
            <span className="text-[10px] text-yellow-500">★ {avgRating}</span>
            <span className="text-[10px] text-muted-foreground">({reviews.length}件)</span>
          </div>
          <div className="space-y-1">
            {visibleReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-yellow-500 shrink-0">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <span className="text-foreground/80 flex-1">{r.comment}</span>
                <span className="text-muted-foreground shrink-0">- {r.nickname || "匿名"}</span>
              </div>
            ))}
          </div>
          {reviews.length > 3 && !showAll && (
            <button onClick={() => setShowAll(true)} className="text-[10px] text-primary hover:underline mt-1">
              他{reviews.length - 3}件を表示
            </button>
          )}
        </div>
      )}

      {done ? (
        <p className="text-[11px] text-green-600">✓ {msg || "レビューありがとうございます！"}</p>
      ) : !open ? (
        <button onClick={() => setOpen(true)} className="text-[11px] text-blue-500 hover:text-blue-600 font-medium">
          ✏️ この施設のレビューを書く
          {user && <span className="text-[10px] text-primary ml-1">(+30pt)</span>}
        </button>
      ) : (
      <div className="bg-secondary/50 border border-border/60 rounded-lg p-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] text-muted-foreground">評価:</span>
        <InteractiveStars rating={rating} onSelect={setRating} />
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`${productName}の感想を一言...`}
          maxLength={300}
          className="flex-1 px-2 py-1 text-xs border rounded bg-background border-border text-foreground"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || !comment.trim() || submitting}
          className="px-3 py-1 text-[11px] font-medium rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
        >
          {submitting ? "..." : "投稿"}
        </button>
      </div>
      {msg && <p className="text-[10px] text-red-500 mt-1">{msg}</p>}
      </div>
      )}
    </div>
  );
}

export function LocalShopCard({ shop, articleId }: { shop: Shop; articleId?: string }) {
  const isTop1 = shop.rank === 1;
  const isTop3 = shop.rank <= 3;
  const { genre, hours, holiday } = parseDescription(shop.description);

  // 複数画像: images_json から追加画像を取得（主画像を除く最大4枚）
  const extraImages: string[] = (() => {
    if (!shop.images_json) return [];
    try {
      const parsed = JSON.parse(shop.images_json) as string[];
      return parsed.filter((url) => url !== shop.image_url).slice(0, 4);
    } catch {
      return [];
    }
  })();
  const safeAffiliateUrl = (() => {
    if (!shop.affiliate_url) return null;

    try {
      const url = new URL(shop.affiliate_url);
      return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
    } catch {
      return null;
    }
  })();

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

        {/* 追加画像ギャラリー */}
        {extraImages.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {extraImages.map((url, i) => (
              <Image
                key={i}
                src={url}
                alt={`${shop.name} 写真${i + 2}`}
                width={72}
                height={72}
                className="object-cover shrink-0 bg-secondary"
                unoptimized
                style={{ width: 72, height: 72 }}
              />
            ))}
          </div>
        )}

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
              <span>{hours}</span>
            </div>
          )}
          {holiday && (
            <div className="flex items-start gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span>{`定休日: ${holiday}`}</span>
            </div>
          )}
          {shop.ai_cons && (
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
        {safeAffiliateUrl && (
          <a
            href={safeAffiliateUrl}
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

        {/* インラインレビュー欄 */}
        {articleId && shop.product_id && (
          <InlineReviewForm productId={shop.product_id} articleId={articleId} productName={shop.name} />
        )}
      </div>
    </article>
  );
}
