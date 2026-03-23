"use client";

import { useEffect, useState, useCallback } from "react";

type Review = {
  id: string;
  product_id: string;
  rating: number;
  comment: string;
  nickname: string;
  created_at: string;
};

type ProductStats = Record<string, { avg: number; count: number }>;

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem("poll_fp");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("poll_fp", fp);
  }
  return fp;
}

function Stars({ rating, interactive, onSelect }: { rating: number; interactive?: boolean; onSelect?: (r: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(i)}
          className={`text-sm ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          {i <= rating ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

export function ProductReviews({
  articleId,
  products,
}: {
  articleId: string;
  products: Array<{ product_id: string; name: string; rank: number }>;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);
  const [productStats, setProductStats] = useState<ProductStats>({});
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    const fp = getFingerprint();
    const res = await fetch(`/api/reviews?article_id=${articleId}&fingerprint=${fp}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
      setReviewedProductIds(data.reviewedProductIds || []);
      setProductStats(data.productStats || {});
    }
    setLoading(false);
  }, [articleId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  if (loading) return null;

  const totalReviews = reviews.length;

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
        <span className="text-lg">💬</span>
        ユーザーレビュー
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        {totalReviews > 0 ? `${totalReviews}件のレビュー` : "まだレビューはありません"}
        {totalReviews === 0 && " — 最初のレビューを投稿しませんか？"}
      </p>

      {/* 商品ごとのレビュー */}
      <div className="space-y-4">
        {products.slice(0, 10).map((product) => {
          const stats = productStats[product.product_id];
          const productReviews = reviews.filter((r) => r.product_id === product.product_id);
          const hasReviewed = reviewedProductIds.includes(product.product_id);

          return (
            <ProductReviewCard
              key={product.product_id}
              articleId={articleId}
              product={product}
              stats={stats}
              reviews={productReviews}
              hasReviewed={hasReviewed}
              onReviewPosted={loadReviews}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProductReviewCard({
  articleId,
  product,
  stats,
  reviews,
  hasReviewed,
  onReviewPosted,
}: {
  articleId: string;
  product: { product_id: string; name: string; rank: number };
  stats?: { avg: number; count: number };
  reviews: Review[];
  hasReviewed: boolean;
  onReviewPosted: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim() || submitting) return;
    setSubmitting(true);
    const fp = getFingerprint();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: articleId,
        product_id: product.product_id,
        rating,
        comment: comment.trim(),
        nickname: nickname.trim(),
        fingerprint: fp,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setMsg(data.message);
      setComment("");
      setRating(0);
      setShowForm(false);
      onReviewPosted();
    } else {
      setMsg(data.error || "エラーが発生しました");
    }
    setSubmitting(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const visibleReviews = showAll ? reviews : reviews.slice(0, 2);

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
      {/* 商品ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
            #{product.rank}
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
            {product.name}
          </span>
        </div>
        {stats && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            {stats.avg} ({stats.count}件)
          </span>
        )}
      </div>

      {/* レビュー一覧 */}
      {visibleReviews.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {visibleReviews.map((r) => (
            <div key={r.id} className="bg-gray-50 dark:bg-gray-700/40 rounded px-2.5 py-1.5">
              <div className="flex items-center gap-2 mb-0.5">
                <Stars rating={r.rating} />
                <span className="text-[10px] text-gray-500">{r.nickname}</span>
                <span className="text-[10px] text-gray-400">{timeAgo(r.created_at)}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">{r.comment}</p>
            </div>
          ))}
          {reviews.length > 2 && !showAll && (
            <button onClick={() => setShowAll(true)} className="text-[11px] text-blue-500 hover:underline">
              他{reviews.length - 2}件を表示
            </button>
          )}
        </div>
      )}

      {/* 投稿フォーム */}
      {!hasReviewed && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-blue-500 hover:text-blue-600 font-medium"
        >
          ✏️ レビューを書く
        </button>
      )}
      {hasReviewed && <p className="text-[10px] text-gray-400">✓ レビュー投稿済み</p>}

      {showForm && !hasReviewed && (
        <div className="mt-2 space-y-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">評価:</span>
            <Stars rating={rating} interactive onSelect={setRating} />
            {rating > 0 && <span className="text-xs text-gray-400">{rating}/5</span>}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネーム"
              maxLength={20}
              className="w-24 px-2 py-1 text-xs border rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="一言レビュー..."
              maxLength={300}
              className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || !comment.trim() || submitting}
              className="px-3 py-1 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {submitting ? "..." : "投稿"}
            </button>
          </div>
        </div>
      )}

      {msg && <p className="text-[11px] text-green-600 dark:text-green-400 mt-1">{msg}</p>}
    </div>
  );
}
