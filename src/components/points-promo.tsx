"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

export function PointsPromo() {
  const { user, loading } = useAuth();

  // ログイン済みなら非表示
  if (loading || user) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/10 p-4">
      <div className="flex items-start gap-3">
        <Image src="/giftee/logo.png" alt="giftee Box" width={36} height={36} className="shrink-0 mt-0.5" unoptimized />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground mb-1">
            レビュー投稿でギフト券がもらえる！
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            匿名でもレビューや投票ができますが、<strong className="text-foreground">ログインして投稿するとポイントが貯まります</strong>。
            貯まったポイントはAmazonギフト券や楽天ポイントなどに交換できます。
            初回ログインで<strong className="text-primary">100pt</strong>プレゼント！
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/points-guide"
              className="text-[11px] font-semibold text-primary hover:underline underline-offset-2"
            >
              ポイントプログラムの詳細 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
