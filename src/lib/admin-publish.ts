import { getCategorySlug, resolveCategoryName } from '@/lib/article-categories'
import { getDraft, getPublishBlockingIssues, type DraftArticle } from '@/lib/linksurge-drafts'

function getSupabaseConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  return { baseUrl, serviceRoleKey }
}

function createHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
  }
}

async function fetchDraft(slug: string): Promise<DraftArticle> {
  return getDraft(slug)
}

export async function publishDraftBySlug(slug: string) {
  const draft = await fetchDraft(slug)
  if (draft.draft_status !== 'done') {
    throw new Error('draft is not ready to publish')
  }

  const publishBlockingIssues = getPublishBlockingIssues(draft)
  if (publishBlockingIssues.length > 0) {
    throw new Error(`draft is missing required assets: ${publishBlockingIssues.join(', ')}`)
  }

  const { baseUrl, serviceRoleKey } = getSupabaseConfig()
  const headers = createHeaders(serviceRoleKey)
  const restBase = `${baseUrl}/rest/v1`

  let categoryId = draft.manual_category_id ?? null
  if (!categoryId) {
    const categoryName = resolveCategoryName(draft.target_keyword)
    const slugValue = getCategorySlug(categoryName)

    const categoryGet = await fetch(
      `${restBase}/categories?slug=eq.${encodeURIComponent(slugValue)}&select=id`,
      {
        headers,
        cache: 'no-store',
      }
    )
    if (!categoryGet.ok) {
      throw new Error(`failed to lookup category: ${categoryGet.status} ${categoryGet.statusText}`)
    }
    const existingCategories = (await categoryGet.json()) as Array<{ id: string }>

    categoryId = existingCategories[0]?.id
    if (!categoryId) {
      const categoryRes = await fetch(`${restBase}/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slug: slugValue, name: categoryName }),
      })
      if (!categoryRes.ok) {
        throw new Error('failed to create category')
      }
      const categoryData = (await categoryRes.json()) as Array<{ id: string }> | { id: string }
      categoryId = Array.isArray(categoryData) ? categoryData[0]?.id : categoryData.id
    }
  }
  if (!categoryId) {
    throw new Error('failed to resolve category')
  }

  const articlePayload = {
    slug: draft.slug,
    target_keyword: draft.target_keyword,
    title: draft.title || draft.target_keyword,
    h1: draft.title || draft.target_keyword,
    meta_description: draft.meta_description || '',
    category_id: categoryId,
    status: 'published',
    published_at: new Date().toISOString(),
    hero_image_url: draft.hero_image_url,
  }

  const articleRes = await fetch(`${restBase}/articles?on_conflict=slug`, {
    method: 'POST',
    headers,
    body: JSON.stringify(articlePayload),
  })
  if (!articleRes.ok) {
    throw new Error('failed to upsert article')
  }
  const articleData = (await articleRes.json()) as Array<{ id: string }> | { id: string }
  const articleId = Array.isArray(articleData) ? articleData[0]?.id : articleData.id
  if (!articleId) {
    throw new Error('failed to resolve published article id')
  }

  await fetch(`${restBase}/article_sections?article_id=eq.${articleId}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: '' },
  })

  const sectionOrder: Array<[keyof DraftArticle['sections'], number]> = [
    ['intro', 0],
    ['criteria', 1],
    ['faq', 2],
    ['conclusion', 3],
    ['references', 4],
  ]

  for (const [sectionKey, sortOrder] of sectionOrder) {
    const content = draft.sections?.[sectionKey]
    if (!content) continue
    await fetch(`${restBase}/article_sections`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        article_id: articleId,
        section_type: sectionKey,
        sort_order: sortOrder,
        content,
      }),
    })
  }

  await fetch(`${restBase}/article_products?article_id=eq.${articleId}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: '' },
  })

  for (const [index, product] of draft.products.entries()) {
    const rank = product.rank || index + 1
    const productPayload: Record<string, unknown> = {
      name: product.name,
      price: product.price,
      affiliate_url: product.affiliate_url,
      image_url: product.image_url,
      review_count: product.review_count || 0,
      review_average: product.review_average || 0,
      shop_name: product.shop_name || '',
      description: (product.description || '').slice(0, 500),
    }
    const rakutenItemId = product.rakuten_item_id || product.item_code
    if (rakutenItemId) {
      productPayload.rakuten_item_id = String(rakutenItemId)
    }

    const productRes = await fetch(
      `${restBase}/products${rakutenItemId ? '?on_conflict=rakuten_item_id' : ''}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(productPayload),
      }
    )
    if (!productRes.ok) continue

    const productData = (await productRes.json()) as Array<{ id: string }> | { id: string }
    const productId = Array.isArray(productData) ? productData[0]?.id : productData.id
    if (!productId) continue

    await fetch(`${restBase}/article_products`, {
      method: 'POST',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        article_id: articleId,
        product_id: productId,
        rank,
        ai_review: product.ai_review || '',
        ai_features: product.ai_features || '',
        ai_cons: product.ai_cons || '',
        ai_recommended_for: product.ai_recommended_for || '',
        ai_not_recommended_for: product.ai_not_recommended_for || '',
      }),
    })
  }

  await fetch(`${restBase}/draft_articles?source_slug=eq.${encodeURIComponent(draft.slug)}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: '' },
    body: JSON.stringify({
      published_to_supabase: true,
      published_at: new Date().toISOString(),
      published_article_id: articleId,
      error_message: null,
    }),
  })

  return {
    articleId,
    slug: draft.slug,
    productCount: draft.products.length,
    wasRepublished: Boolean(draft.published_to_supabase),
  }
}
