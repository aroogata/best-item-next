'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

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
      const data = (await res.json().catch(() => ({ error: 'Request failed' }))) as {
        error?: string
      }

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setMessage(
        action === 'generate'
          ? '生成と staging 同期が完了しました。'
          : action === 'reselect'
            ? '商品再選定と staging 同期が完了しました。'
            : '公開が完了しました。'
      )
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '予期しないエラーが発生しました。')
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
          disabled={busyAction !== null || isPublished || !canPublish}
        >
          {isPublished ? '公開済み' : busyAction === 'publish' ? '公開中...' : 'Supabase に公開'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        生成と商品再選定は `linksurge-crawler` に処理を委譲し、完了後に staging を同期します。
      </p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}
