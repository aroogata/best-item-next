import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UserProfileClient } from "./client";

type PageProps = { params: Promise<{ id: string }> };

async function getProfile(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function getUserReviews(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_reviews")
    .select("id, rating, comment, nickname, created_at, products(name)")
    .eq("user_id", userId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

async function getUserQuestions(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("article_questions")
    .select("id, question, nickname, helpful_count, created_at")
    .eq("user_id", userId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

async function getPointHistory(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("point_transactions")
    .select("action, points, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  return data || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return { title: "ユーザーが見つかりません" };
  return {
    title: `${profile.display_name || "ユーザー"}のプロフィール`,
    robots: { index: false },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const [reviews, questions, pointHistory] = await Promise.all([
    getUserReviews(id),
    getUserQuestions(id),
    getPointHistory(id),
  ]);

  return (
    <UserProfileClient
      profile={profile}
      reviews={reviews}
      questions={questions}
      pointHistory={pointHistory}
    />
  );
}
