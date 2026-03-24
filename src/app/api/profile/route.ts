import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// PATCH /api/profile - プロフィール更新
// ガードレール: URL バリデーション
const ALLOWED_SOCIAL_DOMAINS: Record<string, string[]> = {
  social_x: ["x.com", "twitter.com"],
  social_instagram: ["instagram.com"],
  social_facebook: ["facebook.com", "fb.com"],
  social_note: ["note.com"],
  website_url: [], // 任意ドメイン
  custom_link_1_url: [], // 任意ドメイン
  custom_link_2_url: [], // 任意ドメイン
};

const BLOCKED_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /<script/i,
  /onclick/i,
  /onerror/i,
];

function validateUrl(url: string, field: string): { valid: boolean; error?: string } {
  if (!url) return { valid: true };
  const trimmed = url.trim();
  if (trimmed.length > 200) return { valid: false, error: "URLは200文字以内です" };

  // 危険なパターン
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) return { valid: false, error: "無効なURLです" };
  }

  // https:// で始まるか
  if (!trimmed.startsWith("https://")) {
    return { valid: false, error: "URLは https:// で始めてください" };
  }

  // SNS系はドメインを制限
  const allowedDomains = ALLOWED_SOCIAL_DOMAINS[field];
  if (allowedDomains && allowedDomains.length > 0) {
    try {
      const hostname = new URL(trimmed).hostname.replace(/^www\./, "");
      if (!allowedDomains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
        return { valid: false, error: `${field}には${allowedDomains.join(" or ")}のURLを入力してください` };
      }
    } catch {
      return { valid: false, error: "無効なURLです" };
    }
  }

  return { valid: true };
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { user_id, display_name, bio, social_x, social_instagram, social_facebook, social_note, website_url, custom_link_1_label, custom_link_1_url, custom_link_2_label, custom_link_2_url } = body;

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

  // ソーシャルリンク
  const linkFields = { social_x, social_instagram, social_facebook, social_note, website_url, custom_link_1_url, custom_link_2_url };
  for (const [field, value] of Object.entries(linkFields)) {
    if (value !== undefined) {
      const trimmed = (value as string).trim();
      if (trimmed) {
        const validation = validateUrl(trimmed, field);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
      }
      updates[field] = trimmed;
    }
  }

  // カスタムリンクラベル
  if (custom_link_1_label !== undefined) updates.custom_link_1_label = (custom_link_1_label as string).trim().slice(0, 30);
  if (custom_link_2_label !== undefined) updates.custom_link_2_label = (custom_link_2_label as string).trim().slice(0, 30);

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user_id)
    .select("*")
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
