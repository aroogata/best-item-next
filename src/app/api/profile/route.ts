import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// PATCH /api/profile - プロフィール更新
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { user_id, display_name, bio } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (display_name !== undefined) {
    const trimmed = display_name.trim().slice(0, 30);
    if (trimmed.length < 1) {
      return NextResponse.json({ error: "表示名は1文字以上で入力してください" }, { status: 400 });
    }
    updates.display_name = trimmed;
  }

  if (bio !== undefined) {
    updates.bio = bio.trim().slice(0, 200);
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user_id)
    .select("id, display_name, avatar_url, bio, rank, points")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}

// POST /api/profile - アバターアップロード
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const userId = formData.get("user_id") as string;
  const file = formData.get("avatar") as File;

  if (!userId || !file) {
    return NextResponse.json({ error: "user_id and avatar are required" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "画像は2MB以下にしてください" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `${userId}/avatar.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  // 既存アバターを削除
  await supabase.storage.from("avatars").remove([`${userId}/avatar.png`, `${userId}/avatar.jpg`, `${userId}/avatar.webp`]);

  // アップロード
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const avatarUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${storagePath}?t=${Date.now()}`;

  // プロフィール更新
  await supabase
    .from("user_profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return NextResponse.json({ ok: true, avatar_url: avatarUrl });
}
