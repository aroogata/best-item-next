'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { DEFAULT_REQUEST_ERROR_MESSAGE, DEFAULT_UNEXPECTED_ERROR_MESSAGE } from '@/lib/admin-ui'

type PublishedRegenerateButtonProps = {
  slug: string
}

export function PublishedRegenerateButton({ slug }: PublishedRegenerateButtonProps) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<'draft' | 'refresh' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function runAction(url: string, action: 'draft' | 'refresh') {
    setBusyAction(action)
    setMessage(null)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, count: 20 }),
      })
      const data = (await res.json().catch(() => ({ error: DEFAULT_REQUEST_ERROR_MESSAGE }))) as {
        error?: string
      }

      if (!res.ok) {
        throw new Error(data.error || DEFAULT_REQUEST_ERROR_MESSAGE)
      }

      setMessage(
        action === 'refresh'
          ? '同じURLの公開記事を最新内容で更新しました。'
          : '再生成と staging 同期が完了しました。内容を確認してから必要なら再公開してください。'
      )
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : DEFAULT_UNEXPECTED_ERROR_MESSAGE)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => runAction('/api/admin/drafts/generate', 'draft')}
          disabled={busyAction !== null}
        >
          {busyAction === 'draft' ? '下書き更新中...' : '下書きだけ更新'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => runAction('/api/admin/articles/refresh', 'refresh')}
          disabled={busyAction !== null}
        >
          {busyAction === 'refresh' ? '更新中...' : '同じURLで更新'}
        </Button>
      </div>
      {message ? <p className="max-w-xs text-right text-xs text-muted-foreground">{message}</p> : null}
    </div>
  )
}
