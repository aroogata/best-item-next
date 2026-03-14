import { NextRequest, NextResponse } from 'next/server'

import { normalizeSlug } from '@/lib/linksurge-drafts'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { slug, action } = (await request.json()) as {
      slug?: string
      action?: 'unpublish' | 'delete'
    }

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }
    if (action !== 'unpublish' && action !== 'delete') {
      return NextResponse.json({ error: 'action is invalid' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const normalizedSlug = normalizeSlug(slug)

    const { data: draft, error: draftError } = await supabase
      .from('draft_articles')
      .select('id, published_article_id, published_to_supabase')
      .eq('source_slug', normalizedSlug)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ error: 'ドラフトが見つかりません。' }, { status: 404 })
    }

    let articleId = draft.published_article_id ?? null
    if (!articleId && draft.published_to_supabase) {
      const { data: articleBySlug, error: articleLookupError } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', normalizedSlug)
        .maybeSingle()

      if (articleLookupError) {
        return NextResponse.json(
          { error: `公開記事の照合に失敗しました: ${articleLookupError.message}` },
          { status: 500 }
        )
      }
      articleId = articleBySlug?.id ?? null
    }

    if (!articleId) {
      return NextResponse.json({ error: '対応する公開記事が見つかりません。' }, { status: 404 })
    }

    if (action === 'delete') {
      const { error: deleteArticleError } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (deleteArticleError) {
        return NextResponse.json({ error: `公開記事の削除に失敗しました: ${deleteArticleError.message}` }, { status: 500 })
      }
    } else {
      const { error: updateArticleError } = await supabase
        .from('articles')
        .update({
          status: 'draft',
          published_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)

      if (updateArticleError) {
        return NextResponse.json({ error: `公開記事の非公開化に失敗しました: ${updateArticleError.message}` }, { status: 500 })
      }
    }

    const { error: updateDraftError } = await supabase
      .from('draft_articles')
      .update({
        published_to_supabase: false,
        published_article_id: null,
        published_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id)

    if (updateDraftError) {
      return NextResponse.json({ error: `ドラフト公開状態の更新に失敗しました: ${updateDraftError.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '公開状態の更新に失敗しました。' },
      { status: 500 }
    )
  }
}
