import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDraftSummaries } from '@/lib/linksurge-drafts'

export default async function AdminHomePage() {
  const [allDrafts, publishedDrafts, unpublishedDrafts, errorDrafts] = await Promise.all([
    getDraftSummaries(),
    getDraftSummaries({ published: 'published' }),
    getDraftSummaries({ published: 'unpublished' }),
    getDraftSummaries({ status: 'error' }),
  ])

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Best Item Operations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            draft review、再生成依頼、publish を行う管理トップです。
          </p>
        </div>
        <Badge variant="outline">{allDrafts.length} tracked drafts</Badge>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Drafts</CardDescription>
            <CardTitle>{allDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published</CardDescription>
            <CardTitle>{publishedDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Unpublished</CardDescription>
            <CardTitle>{unpublishedDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Errors</CardDescription>
            <CardTitle>{errorDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Draft Articles</CardTitle>
            <CardDescription>
              staging に同期された draft 一覧を確認し、生成・再選定・公開を行います。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              未公開 draft の確認、公開前レビュー、publish 操作はこちらです。
            </div>
            <Link
              href="/admin/articles/drafts"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Open drafts
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Published Articles</CardTitle>
            <CardDescription>
              公開済み記事の再生成依頼を出し、必要に応じて draft を確認して再公開します。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              公開後のリフレッシュや最新比較内容への更新導線です。
            </div>
            <Link
              href="/admin/articles/published"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Open published
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
