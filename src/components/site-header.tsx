"use client";

import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/kosui/osusume/", label: "化粧水" },
  { href: "/bijyueki/osusume/", label: "美容液" },
  { href: "/protein/osusume/", label: "プロテイン" },
  { href: "/vitamin/osusume/", label: "ビタミン" },
  { href: "/supplement/osusume/", label: "サプリメント" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold text-primary">Best Item</span>
          <span className="text-xs text-muted-foreground hidden sm:block">おすすめ商品比較</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="text-primary">カテゴリ</SheetTitle>
            </SheetHeader>
            <Separator className="my-3" />
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
