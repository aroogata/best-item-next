import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

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
}

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "full";
    if (i === full && half) return "half";
    return "empty";
  });
  return (
    <span className="text-amber-400 text-sm" aria-label={`${value}点`}>
      {stars.map((s, i) =>
        s === "full" ? "★" : s === "half" ? "☆" : "☆"
      ).join("")}
      <span className="text-gray-500 text-xs ml-1">{value.toFixed(1)}</span>
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const isTop3 = product.rank <= 3;
  const rankColors = ["bg-yellow-400", "bg-gray-300", "bg-amber-500"];
  const rankColor = isTop3 ? rankColors[product.rank - 1] : "bg-gray-100";
  const rankTextColor = isTop3 ? "text-white" : "text-gray-600";

  return (
    <div
      id={`rank-${product.rank}`}
      className={`bg-white rounded-xl border p-4 md:p-5 ${
        isTop3 ? "border-primary/30 shadow-md" : "border-gray-200 shadow-sm"
      } hover:shadow-lg transition-shadow`}
    >
      {/* Rank badge */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`${rankColor} ${rankTextColor} rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0`}
        >
          {product.rank}
        </div>
        <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug line-clamp-2">
          {product.name}
        </h3>
      </div>

      <div className="flex gap-4">
        {/* Product image */}
        <div className="shrink-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={96}
              height={96}
              className="rounded-lg object-contain border border-gray-100"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StarRating value={product.review_average} />
            <span className="text-xs text-muted-foreground">
              ({product.review_count.toLocaleString()}件)
            </span>
          </div>

          {product.price && (
            <p className="text-lg font-bold text-gray-900">
              ¥{product.price.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1">(税込)</span>
            </p>
          )}

          {product.ai_recommended_for && (
            <Badge variant="secondary" className="mt-1.5 text-xs">
              {product.ai_recommended_for}
            </Badge>
          )}

          {product.affiliate_url && (
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2.5 flex items-center gap-1 justify-center w-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              詳細・購入はこちら
            </a>
          )}
        </div>
      </div>

      {/* Review text */}
      {(product.ai_features || product.ai_review) && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-700 space-y-1">
          {product.ai_features && (
            <p>
              <span className="font-semibold text-gray-800">特徴：</span>
              {product.ai_features}
            </p>
          )}
          {product.ai_review && (
            <p className="text-muted-foreground">{product.ai_review}</p>
          )}
        </div>
      )}
    </div>
  );
}
