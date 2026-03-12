import Link from 'next/link'

import { DraftListActions } from '@/components/admin/draft-list-actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDraftStatusLabel } from '@/lib/admin-ui'
import { getDraftSummaries } from '@/lib/linksurge-drafts'

type DraftSearchParams = {
  status?: string
  published?: 'published' | 'unpublished' | 'all'
  q?: string
}

function statusVariant(status: string) {
  if (status === 'done') return 'default'
  if (status === 'error') return 'destructive'
  return 'secondary'
}

function buildFilterHref(filters: DraftSearchParams) {
  const params = new URLSearchParams()

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status)
  }
  if (filters.published && filters.published !== 'all') {
    params.set('published', filters.published)
  }
  if (filters.q?.trim()) {
    params.set('q', filters.q.trim())
  }

  const query = params.toString()
  return query ? `/admin/articles/drafts?${query}` : '/admin/articles/drafts'
}

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<DraftSearchParams>
}) {
  const filters = await searchParams
  const status = filters.status || 'all'
  const published = filters.published || 'all'
  const q = filters.q || ''
  const items = await getDraftSummaries({ status, published, q })

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">管理画面</p>
          <h1 className="text-3xl font-semibold tracking-tight">ドラフト記事一覧</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Linksurge crawler から Supabase staging に同期された best-item 用ドラフト一覧。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            管理トップ
          </Link>
          <Badge variant="outline">{items.length} 件</Badge>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">絞り込み</CardTitle>
          <CardDescription>状態、公開状況、検索語でドラフトを絞り込みます。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]" method="GET">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="slug / 対象キーワード / タイトル"
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-0"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-0"
            >
              <option value="all">すべての状態</option>
              <option value="pending">未生成</option>
              <option value="generating">生成中</option>
              <option value="done">生成完了</option>
              <option value="error">エラー</option>
              <option value="redirect">リダイレクト</option>
            </select>
            <select
              name="published"
              defaultValue={published}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-0"
            >
              <option value="all">すべての公開状態</option>
              <option value="published">公開済み</option>
              <option value="unpublished">未公開</option>
            </select>
            <div className="flex gap-2">
              <button className="inline-flex h-10 items-center rounded-md bg-black px-4 text-sm font-medium text-white hover:opacity-90">
                適用
              </button>
              <Link
                href="/admin/articles/drafts"
                className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                リセット
              </Link>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Link href={buildFilterHref({ status: 'done', published, q })} className="rounded-full border px-3 py-1 hover:bg-muted">
              生成完了のみ
            </Link>
            <Link href={buildFilterHref({ status, published: 'unpublished', q })} className="rounded-full border px-3 py-1 hover:bg-muted">
              未公開のみ
            </Link>
            <Link href={buildFilterHref({ status: 'error', published, q })} className="rounded-full border px-3 py-1 hover:bg-muted">
              エラーのみ
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.slug}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{item.title || item.target_keyword}</CardTitle>
                  <CardDescription className="mt-1 font-mono text-xs">
                    {item.slug}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={statusVariant(item.draft_status)}>{getDraftStatusLabel(item.draft_status)}</Badge>
                  {item.published_to_supabase ? <Badge variant="outline">公開済み</Badge> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="space-y-1 text-muted-foreground">
                <p>対象キーワード: {item.target_keyword}</p>
                <p>検索キーワード: {item.search_keyword || '-'}</p>
                <p>更新日時: {item.updated_at || '-'}</p>
                {item.error_message ? <p className="text-red-500">エラー: {item.error_message}</p> : null}
              </div>
              <DraftListActions slug={item.slug} canReselect={item.draft_status === 'done'} />
            </CardContent>
          </Card>
        ))}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm font-medium">表示できるドラフトはまだありません。</p>
              <p className="mt-2 text-sm text-muted-foreground">
                linksurge-crawler からの同期前、または Supabase staging table 未適用時は空一覧として表示します。
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
