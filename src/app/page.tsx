import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Star, Sparkles } from "lucide-react";

const categories = [
  {
    slug: "kosui",
    name: "化粧水",
    description: "プチプラ〜デパコスまで、肌タイプ別におすすめをご紹介",
    articleHref: "/kosui/osusume/",
    emoji: "💧",
    color: "bg-blue-50 border-blue-100",
  },
  {
    slug: "bijyueki",
    name: "美容液",
    description: "エイジングケアから保湿・美白まで目的別に厳選",
    articleHref: "/bijyueki/osusume/",
    emoji: "✨",
    color: "bg-pink-50 border-pink-100",
  },
  {
    slug: "protein",
    name: "プロテイン",
    description: "ホエイ・ソイ・植物性など目的・味別ランキング",
    articleHref: "/protein/osusume/",
    emoji: "💪",
    color: "bg-orange-50 border-orange-100",
  },
  {
    slug: "vitamin",
    name: "ビタミン",
    description: "ビタミンC・D・Bなど種類別おすすめサプリ",
    articleHref: "/vitamin/osusume/",
    emoji: "🌿",
    color: "bg-green-50 border-green-100",
  },
  {
    slug: "supplement",
    name: "サプリメント",
    description: "美容・健康・ダイエット目的別おすすめを比較",
    articleHref: "/supplement/osusume/",
    emoji: "💊",
    color: "bg-purple-50 border-purple-100",
  },
];

const features = [
  { icon: Star, title: "楽天市場の人気商品", desc: "レビュー数・評価をもとに厳選した商品をご紹介" },
  { icon: Sparkles, title: "AI + 専門家が選定", desc: "客観的なデータと専門知識で最適な商品を選定" },
  { icon: ChevronRight, title: "比較表で一目瞭然", desc: "価格・特徴・おすすめ度を比較表で分かりやすく" },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-pink-50 via-white to-pink-50 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-primary border-primary/20 bg-primary/5">
            おすすめ商品比較サイト
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            あなたにぴったりの<br className="sm:hidden" />
            <span className="text-primary">ベストアイテム</span>が見つかる
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            化粧水・美容液・プロテインなど、楽天市場の人気商品を
            専門的な視点で比較・ランキング。
            あなたの目的・肌タイプに合った商品選びをサポートします。
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-3">
              <div className="bg-primary/10 rounded-full p-2 shrink-0">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">カテゴリから探す</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link key={cat.slug} href={cat.articleHref}>
                <Card className={`border hover:shadow-md transition-shadow cursor-pointer h-full ${cat.color}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{cat.emoji}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">
                          {cat.name}おすすめ比較
                        </h3>
                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-primary text-sm font-medium">
                      ランキングを見る
                      <ChevronRight className="h-4 w-4 ml-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-10 bg-white border-t px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-3">ベストアイテムについて</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ベストアイテムは、楽天市場の商品データとAI技術を組み合わせ、
            客観的な評価に基づいて商品を比較・紹介するメディアです。
            価格・口コミ・成分・使い勝手など多角的な視点から、
            あなたにとって本当に良い商品を見つけるお手伝いをします。
          </p>
        </div>
      </section>
    </div>
  );
}
