import { createPublicClient } from "@/lib/supabase/public";
import { SiteHeaderNav } from "@/components/site-header-nav";

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
};

async function getHeaderCategories(): Promise<HeaderCategory[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load header categories", error);
      return [];
    }

    return (data ?? []) as HeaderCategory[];
  } catch (error) {
    console.error("Failed to load header categories", error);
    return [];
  }
}

export async function SiteHeader() {
  const categories = await getHeaderCategories();

  return <SiteHeaderNav categories={categories} />;
}
