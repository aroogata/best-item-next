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
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">管理画面</p>
          <h1 className="text-3xl font-semibold tracking-tight">Best Item 管理トップ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ドラフト確認、再生成依頼、公開操作を行う管理トップです。
          </p>
        </div>
        <Badge variant="outline">管理対象ドラフト {allDrafts.length} 件</Badge>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>ドラフト総数</CardDescription>
            <CardTitle>{allDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>公開済み</CardDescription>
            <CardTitle>{publishedDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>未公開</CardDescription>
            <CardTitle>{unpublishedDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>エラー</CardDescription>
            <CardTitle>{errorDrafts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>ドラフト記事</CardTitle>
            <CardDescription>
              staging に同期されたドラフト一覧を確認し、生成・再選定・公開を行います。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              未公開ドラフトの確認、公開前レビュー、公開操作はこちらです。
            </div>
            <Link
              href="/admin/articles/drafts"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              ドラフト一覧を開く
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>公開済み記事</CardTitle>
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
              公開済み一覧を開く
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>カテゴリ管理</CardTitle>
            <CardDescription>
              記事0件のカテゴリを確認・削除できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              不要なカテゴリを整理して管理します。
            </div>
            <Link
              href="/admin/categories"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              カテゴリ一覧を開く
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
