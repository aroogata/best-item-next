import { NextRequest, NextResponse } from 'next/server'

import { normalizeCategorySlug } from '@/lib/article-categories'
import { createServiceClient } from '@/lib/supabase/server'

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
