import type { MetadataRoute } from "next";

import { LEGACY_SLUG_REDIRECTS } from "@/lib/legacy-slug-redirects";
import { getSitemapEntries } from "@/lib/public-site-data";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600;

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, lastModified: new Date("2026-03-27T00:00:00.000Z"), changeFrequency: "weekly", priority: 1.0 },
  { url: `${SITE_URL}/about`, lastModified: new Date("2026-03-27T00:00:00.000Z"), changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/privacy-policy`, lastModified: new Date("2026-03-27T00:00:00.000Z"), changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/gaibusoshin`, lastModified: new Date("2026-03-27T00:00:00.000Z"), changeFrequency: "yearly", priority: 0.2 },
  { url: `${SITE_URL}/contact`, lastModified: new Date("2026-03-27T00:00:00.000Z"), changeFrequency: "yearly", priority: 0.2 },
  { url: `${SITE_URL}/points-guide`, lastModified: new Date("2026-03-27T00:00:00.000Z"), changeFrequency: "monthly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { articles, categories, siteUrl } = await getSitemapEntries();
    const redirectSources = new Set(Object.keys(LEGACY_SLUG_REDIRECTS));

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${siteUrl}/${category.slug}`,
      lastModified: new Date(category.created_at ?? "2026-03-27T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const articlePages: MetadataRoute.Sitemap = articles
      .filter((article) => !redirectSources.has(article.slug))
      .map((article) => ({
        url: `${siteUrl}${article.slug.replace(/\/$/, "")}`,
        lastModified: new Date(article.updated_at ?? article.published_at ?? "2026-03-27T00:00:00.000Z"),
        changeFrequency: "monthly",
        priority: 0.9,
      }));

    return [...STATIC_PAGES, ...categoryPages, ...articlePages];
  } catch (error) {
    console.error("[sitemap] unexpected error:", error);
    return STATIC_PAGES;
  }
}
