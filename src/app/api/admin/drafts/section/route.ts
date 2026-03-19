import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeSlug } from '@/lib/linksurge-drafts'

function buildContentMarkdown(sections: Record<string, string>): string | null {
  const sectionKeys = Object.keys(sections)
    .filter((k) => /^section_\d+$/.test(k))
    .sort((a, b) => Number(a.replace('section_', '')) - Number(b.replace('section_', '')))
  if (sectionKeys.length === 0) return null
  const parts = sectionKeys.map((k) => (sections[k] || '').trim()).filter(Boolean)
  const productIntro = (sections['product_intro'] || '').trim()
  if (productIntro) parts.push(productIntro)
  return parts.length > 0 ? parts.join('\n\n') : null
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string; sectionKey?: string; content?: string }
    const { slug, sectionKey, content } = body

    if (!slug || !sectionKey || content === undefined) {
      return NextResponse.json({ error: 'slug, sectionKey, content が必要です' }, { status: 400 })
    }

    const normalizedSlug = normalizeSlug(slug)
    const supabase = await createServiceClient()

    // 現在の payload_json を取得
    const { data: draft, error: fetchError } = await supabase
      .from('draft_articles')
      .select('id, payload_json')
      .eq('source_slug', normalizedSlug)
      .single()

    if (fetchError || !draft) {
      return NextResponse.json({ error: 'ドラフトが見つかりません' }, { status: 404 })
    }

    const payloadJson = (draft.payload_json as Record<string, unknown>) || {}
    const sections = ((payloadJson.sections as Record<string, string>) || {})
    const updatedSections = { ...sections, [sectionKey]: content }

    // section_1〜5 or product_intro が変更された場合は content_markdown を再構築
    if (/^section_\d+$/.test(sectionKey) || sectionKey === 'product_intro') {
      const newContentMarkdown = buildContentMarkdown(updatedSections)
      if (newContentMarkdown) {
        updatedSections['content_markdown'] = newContentMarkdown
      }
    }

    const updatedPayload = { ...payloadJson, sections: updatedSections }

    // draft_articles を更新
    const { error: updateError } = await supabase
      .from('draft_articles')
      .update({ payload_json: updatedPayload })
      .eq('id', draft.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // draft_article_sections を更新（該当セクションを upsert）
    await supabase
      .from('draft_article_sections')
      .delete()
      .eq('draft_article_id', draft.id)
      .eq('section_type', sectionKey)

    const SORT_ORDERS: Record<string, number> = {
      intro: 0, criteria: 1, content_markdown: 5,
      faq: 20, conclusion: 21, references: 22, related_links: 30,
    }
    const sortOrder = SORT_ORDERS[sectionKey] ?? 10

    await supabase.from('draft_article_sections').insert({
      draft_article_id: draft.id,
      section_type: sectionKey,
      sort_order: sortOrder,
      content,
    })

    // content_markdown も再構築した場合は sections テーブルも更新
    if (updatedSections['content_markdown'] && (/^section_\d+$/.test(sectionKey) || sectionKey === 'product_intro')) {
      await supabase
        .from('draft_article_sections')
        .delete()
        .eq('draft_article_id', draft.id)
        .eq('section_type', 'content_markdown')

      await supabase.from('draft_article_sections').insert({
        draft_article_id: draft.id,
        section_type: 'content_markdown',
        sort_order: 5,
        content: updatedSections['content_markdown'],
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新に失敗しました' },
      { status: 500 }
    )
  }
}
