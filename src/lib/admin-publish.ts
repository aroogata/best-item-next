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

async function assertOk(response: Response, context: string) {
  if (response.ok) {
    return response
  }

  const body = await response.text().catch(() => '')
  throw new Error(`${context}: ${response.status} ${body || response.statusText}`)
}

async function resolveCategoryId(
  restBase: string,
  headers: ReturnType<typeof createHeaders>,
  slugValue: string,
  categoryName: string
) {
  const categoryQuery = `${restBase}/categories?slug=eq.${encodeURIComponent(slugValue)}&select=id`
  const categoryGet = await assertOk(
    await fetch(categoryQuery, {
      headers,
      cache: 'no-store',
    }),
    'failed to lookup category'
  )
  const existingCategories = (await categoryGet.json()) as Array<{ id: string }>
  const existingId = existingCategories[0]?.id
  if (existingId) {
    return existingId
  }

  const categoryRes = await fetch(`${restBase}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ slug: slugValue, name: categoryName }),
  })

  if (!categoryRes.ok) {
    if (categoryRes.status !== 409) {
      await assertOk(categoryRes, 'failed to create category')
    }

    const retryGet = await assertOk(
      await fetch(categoryQuery, {
        headers,
        cache: 'no-store',
      }),
      'failed to lookup category after create conflict'
    )
    const retriedCategories = (await retryGet.json()) as Array<{ id: string }>
    const retriedId = retriedCategories[0]?.id
    if (retriedId) {
      return retriedId
    }
    throw new Error('failed to resolve category after create conflict')
  }

  const categoryData = (await categoryRes.json()) as Array<{ id: string }> | { id: string }
  return Array.isArray(categoryData) ? categoryData[0]?.id ?? null : categoryData.id
}

async function resolveExistingProductId(
  restBase: string,
  headers: ReturnType<typeof createHeaders>,
  product: DraftArticle['products'][number]
) {
  if (product.affiliate_url) {
    const affiliateQuery = `${restBase}/products?affiliate_url=eq.${encodeURIComponent(product.affiliate_url)}&select=id&limit=1`
    const affiliateRes = await assertOk(
      await fetch(affiliateQuery, {
        headers,
        cache: 'no-store',
      }),
      `failed to lookup product by affiliate_url for ${product.name}`
    )
    const affiliateMatches = (await affiliateRes.json()) as Array<{ id: string }>
    if (affiliateMatches[0]?.id) {
      return affiliateMatches[0].id
    }
  }

  const fallbackQuery = new URLSearchParams({
    name: `eq.${product.name}`,
    image_url: `eq.${product.image_url ?? ''}`,
    shop_name: `eq.${product.shop_name ?? ''}`,
    select: 'id',
    limit: '1',
  })
  const fallbackRes = await assertOk(
    await fetch(`${restBase}/products?${fallbackQuery.toString()}`, {
      headers,
      cache: 'no-store',
    }),
    `failed to lookup fallback product for ${product.name}`
  )
  const fallbackMatches = (await fallbackRes.json()) as Array<{ id: string }>
  return fallbackMatches[0]?.id ?? null
}

async function upsertProduct(
  restBase: string,
  headers: ReturnType<typeof createHeaders>,
  product: DraftArticle['products'][number]
) {
  const productPayload: Record<string, unknown> = {
    name: product.name,
    price: product.price,
    affiliate_url: product.affiliate_url,
    image_url: product.image_url,
    images_json: product.images_json ?? null,
    review_count: product.review_count || 0,
    review_average: product.review_average || 0,
    shop_name: product.shop_name || '',
    description: (product.description || '').slice(0, 500),
  }
  const rakutenItemId = product.rakuten_item_id || product.item_code
  if (rakutenItemId) {
    productPayload.rakuten_item_id = String(rakutenItemId)
    const productRes = await assertOk(
      await fetch(`${restBase}/products?on_conflict=rakuten_item_id`, {
        method: 'POST',
        headers,
        body: JSON.stringify(productPayload),
      }),
      `failed to upsert product ${product.name}`
    )
    const productData = (await productRes.json()) as Array<{ id: string }> | { id: string }
    return Array.isArray(productData) ? productData[0]?.id ?? null : productData.id
  }

  const existingProductId = await resolveExistingProductId(restBase, headers, product)
  if (existingProductId) {
    const productRes = await assertOk(
      await fetch(`${restBase}/products?id=eq.${existingProductId}&select=id`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(productPayload),
      }),
      `failed to update existing product ${product.name}`
    )
    const productData = (await productRes.json()) as Array<{ id: string }> | { id: string }
    return Array.isArray(productData) ? productData[0]?.id ?? null : productData.id
  }

  const productRes = await assertOk(
    await fetch(`${restBase}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productPayload),
    }),
    `failed to create product ${product.name}`
  )
  const productData = (await productRes.json()) as Array<{ id: string }> | { id: string }
  return Array.isArray(productData) ? productData[0]?.id ?? null : productData.id
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
    categoryId = await resolveCategoryId(restBase, headers, slugValue, categoryName)
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

  const articleRes = await assertOk(
    await fetch(`${restBase}/articles?on_conflict=slug`, {
      method: 'POST',
      headers,
      body: JSON.stringify(articlePayload),
    }),
    'failed to upsert article'
  )
  const articleData = (await articleRes.json()) as Array<{ id: string }> | { id: string }
  const articleId = Array.isArray(articleData) ? articleData[0]?.id : articleData.id
  if (!articleId) {
    throw new Error('failed to resolve published article id')
  }

  await assertOk(
    await fetch(`${restBase}/article_sections?article_id=eq.${articleId}`, {
      method: 'DELETE',
      headers: { ...headers, Prefer: '' },
    }),
    'failed to delete article sections'
  )

  const sectionOrder: Array<[keyof DraftArticle['sections'], number]> = [
    ['intro', 0],
    ['criteria', 1],
    // コンテンツ記事（解説記事）用汎用フォーマット: 全本文を1フィールドにまとめたもの
    ['content_markdown', 5],
    ['faq', 20],
    ['conclusion', 21],
    ['references', 22],
  ]

  for (const [sectionKey, sortOrder] of sectionOrder) {
    const content = draft.sections?.[sectionKey]
    if (!content) continue
    await assertOk(
      await fetch(`${restBase}/article_sections`, {
        method: 'POST',
        headers: { ...headers, Prefer: '' },
        body: JSON.stringify({
          article_id: articleId,
          section_type: sectionKey,
          sort_order: sortOrder,
          content,
        }),
      }),
      `failed to insert section ${sectionKey}`
    )
  }

  await assertOk(
    await fetch(`${restBase}/article_products?article_id=eq.${articleId}`, {
      method: 'DELETE',
      headers: { ...headers, Prefer: '' },
    }),
    'failed to delete article products'
  )

  for (const [index, product] of draft.products.entries()) {
    const rank = product.rank || index + 1
    const productId = await upsertProduct(restBase, headers, product)
    if (!productId) {
      throw new Error(`failed to resolve product id for ${product.name}`)
    }

    await assertOk(
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
      }),
      `failed to link product ${product.name}`
    )
  }

  await assertOk(
    await fetch(`${restBase}/draft_articles?source_slug=eq.${encodeURIComponent(draft.slug)}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: '' },
      body: JSON.stringify({
        published_to_supabase: true,
        published_at: new Date().toISOString(),
        published_article_id: articleId,
        error_message: null,
      }),
    }),
    'failed to update draft publish state'
  )

  return {
    articleId,
    slug: draft.slug,
    productCount: draft.products.length,
    wasRepublished: Boolean(draft.published_to_supabase),
  }
}
