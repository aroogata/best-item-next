import { notFound } from 'next/navigation'

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
          <p className="font-mono text-xs text-muted-foreground">{draft.slug}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{draft.title || draft.target_keyword}</h1>
          <p className="mt-2 text-sm text-muted-foreground">target: {draft.target_keyword}</p>
          <p className="text-sm text-muted-foreground">search: {draft.search_keyword || '-'}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <Badge>{draft.draft_status}</Badge>
            {draft.published_to_supabase ? <Badge variant="outline">published</Badge> : null}
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
              <CardTitle>Sections</CardTitle>
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
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="font-medium">Updated:</span> {draft.updated_at || '-'}</p>
              <p><span className="font-medium">Meta description:</span> {draft.meta_description || '-'}</p>
              <p><span className="font-medium">Hero image:</span> {draft.hero_image_url || '-'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.products.map((product) => (
                <div key={`${product.rank}-${product.name}`} className="rounded-md border p-4 text-sm">
                  <p className="font-medium">#{product.rank} {product.name}</p>
                  <p className="text-muted-foreground">price: {product.price ?? '-'}</p>
                  <p className="text-muted-foreground">reviews: {product.review_average ?? '-'} / {product.review_count ?? '-'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
