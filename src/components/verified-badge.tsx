"use client";

import Image from "next/image";

const RANK_STYLE: Record<string, { emoji: string; color: string; label: string }> = {
  bronze:   { emoji: "🥉", color: "text-amber-700",  label: "ブロンズ" },
  silver:   { emoji: "🥈", color: "text-gray-400",   label: "シルバー" },
  gold:     { emoji: "🥇", color: "text-yellow-500", label: "ゴールド" },
  platinum: { emoji: "💎", color: "text-blue-400",   label: "プラチナ" },
};

interface UserProfileData {
  display_name?: string;
  avatar_url?: string | null;
  rank?: string;
}

export function VerifiedBadge({
  userId,
  nickname,
  profile,
  size = "sm",
}: {
  userId?: string | null;
  nickname?: string;
  profile?: UserProfileData | null;
  size?: "sm" | "xs";
}) {
  const isVerified = !!userId && !!profile;
  const displayName = profile?.display_name || nickname || "匿名";
  const rankCfg = RANK_STYLE[profile?.rank || "bronze"];
  const textSize = size === "xs" ? "text-[10px]" : "text-[11px]";

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      {/* アバター（認証ユーザーのみ） */}
      {isVerified && profile?.avatar_url && (
        <Image
          src={profile.avatar_url}
          alt=""
          width={size === "xs" ? 14 : 16}
          height={size === "xs" ? 14 : 16}
          className="rounded-full"
          unoptimized
        />
      )}

      {/* 名前 */}
      <span className={isVerified ? "font-medium text-foreground" : "text-muted-foreground"}>
        {displayName}
      </span>

      {/* 認証バッジ */}
      {isVerified && (
        <>
          <span className="text-blue-500" title="認証済みユーザー">
            <svg viewBox="0 0 16 16" className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} fill="currentColor">
              <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.41 5.09a.75.75 0 00-1.06-1.06L7 7.38 5.65 6.03a.75.75 0 10-1.06 1.06l1.88 1.88a.75.75 0 001.06 0l3.88-3.88z" />
            </svg>
          </span>
          {/* ランクバッジ */}
          {rankCfg && (
            <span className={`${rankCfg.color}`} title={rankCfg.label}>
              {rankCfg.emoji}
            </span>
          )}
        </>
      )}
    </span>
  );
}
