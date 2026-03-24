import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const GA_ID = "G-M8B2NRT6L9";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://awesome-item.com";

export const metadata: Metadata = {
  title: {
    default: "オーサムアイテム — おすすめ商品比較・ランキング",
    template: "%s | オーサムアイテム",
  },
  description:
    "化粧水・美容液・プロテインなど、楽天市場の人気商品を専門的な視点で比較・ランキング。あなたの目的に合った最高のアイテムを。",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "オーサムアイテム",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "オーサムアイテム" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
  manifest: "/manifest.json",
};

// Organization JSON-LD（全ページ共通）
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ベンジー株式会社",
  "alternateName": "Awesome Item",
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "description": "楽天市場の人気商品を専門的な視点で比較・ランキングするメディア「オーサムアイテム」を運営。",
  "sameAs": [
    "https://note.com/tumorikabu",
    "https://x.com/creditcardbook7",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "オーサムアイテム",
  "url": SITE_URL,
  "description": "化粧水・美容液・サプリメントなど、楽天市場の人気商品を専門的に比較・ランキング。",
  "publisher": { "@type": "Organization", "name": "ベンジー株式会社" },
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 — <head>に直接配置してSearch Console確認に対応 */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
          }}
        />
      </head>
      <body className={`${geist.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
