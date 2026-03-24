import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ProfileMap = Record<string, { display_name: string; avatar_url: string | null; rank: string }>;

/**
 * user_id のリストからプロフィール情報をまとめて取得し、
 * user_id → profile のマップを返す。
 */
export async function fetchProfileMap(userIds: (string | null | undefined)[]): Promise<ProfileMap> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return {};

  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("id, display_name, avatar_url, rank")
    .in("id", uniqueIds);

  const map: ProfileMap = {};
  if (data) {
    for (const p of data) {
      map[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url, rank: p.rank };
    }
  }
  return map;
}

/**
 * レコード配列に user_profiles フィールドを追加する。
 */
export function attachProfiles<T extends { user_id?: string | null }>(
  records: T[],
  profileMap: ProfileMap
): (T & { user_profiles: ProfileMap[string] | null })[] {
  return records.map((r) => ({
    ...r,
    user_profiles: r.user_id ? profileMap[r.user_id] || null : null,
  }));
}
