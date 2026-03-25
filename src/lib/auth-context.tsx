"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User, Session } from "@supabase/supabase-js";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type UserRank = "bronze" | "silver" | "gold" | "platinum";

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  provider: string;
  points: number;
  rank: UserRank;
  review_count: number;
  poll_count: number;
  question_count: number;
  answer_count: number;
  helpful_received: number;
  bio: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithLine: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithTwitter: async () => {},
  signInWithLine: async () => {},
  signInWithMagicLink: async () => ({}),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as UserProfile);
  }, []);

  useEffect(() => {
    // 初期セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // セッション変更リスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithTwitter = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "x" as any,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithLine = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "custom:line" as any,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithTwitter, signInWithLine, signInWithMagicLink, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const RANK_CONFIG: Record<UserRank, { label: string; emoji: string; color: string; minPoints: number }> = {
  bronze:   { label: "ブロンズ",   emoji: "🥉", color: "text-amber-700",  minPoints: 0 },
  silver:   { label: "シルバー",   emoji: "🥈", color: "text-gray-400",   minPoints: 100 },
  gold:     { label: "ゴールド",   emoji: "🥇", color: "text-yellow-500", minPoints: 500 },
  platinum: { label: "プラチナ",   emoji: "💎", color: "text-blue-400",   minPoints: 2000 },
};

export const POINT_RULES = {
  signup_bonus: 100,
  poll_vote: 10,
  poll_vote_anon: 3,
  review: 30,
  review_anon: 5,
  review_with_photo: 50,
  question: 10,
  answer: 20,
  helpful_received: 5,
  profile_complete: 50,
} as const;
