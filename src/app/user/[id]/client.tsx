"use client";

import Image from "next/image";
import Link from "next/link";

const RANK_CONFIG: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
  bronze:   { label: "ブロンズ",   emoji: "🥉", color: "text-amber-700",  bgColor: "bg-amber-50" },
  silver:   { label: "シルバー",   emoji: "🥈", color: "text-gray-500",   bgColor: "bg-gray-50" },
  gold:     { label: "ゴールド",   emoji: "🥇", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  platinum: { label: "プラチナ",   emoji: "💎", color: "text-blue-500",   bgColor: "bg-blue-50" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "今日";
  if (days < 30) return `${days}日前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年前`;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-yellow-500" : "text-gray-300"}>★</span>
      ))}
    </span>
  );
}

export function UserProfileClient({
  profile,
  reviews,
  questions,
  pointHistory,
}: {
  profile: any;
  reviews: any[];
  questions: any[];
  pointHistory: any[];
}) {
  const rankCfg = RANK_CONFIG[profile.rank] || RANK_CONFIG.bronze;
  const nextRank = profile.rank === "bronze" ? RANK_CONFIG.silver
    : profile.rank === "silver" ? RANK_CONFIG.gold
    : profile.rank === "gold" ? RANK_CONFIG.platinum
    : null;
  const nextRankPoints = profile.rank === "bronze" ? 100
    : profile.rank === "silver" ? 500
    : profile.rank === "gold" ? 2000 : 0;
  const progress = nextRankPoints > 0 ? Math.min((profile.points / nextRankPoints) * 100, 100) : 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* プロフィールヘッダー */}
      <div className={`rounded-xl border p-6 mb-6 ${rankCfg.bgColor} border-border`}>
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={64}
              height={64}
              className="rounded-full border-2 border-white shadow"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {(profile.display_name || "U")[0]}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {profile.display_name || "ユーザー"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-semibold ${rankCfg.color}`}>
                {rankCfg.emoji} {rankCfg.label}
              </span>
              <span className="text-sm font-bold text-foreground">{profile.points}pt</span>
            </div>
            {profile.bio && (
              <p className="text-xs text-muted-foreground mt-2">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* ランク進捗バー */}
        {nextRank && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{rankCfg.emoji} {rankCfg.label}</span>
              <span>{nextRank.emoji} {nextRank.label}まであと{Math.max(nextRankPoints - profile.points, 0)}pt</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 活動サマリー */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "レビュー", value: profile.review_count },
            { label: "投票", value: profile.poll_count },
            { label: "質問", value: profile.question_count },
            { label: "回答", value: profile.answer_count },
          ].map((s) => (
            <div key={s.label} className="text-center bg-white/40 rounded-lg py-2">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* レビュー一覧 */}
      {reviews.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span>💬</span> レビュー ({reviews.length})
          </h2>
          <div className="space-y-2">
            {reviews.map((r: any) => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted-foreground">{r.products?.name || "商品"}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-xs text-foreground">{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 質問一覧 */}
      {questions.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span>❓</span> 質問 ({questions.length})
          </h2>
          <div className="space-y-2">
            {questions.map((q: any) => (
              <div key={q.id} className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-foreground font-medium">{q.question}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(q.created_at)}</span>
                  {q.helpful_count > 0 && (
                    <span className="text-[10px] text-muted-foreground">👍 {q.helpful_count}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ポイント履歴 */}
      {pointHistory.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span>🏆</span> ポイント履歴
          </h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {pointHistory.map((tx: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-border/40 last:border-0">
                <div>
                  <p className="text-xs text-foreground">{tx.description}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(tx.created_at)}</p>
                </div>
                <span className="text-sm font-bold text-primary">+{tx.points}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="text-center mt-8">
        <Link href="/" className="text-xs text-primary hover:underline">
          ← トップページに戻る
        </Link>
      </div>
    </div>
  );
}
