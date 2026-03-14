import { NextRequest, NextResponse } from 'next/server'

import { normalizeSlug } from '@/lib/linksurge-drafts'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { slug, manualTitle, manualMetaDescription } = (await request.json()) as {
      slug?: string
      manualTitle?: string | null
      manualMetaDescription?: string | null
    }

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const normalizedSlug = normalizeSlug(slug)

    const { data: draft, error: draftError } = await supabase
      .from('draft_articles')
      .select(
        'id, title, meta_description, manual_title, manual_meta_description, published_article_id, published_to_supabase'
      )
      .eq('source_slug', normalizedSlug)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ error: 'ドラフトが見つかりません。' }, { status: 404 })
    }

    const cleanedManualTitle = manualTitle?.trim() || null
    const cleanedManualMetaDescription = manualMetaDescription?.trim() || null
    const originalManualTitle = draft.manual_title ?? null
    const originalManualMetaDescription = draft.manual_meta_description ?? null
    const originalPublishedArticleId = draft.published_article_id ?? null

    const { error: updateDraftError } = await supabase
      .from('draft_articles')
      .update({
        manual_title: cleanedManualTitle,
        manual_meta_description: cleanedManualMetaDescription,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id)

    if (updateDraftError) {
      return NextResponse.json(
        { error: `ドラフトの軽微修正保存に失敗しました: ${updateDraftError.message}` },
        { status: 500 }
      )
    }

    const effectiveTitle = cleanedManualTitle ?? draft.title ?? ''
    const effectiveMetaDescription = cleanedManualMetaDescription ?? draft.meta_description ?? ''

    let publishedArticleId = draft.published_article_id ?? null
    let originalPublishedArticle:
      | { title: string | null; h1: string | null; meta_description: string | null }
      | null = null

    if (!publishedArticleId && draft.published_to_supabase) {
      const { data: articleBySlug, error: articleLookupError } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', normalizedSlug)
        .maybeSingle()

      if (articleLookupError) {
        await supabase
          .from('draft_articles')
          .update({
            manual_title: originalManualTitle,
            manual_meta_description: originalManualMetaDescription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id)

        return NextResponse.json(
          { error: `公開記事の照合に失敗しました: ${articleLookupError.message}` },
          { status: 500 }
        )
      }

      publishedArticleId = articleBySlug?.id ?? null
      if (!publishedArticleId) {
        await supabase
          .from('draft_articles')
          .update({
            manual_title: originalManualTitle,
            manual_meta_description: originalManualMetaDescription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id)

        return NextResponse.json(
          { error: '公開済みドラフトに対応する公開記事が見つかりません。' },
          { status: 409 }
        )
      }

      const { error: backfillDraftError } = await supabase
        .from('draft_articles')
        .update({
          published_article_id: publishedArticleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draft.id)

      if (backfillDraftError) {
        await supabase
          .from('draft_articles')
          .update({
            manual_title: originalManualTitle,
            manual_meta_description: originalManualMetaDescription,
            published_article_id: originalPublishedArticleId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id)

        return NextResponse.json(
          { error: `公開記事IDの補完に失敗しました: ${backfillDraftError.message}` },
          { status: 500 }
        )
      }
    }

    if (publishedArticleId) {
      const { data: articleRow, error: articleReadError } = await supabase
        .from('articles')
        .select('title, h1, meta_description')
        .eq('id', publishedArticleId)
        .single()

      if (articleReadError || !articleRow) {
        await supabase
          .from('draft_articles')
          .update({
            manual_title: originalManualTitle,
            manual_meta_description: originalManualMetaDescription,
            published_article_id: originalPublishedArticleId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id)

        return NextResponse.json(
          { error: `公開記事の読み取りに失敗しました: ${articleReadError?.message ?? 'not found'}` },
          { status: 500 }
        )
      }

      originalPublishedArticle = {
        title: articleRow.title ?? null,
        h1: articleRow.h1 ?? null,
        meta_description: articleRow.meta_description ?? null,
      }

      const { error: updateArticleError } = await supabase
        .from('articles')
        .update({
          title: effectiveTitle,
          h1: effectiveTitle,
          meta_description: effectiveMetaDescription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', publishedArticleId)

      if (updateArticleError) {
        await supabase
          .from('draft_articles')
          .update({
            manual_title: originalManualTitle,
            manual_meta_description: originalManualMetaDescription,
            published_article_id: originalPublishedArticleId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id)

        if (originalPublishedArticle) {
          await supabase
            .from('articles')
            .update({
              title: originalPublishedArticle.title,
              h1: originalPublishedArticle.h1,
              meta_description: originalPublishedArticle.meta_description,
              updated_at: new Date().toISOString(),
            })
            .eq('id', publishedArticleId)
        }

        return NextResponse.json(
          { error: `公開記事の軽微修正反映に失敗しました: ${updateArticleError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      updatedPublishedArticle: Boolean(publishedArticleId),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '軽微修正の保存に失敗しました。' },
      { status: 500 }
    )
  }
}
