/**
 * POST /api/generate-image
 * Gemini 3.1 Flash Image Preview でヒーロー画像を生成し、
 * Supabase Storage にアップロードして公開URLを返す。
 *
 * Body: { slug: string, keyword: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// キーワードからプロンプトを生成
function buildPrompt(keyword: string): string {
  const prompts: Record<string, string> = {
    化粧水: "Professional Japanese beauty editorial photography. Multiple elegant skincare toner bottles arranged on warm cream background. Soft side lighting, petals and minimal props. Premium minimalist aesthetic. No text, no watermark.",
    美容液: "Professional Japanese beauty editorial photography. Luxury serum bottles with dropper on creamy marble surface. Soft bokeh, golden hour lighting, botanical elements. No text, no watermark.",
    プロテイン: "Clean product photography of protein powder containers and shaker bottle. White and light gray background, athletic minimal aesthetic. Professional studio lighting. No text, no watermark.",
    ビタミン: "Beautiful flat-lay of vitamin supplement bottles and capsules on sage green background. Natural herbs and citrus slices as props, soft diffused light. No text, no watermark.",
    サプリメント: "Clean flat-lay of health supplement bottles on cream linen background. Botanical props, natural lighting, minimal Japanese aesthetic. No text, no watermark.",
  };

  for (const [key, prompt] of Object.entries(prompts)) {
    if (keyword.includes(key)) return prompt;
  }
  return `Professional Japanese editorial product photography for '${keyword}'. Clean cream background, soft natural lighting, minimalist composition. No text, no watermark, high quality.`;
}

export async function POST(req: NextRequest) {
  const { slug, keyword } = await req.json();
  if (!slug || !keyword) {
    return NextResponse.json({ error: "slug と keyword が必要です" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const model = process.env.GOOGLE_IMAGE_MODEL ?? "gemini-3.1-flash-image-preview";
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_API_KEY 未設定" }, { status: 500 });
  }

  // ── 1. Gemini で画像生成 ──
  const prompt = buildPrompt(keyword);
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.json();
    return NextResponse.json({ error: "Gemini API エラー", detail: err }, { status: 502 });
  }

  const geminiData = await geminiRes.json();
  const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
  );
  if (!imagePart) {
    return NextResponse.json({ error: "画像パートが見つかりません" }, { status: 500 });
  }

  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  const mimeType: string = imagePart.inlineData.mimeType ?? "image/png";
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";

  // ── 2. Supabase Storage にアップロード ──
  const filename = slug.replace(/^\/|\/$/g, "").replace(/\//g, "-") + `.${ext}`;
  const storagePath = `heroes/${filename}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/article-images/${storagePath}`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return NextResponse.json({ error: "Storage アップロード失敗", detail: err }, { status: 502 });
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/article-images/${storagePath}`;

  // ── 3. articles テーブルの hero_image_url を更新 ──
  try {
    const supabase = await createServiceClient();
    await supabase.from("articles").update({ hero_image_url: publicUrl }).eq("slug", slug);
  } catch {
    // 記事が存在しない場合はスキップ（下書き段階でも使えるように）
  }

  return NextResponse.json({ url: publicUrl });
}
