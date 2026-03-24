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
  const { user } = useAuth();
  const isOwner = user?.id === profile.id;

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [socialX, setSocialX] = useState(profile.social_x || "");
  const [socialInstagram, setSocialInstagram] = useState(profile.social_instagram || "");
  const [socialFacebook, setSocialFacebook] = useState(profile.social_facebook || "");
  const [socialNote, setSocialNote] = useState(profile.social_note || "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || "");
  const [customLink1Label, setCustomLink1Label] = useState(profile.custom_link_1_label || "");
  const [customLink1Url, setCustomLink1Url] = useState(profile.custom_link_1_url || "");
  const [customLink2Label, setCustomLink2Label] = useState(profile.custom_link_2_label || "");
  const [customLink2Url, setCustomLink2Url] = useState(profile.custom_link_2_url || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const rankCfg = RANK_CONFIG[profile.rank] || RANK_CONFIG.bronze;
  const nextRank = profile.rank === "bronze" ? RANK_CONFIG.silver
    : profile.rank === "silver" ? RANK_CONFIG.gold
    : profile.rank === "gold" ? RANK_CONFIG.platinum
    : null;
  const nextRankPoints = profile.rank === "bronze" ? 100
    : profile.rank === "silver" ? 500
    : profile.rank === "gold" ? 2000 : 0;
  const progress = nextRankPoints > 0 ? Math.min((profile.points / nextRankPoints) * 100, 100) : 100;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setEditMsg("画像は2MB以下にしてください"); return; }
    const formData = new FormData();
    formData.append("user_id", profile.id);
    formData.append("avatar", file);
    setEditMsg("アップロード中...");
    const res = await fetch("/api/profile", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.avatar_url) {
      setAvatarUrl(data.avatar_url);
      setEditMsg("アバターを更新しました");
    } else {
      setEditMsg(data.error || "アップロード失敗");
    }
    setTimeout(() => setEditMsg(""), 3000);
  };

  const handleSaveProfile = async () => {
    if (saving) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: profile.id, display_name: displayName, bio,
        social_x: socialX, social_instagram: socialInstagram, social_facebook: socialFacebook,
        social_note: socialNote, website_url: websiteUrl,
        custom_link_1_label: customLink1Label, custom_link_1_url: customLink1Url,
        custom_link_2_label: customLink2Label, custom_link_2_url: customLink2Url,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setEditMsg("保存しました");
      setEditing(false);
    } else {
      setEditMsg(data.error || "保存失敗");
    }
    setSaving(false);
    setTimeout(() => setEditMsg(""), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* プロフィールヘッダー */}
      <div className={`rounded-xl border p-6 mb-6 ${rankCfg.bgColor} border-border`}>
        <div className="flex items-start gap-4">
          {/* アバター */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={64}
                height={64}
                className="rounded-full border-2 border-white shadow object-cover"
                unoptimized
                style={{ width: 64, height: 64 }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {(displayName || "U")[0]}
              </div>
            )}
            {isOwner && (
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-primary/80 shadow">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
                +
              </label>
            )}
          </div>

          <div className="flex-1">
            {/* 編集モード */}
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                  placeholder="表示名"
                  className="w-full px-3 py-1.5 text-sm border rounded-lg bg-background border-border text-foreground font-semibold"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="自己紹介（200文字以内）"
                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-background border-border text-foreground resize-none"
                />
                <p className="text-[10px] text-muted-foreground font-medium mt-1">SNS・リンク</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <input value={socialX} onChange={(e) => setSocialX(e.target.value)} placeholder="X (https://x.com/...)" maxLength={200} className="px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                  <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="Instagram (https://instagram.com/...)" maxLength={200} className="px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                  <input value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="Facebook (https://facebook.com/...)" maxLength={200} className="px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                  <input value={socialNote} onChange={(e) => setSocialNote(e.target.value)} placeholder="note (https://note.com/...)" maxLength={200} className="px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                </div>
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="ホームページ (https://...)" maxLength={200} className="w-full px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                <p className="text-[10px] text-muted-foreground font-medium mt-1">カスタムリンク（2つまで）</p>
                <div className="grid grid-cols-5 gap-1.5">
                  <input value={customLink1Label} onChange={(e) => setCustomLink1Label(e.target.value)} placeholder="リンク名" maxLength={30} className="col-span-2 px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                  <input value={customLink1Url} onChange={(e) => setCustomLink1Url(e.target.value)} placeholder="https://..." maxLength={200} className="col-span-3 px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                  <input value={customLink2Label} onChange={(e) => setCustomLink2Label(e.target.value)} placeholder="リンク名" maxLength={30} className="col-span-2 px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                  <input value={customLink2Url} onChange={(e) => setCustomLink2Url(e.target.value)} placeholder="https://..." maxLength={200} className="col-span-3 px-2 py-1 text-[11px] border rounded bg-background border-border text-foreground" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !displayName.trim()}
                    className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">
                    {displayName || "ユーザー"}
                  </h1>
                  {isOwner && (
                    <button onClick={() => setEditing(true)} className="text-[10px] text-primary hover:underline">
                      編集
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-semibold ${rankCfg.color}`}>
                    {rankCfg.emoji} {rankCfg.label}
                  </span>
                  <span className="text-sm font-bold text-foreground">{profile.points}pt</span>
                </div>
                {bio && (
                  <p className="text-xs text-muted-foreground mt-2">{bio}</p>
                )}
                {/* ソーシャルリンク */}
                <SocialLinks profile={profile} />
              </>
            )}
            {editMsg && <p className="text-[10px] text-green-600 mt-1">{editMsg}</p>}
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
        {/* giftee Box バナー */}
        <div className="mb-4">
          <Image src="/giftee/brands.png" alt="giftee Box - あなたのほしいが詰まってる" width={530} height={300} className="w-full rounded-lg" unoptimized />
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          貯まったポイントを <strong className="text-foreground">giftee Box</strong> に交換できます。Amazon、楽天ポイント、サーティワンなど人気ブランドから選べます。
        </p>

        {/* 交換機能準備中のお知らせ */}
        <div className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 rounded-r-lg mb-4">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">交換機能は現在準備中です</p>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
            ポイントは貯めておくことができます。サービス審査完了後、ギフト券への交換を開始する予定です。
            詳しくは<a href="/points-guide" className="underline">ポイントプログラムのご案内</a>をご覧ください。
          </p>
        </div>

        {/* 交換レート（準備中のため非活性） */}
        {isOwner && false && (
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
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Image src="/giftee/logo.png" alt="giftee Box" width={20} height={20} unoptimized />
                  <span className="font-bold text-base">{rate.amount}円分</span>
                </div>
                <p className="text-muted-foreground">{rate.points}pt</p>
              </button>
            ))}
          </div>
        )}

        {/* giftee Box 利用方法 */}
        <details className="mb-3">
          <summary className="text-xs text-primary cursor-pointer font-medium hover:underline">giftee Box の使い方</summary>
          <div className="mt-2">
            <Image src="/giftee/steps.png" alt="giftee Box 利用手順" width={800} height={300} className="w-full rounded-lg" unoptimized />
            <ol className="mt-2 text-[10px] text-muted-foreground space-y-0.5 list-decimal list-inside">
              <li>交換後にギフトURLが届きます</li>
              <li>URLを開くとギフト一覧から好きな商品を選べます</li>
              <li>ギフト詳細を確認して「ギフト交換へ進む」をタップ</li>
              <li>数量を確認して交換を確定</li>
              <li>交換完了！ギフトのバーコードや引換コードが表示されます</li>
            </ol>
          </div>
        </details>

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

const SOCIAL_ICONS: Record<string, { label: string; icon: string }> = {
  social_x: { label: "X", icon: "𝕏" },
  social_instagram: { label: "Instagram", icon: "📷" },
  social_facebook: { label: "Facebook", icon: "📘" },
  social_note: { label: "note", icon: "📝" },
  website_url: { label: "Website", icon: "🌐" },
};

function SocialLinks({ profile }: { profile: any }) {
  const links: Array<{ label: string; icon: string; url: string }> = [];

  for (const [key, cfg] of Object.entries(SOCIAL_ICONS)) {
    const url = profile[key];
    if (url) links.push({ ...cfg, url });
  }
  if (profile.custom_link_1_url) {
    links.push({ label: profile.custom_link_1_label || "Link", icon: "🔗", url: profile.custom_link_1_url });
  }
  if (profile.custom_link_2_url) {
    links.push({ label: profile.custom_link_2_label || "Link", icon: "🔗", url: profile.custom_link_2_url });
  }

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary border border-border/60 rounded-full px-2 py-0.5 transition-colors"
          title={link.label}
        >
          <span>{link.icon}</span>
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  );
}
