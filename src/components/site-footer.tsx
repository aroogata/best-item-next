import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
  { href: "/kosui/osusume/", label: "化粧水おすすめ" },
  { href: "/bijyueki/osusume/", label: "美容液おすすめ" },
  { href: "/protein/osusume/", label: "プロテインおすすめ" },
  { href: "/vitamin/osusume/", label: "ビタミンおすすめ" },
  { href: "/supplement/osusume/", label: "サプリメントおすすめ" },
];

export function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-white text-lg font-bold mb-1">Best Item</p>
            <p className="text-sm text-gray-400">おすすめ商品比較・ランキングサイト</p>
            <p className="text-xs text-gray-500 mt-3">運営: ベンジー株式会社</p>
          </div>
          <div className="flex gap-10 text-sm">
            <div>
              <p className="text-white font-semibold mb-3">カテゴリ</p>
              <ul className="space-y-2">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">サイト情報</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about/" className="hover:text-white transition-colors">サイトについて</Link></li>
                <li><Link href="/privacy-policy/" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-gray-700" />

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>当サイトは楽天アフィリエイトプログラムに参加しています。</p>
          <p>記載の価格は記事執筆時点のものです。最新の価格は各商品ページでご確認ください。</p>
          <p className="mt-2">© {new Date().getFullYear()} ベンジー株式会社 All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
