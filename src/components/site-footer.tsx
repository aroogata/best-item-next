import Link from "next/link";

const footerLinks = [
  { href: "/skincare/", label: "化粧水" },
  { href: "/haircare/", label: "ヘアケア" },
  { href: "/supplement/", label: "サプリメント" },
  { href: "/makeup/", label: "メイクアップ" },
  { href: "/oral/", label: "オーラルケア" },
];

const relatedSites = [
  { href: "https://best-item.co.jp", label: "ベストアイテム" },
  { href: "https://healthwork-insights.com/", label: "ヘルスワークインサイト" },
  { href: "https://eicta.org/", label: "ディズニープラスはパラダイス" },
  { href: "https://moraerumall.com/yourmoney/", label: "ユアマネー" },
  { href: "https://movie.awesome-item.com/", label: "ベストアイテムムービー" },
  { href: "https://linksurge.jp/", label: "リンクサージ" },
  { href: "https://xn--gmq12gpyni9n8zxp4gxxq.tokyo/", label: "薬剤師転職の成功哲学" },
  { href: "https://mediclan.club/", label: "医師転職の極意まとめ" },
];

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/70 mt-16">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-10">

          {/* Brand mark */}
          <div className="shrink-0">
            <p className="font-display text-2xl italic font-black text-background mb-1">
              Awesome Item.
            </p>
            <p className="text-[10px] tracking-[0.22em] uppercase text-background/40 mb-4">
              Curated Selection
            </p>
            <p className="text-xs text-background/40 font-light mb-3">
              運営: ベンジー株式会社
            </p>
            <div className="flex gap-3">
              <a
                href="https://note.com/tumorikabu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-background/50 hover:text-background transition-colors border border-background/20 hover:border-background/50 px-2 py-1"
              >
                note
              </a>
              <a
                href="https://x.com/creditcardbook7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-background/50 hover:text-background transition-colors border border-background/20 hover:border-background/50 px-2 py-1"
              >
                𝕏
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="flex gap-12 text-sm">
            <div>
              <p className="text-[9px] tracking-[0.22em] uppercase text-background/40 font-light mb-4">
                Category
              </p>
              <ul className="space-y-2.5">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-background/60 hover:text-background transition-colors font-light"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.22em] uppercase text-background/40 font-light mb-4">
                Info
              </p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/about/" className="text-sm text-background/60 hover:text-background transition-colors font-light">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy/" className="text-sm text-background/60 hover:text-background transition-colors font-light">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/gaibusoshin/" className="text-sm text-background/60 hover:text-background transition-colors font-light">
                    外部送信
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.22em] uppercase text-background/40 font-light mb-4">
                Related Sites
              </p>
              <ul className="space-y-2.5">
                {relatedSites.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-background/60 hover:text-background transition-colors font-light"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-6 flex flex-col md:flex-row justify-between gap-2 text-[10px] text-background/30 font-light tracking-wide">
          <p>当サイトは楽天アフィリエイトプログラムに参加しています。</p>
          <p>© {new Date().getFullYear()} ベンジー株式会社</p>
        </div>
      </div>
    </footer>
  );
}
