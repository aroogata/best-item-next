'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Save, ExternalLink } from 'lucide-react'
import type { RelatedLink } from '@/lib/linksurge-drafts'

interface Props {
  slug: string
  initialLinks: RelatedLink[]
}

export function RelatedLinksManager({ slug, initialLinks }: Props) {
  const [links, setLinks] = useState<RelatedLink[]>(initialLinks)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function addLink() {
    setLinks((prev) => [...prev, { text: '', url: '' }])
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function updateLink(index: number, field: 'text' | 'url', value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  async function save() {
    setStatus('saving')
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/drafts/related-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, links }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || '保存に失敗しました')
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (e) {
      setStatus('error')
      setErrorMessage(e instanceof Error ? e.message : '不明なエラー')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>内部リンク</span>
          <Button size="sm" variant="outline" onClick={addLink} className="gap-1 text-xs h-7 px-2">
            <Plus className="h-3.5 w-3.5" />
            追加
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          記事末尾の「関連記事」セクションに表示されます。再公開で反映されます。
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">内部リンクはまだありません。「追加」ボタンで追加してください。</p>
        ) : (
          links.map((link, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  placeholder="リンクテキスト（例: ふるさと納税の活用法）"
                  value={link.text}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink(index, 'text', e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  placeholder="URL（例: /furusato-katsuyoho/ または https://...）"
                  value={link.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLink(index, 'url', e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="flex gap-1 pt-0.5">
                {link.url && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input hover:bg-muted transition-colors"
                    title="リンクを開く"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeLink(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="削除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button size="sm" onClick={save} disabled={status === 'saving'} className="gap-1.5 text-xs h-8">
            <Save className="h-3.5 w-3.5" />
            {status === 'saving' ? '保存中...' : status === 'saved' ? '保存しました ✓' : '内部リンクを保存'}
          </Button>
          {status === 'error' && (
            <span className="text-xs text-destructive">{errorMessage}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
