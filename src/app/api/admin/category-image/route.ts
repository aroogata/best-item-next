import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// POST /api/admin/category-image - カテゴリ画像アップロード
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const categoryId = formData.get("category_id") as string;
  const file = formData.get("image") as File;

  if (!categoryId || !file) {
    return NextResponse.json({ error: "category_id and image are required" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "画像は2MB以下にしてください" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `${categoryId}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  // 既存画像を削除
  await supabase.storage.from("category-images").remove([
    `${categoryId}.png`, `${categoryId}.jpg`, `${categoryId}.webp`,
  ]);

  // アップロード
  const { error: uploadError } = await supabase.storage
    .from("category-images")
    .upload(storagePath, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/category-images/${storagePath}?t=${Date.now()}`;

  // カテゴリの image_url を更新
  const { error: updateError } = await supabase
    .from("categories")
    .update({ image_url: imageUrl })
    .eq("id", categoryId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, image_url: imageUrl });
}
