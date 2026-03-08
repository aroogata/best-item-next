import Link from "next/link";

const footerLinks = [
  { href: "/kosui/osusume/", label: "化粧水" },
  { href: "/bijyueki/osusume/", label: "美容液" },
  { href: "/protein/osusume/", label: "プロテイン" },
  { href: "/vitamin/osusume/", label: "ビタミン" },
  { href: "/supplement/osusume/", label: "サプリメント" },
];

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/70 mt-16">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-10">

          {/* Brand mark */}
          <div className="shrink-0">
            <p className="font-display text-2xl italic font-black text-background mb-1">
              Best Item.
            </p>
            <p className="text-[10px] tracking-[0.22em] uppercase text-background/40 mb-4">
              Curated Selection
            </p>
            <p className="text-xs text-background/40 font-light">
              運営: ベンジー株式会社
            </p>
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
