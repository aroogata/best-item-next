import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { SITE_NAME_FULL, SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `外部送信について | ${SITE_NAME_FULL}`,
  description: `${SITE_NAME_FULL}（ベンジー株式会社）が利用する外部サービスへの情報送信について説明します。`,
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${SITE_URL}/gaibusoshin`,
  },
};

const services = [
  {
    name: "Google Analytics 4",
    provider: "Google LLC",
    purpose: "サイトのアクセス解析・利用状況の把握",
    data: [
      "ページURL・参照URL",
      "ブラウザの種類・OS・デバイスの種類",
      "アクセス日時・滞在時間",
      "クリックイベント等の行動データ",
      "IPアドレス（送信後に匿名化）",
    ],
    policy: "https://policies.google.com/privacy",
    optout: "https://tools.google.com/dlpage/gaoptout",
    optoutLabel: "Google アナリティクス オプトアウト アドオン",
  },
  {
    name: "楽天アフィリエイト",
    provider: "楽天グループ株式会社",
    purpose: "アフィリエイトリンク経由の成果計測",
    data: [
      "クリックされたリンクURL",
      "Cookie（成果判定用・有効期限30日）",
      "参照元URL",
    ],
    policy: "https://privacy.rakuten.co.jp/",
    optout: null,
    optoutLabel: null,
  },
  {
    name: "Vercel（ホスティング）",
    provider: "Vercel Inc.",
    purpose: "ウェブサイトの配信・表示速度の最適化",
    data: [
      "IPアドレス",
      "リクエストURL・HTTPヘッダー",
      "アクセス日時",
    ],
    policy: "https://vercel.com/legal/privacy-policy",
    optout: null,
    optoutLabel: null,
  },
];

export default function GaibusoshinPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-light mb-3">Legal</p>
        <h1 className="font-display text-3xl font-black italic text-foreground mb-2">
          外部送信について
        </h1>
        <p className="text-xs text-muted-foreground">最終更新日：2026年3月</p>
      </div>

      <Separator className="mb-8" />

      <div className="space-y-8 text-sm text-foreground/90 leading-relaxed">

        <section>
          <p>
            当サイト（{SITE_NAME_FULL} / otokiji.com）は、電気通信事業法第27条の12に基づき、
            利用者の情報を外部の事業者に送信している場合について、以下のとおり公表します。
          </p>
        </section>

        {services.map((svc, i) => (
          <section key={i} className="border border-border rounded-sm p-5 space-y-3">
            <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3">
              {svc.name}
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="text-muted-foreground shrink-0 w-32">送信先事業者</dt>
                <dd>{svc.provider}</dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="text-muted-foreground shrink-0 w-32">利用目的</dt>
                <dd>{svc.purpose}</dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="text-muted-foreground shrink-0 w-32">送信される情報</dt>
                <dd>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {svc.data.map((d, j) => <li key={j}>{d}</li>)}
                  </ul>
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="text-muted-foreground shrink-0 w-32">プライバシーポリシー</dt>
                <dd>
                  <a
                    href={svc.policy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:no-underline break-all"
                  >
                    {svc.policy}
                  </a>
                </dd>
              </div>
              {svc.optout && (
                <div className="flex flex-col sm:flex-row gap-1">
                  <dt className="text-muted-foreground shrink-0 w-32">オプトアウト</dt>
                  <dd>
                    <a
                      href={svc.optout}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      {svc.optoutLabel}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        ))}

        <section>
          <h2 className="font-black text-base text-foreground border-l-2 border-primary pl-3 mb-3">
            お問い合わせ
          </h2>
          <p>
            外部送信に関するご質問は、サイト内のお問い合わせページよりご連絡ください。
          </p>
        </section>

      </div>
    </div>
  );
}
