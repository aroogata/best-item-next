import { notFound } from 'next/navigation'
import Link from 'next/link'

import { DraftActions } from '@/components/admin/draft-actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDraft } from '@/lib/linksurge-drafts'

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const normalizedSlug = `/${slug.replace(/^\//, '')}`

  let draft
  try {
    draft = await getDraft(normalizedSlug)
  } catch {
    notFound()
  }

  const sectionEntries = Object.entries(draft.sections || {})

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              管理トップへ戻る
            </Link>
            <Link
              href="/admin/articles/drafts"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              ドラフト一覧へ戻る
            </Link>
          </div>
          <p className="font-mono text-xs text-muted-foreground">{draft.slug}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{draft.title || draft.target_keyword}</h1>
          <p className="mt-2 text-sm text-muted-foreground">対象キーワード: {draft.target_keyword}</p>
          <p className="text-sm text-muted-foreground">検索キーワード: {draft.search_keyword || '-'}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <Badge>{draft.draft_status}</Badge>
            {draft.published_to_supabase ? <Badge variant="outline">公開済み</Badge> : null}
          </div>
          <DraftActions
            slug={draft.slug}
            canPublish={draft.draft_status === 'done'}
            isPublished={draft.published_to_supabase}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>本文セクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sectionEntries.map(([key, value]) => (
                <section key={key} className="space-y-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{key}</h2>
                  <div className="whitespace-pre-wrap rounded-md border p-4 text-sm leading-7">{value}</div>
                </section>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>メタ情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="font-medium">更新日時:</span> {draft.updated_at || '-'}</p>
              <p><span className="font-medium">メタディスクリプション:</span> {draft.meta_description || '-'}</p>
              <p><span className="font-medium">ヒーロー画像:</span> {draft.hero_image_url || '-'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>商品一覧</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.products.map((product) => (
                <div key={`${product.rank}-${product.name}`} className="rounded-md border p-4 text-sm">
                  <p className="font-medium">#{product.rank} {product.name}</p>
                  <p className="text-muted-foreground">価格: {product.price ?? '-'}</p>
                  <p className="text-muted-foreground">レビュー: {product.review_average ?? '-'} / {product.review_count ?? '-'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
