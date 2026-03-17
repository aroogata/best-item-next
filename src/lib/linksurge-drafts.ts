import { createServiceClient } from '@/lib/supabase/server'

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
  images_json?: string | null
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
  published_article_id?: string | null
  updated_at?: string | null
  error_message?: string | null
}

export type DraftArticle = {
  id: string
  slug: string
  target_keyword: string
  search_keyword?: string | null
  title?: string | null
  raw_title?: string | null
  manual_title?: string | null
  meta_description?: string | null
  raw_meta_description?: string | null
  manual_meta_description?: string | null
  hero_image_url?: string | null
  sections: DraftSectionMap
  products: DraftProduct[]
  draft_status: string
  published_to_supabase: boolean
  published_article_id?: string | null
  manual_category_id?: string | null
  updated_at?: string | null
}

export type DraftSummaryFilters = {
  status?: string
  published?: 'published' | 'unpublished' | 'all'
  q?: string
}

type DraftArticleRow = {
  id: string
  source_slug: string
  target_keyword: string
  search_keyword: string | null
  title: string | null
  manual_title: string | null
  meta_description: string | null
  manual_meta_description: string | null
  hero_image_url: string | null
  draft_status: string
  published_to_supabase: boolean | null
  published_article_id: string | null
  manual_category_id: string | null
  updated_at: string | null
  error_message: string | null
}

type DraftSectionRow = {
  section_type: string
  content: string | null
}

type DraftProductRow = {
  rank: number
  name: string
  price: number | null
  affiliate_url: string | null
  image_url: string | null
  shop_name: string | null
  review_count: number | null
  review_average: number | null
  description: string | null
  rakuten_item_id: string | null
  ai_review: string | null
  ai_features: string | null
  ai_cons: string | null
  ai_recommended_for: string | null
  ai_not_recommended_for: string | null
  images_json: string | null
  raw_product_json: { item_code?: string | null } | null
}

export function normalizeSlug(slug: string) {
  const trimmed = slug.trim()
  if (!trimmed) return '/'
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash === '/' ? withLeadingSlash : `${withLeadingSlash.replace(/\/+$/, '')}/`
}

export function getPublishBlockingIssues(draft: DraftArticle) {
  const issues: string[] = []

  if (!draft.hero_image_url) {
    issues.push('ヒーロー画像が未生成です')
  }

  // criteria チェックは比較記事（criteria セクションあり）のみ適用。解説記事はスキップ。
  if ('criteria' in (draft.sections ?? {})) {
    const criteria = draft.sections?.criteria || ''
    const hasCriteriaImage = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/.test(criteria)
    if (!hasCriteriaImage) {
      issues.push('criteria セクションに記事内インフォグラフィックがありません')
    }
  }

  return issues
}

function normalizeQuery(query: string | undefined) {
  return query?.trim().toLowerCase() || ''
}

function matchesQuery(row: DraftArticleRow, query: string) {
  if (!query) return true

  const haystacks = [
    row.source_slug,
    row.target_keyword,
    row.search_keyword,
    row.manual_title ?? row.title,
    row.manual_meta_description ?? row.meta_description,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())

  return haystacks.some((value) => value.includes(query))
}

function isMissingDraftTableError(message: string | undefined) {
  if (!message) return false
  return (
    message.includes("Could not find the table 'public.draft_articles'") ||
    message.includes("relation 'public.draft_articles' does not exist")
  )
}

function mapSummary(row: DraftArticleRow): DraftArticleSummary {
  return {
    slug: row.source_slug,
    target_keyword: row.target_keyword,
    search_keyword: row.search_keyword,
    title: row.manual_title ?? row.title,
    draft_status: row.draft_status,
    published_to_supabase: Boolean(row.published_to_supabase),
    published_article_id: row.published_article_id,
    updated_at: row.updated_at,
    error_message: row.error_message,
  }
}

function mapDraft(
  article: DraftArticleRow,
  sections: DraftSectionRow[],
  products: DraftProductRow[]
): DraftArticle {
  const sectionMap = sections.reduce<DraftSectionMap>((acc, section) => {
    if (section.content) {
      acc[section.section_type] = section.content
    }
    return acc
  }, {})

  return {
    id: article.id,
    slug: article.source_slug,
    target_keyword: article.target_keyword,
    search_keyword: article.search_keyword,
    title: article.manual_title ?? article.title,
    raw_title: article.title,
    manual_title: article.manual_title,
    meta_description: article.manual_meta_description ?? article.meta_description,
    raw_meta_description: article.meta_description,
    manual_meta_description: article.manual_meta_description,
    hero_image_url: article.hero_image_url,
    sections: sectionMap,
    products: products.map((product) => ({
      rank: product.rank,
      name: product.name,
      price: product.price,
      affiliate_url: product.affiliate_url,
      image_url: product.image_url,
      images_json: product.images_json,
      shop_name: product.shop_name,
      review_count: product.review_count,
      review_average: product.review_average,
      description: product.description,
      rakuten_item_id: product.rakuten_item_id,
      item_code: product.raw_product_json?.item_code ?? null,
      ai_review: product.ai_review,
      ai_features: product.ai_features,
      ai_cons: product.ai_cons,
      ai_recommended_for: product.ai_recommended_for,
      ai_not_recommended_for: product.ai_not_recommended_for,
    })),
    draft_status: article.draft_status,
    published_to_supabase: Boolean(article.published_to_supabase),
    published_article_id: article.published_article_id,
    manual_category_id: article.manual_category_id,
    updated_at: article.updated_at,
  }
}

export async function getDraftSummaries(filters: DraftSummaryFilters = {}): Promise<DraftArticleSummary[]> {
  const supabase = await createServiceClient()
  let query = supabase
    .from('draft_articles')
    .select(
      'id, source_slug, target_keyword, search_keyword, title, manual_title, meta_description, manual_meta_description, draft_status, published_to_supabase, published_article_id, updated_at, error_message'
    )
    .order('updated_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('draft_status', filters.status)
  }

  if (filters.published === 'published') {
    query = query.eq('published_to_supabase', true)
  } else if (filters.published === 'unpublished') {
    query = query.eq('published_to_supabase', false)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingDraftTableError(error.message)) {
      return []
    }
    throw new Error(`Failed to fetch draft list: ${error.message}`)
  }

  const normalizedQuery = normalizeQuery(filters.q)
  return ((data ?? []) as DraftArticleRow[])
    .filter((row) => matchesQuery(row, normalizedQuery))
    .map(mapSummary)
}

export async function getDraft(slug: string): Promise<DraftArticle> {
  const supabase = await createServiceClient()
  const normalizedSlug = normalizeSlug(slug)

  const { data: article, error: articleError } = await supabase
    .from('draft_articles')
    .select(
      'id, source_slug, target_keyword, search_keyword, title, manual_title, meta_description, manual_meta_description, hero_image_url, draft_status, published_to_supabase, published_article_id, manual_category_id, updated_at, error_message'
    )
    .eq('source_slug', normalizedSlug)
    .single()

  if (articleError || !article) {
    if (isMissingDraftTableError(articleError?.message)) {
      throw new Error('Draft staging tables are not available yet')
    }
    throw new Error(articleError?.message || 'Draft not found')
  }

  const draftArticle = article as DraftArticleRow

  const [{ data: sections, error: sectionsError }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from('draft_article_sections')
      .select('section_type, content')
      .eq('draft_article_id', draftArticle.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('draft_article_products')
      .select(
        'rank, name, price, affiliate_url, image_url, images_json, shop_name, review_count, review_average, description, rakuten_item_id, ai_review, ai_features, ai_cons, ai_recommended_for, ai_not_recommended_for, raw_product_json'
      )
      .eq('draft_article_id', draftArticle.id)
      .order('rank', { ascending: true }),
  ])

  if (sectionsError) {
    throw new Error(`Failed to fetch draft sections: ${sectionsError.message}`)
  }
  if (productsError) {
    throw new Error(`Failed to fetch draft products: ${productsError.message}`)
  }

  return mapDraft(
    draftArticle,
    (sections ?? []) as DraftSectionRow[],
    (products ?? []) as DraftProductRow[]
  )
}
