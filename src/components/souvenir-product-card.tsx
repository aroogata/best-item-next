import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface SouvenirProduct {
  rank: number;
  name: string;
  price: number | null;
  image_url: string | null;
  affiliate_url: string | null;
  review_average: number | null;
  review_count: number | null;
  shop_name?: string | null;
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      <span className="text-[10px] leading-none">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? "star-filled" : "star-empty"}>★</span>
        ))}
      </span>
      <span className="text-[10px] font-semibold text-foreground ml-0.5">{value.toFixed(1)}</span>
    </span>
  );
}

export function SouvenirProductCard({ product }: { product: SouvenirProduct }) {
  const inner = (
    <div className="flex flex-col h-full">
      {/* 商品画像 */}
      <div className="relative bg-muted overflow-hidden aspect-square">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-1"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-[9px] uppercase tracking-widest">
            No Image
          </div>
        )}
      </div>

      {/* 商品情報 */}
      <div className="flex flex-col flex-1 p-2 gap-1.5">
        <p className="text-[11px] font-medium text-foreground leading-snug line-clamp-3">
          {product.name}
        </p>

        {product.review_average != null && product.review_average > 0 && (
          <Stars value={product.review_average} />
        )}

        {product.price != null && (
          <p className="text-sm font-bold text-primary mt-auto">
            ¥{product.price.toLocaleString()}
          </p>
        )}

        {product.affiliate_url && (
          <span className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] font-semibold tracking-[0.05em] bg-[#bf0000] text-white rounded-none mt-1">
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
            楽天で見る
          </span>
        )}
      </div>
    </div>
  );

  return (
    <article className="border border-border/60 bg-card hover:shadow-sm transition-shadow overflow-hidden">
      {product.affiliate_url ? (
        <a
          href={product.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex flex-col h-full no-underline"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </article>
  );
}
