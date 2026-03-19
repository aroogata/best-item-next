'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  slug: string
  sectionKey: string
  initialContent: string
}

export function SectionEditor({ slug, sectionKey, initialContent }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [draft, setDraft] = useState(initialContent)
  const [status, setStatus] = useState<'idle' | 'saving'>('idle')
  const [error, setError] = useState('')

  async function save() {
    setStatus('saving')
    setError('')
    try {
      const res = await fetch('/api/admin/drafts/section', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, sectionKey, content: draft }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || '保存に失敗しました')
      setContent(draft)
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setStatus('idle')
    }
  }

  function cancel() {
    setDraft(content)
    setEditing(false)
    setError('')
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.max(6, draft.split('\n').length + 2)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-7 font-mono resize-y"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save} disabled={status === 'saving'} className="gap-1.5 h-8 text-xs">
            <Save className="h-3.5 w-3.5" />
            {status === 'saving' ? '保存中...' : '保存'}
          </Button>
          <Button size="sm" variant="outline" onClick={cancel} disabled={status === 'saving'} className="gap-1.5 h-8 text-xs">
            <X className="h-3.5 w-3.5" />
            キャンセル
          </Button>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <div className="whitespace-pre-wrap rounded-md border p-4 text-sm leading-7">{content}</div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setEditing(true)}
        className="absolute top-2 right-2 gap-1.5 h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-3 w-3" />
        編集
      </Button>
    </div>
  )
}
