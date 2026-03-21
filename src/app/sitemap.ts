import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

// 動的サイトマップ（毎リクエストで再生成）
export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://awesome-item.com").trim().replace(/\/$/, "");

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
  { url: `${SITE_URL}/about/`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/privacy-policy/`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/gaibusoshin/`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  { url: `${SITE_URL}/skincare/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/supplement/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/haircare/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/makeup/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  { url: `${SITE_URL}/oral/`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient();

    const { data: articles, error } = await supabase
      .from("articles")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("[sitemap] Supabase error:", error.message);
      return STATIC_PAGES;
    }

    const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
      url: `${SITE_URL}${a.slug.replace(/\/$/, "")}/`,
      lastModified: new Date(a.published_at ?? new Date()),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));

    console.log(`[sitemap] ${articlePages.length} articles added`);
    return [...STATIC_PAGES, ...articlePages];
  } catch (e) {
    console.error("[sitemap] unexpected error:", e);
    return STATIC_PAGES;
  }
}
