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
import { Search, X, User, LogOut, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useHydratedStore } from "@/lib/store/use-store";

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
  const isHydrated = useHydratedStore(useAuthStore, () => true) ?? false;
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onOpenChange(false);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

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
            {navItems.map((item) => {
              const hasMenu = Boolean(item.hasMenu && item.hasMenu.length > 0);
              if (hasMenu) {
                return (
                  <span
                    key={item.id}
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40 select-none cursor-default"
                  >
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="text-xs font-semibold uppercase tracking-[0.25em] text-white/90 hover:text-white"
                >
                  {item.label}
                </Link>
              );
            })}
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

        {/* User Account / Auth Section */}
        <div className="p-6 border-t border-white/[0.08] bg-white/[0.02]">
          {!isHydrated ? (
            <div className="h-10 w-full bg-white/[0.03] animate-pulse rounded-none" />
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-mono text-xs font-bold">
                  {user?.firstname?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-white truncate">
                    {user?.firstname} {user?.lastname}
                  </p>
                  <p className="text-[10px] text-white/50 font-mono truncate">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs uppercase tracking-[0.2em] pt-2">
                <Link
                  href="/account"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between text-white/70 hover:text-white py-1.5 transition-colors"
                >
                  <span>PROFILE & ACCOUNT</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                </Link>
                <Link
                  href="/account/addresses"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between text-white/70 hover:text-white py-1.5 transition-colors"
                >
                  <span>SAVED ADDRESSES</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between text-white/70 hover:text-white py-1.5 transition-colors"
                >
                  <span>MY ORDERS</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                </Link>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>{isLoggingOut ? "SIGNING OUT..." : "LOG OUT"}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-[0.25em] transition-colors"
            >
              <User className="w-4 h-4" />
              <span>LOG IN / REGISTER</span>
            </Link>
          )}
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
