"use client";

import { useEffect, useState, useCallback } from "react";

type ModerationItem = {
  id: string;
  _type: "review" | "comment" | "question" | "answer";
  comment?: string;
  question?: string;
  answer?: string;
  nickname: string;
  rating?: number;
  user_id?: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  created_at: string;
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  review: { label: "レビュー", color: "bg-blue-100 text-blue-700" },
  comment: { label: "コメント", color: "bg-purple-100 text-purple-700" },
  question: { label: "質問", color: "bg-green-100 text-green-700" },
  answer: { label: "回答", color: "bg-orange-100 text-orange-700" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [filter, setFilter] = useState<"flagged" | "all" | "pending">("flagged");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/moderation?filter=${filter}&type=${type}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
      setFlaggedCount(data.flaggedCount || 0);
    }
    setLoading(false);
  }, [filter, type]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAction = async (action: "approve" | "reject" | "flag", item: ModerationItem) => {
    setActionLoading(item.id);
    const res = await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, type: item._type, id: item.id }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (action === "approve" || action === "reject") {
        setFlaggedCount((c) => Math.max(c - 1, 0));
      }
    }
    setActionLoading(null);
  };

  const getContent = (item: ModerationItem) => {
    return item.comment || item.question || item.answer || "";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-2">UGC モデレーション</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {flaggedCount > 0
          ? `${flaggedCount}件の要確認投稿があります`
          : "要確認の投稿はありません"}
      </p>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {([["flagged", "要確認"], ["pending", "未承認"], ["all", "すべて"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 transition-colors ${
                filter === val
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {label}
              {val === "flagged" && flaggedCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{flaggedCount}</span>
              )}
            </button>
          ))}
        </div>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-xs border rounded-lg px-2 py-1.5 bg-card text-foreground"
        >
          <option value="all">全種類</option>
          <option value="reviews">レビュー</option>
          <option value="comments">コメント</option>
          <option value="questions">質問</option>
          <option value="answers">回答</option>
        </select>
      </div>

      {/* 投稿一覧 */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">読み込み中...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">&#x2714;</p>
          <p className="text-sm">該当する投稿はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const typeCfg = TYPE_LABELS[item._type];
            const content = getContent(item);

            return (
              <div
                key={`${item._type}-${item.id}`}
                className={`border rounded-lg p-4 ${
                  item.is_flagged
                    ? "border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* ヘッダー */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                      {item.is_flagged && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          NGワード検出
                        </span>
                      )}
                      {item.user_id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          認証済み
                        </span>
                      )}
                      {!item.user_id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          匿名
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{item.nickname}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</span>
                      {item.rating && (
                        <span className="text-xs text-yellow-500">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span>
                      )}
                    </div>

                    {/* 本文 */}
                    <p className="text-sm text-foreground leading-relaxed">{content}</p>

                    {/* ステータス */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[10px] ${item.is_approved ? "text-green-600" : "text-red-500"}`}>
                        {item.is_approved ? "公開中" : "非公開"}
                      </span>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!item.is_approved && (
                      <button
                        onClick={() => handleAction("approve", item)}
                        disabled={actionLoading === item.id}
                        className="text-[11px] px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50"
                      >
                        承認
                      </button>
                    )}
                    {item.is_approved && !item.is_flagged && (
                      <button
                        onClick={() => handleAction("flag", item)}
                        disabled={actionLoading === item.id}
                        className="text-[11px] px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-medium disabled:opacity-50"
                      >
                        非公開
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("この投稿を完全に削除しますか？")) {
                          handleAction("reject", item);
                        }
                      }}
                      disabled={actionLoading === item.id}
                      className="text-[11px] px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 font-medium disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
