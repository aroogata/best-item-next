"use client";

import { useEffect, useState, useCallback } from "react";

type PollOption = { id: string; label: string; sort_order: number; vote_count: number };
type Poll = {
  id: string;
  question: string;
  is_active: boolean;
  total_votes: number;
  created_at: string;
  article_id: string;
  articles: { slug: string; title: string } | null;
  poll_options: PollOption[];
};

export default function PollsAdminPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/polls?q=${encodeURIComponent(q)}&page=${page}`);
    if (res.ok) {
      const data = await res.json();
      setPolls(data.polls || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  const apiAction = async (body: any) => {
    const res = await fetch("/api/admin/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) load();
    return res.ok;
  };

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-2">アンケート管理</h1>
      <p className="text-sm text-muted-foreground mb-4">全{total}件のアンケート</p>

      {msg && <p className="text-sm text-green-600 mb-3">{msg}</p>}

      {/* 検索 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="質問文で検索..."
          className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background text-foreground"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">読み込み中...</p>
      ) : polls.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">該当するアンケートはありません</p>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} onAction={apiAction} onMsg={showMsg} />
          ))}
        </div>
      )}

      {/* ページネーション */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-xs px-3 py-1 border rounded disabled:opacity-30">前</button>
          <span className="text-xs py-1">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="text-xs px-3 py-1 border rounded disabled:opacity-30">次</button>
        </div>
      )}
    </div>
  );
}

function PollCard({ poll, onAction, onMsg }: { poll: Poll; onAction: (body: any) => Promise<boolean>; onMsg: (m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(poll.question);
  const [options, setOptions] = useState<PollOption[]>(
    [...poll.poll_options].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [newLabel, setNewLabel] = useState("");

  const slug = poll.articles?.slug?.replace(/^\/|\/$/g, "") || "";
  const articleTitle = poll.articles?.title || slug;

  const handleToggle = async () => {
    if (await onAction({ action: "toggle", poll_id: poll.id, is_active: !poll.is_active })) {
      onMsg(poll.is_active ? "非表示にしました" : "表示に戻しました");
    }
  };

  const handleDelete = async () => {
    if (!confirm("このアンケートを完全に削除しますか？投票データも全て削除されます。")) return;
    if (await onAction({ action: "delete", poll_id: poll.id })) {
      onMsg("削除しました");
    }
  };

  const handleSaveQuestion = async () => {
    if (!question.trim()) return;
    if (await onAction({ action: "update_question", poll_id: poll.id, question })) {
      setEditing(false);
      onMsg("質問文を更新しました");
    }
  };

  const handleSaveOption = async (optId: string, label: string) => {
    if (!label.trim()) return;
    await onAction({ action: "update_option", option_id: optId, label });
    onMsg("選択肢を更新しました");
  };

  const handleDeleteOption = async (optId: string) => {
    if (!confirm("この選択肢を削除しますか？")) return;
    if (await onAction({ action: "delete_option", option_id: optId })) {
      setOptions(options.filter((o) => o.id !== optId));
      onMsg("選択肢を削除しました");
    }
  };

  const handleAddOption = async () => {
    if (!newLabel.trim()) return;
    if (await onAction({ action: "add_option", poll_id: poll.id, label: newLabel, sort_order: options.length })) {
      setNewLabel("");
      onMsg("選択肢を追加しました");
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${poll.is_active ? "border-border bg-card" : "border-red-300 bg-red-50 dark:bg-red-900/10"}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded bg-background text-foreground"
              />
              <button onClick={handleSaveQuestion} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">保存</button>
              <button onClick={() => { setEditing(false); setQuestion(poll.question); }} className="text-xs text-muted-foreground">取消</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{poll.question}</p>
              <button onClick={() => setEditing(true)} className="text-[10px] text-primary hover:underline">編集</button>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {articleTitle && <a href={`/${slug}`} target="_blank" className="text-primary hover:underline">{articleTitle}</a>}
            {" / "}{poll.total_votes}票
            {!poll.is_active && <span className="text-red-500 ml-2 font-medium">非表示</span>}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleToggle}
            className={`text-[11px] px-2 py-1 rounded ${poll.is_active ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}`}
          >
            {poll.is_active ? "非表示" : "表示"}
          </button>
          <button onClick={handleDelete} className="text-[11px] px-2 py-1 rounded border border-red-300 text-red-500">削除</button>
        </div>
      </div>

      {/* 選択肢 */}
      <div className="space-y-1 mt-3">
        {options.map((opt) => (
          <OptionRow key={opt.id} option={opt} onSave={handleSaveOption} onDelete={handleDeleteOption} />
        ))}
        {/* 選択肢追加 */}
        <div className="flex gap-2 mt-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="新しい選択肢を追加..."
            className="flex-1 px-2 py-1 text-xs border rounded bg-background text-foreground"
            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
          />
          <button onClick={handleAddOption} disabled={!newLabel.trim()} className="text-[11px] px-2 py-1 rounded bg-primary text-primary-foreground disabled:opacity-50">追加</button>
        </div>
      </div>
    </div>
  );
}

function OptionRow({ option, onSave, onDelete }: { option: PollOption; onSave: (id: string, label: string) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(option.label);

  return (
    <div className="flex items-center gap-2 bg-secondary/30 rounded px-2 py-1">
      {editing ? (
        <>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 px-2 py-0.5 text-xs border rounded bg-background text-foreground"
          />
          <button onClick={() => { onSave(option.id, label); setEditing(false); }} className="text-[10px] text-primary">保存</button>
          <button onClick={() => { setEditing(false); setLabel(option.label); }} className="text-[10px] text-muted-foreground">取消</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs text-foreground">{option.label}</span>
          <span className="text-[10px] text-muted-foreground">{option.vote_count}票</span>
          <button onClick={() => setEditing(true)} className="text-[10px] text-primary hover:underline">編集</button>
          <button onClick={() => onDelete(option.id)} className="text-[10px] text-red-500 hover:underline">削除</button>
        </>
      )}
    </div>
  );
}
