export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://awesome-item.com")
  .trim()
  .replace(/\/$/, "");

export const PUBLIC_SITE_REVALIDATE_SECONDS = 300;
export const SITEMAP_REVALIDATE_SECONDS = 3600;
