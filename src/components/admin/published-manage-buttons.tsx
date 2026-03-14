'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { DEFAULT_REQUEST_ERROR_MESSAGE, DEFAULT_UNEXPECTED_ERROR_MESSAGE } from '@/lib/admin-ui'

type PublishedManageButtonsProps = {
  slug: string
}

export function PublishedManageButtons({ slug }: PublishedManageButtonsProps) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<'unpublish' | 'delete' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function runAction(action: 'unpublish' | 'delete') {
    const confirmed = window.confirm(
      action === 'delete'
        ? '公開記事を削除します。公開状態は解除され、記事本体も削除されます。続行しますか？'
        : '公開記事を非公開にします。続行しますか？'
    )

    if (!confirmed) return

    setBusyAction(action)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/articles/publish-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, action }),
      })
      const data = (await res.json().catch(() => ({ error: DEFAULT_REQUEST_ERROR_MESSAGE }))) as {
        error?: string
      }

      if (!res.ok) {
        throw new Error(data.error || DEFAULT_REQUEST_ERROR_MESSAGE)
      }

      setMessage(action === 'delete' ? '公開記事を削除しました。' : '公開記事を非公開にしました。')
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
          onClick={() => runAction('unpublish')}
          disabled={busyAction !== null}
        >
          {busyAction === 'unpublish' ? '非公開化中...' : '非公開にする'}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => runAction('delete')}
          disabled={busyAction !== null}
        >
          {busyAction === 'delete' ? '削除中...' : '削除する'}
        </Button>
      </div>
      {message ? (
        <p role="status" aria-live="polite" className="max-w-xs text-right text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  )
}
