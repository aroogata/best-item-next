"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type RankingItem = {
  label: string;
  votes: number;
};

type ActiveUser = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  rank: string;
  points: number;
  review_count: number;
  poll_count: number;
};

type RecentActivity = {
  id: string;
  type: "review" | "question";
  text: string;
  nickname: string;
  user_id?: string | null;
  article_slug?: string;
  article_title?: string;
  created_at: string;
};

const RANK_EMOJI: Record<string, string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎",
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
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    // 投票ランキング
    const fp = getFingerprint();
    const pollRes = await fetch(`/api/polls?article_id=${articleId}&fingerprint=${fp}`);
    if (pollRes.ok) {
      const data = await pollRes.json();
      const polls = data.polls || [];
      const productPoll = polls.find((p: any) =>
        p.poll_options.length >= 3 &&
        /商品|どれ|気になる|試し|買う|泊まる|行く|選ぶ|食べ|興味/.test(p.question)
      );
      if (productPoll && productPoll.total_votes > 0) {
        const items: RankingItem[] = [...productPoll.poll_options]
          .sort((a: any, b: any) => b.vote_count - a.vote_count)
          .map((opt: any) => ({ label: opt.label, votes: opt.vote_count }));
        setRanking(items);
      }
    }

    // アクティブユーザー + 最新アクティビティ
    const sideRes = await fetch(`/api/ugc-sidebar?article_id=${articleId}`);
    if (sideRes.ok) {
      const data = await sideRes.json();
      setActiveUsers(data.activeUsers || []);
      setRecentActivity(data.recentActivity || []);
    }

    setLoading(false);
  }, [articleId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return null;

  const hasRanking = ranking.length > 0;
  const hasUsers = activeUsers.length > 0;
  const hasActivity = recentActivity.length > 0;

  if (!hasRanking && !hasUsers && !hasActivity) return null;

  const maxVotes = Math.max(...ranking.map((r) => r.votes), 1);

  return (
    <div className="my-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 左: みんなのランキング */}
      {hasRanking && (
        <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="text-lg">🏆</span>
            みんなのランキング
          </h3>
          <div className="space-y-2">
            {ranking.map((item, idx) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`text-xs font-bold w-6 text-center flex-shrink-0 ${
                  idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-gray-400"
                }`}>
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
        </div>
      )}

      {/* 右サイド: アクティブユーザー + 最新アクティビティ */}
      <div className={`${hasRanking ? "" : "md:col-span-3"} space-y-4`}>
        {/* アクティブユーザー */}
        {hasUsers && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
              <span>👑</span> アクティブユーザー
            </h4>
            <div className="space-y-2">
              {activeUsers.map((u, idx) => (
                <Link key={u.id} href={`/user/${u.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="text-[10px] font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
                  {u.avatar_url ? (
                    <Image src={u.avatar_url} alt="" width={20} height={20} className="rounded-full" unoptimized />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                      {(u.display_name || "U")[0]}
                    </span>
                  )}
                  <span className="text-xs text-gray-800 dark:text-gray-200 truncate flex-1">{u.display_name || "ユーザー"}</span>
                  <span className="text-[10px]">{RANK_EMOJI[u.rank] || "🥉"}</span>
                  <span className="text-[10px] text-gray-400">{u.points}pt</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 最新アクティビティ */}
        {hasActivity && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
              <span>💬</span> 最新の投稿
            </h4>
            <div className="space-y-2">
              {recentActivity.map((a) => (
                <Link
                  key={`${a.type}-${a.id}`}
                  href={a.article_slug ? `/${a.article_slug.replace(/^\/|\/$/g, "")}` : "#"}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] mt-0.5">{a.type === "review" ? "💬" : "❓"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2">{a.text}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{a.nickname} / {timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
