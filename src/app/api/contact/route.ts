import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TO_EMAIL = "info@benzie-c.com";
const FROM_EMAIL = "noreply@benzie-c.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "お名前、メールアドレス、お問い合わせ内容は必須です" }, { status: 400 });
  }

  if (message.trim().length < 10) {
    return NextResponse.json({ error: "お問い合わせ内容は10文字以上で入力してください" }, { status: 400 });
  }

  const trimmedName = name.trim().slice(0, 100);
  const trimmedEmail = email.trim().slice(0, 200);
  const trimmedSubject = (subject || "").trim().slice(0, 200) || "お問い合わせ";
  const trimmedMessage = message.trim().slice(0, 5000);

  // DB に保存
  await supabase.from("contact_messages").insert({
    name: trimmedName,
    email: trimmedEmail,
    subject: trimmedSubject,
    message: trimmedMessage,
  });

  // Resend でメール送信
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `オーサムアイテム <${FROM_EMAIL}>`,
          to: [TO_EMAIL],
          reply_to: trimmedEmail,
          subject: `[お問い合わせ] ${trimmedSubject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px;">
              <h2 style="color: #333; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
                オーサムアイテム お問い合わせ
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #888; width: 100px;">お名前</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${trimmedName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">メール</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">
                    <a href="mailto:${trimmedEmail}">${trimmedEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #888;">件名</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${trimmedSubject}</td>
                </tr>
              </table>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.8;">
                ${trimmedMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 16px;">
                このメールはオーサムアイテム (awesome-item.com) のお問い合わせフォームから送信されました。
                返信はこのメールに直接返信してください。
              </p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("[contact] Resend error:", res.status, errBody);
      }
    } catch (e) {
      console.error("[contact] Resend send failed:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "お問い合わせを受け付けました。返信まで数日かかる場合がございます。",
  });
}
