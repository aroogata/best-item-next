'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DEFAULT_REQUEST_ERROR_MESSAGE,
  DEFAULT_UNEXPECTED_ERROR_MESSAGE,
} from '@/lib/admin-ui'
import { buildCategoryLabel, type AdminCategoryOption } from '@/lib/article-categories'

type CategoryManagerProps = {
  slug: string
  categories: AdminCategoryOption[]
  currentCategoryId: string | null
  currentCategoryName: string | null
  suggestedCategoryName: string
  isPublished: boolean
}

export function CategoryManager({
  slug,
  categories: initialCategories,
  currentCategoryId,
  currentCategoryName,
  suggestedCategoryName,
  isPublished,
}: CategoryManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(currentCategoryId ?? '')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')
  const [newParentCategoryId, setNewParentCategoryId] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'save' | 'create' | null>(null)

  async function updateCategory(categoryId: string, successMessage: string) {
    const response = await fetch('/api/admin/articles/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, categoryId }),
    })
    const data = (await response.json().catch(() => ({ error: DEFAULT_REQUEST_ERROR_MESSAGE }))) as {
      error?: string
      category?: AdminCategoryOption
      updatedPublishedArticle?: boolean
    }

    if (!response.ok) {
      throw new Error(data.error || DEFAULT_REQUEST_ERROR_MESSAGE)
    }

    setSelectedCategoryId(categoryId)
    setMessage(
      data.updatedPublishedArticle
        ? `${successMessage} 公開済み記事にも反映しました。`
        : successMessage
    )
    router.refresh()
  }

  async function handleSaveCategory() {
    if (!selectedCategoryId) {
      setMessage('カテゴリを選択してください。')
      return
    }

    setBusyAction('save')
    setMessage(null)

    try {
      await updateCategory(selectedCategoryId, 'カテゴリを更新しました。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : DEFAULT_UNEXPECTED_ERROR_MESSAGE)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim() || !newCategorySlug.trim()) {
      setMessage('新規カテゴリ名と slug を入力してください。')
      return
    }

    setBusyAction('create')
    setMessage(null)

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          slug: newCategorySlug,
          parentCategoryId: newParentCategoryId || null,
        }),
      })
      const data = (await response.json().catch(() => ({ error: DEFAULT_REQUEST_ERROR_MESSAGE }))) as {
        error?: string
        category?: AdminCategoryOption
      }

      if (!response.ok || !data.category) {
        throw new Error(data.error || DEFAULT_REQUEST_ERROR_MESSAGE)
      }

      setCategories((current) => [...current, data.category!].sort((a, b) => a.name.localeCompare(b.name, 'ja')))
      setNewCategoryName('')
      setNewCategorySlug('')
      setNewParentCategoryId('')
      await updateCategory(data.category.id, `カテゴリ「${data.category.name}」を作成して設定しました。`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : DEFAULT_UNEXPECTED_ERROR_MESSAGE)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">カテゴリ管理</h2>
        <p className="text-sm text-muted-foreground">
          現在のカテゴリ: {currentCategoryName || '未設定'}
        </p>
        <p className="text-sm text-muted-foreground">
          自動判定候補: {suggestedCategoryName}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPublished
            ? 'ここで変更すると、ドラフト設定と公開済み記事の両方に反映します。'
            : 'ここで設定したカテゴリは、公開時に自動判定より優先されます。'}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="category-select">
          既存カテゴリを選択
        </label>
        <select
          id="category-select"
          value={selectedCategoryId}
          onChange={(event) => setSelectedCategoryId(event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">カテゴリを選択してください</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {buildCategoryLabel(category, categories)} ({category.slug})
            </option>
          ))}
        </select>
        <Button type="button" onClick={handleSaveCategory} disabled={busyAction !== null}>
          {busyAction === 'save' ? '更新中...' : 'カテゴリを更新'}
        </Button>
      </div>

      <div className="space-y-2 border-t pt-4">
        <p className="text-sm font-medium">新規カテゴリを作成</p>
        <input
          type="text"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="カテゴリ名（例: ボディケア）"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        />
        <input
          type="text"
          value={newCategorySlug}
          onChange={(event) => setNewCategorySlug(event.target.value)}
          placeholder="slug（例: bodycare）"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        />
        <select
          value={newParentCategoryId}
          onChange={(event) => setNewParentCategoryId(event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">親カテゴリなし</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {buildCategoryLabel(category, categories)}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={handleCreateCategory} disabled={busyAction !== null}>
          {busyAction === 'create' ? '作成中...' : '新規カテゴリを作成して設定'}
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}
