"use client";

import Image from "next/image";
import { ExternalLink, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

interface Product {
  rank: number;
  name: string;
  product_id?: string;
  price: number | null;
  image_url: string | null;
  images_json?: string | null;
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
        <li key={i} className="flex items-start gap-2 text-xs text-foreground/95 leading-snug">
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

/** 画像ギャラリー: 複数画像対応 + タップ拡大 */
function ImageGallery({ images, name, isTop1 }: { images: string[]; name: string; isTop1: boolean }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const size = isTop1 ? 112 : 88;

  if (images.length === 0) {
    return (
      <div
        className="bg-muted flex items-center justify-center text-muted-foreground/30 text-xs"
        style={{ width: size, height: size }}
      >
        No Image
      </div>
    );
  }

  return (
    <div>
      {/* メイン画像 */}
      <button type="button" onClick={() => setZoomed(true)} className="cursor-zoom-in block">
        <Image
          src={images[selectedIdx]}
          alt={name}
          width={size}
          height={size}
          className="object-contain bg-secondary"
          unoptimized
          style={{ width: size, height: size }}
        />
      </button>

      {/* サムネイル（複数枚ある場合） */}
      {images.length > 1 && (
        <div className="flex gap-1 mt-1 overflow-x-auto">
          {images.slice(0, 5).map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`shrink-0 border rounded overflow-hidden ${
                idx === selectedIdx ? "border-primary" : "border-border/50 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img} alt="" width={28} height={28} className="object-contain" unoptimized style={{ width: 28, height: 28 }} />
            </button>
          ))}
        </div>
      )}

      {/* ズームモーダル */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={images[selectedIdx]}
              alt={name}
              width={600}
              height={600}
              className="object-contain max-w-full max-h-[85vh]"
              unoptimized
            />
            <button
              onClick={() => setZoomed(false)}
              className="absolute top-2 right-2 bg-white/80 text-black rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
            >
              ×
            </button>
            {images.length > 1 && (
              <div className="flex gap-2 justify-center mt-3">
                {images.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setSelectedIdx(idx); }}
                    className={`shrink-0 border-2 rounded overflow-hidden ${
                      idx === selectedIdx ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" width={48} height={48} className="object-contain" unoptimized style={{ width: 48, height: 48 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem("poll_fp");
  if (!fp) { fp = crypto.randomUUID(); localStorage.setItem("poll_fp", fp); }
  return fp;
}

/** インラインレビュー投稿欄 */
type ReviewItem = { id: string; rating: number; comment: string; nickname: string; created_at: string };

function InlineReviewForm({ productId, articleId, productName, isLocal }: { productId: string; articleId: string; productName: string; isLocal?: boolean }) {
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

  const label = isLocal ? "この施設" : "この商品";

  // マウント時にレビューを自動読み込み
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
      {/* 既存レビュー表示（常に表示） */}
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

      {/* レビュー投稿 */}
      {done ? (
        <p className="text-[11px] text-green-600">✓ {msg || "レビューありがとうございます！"}</p>
      ) : !open ? (
        <button onClick={() => setOpen(true)} className="text-[11px] text-blue-500 hover:text-blue-600 font-medium">
          ✏️ {label}のレビューを書く
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

function parseImages(imageUrl: string | null, imagesJson?: string | null): string[] {
  const urls: string[] = [];
  if (imagesJson) {
    try {
      const parsed = JSON.parse(imagesJson);
      if (Array.isArray(parsed)) {
        urls.push(...parsed.filter((u: unknown) => typeof u === "string" && u.startsWith("http")));
      }
    } catch { /* ignore */ }
  }
  if (urls.length === 0 && imageUrl) urls.push(imageUrl);
  return urls;
}

export function ProductCard({ product, articleId, isLocal }: { product: Product; articleId?: string; isLocal?: boolean }) {
  const isTop1 = product.rank === 1;
  const isTop3 = product.rank <= 3;
  const images = parseImages(product.image_url, product.images_json);

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
          {/* Product image gallery */}
          <div className="shrink-0">
            <ImageGallery images={images} name={product.name} isTop1={isTop1} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <RankLabel rank={product.rank} />
            </div>
            <h3 className={`font-semibold leading-snug mb-2 ${isTop1 ? "text-base md:text-lg" : "text-sm md:text-base"} text-foreground`}>
              {product.affiliate_url ? (
                <a
                  href={product.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-primary hover:underline underline-offset-2 transition-colors"
                >
                  {product.name}
                </a>
              ) : (
                product.name
              )}
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
          <p className="mt-4 text-sm text-foreground/95 leading-relaxed">
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
                <p className="text-xs text-foreground/95 leading-snug">
                  {product.ai_recommended_for}
                </p>
              </div>
            )}
            {product.ai_not_recommended_for && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground font-semibold whitespace-nowrap mt-0.5">
                  向かない人
                </span>
                <p className="text-xs text-foreground/80 leading-snug">
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
            {isLocal ? "詳細はこちら" : "詳細・購入はこちら"}
          </a>
        )}

        {/* インラインレビュー欄 */}
        {articleId && product.product_id && (
          <InlineReviewForm productId={product.product_id} articleId={articleId} productName={product.name} isLocal={isLocal} />
        )}
      </div>
    </article>
  );
}
