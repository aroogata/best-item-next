'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  categoryId: string
  categoryName: string
  onDeleted: () => void
}

export function CategoryDeleteButton({ categoryId, categoryName, onDeleted }: Props) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'deleting'>('idle')
  const [error, setError] = useState('')

  async function handleDelete() {
    setStatus('deleting')
    setError('')
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: categoryId }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || '削除に失敗しました')
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました')
      setStatus('idle')
    }
  }

  if (status === 'confirming') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">「{categoryName}」を削除しますか？</span>
        <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={handleDelete}>
          削除
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setStatus('idle')}>
          キャンセル
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
        title="削除"
        disabled={status === 'deleting'}
        onClick={() => setStatus('confirming')}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
