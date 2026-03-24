import { NextRequest, NextResponse } from "next/server";

const TO_EMAIL = "info@benzie-c.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "お名前、メールアドレス、お問い合わせ内容は必須です" }, { status: 400 });
  }

  if (message.trim().length < 10) {
    return NextResponse.json({ error: "お問い合わせ内容は10文字以上で入力してください" }, { status: 400 });
  }

  // Supabase の built-in SMTP でメール送信（Supabase Auth の invite 機能を流用せず、
  // シンプルに fetch で Supabase Edge Function or 外部 SMTP を使う）
  // ここでは Supabase DB にお問い合わせを保存して、管理画面から確認する方式を採用
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("contact_messages").insert({
    name: name.trim().slice(0, 100),
    email: email.trim().slice(0, 200),
    subject: (subject || "").trim().slice(0, 200),
    message: message.trim().slice(0, 5000),
  });

  if (error) {
    // テーブルが未作成の場合はフォールバック（コンソールログのみ）
    console.error("[contact] DB insert failed:", error.message);
    console.log(`[contact] From: ${name} <${email}> Subject: ${subject}\n${message}`);
  }

  return NextResponse.json({
    ok: true,
    message: "お問い合わせを受け付けました。返信まで数日かかる場合がございます。",
  });
}
