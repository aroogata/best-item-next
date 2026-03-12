'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { DEFAULT_REQUEST_ERROR_MESSAGE, DEFAULT_UNEXPECTED_ERROR_MESSAGE } from '@/lib/admin-ui'

type DraftActionsProps = {
  slug: string
  canPublish: boolean
  isPublished: boolean
}

export function DraftActions({ slug, canPublish, isPublished }: DraftActionsProps) {
  const router = useRouter()
  const [count, setCount] = useState('20')
  const [message, setMessage] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'generate' | 'reselect' | 'publish' | null>(null)

  async function runAction(url: string, action: 'generate' | 'reselect' | 'publish') {
    setBusyAction(action)
    setMessage(null)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, count: Number(count) }),
      })
      const data = (await res.json().catch(() => ({ error: DEFAULT_REQUEST_ERROR_MESSAGE }))) as {
        error?: string
      }

      if (!res.ok) {
        throw new Error(data.error || DEFAULT_REQUEST_ERROR_MESSAGE)
      }

      setMessage(
        action === 'generate'
          ? '最新ドラフトの生成と staging 同期が完了しました。'
          : action === 'reselect'
            ? '商品再選定と staging 同期が完了しました。'
            : isPublished
              ? '同じURLの公開記事を最新内容で更新しました。'
              : '公開が完了しました。'
      )
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : DEFAULT_UNEXPECTED_ERROR_MESSAGE)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={count}
          onChange={(event) => setCount(event.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="10">商品数 10件</option>
          <option value="15">商品数 15件</option>
          <option value="20">商品数 20件</option>
          <option value="25">商品数 25件</option>
          <option value="30">商品数 30件</option>
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={() => runAction('/api/admin/drafts/generate', 'generate')}
          disabled={busyAction !== null}
        >
          {busyAction === 'generate' ? '生成中...' : 'crawler で生成'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => runAction('/api/admin/drafts/reselect-products', 'reselect')}
          disabled={busyAction !== null}
        >
          {busyAction === 'reselect' ? '再選定中...' : '商品を再選定'}
        </Button>
        <Button
          type="button"
          onClick={() => runAction('/api/admin/drafts/publish', 'publish')}
          disabled={busyAction !== null || !canPublish}
        >
          {busyAction === 'publish'
            ? isPublished
              ? '更新中...'
              : '公開中...'
            : isPublished
              ? '最新内容で再公開'
              : 'Supabase に公開'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        生成と商品再選定は `linksurge-crawler` に処理を委譲し、完了後に staging を同期します。
        {isPublished ? ' 再公開すると同じURLの公開記事を上書き更新します。' : ''}
      </p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}
