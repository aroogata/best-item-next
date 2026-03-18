import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeSlug } from '@/lib/linksurge-drafts'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string; links?: Array<{ text: string; url: string }> }
    const { slug, links } = body

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }
    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'links must be an array' }, { status: 400 })
    }

    // バリデーション: text と url の両方が必要
    const validLinks = links
      .map((l) => ({ text: String(l.text ?? '').trim(), url: String(l.url ?? '').trim() }))
      .filter((l) => l.text && l.url)

    const normalizedSlug = normalizeSlug(slug)
    const supabase = await createServiceClient()

    const { error } = await supabase
      .from('draft_articles')
      .update({ related_links_json: validLinks })
      .eq('source_slug', normalizedSlug)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: validLinks.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
