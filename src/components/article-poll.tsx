"use client";

import { useEffect, useState, useCallback } from "react";
import { VerifiedBadge } from "@/components/verified-badge";
import { useAuth } from "@/lib/auth-context";

type PollOption = {
  id: string;
  label: string;
  sort_order: number;
  vote_count: number;
};

type PollComment = {
  id: string;
  comment: string;
  nickname: string;
  user_id?: string | null;
  option_id: string | null;
  created_at: string;
  user_profiles?: { display_name: string; avatar_url: string | null; rank: string } | null;
};

type Poll = {
  id: string;
  question: string;
  poll_type: string;
  total_votes: number;
  poll_options: PollOption[];
  user_voted_option_id: string | null;
  comments: PollComment[];
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

export function ArticlePoll({ articleId }: { articleId: string }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPolls = useCallback(async () => {
    const fp = getFingerprint();
    const res = await fetch(`/api/polls?article_id=${articleId}&fingerprint=${fp}`);
    if (res.ok) {
      const data = await res.json();
      setPolls(data.polls || []);
    }
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  if (loading || polls.length === 0) return null;

  return (
    <div className="my-8 space-y-6">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} onVoted={loadPolls} />
      ))}
    </div>
  );
}

function PollCard({ poll, onVoted }: { poll: Poll; onVoted: () => void }) {
  const { user, profile } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(!!poll.user_voted_option_id);
  const [votedOptionId, setVotedOptionId] = useState(poll.user_voted_option_id);
  const [options, setOptions] = useState(poll.poll_options);
  const [totalVotes, setTotalVotes] = useState(poll.total_votes);
  const [voting, setVoting] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [nickname, setNickname] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [commentMsg, setCommentMsg] = useState("");
  const [comments, setComments] = useState(poll.comments);

  const handleVote = async () => {
    if (!selectedOption || voting) return;
    setVoting(true);
    const fp = getFingerprint();
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "vote",
        poll_id: poll.id,
        option_id: selectedOption,
        fingerprint: fp,
        user_id: user?.id || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setOptions(data.options);
      setTotalVotes(data.total_votes);
      setHasVoted(true);
      setVotedOptionId(selectedOption);
      setShowComment(true);
    } else if (data.error === "already_voted") {
      setHasVoted(true);
    }
    setVoting(false);
  };

  const handleComment = async () => {
    if (!comment.trim() || commenting) return;
    setCommenting(true);
    const fp = getFingerprint();
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment",
        poll_id: poll.id,
        option_id: votedOptionId,
        comment: comment.trim(),
        nickname: user ? (profile?.display_name || "") : nickname.trim(),
        fingerprint: fp,
        user_id: user?.id || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setCommentMsg(data.message);
      if (!data.is_flagged && data.comment) {
        setComments([data.comment, ...comments]);
      }
      setComment("");
      setNickname("");
    } else {
      setCommentMsg(data.error || "エラーが発生しました");
    }
    setCommenting(false);
    setTimeout(() => setCommentMsg(""), 4000);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 shadow-sm">
      {/* 質問 */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span className="text-lg">📊</span>
        {poll.question}
      </h3>

      {/* 選択肢 */}
      <div className="space-y-2 mb-4">
        {options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;
          const isVoted = votedOptionId === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => !hasVoted && setSelectedOption(opt.id)}
              disabled={hasVoted}
              className={`
                w-full text-left rounded-lg border p-3 transition-all relative overflow-hidden
                ${hasVoted
                  ? isVoted
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600"
                  : isSelected
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-400"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                }
              `}
            >
              {/* 結果バー */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-blue-100 dark:bg-blue-900/30 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {!hasVoted && (
                    <span className={`
                      w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors
                      ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-500"}
                    `}>
                      {isSelected && (
                        <span className="block w-2 h-2 rounded-full bg-white m-[2px]" />
                      )}
                    </span>
                  )}
                  {isVoted && <span className="text-blue-500">✓</span>}
                  {opt.label}
                </span>
                {hasVoted && (
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 ml-2">
                    {pct}%
                    <span className="text-xs font-normal text-gray-400 ml-1">({opt.vote_count}票)</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 投票ボタン + 案内 */}
      {!hasVoted && (
        <div className="space-y-2">
          <button
            onClick={handleVote}
            disabled={!selectedOption || voting}
            className={`
              w-full py-2.5 rounded-lg text-sm font-semibold transition-all
              ${selectedOption
                ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {voting ? "投票中..." : "投票する"}
          </button>
          <p className="text-center text-xs text-blue-500 dark:text-blue-400 font-medium animate-pulse">
            回答するとみんなの投票結果が見られます
          </p>
        </div>
      )}

      {/* 投票数 */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
        {totalVotes > 0 ? `${totalVotes}人が回答` : "まだ回答がありません"}
      </p>

      {/* コメントセクション */}
      {hasVoted && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {!showComment ? (
            <button
              onClick={() => setShowComment(true)}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              💬 選んだ理由を教えてください（任意）
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ニックネーム（任意）"
                  maxLength={20}
                  className="w-28 px-2 py-1.5 text-xs border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                />
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="選んだ理由やコメント..."
                  maxLength={500}
                  className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                />
                <button
                  onClick={handleComment}
                  disabled={!comment.trim() || commenting}
                  className="px-4 py-1.5 text-sm font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commenting ? "..." : "送信"}
                </button>
              </div>
              {commentMsg && (
                <p className="text-xs text-green-600 dark:text-green-400">{commentMsg}</p>
              )}
            </div>
          )}

          {/* コメント一覧 */}
          {comments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                💬 みんなのコメント ({comments.length})
              </p>
              {comments.slice(0, 5).map((c) => {
                const optLabel = options.find((o) => o.id === c.option_id)?.label;
                return (
                  <div key={c.id} className="flex items-start gap-2 text-sm">
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                          <VerifiedBadge userId={c.user_id} nickname={c.nickname} profile={c.user_profiles} size="xs" />
                        </span>
                        {optLabel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            {optLabel}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">{c.comment}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
