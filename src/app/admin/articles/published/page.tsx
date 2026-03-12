import Link from 'next/link'

import { PublishedRegenerateButton } from '@/components/admin/published-regenerate-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDraftSummaries } from '@/lib/linksurge-drafts'

type PublishedSearchParams = {
  q?: string
}

export default async function PublishedArticlesPage({
  searchParams,
}: {
  searchParams: Promise<PublishedSearchParams>
}) {
  const filters = await searchParams
  const q = filters.q || ''
  const items = await getDraftSummaries({ published: 'published', q })

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">管理画面</p>
          <h1 className="text-3xl font-semibold tracking-tight">公開済み記事一覧</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            公開済み記事を、同じURL・同じ対象キーワードのまま最新内容に更新するための画面です。
            安全に進めるなら「下書きだけ更新」、すぐ入れ替えるなら「同じURLで更新」を使います。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            管理トップ
          </Link>
          <Badge variant="outline">公開済み {items.length} 件</Badge>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">検索</CardTitle>
          <CardDescription>slug、target keyword、title で公開済み記事を検索します。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3" method="GET">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="slug / 対象キーワード / タイトル"
              className="h-10 min-w-[280px] rounded-md border bg-background px-3 text-sm outline-none ring-0"
            />
            <button className="inline-flex h-10 items-center rounded-md bg-black px-4 text-sm font-medium text-white hover:opacity-90">
              検索
            </button>
            <Link href="/admin/articles/published" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted">
              リセット
            </Link>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {items.map((item) => {
          const slugPath = item.slug.replace(/^\//, '').replace(/\/$/, '')
          return (
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
                    <Badge>{item.draft_status}</Badge>
                    <Badge variant="outline">公開済み</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <p>対象キーワード: {item.target_keyword}</p>
                  <p>検索キーワード: {item.search_keyword || '-'}</p>
                  <p>更新日時: {item.updated_at || '-'}</p>
                  <p>公開URL: https://best-item.co.jp/{slugPath}</p>
                  {item.error_message ? <p className="text-red-500">エラー: {item.error_message}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/articles/drafts/${slugPath}`}
                    className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    ドラフトを開く
                  </Link>
                  <PublishedRegenerateButton slug={item.slug} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
