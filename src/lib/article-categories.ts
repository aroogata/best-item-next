export type AdminCategoryOption = {
  id: string
  slug: string
  name: string
  description?: string | null
  sort_order?: number
}

const CATEGORY_KEYWORDS: Array<[string, string]> = [
  ['口臭ケア', 'オーラルケア'],
  ['マウスウォッシュ', 'オーラルケア'],
  ['歯磨き粉', 'オーラルケア'],
  ['歯みがき粉', 'オーラルケア'],
  ['電動歯ブラシ', 'オーラルケア'],
  ['歯ブラシ', 'オーラルケア'],
  ['デンタル', 'オーラルケア'],
  ['オーラル', 'オーラルケア'],
  ['口臭', 'オーラルケア'],
  ['ホワイトニング', 'オーラルケア'],
  ['化粧水', 'スキンケア'],
  ['美容液', 'スキンケア'],
  ['シートマスク', 'スキンケア'],
  ['ナイトクリーム', 'スキンケア'],
  ['クレンジング', 'スキンケア'],
  ['日焼け止め', 'スキンケア'],
  ['BBクリーム', 'メイクアップ'],
  ['口紅', 'メイクアップ'],
  ['リップ', 'メイクアップ'],
  ['プロテイン', 'サプリメント'],
  ['葉酸', 'サプリメント'],
  ['マルチビタミン', 'サプリメント'],
  ['鉄分', 'サプリメント'],
  ['ビタミン', 'サプリメント'],
  ['コラーゲン', 'サプリメント'],
  ['乳酸菌', 'サプリメント'],
  ['酵素', 'サプリメント'],
  ['青汁', 'サプリメント'],
  ['ダイエット', 'サプリメント'],
  ['脂肪燃焼', 'サプリメント'],
  ['カルシウム', 'サプリメント'],
  ['コレステロール', 'サプリメント'],
  ['疲労回復', 'サプリメント'],
  ['むくみ', 'サプリメント'],
  ['子供用サプリ', 'サプリメント'],
  ['シャンプー', 'ヘアケア'],
  ['ヘアオイル', 'ヘアケア'],
  ['ドライヤー', 'ヘアケア'],
  ['脱毛器', '美容家電'],
  ['ミキサー', 'キッチン家電'],
  ['洗濯洗剤', '生活用品'],
  ['柔軟剤', '生活用品'],
  ['枕', '睡眠・寝具'],
]

const CATEGORY_NAME_TO_SLUG: Record<string, string> = {
  スキンケア: 'skincare',
  メイクアップ: 'makeup',
  サプリメント: 'supplement',
  ヘアケア: 'haircare',
  オーラルケア: 'oral',
  美容家電: 'beauty-appliance',
  キッチン家電: 'kitchen',
  生活用品: 'household',
  '睡眠・寝具': 'sleep',
  その他: 'other',
}

export function resolveCategoryName(keyword: string) {
  for (const [needle, categoryName] of CATEGORY_KEYWORDS) {
    if (keyword.includes(needle)) return categoryName
  }

  return 'その他'
}

export function getCategorySlug(categoryName: string) {
  return CATEGORY_NAME_TO_SLUG[categoryName] || 'other'
}

export function normalizeCategorySlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}
