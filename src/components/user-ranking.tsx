"use client";

import { useEffect, useState, useCallback } from "react";

type RankingItem = {
  label: string;
  votes: number;
};

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem("poll_fp");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("poll_fp", fp);
  }
  return fp;
}

export function UserRanking({ articleId }: { articleId: string }) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ai" | "user">("user");

  const loadRanking = useCallback(async () => {
    const fp = getFingerprint();
    const res = await fetch(`/api/polls?article_id=${articleId}&fingerprint=${fp}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    const polls = data.polls || [];

    // 商品名が選択肢になっているアンケートを探す（2問目の「気になる商品は？」系）
    // ヒューリスティック: 選択肢が3つ以上で、質問に「商品」「どれ」「気になる」「試し」「買う」等が含まれる
    const productPoll = polls.find((p: any) =>
      p.poll_options.length >= 3 &&
      /商品|どれ|気になる|試し|買う|泊まる|行く|選ぶ|食べ|興味/.test(p.question)
    );

    if (!productPoll || productPoll.total_votes === 0) {
      setLoading(false);
      return;
    }

    const items: RankingItem[] = [...productPoll.poll_options]
      .sort((a: any, b: any) => b.vote_count - a.vote_count)
      .map((opt: any) => ({ label: opt.label, votes: opt.vote_count }));

    setRanking(items);
    setLoading(false);
  }, [articleId]);

  useEffect(() => { loadRanking(); }, [loadRanking]);

  if (loading || ranking.length === 0) return null;

  const maxVotes = Math.max(...ranking.map((r) => r.votes), 1);

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="text-lg">🏆</span>
          みんなのランキング
        </h3>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
          <button
            onClick={() => setTab("user")}
            className={`px-3 py-1 transition-colors ${
              tab === "user"
                ? "bg-blue-500 text-white font-semibold"
                : "bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            みんなの投票
          </button>
          <button
            onClick={() => setTab("ai")}
            className={`px-3 py-1 transition-colors ${
              tab === "ai"
                ? "bg-blue-500 text-white font-semibold"
                : "bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            AIおすすめ
          </button>
        </div>
      </div>

      {tab === "user" ? (
        <div className="space-y-2">
          {ranking.map((item, idx) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className={`
                text-xs font-bold w-6 text-center flex-shrink-0
                ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-gray-400"}
              `}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{item.label}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.votes}票</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0 ? "bg-yellow-400" : idx === 1 ? "bg-gray-300" : idx === 2 ? "bg-amber-400" : "bg-blue-300"
                    }`}
                    style={{ width: `${(item.votes / maxVotes) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 text-center mt-2">
            投票数に基づくユーザーランキングです
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-6">
          ↑ 記事上部のAIおすすめランキングをご覧ください
        </p>
      )}
    </div>
  );
}
