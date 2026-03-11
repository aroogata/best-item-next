function getCrawlerBaseUrl() {
  const baseUrl = process.env.LINKSURGE_CRAWLER_API_BASE_URL?.trim()
  if (!baseUrl) {
    throw new Error('LINKSURGE_CRAWLER_API_BASE_URL is not set')
  }
  return baseUrl.replace(/\/$/, '')
}

function normalizeSlug(slug: string) {
  const trimmed = slug.trim()
  if (!trimmed) {
    throw new Error('slug is required')
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

async function readSseResult(response: Response) {
  if (!response.ok) {
    throw new Error(`Crawler request failed: ${response.status}`)
  }
  if (!response.body) {
    throw new Error('Crawler response body is missing')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let lastPayload: Record<string, unknown> = {}

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''

    for (const chunk of chunks) {
      const dataLines = chunk
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())

      for (const line of dataLines) {
        if (!line) continue
        const payload = JSON.parse(line) as Record<string, unknown>
        lastPayload = payload
        if (payload.error) {
          throw new Error(String(payload.error))
        }
      }
    }
  }

  return lastPayload
}

export async function generateDraftInCrawler(slug: string, count: number) {
  const normalizedSlug = normalizeSlug(slug)
  const baseUrl = getCrawlerBaseUrl()
  const targetCount = Math.min(Math.max(count, 5), 30)

  const response = await fetch(
    `${baseUrl}/api/article-draft-generate?slug=${encodeURIComponent(normalizedSlug)}&count=${targetCount}`,
    { cache: 'no-store' }
  )

  return readSseResult(response)
}

export async function reselectDraftProductsInCrawler(slug: string, count: number) {
  const normalizedSlug = normalizeSlug(slug)
  const baseUrl = getCrawlerBaseUrl()
  const targetCount = Math.min(Math.max(count, 5), 30)

  const response = await fetch(
    `${baseUrl}/api/article-reselect-products?slug=${encodeURIComponent(normalizedSlug)}&count=${targetCount}`,
    { cache: 'no-store' }
  )

  return readSseResult(response)
}

export async function syncDraftToStaging(slug: string) {
  const normalizedSlug = normalizeSlug(slug)
  const baseUrl = getCrawlerBaseUrl()
  const pathSlug = normalizedSlug.replace(/^\//, '').replace(/\/$/, '')

  const response = await fetch(`${baseUrl}/api/drafts/${pathSlug}/sync-staging`, {
    method: 'POST',
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Sync request failed: ${response.status}`)
  }

  return response.json()
}
