import Image from "next/image";
import { MapPin, ExternalLink } from "lucide-react";

interface Shop {
  rank: number;
  name: string;
  price: number | null;
  image_url: string | null;
  affiliate_url: string | null;
  review_average: number | null;
  review_count: number | null;
  shop_name: string | null;        // address が格納されている
  description: string | null;      // ジャンル | 営業時間 等
  ai_recommended_for: string | null;
  ai_cons: string | null;          // アクセス情報が格納されている
}

const PRICE_TOKEN_PATTERN = /(?:\d[\d,]*\s*(?:円|万円)|\d[\d,]*\s*[~〜-]\s*\d[\d,]*\s*(?:円|万円)?|[~〜-]\s*\d[\d,]*\s*(?:円|万円)|¥\s*\d[\d,]*)/;

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

export function LocalComparisonTable({
  shops,
  keyword,
}: {
  shops: Shop[];
  keyword: string;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-4 mb-4">
        <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-light">
          Ranking
        </h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] tracking-[0.15em] uppercase text-primary font-medium">
          {keyword} {shops.length}選
        </span>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full border-collapse" style={{ minWidth: "560px" }}>
          <thead>
            <tr className="bg-foreground">
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-center py-2.5 px-2 w-[52px]">
                順位
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-left py-2.5 px-2">
                店舗
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-left py-2.5 px-2 w-[96px]">
                評価
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-left py-2.5 px-2 w-[90px]">
                価格帯
              </th>
              <th className="text-background/70 text-[10px] tracking-[0.15em] uppercase font-medium text-left py-2.5 px-2 w-[150px]">
                こんな人に
              </th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => {
              const style = RANK_STYLES[shop.rank];
              const imgSize = shop.rank === 1 ? 64 : 52;

              // 価格帯: numeric price 優先、なければ description から最初のマッチ文字列のみ抽出
              const priceRange = shop.price != null
                ? `¥${shop.price.toLocaleString()}`
                : shop.description?.match(PRICE_TOKEN_PATTERN)?.[0] ?? "—";

              return (
                <tr
                  key={shop.rank}
                  className={`${style?.cell ?? ""} border-b border-border/40 hover:brightness-[0.97] transition-all`}
                >
                  {/* 順位 */}
                  <td className="text-center py-3 px-2 align-top">
                    {style ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`font-display font-black italic text-2xl leading-none ${style.numColor}`}>
                          #{shop.rank}
                        </span>
                        <span className={`text-[9px] tracking-[0.1em] px-1 py-0.5 ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                    ) : (
                      <span className="font-display font-bold text-base text-muted-foreground">
                        {shop.rank}
                      </span>
                    )}
                  </td>

                  {/* 店舗: 画像 + 名前 + 住所 */}
                  <td className="py-3 px-2 align-top">
                    <div className="flex items-start gap-2.5">
                      <div className="shrink-0 flex flex-col items-center gap-1.5">
                        {shop.image_url ? (
                          <Image
                            src={shop.image_url}
                            alt={shop.name}
                            width={imgSize}
                            height={imgSize}
                            className="object-cover border border-border/40"
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
                        {shop.affiliate_url && (
                          <a
                            href={shop.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            style={{ width: imgSize }}
                            className={`flex items-center justify-center gap-0.5 text-[9px] font-semibold tracking-[0.05em] py-1 transition-colors ${
                              shop.rank === 1
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            }`}
                          >
                            <ExternalLink className="h-2 w-2 shrink-0" />
                            詳細
                          </a>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold leading-snug text-foreground ${shop.rank === 1 ? "text-xs" : "text-[11px]"}`}>
                          {shop.name}
                        </p>
                        {shop.shop_name && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-start gap-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                            <span>{shop.shop_name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 評価 */}
                  <td className="py-3 px-2 align-top">
                    {shop.review_average ? (
                      <>
                        <Stars value={shop.review_average} />
                        <p className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">
                          {(shop.review_count ?? 0).toLocaleString()}件
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* 価格帯 */}
                  <td className="py-3 px-2 align-top">
                    {priceRange !== "—" ? (
                      <span className="text-[11px] text-foreground">{priceRange}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* こんな人に */}
                  <td className="py-3 px-2 align-top">
                    {shop.ai_recommended_for ? (
                      <p className="text-[11px] text-foreground leading-snug" style={{ overflowWrap: "break-word" }}>
                        {shop.ai_recommended_for}
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
      </div>
    </section>
  );
}
