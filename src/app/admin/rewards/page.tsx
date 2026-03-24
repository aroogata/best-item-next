"use client";

import { useEffect, useState, useCallback } from "react";

export default function RewardsAdminPage() {
  const [tab, setTab] = useState<"exchanges" | "campaigns">("exchanges");
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // 新規キャンペーン
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "", description: "", entry_cost: 1000,
    prize_description: "500円分デジタルギフト", prize_amount: 500,
    max_winners: 1, entry_end: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [exRes, cpRes] = await Promise.all([
      fetch("/api/admin/lottery?type=exchanges"),
      fetch("/api/admin/lottery?type=campaigns"),
    ]);
    if (exRes.ok) {
      const d = await exRes.json();
      setExchanges(d.exchanges || []);
    }
    if (cpRes.ok) {
      const d = await cpRes.json();
      setCampaigns(d.campaigns || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const fulfillExchange = async (exchangeId: string) => {
    const giftUrl = prompt("ギフトURL（giftee等）を入力:");
    if (!giftUrl) return;
    const res = await fetch("/api/admin/lottery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fulfill_exchange", exchange_id: exchangeId, gift_url: giftUrl }),
    });
    if (res.ok) { setActionMsg("交換完了しました"); loadData(); }
    setTimeout(() => setActionMsg(""), 3000);
  };

  const drawLottery = async (campaignId: string) => {
    if (!confirm("抽選を実行しますか？")) return;
    const res = await fetch("/api/admin/lottery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draw", campaign_id: campaignId }),
    });
    const data = await res.json();
    if (res.ok) {
      setActionMsg(`抽選完了: ${data.winners?.length || 0}名当選 / ${data.total_entries}名応募`);
      loadData();
    }
    setTimeout(() => setActionMsg(""), 5000);
  };

  const createCampaign = async () => {
    if (!newCampaign.title || !newCampaign.entry_end) { alert("タイトルと締切日は必須です"); return; }
    const res = await fetch("/api/admin/lottery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...newCampaign }),
    });
    if (res.ok) { setShowNewCampaign(false); setActionMsg("キャンペーン作成完了"); loadData(); }
    setTimeout(() => setActionMsg(""), 3000);
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    return days < 1 ? "今日" : `${days}日前`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-2">報酬管理</h1>
      {actionMsg && <p className="text-sm text-green-600 mb-4">{actionMsg}</p>}

      {/* タブ */}
      <div className="flex rounded-lg border overflow-hidden text-xs mb-6">
        <button onClick={() => setTab("exchanges")} className={`px-4 py-2 ${tab === "exchanges" ? "bg-primary text-primary-foreground font-semibold" : "bg-card text-muted-foreground"}`}>
          ギフト交換 ({exchanges.filter((e: any) => e.status === "pending").length}件待ち)
        </button>
        <button onClick={() => setTab("campaigns")} className={`px-4 py-2 ${tab === "campaigns" ? "bg-primary text-primary-foreground font-semibold" : "bg-card text-muted-foreground"}`}>
          抽選キャンペーン ({campaigns.length})
        </button>
      </div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">読み込み中...</p>}

      {/* ギフト交換一覧 */}
      {!loading && tab === "exchanges" && (
        <div className="space-y-2">
          {exchanges.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">交換申請はありません</p>}
          {exchanges.map((ex: any) => (
            <div key={ex.id} className={`border rounded-lg p-3 ${ex.status === "pending" ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{ex.gift_amount}円分ギフト (-{ex.points_spent}pt)</p>
                  <p className="text-[10px] text-muted-foreground">
                    {ex.user_profiles?.display_name || "ユーザー"} / {timeAgo(ex.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    ex.status === "completed" ? "bg-green-100 text-green-700"
                    : ex.status === "pending" ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    {ex.status === "completed" ? "完了" : ex.status === "pending" ? "未処理" : ex.status}
                  </span>
                  {ex.status === "pending" && (
                    <button onClick={() => fulfillExchange(ex.id)} className="text-xs px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600">
                      ギフト発行
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 抽選キャンペーン */}
      {!loading && tab === "campaigns" && (
        <div>
          <button onClick={() => setShowNewCampaign(!showNewCampaign)} className="text-xs px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 mb-4">
            + 新規キャンペーン
          </button>

          {showNewCampaign && (
            <div className="border border-border rounded-lg p-4 mb-4 bg-card space-y-2">
              <input value={newCampaign.title} onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} placeholder="タイトル" className="w-full px-3 py-1.5 text-sm border rounded bg-background text-foreground" />
              <input value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="説明" className="w-full px-3 py-1.5 text-sm border rounded bg-background text-foreground" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={newCampaign.entry_cost} onChange={(e) => setNewCampaign({ ...newCampaign, entry_cost: +e.target.value })} className="px-2 py-1.5 text-xs border rounded bg-background text-foreground" placeholder="参加費pt" />
                <input type="number" value={newCampaign.prize_amount} onChange={(e) => setNewCampaign({ ...newCampaign, prize_amount: +e.target.value })} className="px-2 py-1.5 text-xs border rounded bg-background text-foreground" placeholder="賞金額" />
                <input type="number" value={newCampaign.max_winners} onChange={(e) => setNewCampaign({ ...newCampaign, max_winners: +e.target.value })} className="px-2 py-1.5 text-xs border rounded bg-background text-foreground" placeholder="当選人数" />
              </div>
              <input value={newCampaign.prize_description} onChange={(e) => setNewCampaign({ ...newCampaign, prize_description: e.target.value })} placeholder="賞品説明" className="w-full px-3 py-1.5 text-sm border rounded bg-background text-foreground" />
              <input type="datetime-local" value={newCampaign.entry_end} onChange={(e) => setNewCampaign({ ...newCampaign, entry_end: e.target.value })} className="w-full px-3 py-1.5 text-sm border rounded bg-background text-foreground" />
              <button onClick={createCampaign} className="text-xs px-4 py-2 rounded bg-primary text-primary-foreground">作成</button>
            </div>
          )}

          <div className="space-y-2">
            {campaigns.map((c: any) => (
              <div key={c.id} className="border border-border rounded-lg p-3 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      賞品: {c.prize_description} / 当選{c.max_winners}名 / 参加費{c.entry_cost}pt
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      締切: {new Date(c.entry_end).toLocaleDateString("ja-JP")}
                      {c.drawn_at && ` / 抽選: ${new Date(c.drawn_at).toLocaleDateString("ja-JP")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      c.status === "open" ? "bg-green-100 text-green-700"
                      : c.status === "drawn" ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>{c.status}</span>
                    {c.status === "open" && (
                      <button onClick={() => drawLottery(c.id)} className="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">
                        抽選実行
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
