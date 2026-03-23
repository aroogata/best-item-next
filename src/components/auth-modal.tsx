"use client";

import { useState } from "react";
import { useAuth, RANK_CONFIG } from "@/lib/auth-context";
import Image from "next/image";
import Link from "next/link";

export function LoginButton() {
  const { user, profile, loading, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (loading) return null;

  if (user && profile) {
    const rankCfg = RANK_CONFIG[profile.rank];
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={28}
              height={28}
              className="rounded-full border border-border"
              unoptimized
            />
          ) : (
            <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {(profile.display_name || "U")[0]}
            </span>
          )}
          <span className="hidden md:inline text-xs text-muted-foreground">
            {rankCfg.emoji} {profile.points}pt
          </span>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-9 z-50 w-56 bg-card border border-border rounded-lg shadow-lg p-3 space-y-2">
              <div className="text-xs text-muted-foreground border-b border-border pb-2">
                <p className="font-semibold text-foreground">{profile.display_name || "ユーザー"}</p>
                <p className="flex items-center gap-1 mt-0.5">
                  <span>{rankCfg.emoji}</span>
                  <span className={rankCfg.color}>{rankCfg.label}</span>
                  <span className="ml-auto font-bold text-foreground">{profile.points}pt</span>
                </p>
              </div>
              <Link
                href={`/user/${profile.id}`}
                onClick={() => setShowMenu(false)}
                className="block text-xs text-foreground hover:text-primary py-1"
              >
                マイページ
              </Link>
              <button
                onClick={() => { signOut(); setShowMenu(false); }}
                className="block w-full text-left text-xs text-muted-foreground hover:text-red-500 py-1"
              >
                ログアウト
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs font-medium text-primary border border-primary/40 rounded-full px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        ログイン
      </button>
      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleMagicLink = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    setError("");
    const result = await signInWithMagicLink(email.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setEmailSent(true);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">ログイン</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">×</button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          ログインするとレビュー投稿でポイントが貯まります。初回100ptプレゼント！
        </p>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors mb-3"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Googleでログイン
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground">または</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Magic Link */}
        {emailSent ? (
          <div className="text-center py-4">
            <p className="text-sm text-foreground font-medium mb-1">メールを送信しました</p>
            <p className="text-xs text-muted-foreground">
              {email} に届いたリンクをクリックしてログインしてください。
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
            />
            <button
              onClick={handleMagicLink}
              disabled={!email.trim() || sending}
              className="w-full py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {sending ? "送信中..." : "メールでログイン"}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <p className="text-[10px] text-muted-foreground mt-4 text-center">
          ログインすると<Link href="/privacy-policy" className="underline">プライバシーポリシー</Link>に同意したことになります。
        </p>
      </div>
    </div>
  );
}
