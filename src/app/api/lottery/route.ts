import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/lottery?user_id=xxx - 開催中キャンペーン + エントリー状況
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");

  const { data: campaigns } = await supabase
    .from("lottery_campaigns")
    .select("*")
    .in("status", ["open", "drawn", "fulfilled"])
    .order("created_at", { ascending: false })
    .limit(5);

  let myEntries: Record<string, boolean> = {};
  let myWins: Record<string, { gift_url: string | null }> = {};
  if (userId && campaigns) {
    const campaignIds = campaigns.map((c) => c.id);
    const { data: entries } = await supabase
      .from("lottery_entries")
      .select("campaign_id, is_winner, gift_url")
      .eq("user_id", userId)
      .in("campaign_id", campaignIds);

    if (entries) {
      for (const e of entries) {
        myEntries[e.campaign_id] = true;
        if (e.is_winner) myWins[e.campaign_id] = { gift_url: e.gift_url };
      }
    }
  }

  // エントリー数を取得
  const enriched = await Promise.all(
    (campaigns || []).map(async (c) => {
      const { count } = await supabase
        .from("lottery_entries")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", c.id);
      return {
        ...c,
        entry_count: count || 0,
        user_entered: !!myEntries[c.id],
        user_won: myWins[c.id] || null,
      };
    })
  );

  return NextResponse.json({ campaigns: enriched });
}

// POST /api/lottery - エントリー
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, campaign_id } = body;

  if (!user_id || !campaign_id) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  // キャンペーン確認
  const { data: campaign } = await supabase
    .from("lottery_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .eq("status", "open")
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "このキャンペーンは終了しています" }, { status: 400 });
  }

  // ポイント確認
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("points")
    .eq("id", user_id)
    .single();

  if (!profile || profile.points < campaign.entry_cost) {
    return NextResponse.json({ error: `ポイントが不足しています（必要: ${campaign.entry_cost}pt）` }, { status: 400 });
  }

  // ポイント差引
  await supabase.from("user_profiles").update({
    points: profile.points - campaign.entry_cost,
    updated_at: new Date().toISOString(),
  }).eq("id", user_id);

  await supabase.from("point_transactions").insert({
    user_id,
    action: "lottery_entry",
    points: -campaign.entry_cost,
    description: `抽選応募: ${campaign.title} (-${campaign.entry_cost}pt)`,
    reference_id: campaign_id,
  });

  // エントリー
  const { error } = await supabase.from("lottery_entries").insert({
    campaign_id,
    user_id,
  });

  if (error) {
    if (error.code === "23505") {
      // ポイント復元
      await supabase.from("user_profiles").update({
        points: profile.points,
      }).eq("id", user_id);
      return NextResponse.json({ error: "既にエントリー済みです" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    remaining_points: profile.points - campaign.entry_cost,
    message: `${campaign.title}にエントリーしました！抽選結果はマイページで確認できます。`,
  });
}
