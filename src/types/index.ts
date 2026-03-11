export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  rakuten_item_id: string | null
  name: string
  price: number | null
  url: string | null
  affiliate_url: string | null
  image_url: string | null
  review_count: number
  review_average: number
  shop_name: string | null
  description: string | null
  genre_name: string | null
  last_fetched_at: string | null
  created_at: string
}

export interface Article {
  id: string
  category_id: string | null
  slug: string
  target_keyword: string
  title: string
  h1: string | null
  meta_description: string | null
  status: 'draft' | 'review' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
  categories?: Category
}

export interface ArticleSection {
  id: string
  article_id: string
  section_type: string
  sort_order: number
  content: string | null
  created_at: string
}

export interface ArticleProduct {
  id: string
  article_id: string
  product_id: string
  rank: number
  ai_review: string | null
  ai_features: string | null
  ai_recommended_for: string | null
  created_at: string
  products?: Product
}

export interface ArticleWithDetails extends Article {
  article_sections: ArticleSection[]
  article_products: (ArticleProduct & { products: Product })[]
}

export interface DraftArticle {
  id: string
  source_slug: string
  target_keyword: string
  search_keyword: string | null
  title: string | null
  meta_description: string | null
  hero_image_url: string | null
  draft_status: string
  source_updated_at: string | null
  last_synced_at: string
  published_at: string | null
  published_article_id: string | null
  published_by: string | null
  published_to_supabase: boolean
  error_message: string | null
  payload_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DraftArticleSection {
  id: string
  draft_article_id: string
  section_type: string
  sort_order: number
  content: string | null
  created_at: string
  updated_at: string
}

export interface DraftArticleProduct {
  id: string
  draft_article_id: string
  rank: number
  rakuten_item_id: string | null
  name: string
  price: number | null
  affiliate_url: string | null
  image_url: string | null
  review_count: number
  review_average: number
  shop_name: string | null
  description: string | null
  ai_review: string | null
  ai_features: string | null
  ai_cons: string | null
  ai_recommended_for: string | null
  ai_not_recommended_for: string | null
  raw_product_json: Record<string, unknown>
  created_at: string
  updated_at: string
}
