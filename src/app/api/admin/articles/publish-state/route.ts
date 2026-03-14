import { NextRequest, NextResponse } from 'next/server'

import { normalizeSlug } from '@/lib/linksurge-drafts'
import { createServiceClient } from '@/lib/supabase/server'

type ArticleSectionRow = {
  id: string
  article_id: string
  section_type: string
  sort_order: number
  content: string | null
  created_at: string
}

type ArticleProductRow = {
  id: string
  article_id: string
  product_id: string | null
  rank: number
  ai_review: string | null
  ai_features: string | null
  ai_recommended_for: string | null
  created_at: string
}

async function restoreDeletedArticleData(params: {
  supabase: Awaited<ReturnType<typeof createServiceClient>>
  articleRow: Record<string, unknown>
  articleSections: ArticleSectionRow[]
  articleProducts: ArticleProductRow[]
}) {
  const { supabase, articleRow, articleSections, articleProducts } = params

  const rollbackErrors: string[] = []

  const { error: articleInsertError } = await supabase.from('articles').insert(articleRow)
  if (articleInsertError) {
    rollbackErrors.push(`articles: ${articleInsertError.message}`)
    return rollbackErrors
  }

  if (articleSections.length > 0) {
    const { error: sectionInsertError } = await supabase
      .from('article_sections')
      .insert(articleSections)

    if (sectionInsertError) {
      rollbackErrors.push(`article_sections: ${sectionInsertError.message}`)
      const { error: cleanupError } = await supabase
        .from('articles')
        .delete()
        .eq('id', String(articleRow.id))
      if (cleanupError) {
        rollbackErrors.push(`cleanup: ${cleanupError.message}`)
      }
      return rollbackErrors
    }
  }

  if (articleProducts.length > 0) {
    const { error: productInsertError } = await supabase
      .from('article_products')
      .insert(articleProducts)

    if (productInsertError) {
      rollbackErrors.push(`article_products: ${productInsertError.message}`)
      const { error: cleanupError } = await supabase
        .from('articles')
        .delete()
        .eq('id', String(articleRow.id))
      if (cleanupError) {
        rollbackErrors.push(`cleanup: ${cleanupError.message}`)
      }
      return rollbackErrors
    }
  }

  return rollbackErrors
}

export async function POST(request: NextRequest) {
  try {
    const { slug, action } = (await request.json()) as {
      slug?: string
      action?: 'unpublish' | 'delete'
    }

    if (!slug?.trim()) {
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

    if (draftError) {
      return NextResponse.json(
        { error: `ドラフトの読み取りに失敗しました: ${draftError.message}` },
        { status: 500 }
      )
    }

    if (!draft) {
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

    const { data: articleRow, error: articleReadError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (articleReadError || !articleRow) {
      return NextResponse.json(
        { error: `公開記事の読み取りに失敗しました: ${articleReadError?.message ?? 'not found'}` },
        { status: 500 }
      )
    }

    let articleSections: ArticleSectionRow[] = []
    let articleProducts: ArticleProductRow[] = []

    if (action === 'delete') {
      const [{ data: sectionRows, error: sectionReadError }, { data: productRows, error: productReadError }] =
        await Promise.all([
          supabase.from('article_sections').select('*').eq('article_id', articleId),
          supabase.from('article_products').select('*').eq('article_id', articleId),
        ])

      if (sectionReadError) {
        return NextResponse.json(
          { error: `公開記事セクションの読み取りに失敗しました: ${sectionReadError.message}` },
          { status: 500 }
        )
      }

      if (productReadError) {
        return NextResponse.json(
          { error: `公開記事商品の読み取りに失敗しました: ${productReadError.message}` },
          { status: 500 }
        )
      }

      articleSections = (sectionRows ?? []) as ArticleSectionRow[]
      articleProducts = (productRows ?? []) as ArticleProductRow[]
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
      let rollbackErrorMessage: string | null = null

      if (action === 'delete') {
        const rollbackErrors = await restoreDeletedArticleData({
          supabase,
          articleRow,
          articleSections,
          articleProducts,
        })
        rollbackErrorMessage = rollbackErrors.length > 0 ? rollbackErrors.join(' / ') : null
      } else {
        const { error: rollbackUpdateError } = await supabase
          .from('articles')
          .update({
            status: articleRow.status,
            published_at: articleRow.published_at,
            updated_at: articleRow.updated_at,
          })
          .eq('id', articleId)
        rollbackErrorMessage = rollbackUpdateError?.message ?? null
      }

      return NextResponse.json(
        {
          error: rollbackErrorMessage
            ? `ドラフト公開状態の更新に失敗しました: ${updateDraftError.message} / ロールバックにも失敗しました: ${rollbackErrorMessage}`
            : `ドラフト公開状態の更新に失敗しました: ${updateDraftError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '公開状態の更新に失敗しました。' },
      { status: 500 }
    )
  }
}
