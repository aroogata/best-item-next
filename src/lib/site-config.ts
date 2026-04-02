export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://otokiji.com")
  .trim()
  .replace(/\/$/, "");

export const LEGACY_SITE_URL = "https://awesome-item.com";
export const SITE_NAME = "OtoKiji";
export const SITE_NAME_KANA = "オトキジ";
export const SITE_NAME_FULL = "OtoKiji（オトキジ）";
export const SITE_DESCRIPTION =
  "楽天市場の人気商品を専門的な視点で比較・ランキング。目的や悩みに合う一品を見つけやすく整理するメディアです。";
export const SITE_LOGO_PATH = "/logo.png";
export const SITE_OG_IMAGE_PATH = "/opengraph-image.png";

export const PUBLIC_SITE_REVALIDATE_SECONDS = 300;
export const SITEMAP_REVALIDATE_SECONDS = 3600;
