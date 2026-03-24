"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

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

      {/* ポイント交換 */}
      <GiftExchangeSection userId={profile.id} initialPoints={profile.points} />

      {/* 抽選 */}
      <LotterySection userId={profile.id} />

      <div className="text-center mt-8">
        <Link href="/" className="text-xs text-primary hover:underline">
          ← トップページに戻る
        </Link>
      </div>
    </div>
  );
}

function GiftExchangeSection({ userId, initialPoints }: { userId: string; initialPoints: number }) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);
  const [msg, setMsg] = useState("");

  const isOwner = user?.id === userId;

  const load = useCallback(async () => {
    const res = await fetch(`/api/exchange?user_id=${userId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleExchange = async (points: number) => {
    if (exchanging) return;
    if (!confirm(`${points}ptをギフト券に交換しますか？`)) return;
    setExchanging(true);
    setMsg("");
    const res = await fetch("/api/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, points_to_spend: points }),
    });
    const result = await res.json();
    setMsg(result.message || result.error || "");
    if (res.ok) load();
    setExchanging(false);
    setTimeout(() => setMsg(""), 5000);
  };

  if (loading || !data) return null;

  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <span>🎁</span> ポイント交換
      </h2>
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-3">
          貯まったポイントをデジタルギフト券に交換できます。
        </p>

        {isOwner && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {data.rates.map((rate: any) => (
              <button
                key={rate.points}
                onClick={() => handleExchange(rate.points)}
                disabled={data.points < rate.points || exchanging}
                className={`text-xs p-3 rounded-lg border text-center transition-colors ${
                  data.points >= rate.points
                    ? "border-primary/40 hover:bg-primary hover:text-primary-foreground cursor-pointer"
                    : "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                }`}
              >
                <p className="font-bold text-base">{rate.amount}円分</p>
                <p className="text-muted-foreground">{rate.points}pt</p>
              </button>
            ))}
          </div>
        )}

        {msg && <p className="text-xs text-green-600 mb-3">{msg}</p>}

        {/* 交換履歴 */}
        {data.history.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-2 font-medium">交換履歴</p>
            {data.history.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                <div>
                  <p className="text-xs text-foreground">{h.gift_amount}円分ギフト (-{h.points_spent}pt)</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(h.created_at)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    h.status === "completed" ? "bg-green-100 text-green-700"
                    : h.status === "pending" ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    {h.status === "completed" ? "完了" : h.status === "pending" ? "処理中" : h.status}
                  </span>
                  {h.gift_url && (
                    <a href={h.gift_url} target="_blank" rel="noreferrer" className="block text-[10px] text-primary hover:underline mt-0.5">
                      ギフトを受け取る
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LotterySection({ userId }: { userId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [msg, setMsg] = useState("");

  const isOwner = user?.id === userId;

  const load = useCallback(async () => {
    const res = await fetch(`/api/lottery?user_id=${userId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleEntry = async (campaignId: string) => {
    if (entering) return;
    if (!confirm("この抽選に応募しますか？")) return;
    setEntering(true);
    setMsg("");
    const res = await fetch("/api/lottery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, campaign_id: campaignId }),
    });
    const result = await res.json();
    setMsg(result.message || result.error || "");
    if (res.ok) load();
    setEntering(false);
    setTimeout(() => setMsg(""), 5000);
  };

  if (loading || !data || !data.campaigns || data.campaigns.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <span>🎰</span> 抽選キャンペーン
      </h2>
      {msg && <p className="text-xs text-green-600 mb-2">{msg}</p>}
      <div className="space-y-2">
        {data.campaigns.map((c: any) => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                <p className="text-xs text-primary font-medium mt-1">賞品: {c.prize_description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  応募: {c.entry_count}名 / 当選: {c.max_winners}名 / 参加費: {c.entry_cost}pt
                </p>
              </div>
              <div className="shrink-0 text-right">
                {c.user_won ? (
                  <div>
                    <span className="text-xs font-bold text-yellow-600">当選!</span>
                    {c.user_won.gift_url && (
                      <a href={c.user_won.gift_url} target="_blank" rel="noreferrer" className="block text-[10px] text-primary hover:underline mt-1">
                        ギフトを受け取る
                      </a>
                    )}
                  </div>
                ) : c.user_entered ? (
                  <span className="text-[10px] text-muted-foreground">応募済み</span>
                ) : c.status === "open" && isOwner ? (
                  <button
                    onClick={() => handleEntry(c.id)}
                    disabled={entering}
                    className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    応募する
                  </button>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {c.status === "drawn" ? "抽選済み" : c.status === "fulfilled" ? "終了" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
