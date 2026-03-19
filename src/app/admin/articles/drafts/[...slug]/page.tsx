import { notFound } from 'next/navigation'
import Link from 'next/link'

import { DraftActions } from '@/components/admin/draft-actions'
import { CategoryManager } from '@/components/admin/category-manager'
import { DraftContentEditor } from '@/components/admin/draft-content-editor'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildCategoryLabel, getCategorySlug, resolveCategoryName, type AdminCategoryOption } from '@/lib/article-categories'
import { getDraftStatusLabel } from '@/lib/admin-ui'
import { getDraft, getPublishBlockingIssues } from '@/lib/linksurge-drafts'
import { RelatedLinksManager } from '@/components/admin/related-links-manager'
import { SectionEditor } from '@/components/admin/section-editor'
import { createServiceClient } from '@/lib/supabase/server'

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const normalizedSlug = `/${slug.join('/')}`

  let draft
  try {
    draft = await getDraft(normalizedSlug)
  } catch {
    notFound()
  }

  const supabase = await createServiceClient()
  const [{ data: categories }, { data: articleRow }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, slug, name, parent_category_id, description, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    draft.published_article_id
      ? supabase
          .from('articles')
          .select('category_id')
          .eq('id', draft.published_article_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const categoryOptions = (categories ?? []) as AdminCategoryOption[]
  const suggestedCategoryName = resolveCategoryName(draft.target_keyword)
  const suggestedCategorySlug = getCategorySlug(suggestedCategoryName)
  const effectiveCategoryId =
    draft.manual_category_id ??
    articleRow?.category_id ??
    categoryOptions.find((category) => category.slug === suggestedCategorySlug)?.id ??
    null
  const effectiveCategoryName =
    (() => {
      if (!effectiveCategoryId) return null
      const selectedCategory = categoryOptions.find((category) => category.id === effectiveCategoryId)
      return selectedCategory ? buildCategoryLabel(selectedCategory, categoryOptions) : null
    })()

  const sectionEntries = Object.entries(draft.sections || {})
  const publishBlockingIssues = getPublishBlockingIssues(draft)
  const canPublish = draft.draft_status === 'done' && publishBlockingIssues.length === 0

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
            <Badge>{getDraftStatusLabel(draft.draft_status)}</Badge>
            {draft.published_to_supabase ? <Badge variant="outline">公開済み</Badge> : null}
          </div>
          <DraftActions
            slug={draft.slug}
            canPublish={canPublish}
            isPublished={draft.published_to_supabase}
          />
        </div>
      </div>

      {publishBlockingIssues.length > 0 ? (
        <Card className="mb-6 border-amber-500/40 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">公開前に補完が必要です</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {publishBlockingIssues.map((issue) => (
              <p key={issue}>- {issue}</p>
            ))}
            <p>この画面の `crawler で生成` を実行して、画像付きの draft に更新してから公開してください。</p>
          </CardContent>
        </Card>
      ) : null}

      {draft.published_to_supabase ? (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">公開済み記事の更新フロー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>このドラフトはすでに公開済みです。</p>
            <p>`crawler で生成` で商品と本文を最新化したあと、`最新内容で再公開` を押すと同じURLの記事内容を上書き更新できます。</p>
          </CardContent>
        </Card>
      ) : null}

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
                  <SectionEditor slug={draft.slug} sectionKey={key} initialContent={value ?? ''} />
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

          <DraftContentEditor
            slug={draft.slug}
            currentTitle={draft.title || draft.target_keyword}
            baseTitle={draft.raw_title || draft.target_keyword}
            currentMetaDescription={draft.meta_description || ''}
            baseMetaDescription={draft.raw_meta_description || ''}
            isPublished={draft.published_to_supabase}
          />

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

          <RelatedLinksManager
            slug={draft.slug}
            initialLinks={draft.related_links ?? []}
          />

          <CategoryManager
            slug={draft.slug}
            categories={categoryOptions}
            currentCategoryId={effectiveCategoryId}
            currentCategoryName={effectiveCategoryName}
            suggestedCategoryName={suggestedCategoryName}
            isPublished={draft.published_to_supabase}
          />
        </div>
      </div>
    </main>
  )
}
