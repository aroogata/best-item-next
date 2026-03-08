import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Best Item — おすすめ商品比較・ランキング",
    template: "%s | Best Item",
  },
  description:
    "化粧水・美容液・プロテインなど、楽天市場の人気商品を専門的な視点で比較・ランキング。あなたの目的に合った最高のアイテムを。",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://best-item.co.jp"
  ),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "Best Item",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geist.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
