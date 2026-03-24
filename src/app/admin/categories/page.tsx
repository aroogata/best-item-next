import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/server'
import { CategoryDeleteRow } from '@/components/admin/category-delete-row'
import { CategoryImageUpload } from '@/components/admin/category-image-upload'

export default async function AdminCategoriesPage() {
  const supabase = await createServiceClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, name, parent_category_id, sort_order, image_url')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  // 記事数をカテゴリごとに取得
  const { data: articleCounts } = await supabase
    .from('articles')
    .select('category_id')
    .eq('status', 'published')

  const countMap: Record<string, number> = {}
  for (const row of articleCounts ?? []) {
    if (row.category_id) {
      countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
    }
  }

  // 子カテゴリ数をカウント
  const childCountMap: Record<string, number> = {}
  for (const cat of categories ?? []) {
    if (cat.parent_category_id) {
      childCountMap[cat.parent_category_id] = (childCountMap[cat.parent_category_id] ?? 0) + 1
    }
  }

  const allCats = categories ?? []
  const zeroCats = allCats.filter((c) => (countMap[c.id] ?? 0) === 0)
  const nonZeroCats = allCats.filter((c) => (countMap[c.id] ?? 0) > 0)

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              管理トップへ戻る
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">カテゴリ管理</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            全 {allCats.length} カテゴリ（記事0件: {zeroCats.length} 件）
          </p>
        </div>
      </div>

      {zeroCats.length > 0 && (
        <Card className="mb-8 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              記事0件のカテゴリ
              <Badge variant="destructive">{zeroCats.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {zeroCats.map((cat) => {
                const hasChildren = (childCountMap[cat.id] ?? 0) > 0
                return (
                  <div key={cat.id} className="flex items-center justify-between py-2.5 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasChildren && (
                        <span className="text-xs text-muted-foreground">
                          子カテゴリ {childCountMap[cat.id]} 件あり
                        </span>
                      )}
                      {!hasChildren ? (
                        <CategoryDeleteRow categoryId={cat.id} categoryName={cat.name} />
                      ) : (
                        <span className="text-xs text-muted-foreground">削除不可</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">全カテゴリ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {allCats.map((cat) => {
              const count = countMap[cat.id] ?? 0
              const isChild = !!cat.parent_category_id
              return (
                <div key={cat.id} className={`flex items-center justify-between py-2.5 gap-4 ${isChild ? 'pl-4' : ''}`}>
                  <CategoryImageUpload categoryId={cat.id} currentImageUrl={cat.image_url || null} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{isChild && <span className="text-muted-foreground mr-1">└</span>}{cat.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{cat.slug}</p>
                  </div>
                  <Badge variant={count > 0 ? 'secondary' : 'outline'} className="shrink-0 text-xs">
                    {count} 件
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
