import { NextRequest, NextResponse } from 'next/server'

import { publishDraftBySlug } from '@/lib/admin-publish'

export async function POST(request: NextRequest) {
  try {
    const { slug } = (await request.json()) as { slug?: string }
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const result = await publishDraftBySlug(slug)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error'
    const status = message.includes('draft is not ready') || message.includes('draft is missing required assets')
      ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
