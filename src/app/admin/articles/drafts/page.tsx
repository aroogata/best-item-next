import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDraftSummaries } from '@/lib/linksurge-drafts'

function statusVariant(status: string) {
  if (status === 'done') return 'default'
  if (status === 'error') return 'destructive'
  return 'secondary'
}

export default async function DraftsPage() {
  const items = await getDraftSummaries()

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Draft Articles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Linksurge crawler から Supabase staging に同期された best-item 用ドラフト一覧。
          </p>
        </div>
        <Badge variant="outline">{items.length} drafts</Badge>
      </div>

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
                  <Badge variant={statusVariant(item.draft_status)}>{item.draft_status}</Badge>
                  {item.published_to_supabase ? <Badge variant="outline">published</Badge> : null}
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
              <Link
                href={`/admin/articles/drafts/${item.slug.replace(/^\//, '').replace(/\/$/, '')}`}
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Open draft
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
