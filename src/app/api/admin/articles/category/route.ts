import { NextRequest, NextResponse } from 'next/server'

import { normalizeSlug } from '@/lib/linksurge-drafts'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { slug, categoryId } = (await request.json()) as {
      slug?: string
      categoryId?: string
    }

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const normalizedSlug = normalizeSlug(slug)

    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, slug, name')
      .eq('id', categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: 'カテゴリが見つかりません。' }, { status: 404 })
    }

    const { data: draft, error: draftError } = await supabase
      .from('draft_articles')
      .select('id, published_article_id, published_to_supabase')
      .eq('source_slug', normalizedSlug)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ error: 'ドラフトが見つかりません。' }, { status: 404 })
    }

    const { error: updateDraftError } = await supabase
      .from('draft_articles')
      .update({ manual_category_id: category.id, updated_at: new Date().toISOString() })
      .eq('id', draft.id)

    if (updateDraftError) {
      return NextResponse.json({ error: `ドラフトカテゴリ更新に失敗しました: ${updateDraftError.message}` }, { status: 500 })
    }

    let publishedArticleId = draft.published_article_id
    if (!publishedArticleId && draft.published_to_supabase) {
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

      publishedArticleId = articleBySlug?.id ?? null
      if (publishedArticleId) {
        const { error: backfillDraftError } = await supabase
          .from('draft_articles')
          .update({
            published_article_id: publishedArticleId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id)

        if (backfillDraftError) {
          return NextResponse.json(
            { error: `公開記事IDの補完に失敗しました: ${backfillDraftError.message}` },
            { status: 500 }
          )
        }
      }
    }

    if (publishedArticleId) {
      const { error: updateArticleError } = await supabase
        .from('articles')
        .update({ category_id: category.id, updated_at: new Date().toISOString() })
        .eq('id', publishedArticleId)

      if (updateArticleError) {
        return NextResponse.json({ error: `公開記事カテゴリ更新に失敗しました: ${updateArticleError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      category,
      updatedPublishedArticle: Boolean(publishedArticleId),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'カテゴリ更新に失敗しました。' },
      { status: 500 }
    )
  }
}
