'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { DEFAULT_REQUEST_ERROR_MESSAGE, DEFAULT_UNEXPECTED_ERROR_MESSAGE } from '@/lib/admin-ui'

type DraftListActionsProps = {
  slug: string
  canReselect: boolean
}

export function DraftListActions({ slug, canReselect }: DraftListActionsProps) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<'generate' | 'reselect' | null>(null)

  async function runAction(url: string, action: 'generate' | 'reselect') {
    setBusyAction(action)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, count: 20 }),
      })
      const data = (await res.json().catch(() => ({ error: DEFAULT_REQUEST_ERROR_MESSAGE }))) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || DEFAULT_REQUEST_ERROR_MESSAGE)
      }
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : DEFAULT_UNEXPECTED_ERROR_MESSAGE)
    } finally {
      setBusyAction(null)
    }
  }

  const slugPath = slug.replace(/^\//, '').replace(/\/$/, '')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => runAction('/api/admin/drafts/generate', 'generate')}
        disabled={busyAction !== null}
      >
        {busyAction === 'generate' ? '生成中...' : '生成'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => runAction('/api/admin/drafts/reselect-products', 'reselect')}
        disabled={busyAction !== null || !canReselect}
      >
        {busyAction === 'reselect' ? '再選定中...' : '商品再選定'}
      </Button>
      <Link
        href={`/admin/articles/drafts/${slugPath}`}
        className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        詳細を開く
      </Link>
    </div>
  )
}
