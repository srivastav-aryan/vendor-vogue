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
import { Search, X } from "lucide-react";

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

  const itemsWithMenu = navItems.filter(
    (item) => Boolean(item.hasMenu && item.hasMenu.length > 0)
  );
  const itemsWithoutMenu = navItems.filter(
    (item) => !item.hasMenu || item.hasMenu.length === 0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[88vw] sm:max-w-md p-0 flex flex-col bg-[#070707] text-white border-r border-white/[0.08]"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-white/[0.08] text-left">
          <SheetTitle className="text-sm font-bold uppercase tracking-[0.25em] text-white">
            VENDOR VOGUE
          </SheetTitle>
          <SheetDescription className="text-[10px] font-mono text-white/40 uppercase tracking-[0.25em]">
            FW26 CAMPAIGN & CATALOG
          </SheetDescription>
        </SheetHeader>

        {/* Minimal Search Bar inside Drawer */}
        <div className="px-6 pt-5 pb-2">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex items-center gap-3 px-3 py-2 border-b border-white/20 bg-transparent text-sm focus-within:border-white transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CATALOG..."
              className="w-full bg-transparent text-xs tracking-widest uppercase outline-none placeholder:text-white/30 text-white"
              aria-label="Search catalog in drawer"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-white/40 hover:text-white p-0.5"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Primary Quick Department Links (Dynamic from backend navItems) */}
          <div className="flex items-center gap-6 pb-4 border-b border-white/[0.08]">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className="text-xs font-semibold uppercase tracking-[0.25em] text-white/90 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Section 1: Editorial Highlights */}
          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
              EDITORIAL DROPS
            </p>
            <div className="flex flex-col space-y-3">
              {EDITORIAL_QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center justify-between text-xl font-bold font-display uppercase tracking-tight text-white/90 hover:text-white transition-colors"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border border-white/20 text-white/60">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.08]" />

          {/* Section 2: Collapsible Category Tree */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
              COLLECTIONS
            </p>
            <Accordion type="single" collapsible className="w-full">
              {itemsWithMenu.map((navItem) =>
                navItem.hasMenu?.map((section, idx) => (
                  <AccordionItem
                    key={`${navItem.id}-${section.name}`}
                    value={`section-${navItem.id}-${idx}`}
                    className="border-white/[0.08]"
                  >
                    <AccordionTrigger className="text-xs font-medium uppercase tracking-[0.2em] py-3 text-white/80 hover:text-white hover:no-underline">
                      {section.name}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pb-2 pl-2">
                        {section.items.map((subItem) => (
                          <li key={subItem.id}>
                            <Link
                              href={subItem.href}
                              onClick={() => onOpenChange(false)}
                              className="text-xs uppercase tracking-wider text-white/50 hover:text-white transition-colors block py-1"
                            >
                              {subItem.label}
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
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-white/[0.08] text-[10px] font-mono uppercase tracking-[0.25em] text-white/40 flex justify-between items-center">
          <span>FW26 / MUMBAI</span>
          <span>VENDOR VOGUE</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
