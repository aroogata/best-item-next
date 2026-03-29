import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const LEGACY_SLUG_REDIRECTS = {
  "/2026-25/": "/beef-yakiniku-guide/",
  "/202620-13/": "/diet-slippers-guide/",
  "/202620-12/": "/kanazawa-omiyage-guide/",
  "/202620-11/": "/kanazawa-meibutsu-guide/",
  "/202620-10/": "/hiroshima-omiyage-guide/",
  "/202620-9/": "/hiroshima-meibutsu-guide/",
  "/202625-18/": "/nagoya-omiyage-guide/",
  "/202625-17/": "/nagoya-meibutsu-guide/",
  "/202625-16/": "/kyoto-omiyage-guide/",
  "/202625-15/": "/kyoto-meibutsu-guide/",
  "/202625-14/": "/osaka-omiyage-guide/",
  "/202625-13/": "/osaka-meibutsu-guide/",
  "/202625-12/": "/hokkaido-meibutsu-guide/",
  "/202625-11/": "/hokkaido-omiyage-guide/",
  "/202625-10/": "/tokyo-meibutsu-guide/",
  "/202625-9/": "/okinawa-meibutsu-guide/",
  "/202620-8/": "/saga-meibutsu-guide/",
  "/202620-7/": "/kagoshima-meibutsu-guide/",
  "/202620-6/": "/miyazaki-meibutsu-guide/",
  "/202620-5/": "/oita-meibutsu-guide/",
  "/202620-4/": "/kumamoto-meibutsu-guide/",
  "/202625-8/": "/nagasaki-meibutsu-guide/",
  "/202625-7/": "/fukuoka-meibutsu-guide/",
  "/202625-6/": "/facecream-sensitive-skin-guide/",
  "/252026-2/": "/facecream-moisturizing-guide/",
  "/2026-201/": "/facecream-acne-guide/",
  "/202625-5/": "/facecream-guide/",
  "/2026-20/": "/cleansing-oily-skin-guide/",
  "/202620-3/": "/cleansing-sensitive-skin-guide/",
  "/202625-4/": "/cleansing-dry-skin-guide/",
  "/202625-3/": "/mens-lotion-guide/",
  "/202625-2/": "/vitamin-serum-guide/",
  "/252026/": "/whitening-serum-guide/",
  "/202620-2/": "/facepack-guide/",
  "/202625/": "/sheetmask-ranking-guide/",
  "/202620/": "/oralcare-guide/",
};

function loadEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.join(__dirname, "..", ".env.local");
  const envText = fs.readFileSync(envPath, "utf8");

  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const shouldApply = process.argv.includes("--apply");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title")
    .in("slug", Object.keys(LEGACY_SLUG_REDIRECTS))
    .order("slug", { ascending: true });

  if (error) throw error;

  const operations = (data || []).map((row) => ({
    id: row.id,
    from: row.slug,
    to: LEGACY_SLUG_REDIRECTS[row.slug],
    title: row.title,
  }));

  if (!shouldApply) {
    console.log(JSON.stringify({ apply: false, count: operations.length, operations }, null, 2));
    return;
  }

  for (const operation of operations) {
    const { error: updateError } = await supabase
      .from("articles")
      .update({ slug: operation.to })
      .eq("id", operation.id);
    if (updateError) throw updateError;
  }

  console.log(JSON.stringify({ apply: true, count: operations.length, operations }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
