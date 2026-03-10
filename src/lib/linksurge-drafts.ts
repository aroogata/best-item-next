export type DraftSectionMap = {
  intro?: string
  criteria?: string
  faq?: string
  conclusion?: string
  references?: string
  [key: string]: string | undefined
}

export type DraftProduct = {
  rank: number
  name: string
  price: number | null
  affiliate_url?: string | null
  image_url?: string | null
  shop_name?: string | null
  review_count?: number | null
  review_average?: number | null
  description?: string | null
  rakuten_item_id?: string | null
  item_code?: string | null
  ai_review?: string | null
  ai_features?: string | null
  ai_cons?: string | null
  ai_recommended_for?: string | null
  ai_not_recommended_for?: string | null
}

export type DraftArticleSummary = {
  slug: string
  target_keyword: string
  search_keyword?: string | null
  title?: string | null
  draft_status: string
  published_to_supabase: boolean
  updated_at?: string | null
  error_message?: string | null
}

export type DraftArticle = {
  slug: string
  target_keyword: string
  search_keyword?: string | null
  title?: string | null
  meta_description?: string | null
  hero_image_url?: string | null
  sections: DraftSectionMap
  products: DraftProduct[]
  draft_status: string
  published_to_supabase: boolean
  updated_at?: string | null
}

function getCrawlerBaseUrl() {
  const baseUrl = process.env.LINKSURGE_CRAWLER_API_BASE_URL?.trim()
  if (!baseUrl) {
    throw new Error('LINKSURGE_CRAWLER_API_BASE_URL is not set')
  }
  return baseUrl.replace(/\/$/, '')
}

export async function getDraftSummaries(): Promise<DraftArticleSummary[]> {
  const res = await fetch(`${getCrawlerBaseUrl()}/api/drafts`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch draft list: ${res.status}`)
  }

  const data = (await res.json()) as { items?: DraftArticleSummary[] }
  return data.items ?? []
}

export async function getDraft(slug: string): Promise<DraftArticle> {
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`
  const pathSlug = normalizedSlug.replace(/^\//, '')
  const res = await fetch(`${getCrawlerBaseUrl()}/api/drafts/${pathSlug}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch draft: ${res.status}`)
  }

  return (await res.json()) as DraftArticle
}
