"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { NavigationItem } from "@e-com/shared/types";
import { EDITORIAL_QUICK_LINKS } from "@/lib/constants/navigation";
import { User, Heart, Globe, Search, X } from "lucide-react";

interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavigationItem[];
}

export function MobileNavSheet({
  open,
  onOpenChange,
  navItems,
}: MobileNavSheetProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenChange(false);
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Collect all items with submenus
  const itemsWithMenu = navItems.filter(
    (item) => Boolean(item.hasMenu && item.hasMenu.length > 0)
  );
  const itemsWithoutMenu = navItems.filter(
    (item) => !item.hasMenu || item.hasMenu.length === 0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-neutral-200 text-left">
          <SheetTitle className="text-xl font-black font-display uppercase tracking-tight">
            Vendor Vogue
          </SheetTitle>
          <SheetDescription className="text-xs text-neutral-500 uppercase tracking-widest">
            Storefront Navigation
          </SheetDescription>
        </SheetHeader>

        {/* Search Bar inside Drawer */}
        <div className="px-6 pt-4 pb-1">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-neutral-200 bg-neutral-100/70 text-sm focus-within:border-neutral-900 focus-within:bg-white transition-colors"
          >
            <Search className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400 placeholder:text-xs"
              aria-label="Search catalog in drawer"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-neutral-400 hover:text-black p-0.5"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {/* Section 1: Bold Editorial Quick Links (Nude Project Style) */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Featured Highlights
            </p>
            <div className="flex flex-col space-y-2.5">
              {EDITORIAL_QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center justify-between text-xl sm:text-2xl font-black font-display tracking-tight hover:text-neutral-500 transition-colors"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-xs bg-neutral-900 text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <hr className="border-neutral-200" />

          {/* Section 2: Collapsible Category Tree (shadcn Accordion) */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Categories
            </p>
            <Accordion type="single" collapsible className="w-full">
              {itemsWithMenu.map((navItem) =>
                navItem.hasMenu?.map((section, idx) => (
                  <AccordionItem
                    key={`${navItem.id}-${section.name}`}
                    value={`section-${navItem.id}-${idx}`}
                  >
                    <AccordionTrigger className="text-sm font-bold uppercase tracking-wider py-3 hover:no-underline">
                      {itemsWithMenu.length > 1
                        ? `${navItem.label} · ${section.name}`
                        : section.name}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2.5 pt-1 pb-2 pl-3 border-l-2 border-neutral-200">
                        {section.items.map((subItem) => (
                          <li key={subItem.id}>
                            <Link
                              href={subItem.href}
                              onClick={() => onOpenChange(false)}
                              className="inline-flex items-center justify-between w-full text-xs text-neutral-700 hover:text-black font-medium"
                            >
                              <span>{subItem.label}</span>
                              {subItem.badge && (
                                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-xs bg-neutral-100 text-neutral-800 border border-neutral-200">
                                  {subItem.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </div>

          {/* Section 3: Root Level Navigation Links Without Submenus */}
          {itemsWithoutMenu.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              {itemsWithoutMenu.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-black"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer Utilities */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50/70 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link
              href="/account"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-2 font-medium text-neutral-700 hover:text-black min-h-[44px]"
            >
              <User className="w-4 h-4" />
              <span>My Account</span>
            </Link>
            <Link
              href="/wishlist"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-2 font-medium text-neutral-700 hover:text-black min-h-[44px]"
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist</span>
            </Link>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/60">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>United States (USD $)</span>
            </span>
            <span>English</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
