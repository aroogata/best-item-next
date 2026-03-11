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
      setMessage(error instanceof Error ? error.message : 'Unexpected error')
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
          <option value="10">10 products</option>
          <option value="15">15 products</option>
          <option value="20">20 products</option>
          <option value="25">25 products</option>
          <option value="30">30 products</option>
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={() => runAction('/api/admin/drafts/generate', 'generate')}
          disabled={busyAction !== null}
        >
          {busyAction === 'generate' ? 'Generating...' : 'Generate in crawler'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => runAction('/api/admin/drafts/reselect-products', 'reselect')}
          disabled={busyAction !== null}
        >
          {busyAction === 'reselect' ? 'Reselecting...' : 'Reselect products'}
        </Button>
        <Button
          type="button"
          onClick={() => runAction('/api/admin/drafts/publish', 'publish')}
          disabled={busyAction !== null || isPublished || !canPublish}
        >
          {isPublished ? 'Already published' : busyAction === 'publish' ? 'Publishing...' : 'Publish to Supabase'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        生成と商品再選定は `linksurge-crawler` に処理を委譲し、完了後に staging を同期します。
      </p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  )
}
