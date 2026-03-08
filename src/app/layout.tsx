import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ベストアイテム - おすすめ商品比較・ランキング",
    template: "%s | ベストアイテム",
  },
  description:
    "あなたにぴったりのアイテムが見つかる！専門家が厳選したおすすめ商品の比較・ランキングサイト。化粧水・美容液・プロテイン・サプリなどを詳しく解説。",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://best-item.co.jp"
  ),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "ベストアイテム",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geist.variable} antialiased min-h-screen flex flex-col bg-gray-50`}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
