"use client";

import { useState } from "react";
import Link from "next/link";
import type { Metadata } from "next";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setResult(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      setResult({ ok: true, message: data.message });
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } else {
      setResult({ ok: false, message: data.error || "送信に失敗しました" });
    }
    setSending(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-light mb-3">Contact</p>
        <h1 className="font-display text-3xl font-black italic text-foreground mb-2">
          お問い合わせ
        </h1>
        <p className="text-sm text-muted-foreground">
          オーサムアイテムへのお問い合わせは下記フォームよりお願いいたします。
        </p>
      </div>

      <div className="border-l-2 border-amber-400 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 mb-8 text-xs text-amber-800 dark:text-amber-300">
        <p className="font-semibold mb-1">営業目的のお問い合わせはお断りしております</p>
        <p className="text-amber-700 dark:text-amber-400">
          広告掲載・SEO対策・営業代行等のご連絡にはご返信いたしかねます。ご了承ください。
        </p>
      </div>

      {result?.ok ? (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <p className="text-2xl mb-2">&#x2714;</p>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">送信完了</p>
          <p className="text-xs text-green-700 dark:text-green-400">{result.message}</p>
          <Link href="/" className="text-xs text-primary hover:underline mt-4 inline-block">
            トップページに戻る
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="山田 太郎"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              件名
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="お問い合わせの件名"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              お問い合わせ内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={5000}
              rows={6}
              placeholder="お問い合わせ内容をご記入ください"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-vertical"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length} / 5,000</p>
          </div>

          {result && !result.ok && (
            <p className="text-xs text-red-500">{result.message}</p>
          )}

          <button
            type="submit"
            disabled={sending || !name.trim() || !email.trim() || !message.trim()}
            className="w-full py-3 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {sending ? "送信中..." : "送信する"}
          </button>

          <p className="text-[10px] text-muted-foreground text-center">
            送信いただいた内容は
            <Link href="/privacy-policy" className="text-primary hover:underline">プライバシーポリシー</Link>
            に基づいて取り扱います。
          </p>
        </form>
      )}
    </div>
  );
}
