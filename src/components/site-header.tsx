"use client";

import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navItems = [
  { href: "/kosui/", label: "化粧水" },
  { href: "/bijyueki/", label: "美容液" },
  { href: "/protein/", label: "プロテイン" },
  { href: "/vitamin/", label: "ビタミン" },
  { href: "/supplement/", label: "サプリ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background border-b border-border/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-12">

        {/* Logo — Playfair Display italic for editorial feel */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="font-display text-xl italic font-bold text-primary tracking-tight">
            Best Item
          </span>
          <span
            className="hidden sm:block text-[10px] font-light tracking-[0.2em] uppercase text-muted-foreground"
            style={{ letterSpacing: "0.18em" }}
          >
            Selection
          </span>
        </Link>

        {/* Desktop nav — thin, spaced uppercase */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-56 bg-background">
            <SheetHeader>
              <SheetTitle className="font-display italic text-primary text-lg text-left">
                Best Item
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-0 py-3 text-sm text-foreground border-b border-border/50 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
