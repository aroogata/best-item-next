"use client";

import { useEffect, useState, useCallback } from "react";
import { VerifiedBadge } from "@/components/verified-badge";

type UserProfileRef = { display_name: string; avatar_url: string | null; rank: string } | null;

type Answer = {
  id: string;
  answer: string;
  nickname: string;
  user_id?: string | null;
  helpful_count: number;
  created_at: string;
  user_profiles?: UserProfileRef;
};

type Question = {
  id: string;
  question: string;
  nickname: string;
  user_id?: string | null;
  helpful_count: number;
  created_at: string;
  article_answers: Answer[];
  user_profiles?: UserProfileRef;
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

export function ArticleQA({ articleId }: { articleId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const loadQuestions = useCallback(async () => {
    const res = await fetch(`/api/questions?article_id=${articleId}`);
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions || []);
    }
    setLoading(false);
  }, [articleId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || submitting) return;
    setSubmitting(true);
    const fp = getFingerprint();
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "question",
        article_id: articleId,
        question: newQuestion.trim(),
        nickname: nickname.trim(),
        fingerprint: fp,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setMsg(data.message);
      setNewQuestion("");
      setShowForm(false);
      loadQuestions();
    } else {
      setMsg(data.error || "エラーが発生しました");
    }
    setSubmitting(false);
    setTimeout(() => setMsg(""), 4000);
  };

  if (loading) return null;

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="text-lg">❓</span>
          みんなのQ&A
          {questions.length > 0 && (
            <span className="text-xs font-normal text-gray-400">({questions.length}件)</span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-blue-500 hover:text-blue-600 border border-blue-300 dark:border-blue-600 rounded-full px-3 py-1"
          >
            質問する
          </button>
        )}
      </div>

      {/* 質問フォーム */}
      {showForm && (
        <div className="mb-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 space-y-2">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="この商品について質問してみましょう..."
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 resize-none"
          />
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネーム"
              maxLength={20}
              className="w-28 px-2 py-1.5 text-xs border rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            />
            <div className="flex-1" />
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-500">
              キャンセル
            </button>
            <button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim() || submitting}
              className="px-4 py-1.5 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {submitting ? "..." : "質問を投稿"}
            </button>
          </div>
        </div>
      )}

      {msg && <p className="text-xs text-green-600 dark:text-green-400 mb-3">{msg}</p>}

      {/* 質問一覧 */}
      {questions.length === 0 && !showForm && (
        <p className="text-xs text-gray-400 text-center py-4">
          まだ質問はありません。最初の質問を投稿してみませんか？
        </p>
      )}

      <div className="space-y-3">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} onAnswered={loadQuestions} />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ question, onAnswered }: { question: Question; onAnswered: () => void }) {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answer, setAnswer] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    const fp = getFingerprint();
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "answer",
        question_id: question.id,
        answer: answer.trim(),
        nickname: nickname.trim(),
        fingerprint: fp,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setAnswer("");
      setShowAnswerForm(false);
      onAnswered();
    }
    setSubmitting(false);
  };

  const answers = question.article_answers || [];

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <span className="text-blue-500 font-bold text-sm mt-0.5">Q</span>
        <div className="flex-1">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{question.question}</p>
          <div className="flex items-center gap-2 mt-1">
            <VerifiedBadge userId={question.user_id} nickname={question.nickname} profile={question.user_profiles} size="xs" />
            <span className="text-[10px] text-gray-400">{timeAgo(question.created_at)}</span>
          </div>
        </div>
      </div>

      {/* 回答一覧 */}
      {answers.length > 0 && (
        <div className="mt-2 ml-5 space-y-1.5">
          {answers.map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <span className="text-green-500 font-bold text-xs mt-0.5">A</span>
              <div className="flex-1 bg-green-50 dark:bg-green-900/10 rounded px-2.5 py-1.5">
                <p className="text-xs text-gray-700 dark:text-gray-300">{a.answer}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <VerifiedBadge userId={a.user_id} nickname={a.nickname} profile={a.user_profiles} size="xs" />
                  <span className="text-[10px] text-gray-400">{timeAgo(a.created_at)}</span>
                  {a.helpful_count > 0 && (
                    <span className="text-[10px] text-gray-400">👍{a.helpful_count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 回答フォーム */}
      <div className="mt-2 ml-5">
        {!showAnswerForm ? (
          <button
            onClick={() => setShowAnswerForm(true)}
            className="text-[11px] text-blue-500 hover:text-blue-600"
          >
            {answers.length === 0 ? "回答する" : "回答を追加"}
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="名前"
              maxLength={20}
              className="w-20 px-2 py-1 text-[11px] border rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="回答を入力..."
              maxLength={1000}
              className="flex-1 px-2 py-1 text-[11px] border rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || submitting}
              className="px-2 py-1 text-[11px] rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
            >
              {submitting ? "..." : "送信"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
