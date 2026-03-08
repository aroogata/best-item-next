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
