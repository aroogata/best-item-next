import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Best Item",
  description: "Best Item（ベンジー株式会社）のプライバシーポリシーです。個人情報の取り扱い、Cookieの使用、アフィリエイトについて説明します。",
  robots: { index: false, follow: false },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-light mb-3">Legal</p>
        <h1 className="font-display text-3xl font-black italic text-foreground mb-2">
          プライバシーポリシー
        </h1>
        <p className="text-xs text-muted-foreground">最終更新日：2026年3月</p>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-8 text-sm text-foreground/80 leading-relaxed">

        <section>
          <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3 mb-3">
            1. 事業者情報
          </h2>
          <p>ベンジー株式会社（以下「当社」）が運営するBest Item（以下「当サイト」）におけるプライバシーポリシーを定めます。</p>
        </section>

        <section>
          <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3 mb-3">
            2. 収集する情報
          </h2>
          <p>当サイトは以下の情報を収集することがあります。</p>
          <ul className="mt-3 space-y-2 pl-4 list-disc">
            <li>アクセスログ（IPアドレス、ブラウザ情報、参照URL等）</li>
            <li>Cookie・ローカルストレージ等の技術情報</li>
            <li>お問い合わせフォームからご連絡いただいた氏名・メールアドレス</li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3 mb-3">
            3. Cookieの使用
          </h2>
          <p>
            当サイトはGoogle Analytics（Googleが提供するアクセス解析ツール）を使用しており、
            Cookieを通じてアクセス情報を収集します。収集される情報は匿名であり、個人を特定するものではありません。
            Cookieを無効にする場合はブラウザの設定をご変更ください。
          </p>
        </section>

        <section>
          <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3 mb-3">
            4. アフィリエイトプログラム
          </h2>
          <p>
            当サイトは楽天アフィリエイトプログラムに参加しています。
            記事内の商品リンクを経由してご購入いただいた場合、当社が紹介料を受け取ることがあります。
            これにより読者様のご負担が増えることはありません。
          </p>
        </section>

        <section>
          <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3 mb-3">
            5. 第三者提供
          </h2>
          <p>
            当社は、法令に基づく場合を除き、収集した個人情報を第三者に提供することはありません。
          </p>
        </section>

        <section>
          <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3 mb-3">
            6. お問い合わせ
          </h2>
          <p>
            プライバシーに関するお問い合わせは、サイト内のお問い合わせページよりご連絡ください。
          </p>
        </section>

      </div>
    </div>
  );
}
