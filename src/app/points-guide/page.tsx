import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "ポイントプログラム",
  description: "オーサムアイテムのポイントプログラム。レビューや投票でポイントを貯めて、giftee Boxのデジタルギフト券に交換できます。",
};

const POINT_TABLE = [
  { action: "初回ログインボーナス", points: 100, icon: "🎉" },
  { action: "アンケート回答", points: 10, icon: "📊" },
  { action: "商品レビュー投稿", points: 30, icon: "💬" },
  { action: "Q&A 質問投稿", points: 10, icon: "❓" },
  { action: "Q&A 回答投稿", points: 20, icon: "💡" },
  { action: "「役に立った」を獲得", points: 5, icon: "👍" },
  { action: "プロフィール完成", points: 50, icon: "👤" },
];

const RANKS = [
  { name: "ブロンズ", emoji: "🥉", points: "0pt〜", benefit: "基本機能が利用可能", color: "bg-amber-50 border-amber-200" },
  { name: "シルバー", emoji: "🥈", points: "100pt〜", benefit: "認証バッジが表示", color: "bg-gray-50 border-gray-200" },
  { name: "ゴールド", emoji: "🥇", points: "500pt〜", benefit: "レビューが上位表示", color: "bg-yellow-50 border-yellow-200" },
  { name: "プラチナ", emoji: "💎", points: "2,000pt〜", benefit: "特別キャンペーンに招待", color: "bg-blue-50 border-blue-200" },
];

const EXCHANGE_RATES = [
  { points: 500, amount: 50 },
  { points: 1000, amount: 100 },
  { points: 2500, amount: 300 },
  { points: 5000, amount: 500 },
];

export default function PointsGuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* ヘッダー */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-light mb-3">Rewards Program</p>
        <h1 className="font-display text-3xl font-black italic text-foreground mb-2">
          ポイントプログラム
        </h1>
        <p className="text-sm text-muted-foreground">
          レビューや投票でポイントを貯めて、お好きなギフト券に交換できます。
        </p>
      </div>

      <Separator className="mb-8" />

      {/* 交換機能準備中のお知らせ */}
      <div className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/10 px-5 py-4 rounded-r-lg mb-8">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">ポイント交換は現在準備中です</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          ポイントの獲得は既に開始しています。レビューやアンケート回答でポイントを貯めておくことができます。
          ギフト券への交換機能は、サービス審査完了後に開始する予定です。準備でき次第、本ページおよびマイページでお知らせいたします。
        </p>
      </div>

      {/* 3ステップ紹介 */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          かんたん3ステップ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-3xl mb-2">1</p>
            <p className="text-sm font-bold text-foreground mb-1">無料ログイン</p>
            <p className="text-xs text-muted-foreground">GoogleまたはXアカウントで簡単ログイン。メールでもOK。</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-3xl mb-2">2</p>
            <p className="text-sm font-bold text-foreground mb-1">レビュー・投票</p>
            <p className="text-xs text-muted-foreground">商品レビューやアンケート回答でポイントが貯まります。</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-3xl mb-2">3</p>
            <p className="text-sm font-bold text-foreground mb-1">ギフト券に交換</p>
            <p className="text-xs text-muted-foreground">貯まったポイントをAmazonや楽天ポイントなどに交換！</p>
          </div>
        </div>
      </section>

      {/* giftee Box バナー */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          交換先はgiftee Boxで選び放題
        </h2>
        <div className="rounded-xl overflow-hidden border border-border mb-4">
          <Image src="/giftee/brands.png" alt="giftee Box - Amazon、楽天ポイント、サーティワンなど" width={530} height={300} className="w-full" unoptimized />
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          ポイントは <strong>giftee Box</strong> を通じて、Amazon、楽天ポイント、サーティワン、スターバックスなど
          <strong>500種類以上</strong>のブランドからお好きなギフトに交換できます。
        </p>
      </section>

      {/* 交換レート */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          交換レート
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXCHANGE_RATES.map((r) => (
            <div key={r.points} className="bg-card border border-border rounded-lg p-4 text-center">
              <Image src="/giftee/logo.png" alt="giftee Box" width={24} height={24} className="mx-auto mb-2" unoptimized />
              <p className="text-xl font-bold text-foreground">{r.amount}円分</p>
              <p className="text-xs text-muted-foreground">{r.points.toLocaleString()}pt</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-amber-600 mt-2">※ 交換機能はサービス審査完了後に開始予定です。現在はポイントを貯めておくことができます。</p>
      </section>

      {/* giftee Box 使い方 */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          giftee Box の使い方
        </h2>
        <div className="rounded-xl overflow-hidden border border-border mb-3">
          <Image src="/giftee/steps.png" alt="giftee Box 利用手順" width={800} height={300} className="w-full" unoptimized />
        </div>
        <ol className="text-sm text-foreground/80 space-y-1.5 list-decimal list-inside">
          <li>ポイント交換後、ギフトURLがマイページに届きます</li>
          <li>URLを開くと、交換可能なギフト一覧が表示されます</li>
          <li>お好きなギフトを選んで「ギフト交換へ進む」をタップ</li>
          <li>数量を確認して交換を確定</li>
          <li>ギフトのバーコードや引換コードが表示されます</li>
        </ol>
      </section>

      {/* ポイント獲得表 */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          ポイントの貯め方
        </h2>
        <p className="text-xs text-muted-foreground mb-3">匿名でも投稿できますが、ログインして投稿するとポイントが貯まります。</p>
        <div className="border border-border rounded-lg overflow-hidden">
          {POINT_TABLE.map((row, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{row.icon}</span>
                <span className="text-sm text-foreground">{row.action}</span>
              </div>
              <span className="text-sm font-bold text-primary">+{row.points}pt</span>
            </div>
          ))}
        </div>
      </section>

      {/* ガードレール */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          ポイント付与のルール
        </h2>
        <p className="text-xs text-muted-foreground mb-3">公正なポイントプログラム運営のため、以下の制限を設けています。</p>
        <div className="border border-border rounded-lg overflow-hidden">
          {[
            { rule: "1日のポイント獲得上限", value: "200pt / 日" },
            { rule: "アンケート回答", value: "1日20回まで" },
            { rule: "商品レビュー投稿", value: "1日10件まで" },
            { rule: "Q&A 質問投稿", value: "1日3件まで" },
            { rule: "Q&A 回答投稿", value: "1日10件まで" },
            { rule: "連続投稿の間隔", value: "30秒以上" },
            { rule: "同一対象への重複投稿", value: "1回のみポイント付与" },
          ].map((row, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
              <span className="text-xs text-foreground">{row.rule}</span>
              <span className="text-xs font-semibold text-muted-foreground">{row.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          ※ 上限に達してもレビューや投票自体は引き続き行えます。ポイントの付与のみが制限されます。
        </p>
      </section>

      {/* ランク */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          レビュアーランク
        </h2>
        <p className="text-xs text-muted-foreground mb-3">ポイントが貯まるとランクが上がり、特典が増えます。</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RANKS.map((rank) => (
            <div key={rank.name} className={`border rounded-lg p-4 text-center ${rank.color}`}>
              <p className="text-2xl mb-1">{rank.emoji}</p>
              <p className="text-sm font-bold text-foreground">{rank.name}</p>
              <p className="text-xs text-primary font-semibold mt-1">{rank.points}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{rank.benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 月次抽選 */}
      <section className="mb-10">
        <h2 className="font-black text-lg text-foreground border-l-2 border-primary pl-3 mb-5">
          月次抽選キャンペーン
        </h2>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-foreground/80 leading-relaxed">
            毎月開催される抽選キャンペーンにポイントで応募できます。
            当選者には <strong>giftee Box</strong> のギフト券をプレゼント！
            開催中のキャンペーンは<Link href="/" className="text-primary hover:underline">マイページ</Link>から確認できます。
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
        <p className="text-lg font-bold text-foreground mb-2">今すぐポイントを貯めよう</p>
        <p className="text-xs text-muted-foreground mb-4">初回ログインで <strong className="text-primary">100ポイント</strong> プレゼント！</p>
        <p className="text-xs text-muted-foreground">
          記事ページのアンケートやレビュー欄からすぐに参加できます。
        </p>
      </div>

      <div className="text-center mt-8">
        <Link href="/" className="text-xs text-primary hover:underline">
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}
