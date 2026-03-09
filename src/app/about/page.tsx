import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Search, ClipboardList, Star, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Best Item 編集部について | 評価基準・編集方針",
  description:
    "Best Item編集部は、楽天市場の口コミ・価格・成分情報をもとに独立した商品比較を行っています。評価基準、編集方針、アフィリエイト開示についてご説明します。",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://best-item.co.jp";

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "Best Item 編集部について",
  "url": `${SITE_URL}/about/`,
  "description": "Best Item編集部の評価基準・編集方針・専門性についての説明ページ。",
  "publisher": {
    "@type": "Organization",
    "name": "ベンジー株式会社",
    "url": SITE_URL,
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-light mb-3">
          Editorial Policy
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-black italic text-foreground mb-4">
          Best Item 編集部について
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Best Itemは、楽天市場で販売される商品を中立的な視点で調査・比較し、
          読者が本当に自分に合ったアイテムを見つけられるようにするメディアです。
          運営：ベンジー株式会社
        </p>
      </div>

      <Separator className="mb-10" />

      {/* E-E-A-T セクション */}
      <section className="mb-10">
        <h2 className="text-base font-black text-foreground border-l-2 border-primary pl-3 mb-6">
          私たちの専門性と信頼性
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: Search,
              title: "独立した調査",
              body: "広告主からの指示を受けず、楽天市場の口コミ・評価点数・レビュー件数・価格・成分情報を独自に収集・分析しています。",
            },
            {
              icon: ClipboardList,
              title: "明確な評価基準",
              body: "各ジャンルに応じた評価軸（成分・コスパ・使用感・口コミ数など）を事前に設定し、一貫した基準でランキングを作成します。",
            },
            {
              icon: Star,
              title: "実データ重視",
              body: "楽天市場の実際の購入者レビュー（数百〜数千件）を根拠に評価。星4以上・レビュー100件以上を一次選定条件としています。",
            },
            {
              icon: Users,
              title: "読者ファースト",
              body: "アフィリエイト収益よりも読者の利益を優先。商品の欠点・注意点も正直に記載し、「向かない人」も明示しています。",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">{title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 評価プロセス */}
      <section className="mb-10">
        <h2 className="text-base font-black text-foreground border-l-2 border-primary pl-3 mb-6">
          記事作成プロセス
        </h2>
        <ol className="space-y-4">
          {[
            { step: "01", title: "商品候補の収集", body: "楽天市場APIを通じて各カテゴリの上位商品（60件以上）を収集。売上・口コミ数・評価点を一次フィルタとして使用します。" },
            { step: "02", title: "評価データの分析", body: "価格帯・成分・レビュー内容・リピート率などの指標を多角的に分析し、上位20件を選定します。" },
            { step: "03", title: "競合記事の調査", body: "同一キーワードで上位表示される記事の内容を調査し、読者の疑問点・悩みを把握した上で記事構成を設計します。" },
            { step: "04", title: "編集・レビュー", body: "AIによるドラフト生成後、編集部が情報の正確性・中立性・読みやすさを確認・加筆修正します。" },
            { step: "05", title: "定期更新", body: "価格変動・新商品発売・口コミ数の増加に応じて定期的に内容を見直し、最新情報に更新します。" },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-primary/10 flex items-center justify-center">
                <span className="text-[10px] font-black text-primary tracking-wider">{step}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-foreground mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* アフィリエイト開示 */}
      <section className="mb-10 bg-secondary/50 border border-border p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h2 className="font-black text-sm text-foreground mb-2">
              アフィリエイト広告の開示
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              当サイトは楽天アフィリエイトプログラムに参加しており、記事内の商品リンクを経由してご購入いただいた場合、
              当社が手数料を受け取ることがあります。ただし、これはランキングや評価に一切影響しません。
              すべての評価は購入者レビューと編集部の基準に基づき、独立して行われます。
            </p>
          </div>
        </div>
      </section>

      {/* 問い合わせ */}
      <section className="text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">お問い合わせ</p>
        <p>運営会社：ベンジー株式会社</p>
        <p>
          記事内容の誤り・修正依頼は{" "}
          <Link href="/contact/" className="text-primary underline underline-offset-2">
            お問い合わせページ
          </Link>{" "}
          よりご連絡ください。
        </p>
        <p>
          <Link href="/privacy-policy/" className="text-primary underline underline-offset-2">
            プライバシーポリシー
          </Link>
        </p>
      </section>
    </div>
  );
}
