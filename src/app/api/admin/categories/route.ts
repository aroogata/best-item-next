import { NextRequest, NextResponse } from 'next/server'

import { normalizeCategorySlug } from '@/lib/article-categories'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { id } = (await request.json()) as { id?: string }
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 記事が紐づいていないか確認
    const { count: articleCount } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
    if ((articleCount ?? 0) > 0) {
      return NextResponse.json({ error: 'このカテゴリには記事が紐づいているため削除できません。' }, { status: 409 })
    }

    // 子カテゴリが存在しないか確認
    const { count: childCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_category_id', id)
    if ((childCount ?? 0) > 0) {
      return NextResponse.json({ error: 'このカテゴリには子カテゴリが存在するため削除できません。' }, { status: 409 })
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: `削除に失敗しました: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '削除に失敗しました。' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug, description, sortOrder, parentCategoryId } = (await request.json()) as {
      name?: string
      slug?: string
      description?: string
      sortOrder?: number
      parentCategoryId?: string | null
    }

    const trimmedName = name?.trim()
    const normalizedSlug = normalizeCategorySlug(slug || '')

    if (!trimmedName) {
      return NextResponse.json({ error: 'カテゴリ名を入力してください。' }, { status: 400 })
    }
    if (!normalizedSlug) {
      return NextResponse.json({ error: 'カテゴリ slug は半角英数字とハイフンで入力してください。' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    if (
      parentCategoryId !== undefined &&
      parentCategoryId !== null &&
      typeof parentCategoryId !== 'string'
    ) {
      return NextResponse.json({ error: '親カテゴリIDの形式が不正です。' }, { status: 400 })
    }

    const normalizedParentCategoryId =
      typeof parentCategoryId === 'string' ? parentCategoryId.trim() || null : null

    if (normalizedParentCategoryId) {
      const { data: parentCategory, error: parentCategoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', normalizedParentCategoryId)
        .single()

      if (parentCategoryError || !parentCategory) {
        return NextResponse.json({ error: '親カテゴリが見つかりません。' }, { status: 404 })
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: trimmedName,
        slug: normalizedSlug,
        description: description?.trim() || null,
        sort_order: Number.isFinite(sortOrder) ? Number(sortOrder) : 0,
        parent_category_id: normalizedParentCategoryId,
      })
      .select('id, slug, name, parent_category_id, description, sort_order')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '同じ slug のカテゴリがすでに存在します。' }, { status: 409 })
      }
      return NextResponse.json({ error: `カテゴリ作成に失敗しました: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ category: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'カテゴリ作成に失敗しました。' },
      { status: 500 }
    )
  }
}
