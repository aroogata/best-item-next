import { NextRequest, NextResponse } from 'next/server'

import { reselectDraftProductsInCrawler, syncDraftToStaging } from '@/lib/crawler-admin'

export async function POST(request: NextRequest) {
  try {
    const { slug, count } = (await request.json()) as { slug?: string; count?: number }
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const reselection = await reselectDraftProductsInCrawler(slug, count || 20)
    const syncResult = await syncDraftToStaging(slug)

    return NextResponse.json({ ok: true, reselection, sync: syncResult })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
