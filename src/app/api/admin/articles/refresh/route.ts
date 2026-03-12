import { NextRequest, NextResponse } from 'next/server'

import { publishDraftBySlug } from '@/lib/admin-publish'
import { generateDraftInCrawler, syncDraftToStaging } from '@/lib/crawler-admin'

export async function POST(request: NextRequest) {
  try {
    const { slug, count } = (await request.json()) as { slug?: string; count?: number }
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const generation = await generateDraftInCrawler(slug, count || 20)
    const sync = await syncDraftToStaging(slug)
    const publish = await publishDraftBySlug(slug)

    return NextResponse.json({
      ok: true,
      generation,
      sync,
      publish,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error'
    const status = message.includes('draft is missing required assets') || message.includes('draft is not ready')
      ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
