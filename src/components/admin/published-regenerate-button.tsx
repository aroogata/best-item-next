'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

type PublishedRegenerateButtonProps = {
  slug: string
}

export function PublishedRegenerateButton({ slug }: PublishedRegenerateButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleRegenerate() {
    setBusy(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, count: 20 }),
      })
      const data = (await res.json().catch(() => ({ error: 'Request failed' }))) as {
        error?: string
      }

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setMessage('再生成と staging 同期が完了しました。内容を確認してから必要なら再公開してください。')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '予期しないエラーが発生しました。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="secondary" onClick={handleRegenerate} disabled={busy}>
        {busy ? '再生成中...' : 'crawler で再生成'}
      </Button>
      {message ? <p className="max-w-xs text-right text-xs text-muted-foreground">{message}</p> : null}
    </div>
  )
}
