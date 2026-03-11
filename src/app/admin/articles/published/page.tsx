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
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Published Articles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            公開済み記事の再生成依頼を出す画面です。再生成後は draft 詳細で内容を確認してから再公開してください。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            Admin home
          </Link>
          <Badge variant="outline">{items.length} published drafts</Badge>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>slug、target keyword、title で公開済み記事を検索します。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3" method="GET">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="slug / target keyword / title"
              className="h-10 min-w-[280px] rounded-md border bg-background px-3 text-sm outline-none ring-0"
            />
            <button className="inline-flex h-10 items-center rounded-md bg-black px-4 text-sm font-medium text-white hover:opacity-90">
              Search
            </button>
            <Link href="/admin/articles/published" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted">
              Reset
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
                    <Badge variant="outline">published</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <p>target: {item.target_keyword}</p>
                  <p>search: {item.search_keyword || '-'}</p>
                  <p>updated: {item.updated_at || '-'}</p>
                  {item.error_message ? <p className="text-red-500">error: {item.error_message}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/articles/drafts/${slugPath}`}
                    className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Open draft
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
