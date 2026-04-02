"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LoginButton } from "@/components/auth-modal";
import { SITE_NAME } from "@/lib/site-config";

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
};

export function SiteHeaderNav({ categories }: { categories: HeaderCategory[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background border-b border-border/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between gap-4 h-12">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="font-display text-xl italic font-bold text-primary tracking-tight">
            {SITE_NAME}
          </span>
          <span
            className="hidden sm:block text-[10px] font-light tracking-[0.2em] uppercase text-muted-foreground"
            style={{ letterSpacing: "0.18em" }}
          >
            Selection
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* 検索アイコン */}
          <Link
            href="/search"
            aria-label="記事を検索"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* ログイン / ユーザーメニュー */}
          <LoginButton />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background px-5">
            <SheetHeader>
              <SheetTitle className="font-display italic text-primary text-lg text-left">
                {SITE_NAME}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-3">
                Categories
              </p>
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                <div className="flex flex-col gap-0.5">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/${category.slug}/`}
                      onClick={() => setOpen(false)}
                      className="px-0 py-3 text-sm text-foreground border-b border-border/50 hover:text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
