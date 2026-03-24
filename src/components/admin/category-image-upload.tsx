"use client";

import { useState } from "react";
import Image from "next/image";

export function CategoryImageUpload({ categoryId, currentImageUrl }: { categoryId: string; currentImageUrl: string | null }) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    if (file.size > 2 * 1024 * 1024) { alert("2MB以下の画像を選択してください"); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("category_id", categoryId);
    formData.append("image", file);

    const res = await fetch("/api/admin/category-image", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.image_url) {
      setImageUrl(data.image_url);
    } else {
      alert(data.error || "アップロード失敗");
    }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {imageUrl ? (
        <Image src={imageUrl} alt="" width={32} height={32} className="rounded-full object-cover border border-border" style={{ width: 32, height: 32 }} unoptimized />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">?</div>
      )}
      <label className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors ${
        uploading ? "opacity-50 cursor-wait" : "border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
      }`}>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
        {uploading ? "..." : imageUrl ? "変更" : "画像追加"}
      </label>
    </div>
  );
}
