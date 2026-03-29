import { PUBLIC_SITE_REVALIDATE_SECONDS, SITEMAP_REVALIDATE_SECONDS, SITE_URL } from "@/lib/site-config";

type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  parent_category_id?: string | null;
  image_url?: string | null;
};

type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  h1?: string | null;
  target_keyword: string;
  meta_description: string | null;
  published_at: string | null;
  updated_at?: string | null;
  hero_image_url?: string | null;
  category_id?: string | null;
  categories?: { id?: string; name: string; slug: string } | Array<{ id?: string; name: string; slug: string }> | null;
  article_sections?: Array<{ section_type: string; content: string | null; sort_order: number }>;
  article_products?: Array<{
    rank: number;
    product_id: string;
    ai_review: string | null;
    ai_features: string | null;
    ai_recommended_for: string | null;
    ai_cons?: string | null;
    ai_not_recommended_for?: string | null;
    products: {
      name: string;
      price: number | null;
      image_url: string | null;
      images_json?: string | null;
      affiliate_url: string | null;
      review_average: number | null;
      review_count: number | null;
      shop_name?: string | null;
      description?: string | null;
    };
  }>;
};

function getSupabaseRestConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const apiKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Supabase public site environment variables are not configured");
  }

  return { restBase: `${baseUrl}/rest/v1`, apiKey };
}

async function fetchRest<T>(
  resource: string,
  params: Record<string, string>,
  revalidate = PUBLIC_SITE_REVALIDATE_SECONDS
): Promise<T> {
  const { restBase, apiKey } = getSupabaseRestConfig();
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${restBase}/${resource}?${query}`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`Supabase REST request failed: ${response.status} ${resource}`);
  }

  return response.json() as Promise<T>;
}

function normalizeCategory(
  category: { id?: string; name: string; slug: string } | Array<{ id?: string; name: string; slug: string }> | null | undefined
) {
  if (!category) return null;
  return Array.isArray(category) ? (category[0] ?? null) : category;
}

export async function getHomepageData() {
  try {
    const [latestArticles, categories, categoryArticles] = await Promise.all([
      fetchRest<Array<Record<string, unknown>>>("articles", {
        select: "id,slug,title,hero_image_url,published_at,categories(id,name,slug)",
        status: "eq.published",
        order: "published_at.desc",
        limit: "90",
      }),
      fetchRest<Array<CategoryRecord>>("categories", {
        select: "id,slug,name,description,sort_order,parent_category_id,image_url",
        order: "sort_order.asc,name.asc",
      }),
      fetchRest<Array<Record<string, unknown>>>("articles", {
        select: "id,slug,title,published_at,category_id,categories(id,name,slug)",
        status: "eq.published",
        order: "published_at.desc",
      }),
    ]);

  const latest = latestArticles.map((item) => ({
    id: String(item.id),
    slug: String(item.slug),
    title: String(item.title),
    hero_image_url: item.hero_image_url ? String(item.hero_image_url) : null,
    published_at: item.published_at ? String(item.published_at) : null,
    categories: normalizeCategory(
      item.categories as { id?: string; name: string; slug: string } | Array<{ id?: string; name: string; slug: string }> | null
    ),
  }));

  const categoryMeta = new Map<
    string,
    { articleCount: number; latestArticle: { slug: string; title: string; published_at: string | null } | null }
  >();

  for (const row of categoryArticles) {
    const category = normalizeCategory(
      row.categories as { id?: string; name: string; slug: string } | Array<{ id?: string; name: string; slug: string }> | null
    );
    const categoryId = category?.id ?? (row.category_id ? String(row.category_id) : null);
    if (!categoryId) continue;

    const current = categoryMeta.get(categoryId) ?? { articleCount: 0, latestArticle: null };
    categoryMeta.set(categoryId, {
      articleCount: current.articleCount + 1,
      latestArticle:
        current.latestArticle ??
        (row.slug && row.title
          ? {
              slug: String(row.slug),
              title: String(row.title),
              published_at: row.published_at ? String(row.published_at) : null,
            }
          : null),
    });
  }

  for (const category of categories) {
    const parentId = category.parent_category_id ? String(category.parent_category_id) : null;
    if (!parentId) continue;
    const childMeta = categoryMeta.get(String(category.id));
    if (!childMeta || childMeta.articleCount === 0) continue;
    const parentMeta = categoryMeta.get(parentId) ?? { articleCount: 0, latestArticle: null };
    const parentDate = parentMeta.latestArticle?.published_at ?? null;
    const childDate = childMeta.latestArticle?.published_at ?? null;
    const mergedLatest =
      parentDate && childDate
        ? parentDate >= childDate
          ? parentMeta.latestArticle
          : childMeta.latestArticle
        : (parentMeta.latestArticle ?? childMeta.latestArticle);
    categoryMeta.set(parentId, {
      articleCount: parentMeta.articleCount + childMeta.articleCount,
      latestArticle: mergedLatest,
    });
  }

    return {
      latestArticles: latest,
      categories: categories.map((category) => {
        const meta = categoryMeta.get(String(category.id));
        return {
          id: String(category.id),
          slug: String(category.slug),
          name: String(category.name),
          description: category.description ? String(category.description) : null,
          sort_order: Number(category.sort_order ?? 0),
          image_url: category.image_url ? String(category.image_url) : null,
          articleCount: meta?.articleCount ?? 0,
          latestArticle: meta?.latestArticle ?? null,
        };
      }),
    };
  } catch (error) {
    console.error("Failed to load homepage data", error);
    return { latestArticles: [], categories: [] };
  }
}

export async function getPublishedArticleBySlug(slug: string): Promise<ArticleRecord | null> {
  try {
    const articles = await fetchRest<ArticleRecord[]>("articles", {
      select: "*,categories(*),article_sections(*),article_products(*,products(*))",
      slug: `eq.${slug}`,
      status: "eq.published",
      limit: "1",
    });
    return articles[0] ?? null;
  } catch {
    return null;
  }
}

export async function getPopularArticles() {
  try {
    return await fetchRest<Array<{ id: string; slug: string; title: string; hero_image_url: string | null; published_at: string | null }>>(
      "articles",
      {
        select: "id,slug,title,hero_image_url,published_at",
        status: "eq.published",
        order: "published_at.desc",
        limit: "5",
      }
    );
  } catch {
    return [];
  }
}

export async function getAllCategories() {
  try {
    return await fetchRest<Array<{ id: string; name: string; slug: string }>>("categories", {
      select: "id,name,slug",
      order: "name.asc",
    });
  } catch {
    return [];
  }
}

export async function getRelatedArticles(categoryId: string, currentSlug: string) {
  try {
    return await fetchRest<Array<{ id: string; slug: string; title: string; hero_image_url: string | null; published_at: string | null }>>(
      "articles",
      {
        select: "id,slug,title,hero_image_url,published_at",
        category_id: `eq.${categoryId}`,
        status: "eq.published",
        slug: `neq.${currentSlug}`,
        order: "published_at.desc",
        limit: "3",
      }
    );
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(categorySlug: string) {
  try {
    const categories = await fetchRest<Array<{ id: string; name: string; slug: string }>>("categories", {
      select: "id,name,slug",
      slug: `eq.${categorySlug}`,
      limit: "1",
    });
    return categories[0] ?? null;
  } catch {
    return null;
  }
}

export async function getCategoryPage(categorySlug: string) {
  try {
    const category = await getCategoryBySlug(categorySlug);
    if (!category) return null;

  const childCategories = await fetchRest<Array<{ id: string; name: string; slug: string; sort_order: number | null }>>(
    "categories",
    {
      select: "id,name,slug,sort_order",
      parent_category_id: `eq.${category.id}`,
      order: "sort_order.asc,name.asc",
    }
  );

  const allCategoryIds = [category.id, ...childCategories.map((item) => item.id)];
  const articles = allCategoryIds.length
    ? await fetchRest<Array<{ id: string; slug: string; title: string; hero_image_url: string | null; published_at: string | null; meta_description: string | null; category_id: string }>>(
        "articles",
        {
          select: "id,slug,title,hero_image_url,published_at,meta_description,category_id",
          category_id: `in.(${allCategoryIds.join(",")})`,
          status: "eq.published",
          order: "published_at.desc",
        }
      )
    : [];

  const articleCountByCategory = new Map<string, number>();
  for (const article of articles) {
    articleCountByCategory.set(
      article.category_id,
      (articleCountByCategory.get(article.category_id) ?? 0) + 1
    );
  }

    return {
      category,
      articles,
      subcategories: childCategories.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        articleCount: articleCountByCategory.get(child.id) ?? 0,
      })),
    };
  } catch {
    return null;
  }
}

export async function getSitemapEntries() {
  const [articles, categories] = await Promise.all([
    fetchRest<Array<{ slug: string; published_at: string | null; updated_at: string | null }>>(
      "articles",
      {
        select: "slug,published_at,updated_at",
        status: "eq.published",
        order: "published_at.desc",
      },
      SITEMAP_REVALIDATE_SECONDS
    ),
    fetchRest<Array<{ slug: string; created_at: string | null }>>(
      "categories",
      {
        select: "slug,created_at",
        order: "name.asc",
      },
      SITEMAP_REVALIDATE_SECONDS
    ),
  ]);

  return { articles, categories, siteUrl: SITE_URL };
}
