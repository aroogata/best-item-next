'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DEFAULT_REQUEST_ERROR_MESSAGE,
  DEFAULT_UNEXPECTED_ERROR_MESSAGE,
} from '@/lib/admin-ui'

type DraftContentEditorProps = {
  slug: string
  currentTitle: string
  baseTitle: string
  currentMetaDescription: string
  baseMetaDescription: string
  isPublished: boolean
}

export function DraftContentEditor({
  slug,
  currentTitle,
  baseTitle,
  currentMetaDescription,
  baseMetaDescription,
  isPublished,
}: DraftContentEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(currentTitle)
  const [metaDescription, setMetaDescription] = useState(currentMetaDescription)
  const [savedBaseTitle, setSavedBaseTitle] = useState(baseTitle)
  const [savedBaseMetaDescription, setSavedBaseMetaDescription] = useState(baseMetaDescription)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const normalizedBaseTitle = savedBaseTitle.trim()
  const normalizedBaseMetaDescription = savedBaseMetaDescription.trim()

  async function handleSave() {
    setBusy(true)
    setMessage(null)

    try {
      const normalizedTitle = title.trim()
      const normalizedMetaDescription = metaDescription.trim()

      const response = await fetch('/api/admin/articles/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          manualTitle:
            normalizedTitle && normalizedTitle !== normalizedBaseTitle
              ? normalizedTitle
              : null,
          manualMetaDescription:
            normalizedMetaDescription && normalizedMetaDescription !== normalizedBaseMetaDescription
              ? normalizedMetaDescription
              : null,
        }),
      })
      const data = (await response.json().catch(() => ({ error: DEFAULT_REQUEST_ERROR_MESSAGE }))) as {
        error?: string
        updatedPublishedArticle?: boolean
      }

      if (!response.ok) {
        throw new Error(data.error || DEFAULT_REQUEST_ERROR_MESSAGE)
      }

      setMessage(
        data.updatedPublishedArticle
          ? '軽微修正を保存し、公開済み記事にも反映しました。'
          : '軽微修正を保存しました。'
      )
      setTitle(normalizedTitle)
      setMetaDescription(normalizedMetaDescription)
      setSavedBaseTitle(normalizedTitle || baseTitle)
      setSavedBaseMetaDescription(normalizedMetaDescription || baseMetaDescription)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : DEFAULT_UNEXPECTED_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  function resetToGenerated() {
    setTitle(savedBaseTitle)
    setMetaDescription(savedBaseMetaDescription)
    setMessage('生成済みの内容に戻しました。保存すると上書きが解除されます。')
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">軽微修正</h2>
        <p className="text-sm text-muted-foreground">
          タイトルや説明文のちょっとした修正をここで保存できます。
        </p>
        <p className="text-xs text-muted-foreground">
          {isPublished
            ? '保存するとドラフトの上書き設定と公開済み記事の両方に反映します。'
            : '保存した内容はドラフトに保持され、公開時に優先されます。'}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="draft-title" className="text-sm font-medium">
          タイトル
        </label>
        <input
          id="draft-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="draft-meta-description" className="text-sm font-medium">
          メタディスクリプション
        </label>
        <textarea
          id="draft-meta-description"
          value={metaDescription}
          onChange={(event) => setMetaDescription(event.target.value)}
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleSave} disabled={busy}>
          {busy ? '保存中...' : '軽微修正を保存'}
        </Button>
        <Button type="button" variant="secondary" onClick={resetToGenerated} disabled={busy}>
          生成済みの内容に戻す
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}
