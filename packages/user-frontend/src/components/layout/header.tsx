"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@e-com/shared/types";
import { DEFAULT_NAV_ITEMS } from "@/lib/constants/navigation";
import { MegaMenu } from "./mega-menu";
import { MobileNavSheet } from "./mobile-nav-sheet";

interface HeaderProps {
  isScrolled?: boolean;
  navItems?: NavigationItem[];
}

export function Header({
  isScrolled = false,
  navItems = DEFAULT_NAV_ITEMS,
}: HeaderProps) {
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const openTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Header turns white when user scrolls past hero OR when megamenu/search is open
  const isWhiteMode = isScrolled || activeMenuId !== null || searchOverlayOpen;

  const clearTimers = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  // Close menus on resize or Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOverlayOpen(false);
        setActiveMenuId(null);
      }
    };
    const handleResize = () => {
      if (window.innerWidth < 768 && activeMenuId !== null) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeMenuId]);

  // Focus input when search opens
  React.useEffect(() => {
    if (searchOverlayOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [searchOverlayOpen]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOverlayOpen(false);
      clearTimers();
      setActiveMenuId(null);
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Dynamic sections from active nav item
  const activeNavItem = navItems.find((item) => item.id === activeMenuId);
  const activeSections = activeNavItem?.hasMenu || [];

  const handleNavMouseEnter = (itemId: string, hasMenu: boolean) => {
    clearTimers();
    if (!hasMenu) {
      closeTimerRef.current = setTimeout(() => setActiveMenuId(null), 120);
      return;
    }
    if (activeMenuId !== null) {
      setActiveMenuId(itemId);
    } else {
      openTimerRef.current = setTimeout(() => setActiveMenuId(itemId), 100);
    }
  };

  const handleNavMouseLeave = () => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => setActiveMenuId(null), 180);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-out",
          isWhiteMode
            ? "bg-white/95 backdrop-blur-md text-neutral-900 border-b border-neutral-200/80 shadow-xs"
            : "bg-transparent text-white border-transparent"
        )}
      >
        <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16 h-16 sm:h-20 flex items-center justify-between">
          {/* Left: Brand + Dynamic Backend Categories */}
          <div className="flex items-center gap-6 sm:gap-10 lg:gap-16 min-w-0">
            {/* Brand Logo */}
            <Link
              href="/"
              onClick={() => {
                clearTimers();
                setActiveMenuId(null);
              }}
              className={cn(
                "text-sm sm:text-base md:text-lg font-bold uppercase tracking-[0.18em] sm:tracking-[0.22em] select-none whitespace-nowrap transition-colors shrink-0",
                isWhiteMode ? "text-black" : "text-white drop-shadow-sm"
              )}
            >
              VENDOR VOGUE
            </Link>

            {/* Dynamic Backend Categories (Desktop only: Men, Women, etc.) */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-10 text-xs uppercase tracking-[0.22em] font-medium whitespace-nowrap">
              {navItems.map((item) => {
                const hasMenu = Boolean(item.hasMenu && item.hasMenu.length > 0);
                const isActive = activeMenuId === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative py-4"
                    onMouseEnter={() => handleNavMouseEnter(item.id, hasMenu)}
                    onMouseLeave={handleNavMouseLeave}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "transition-colors duration-200 relative py-1",
                        isWhiteMode
                          ? "text-neutral-700 hover:text-black"
                          : "text-white/90 hover:text-white drop-shadow-sm",
                        isActive && (isWhiteMode ? "text-black font-bold" : "text-white font-bold")
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <span
                          className={cn(
                            "absolute bottom-0 left-0 w-full h-[1.5px] transition-all",
                            isWhiteMode ? "bg-black" : "bg-white"
                          )}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 text-xs uppercase tracking-[0.2em] font-medium shrink-0">
            {/* SEARCH - Desktop & Tablet only */}
            <button
              type="button"
              onClick={() => setSearchOverlayOpen((prev) => !prev)}
              className={cn(
                "hidden md:inline-block tracking-[0.22em] transition-colors cursor-pointer",
                isWhiteMode ? "text-neutral-700 hover:text-black" : "text-white/90 hover:text-white drop-shadow-sm"
              )}
              aria-label="Open search input"
            >
              SEARCH
            </button>

            {/* ♡ Wishlist - Desktop & Tablet only */}
            <Link
              href="/wishlist"
              className={cn(
                "hidden md:inline-block text-base leading-none transition-colors",
                isWhiteMode ? "text-neutral-700 hover:text-black" : "text-white/90 hover:text-white drop-shadow-sm"
              )}
              aria-label="Wishlist"
            >
              ♡
            </Link>

            {/* BAG - Always visible, clean and non-clustered */}
            <Link
              href="/cart"
              className={cn(
                "tracking-[0.2em] transition-colors cursor-pointer py-1",
                isWhiteMode ? "text-neutral-900 hover:text-black font-semibold" : "text-white/90 hover:text-white drop-shadow-sm"
              )}
              aria-label="Shopping bag"
            >
              BAG
            </Link>

            {/* Mobile Menu Trigger (Hamburger) */}
            <button
              type="button"
              onClick={() => setMobileSheetOpen(true)}
              className={cn(
                "md:hidden p-1 transition-colors cursor-pointer",
                isWhiteMode ? "text-black hover:opacity-70" : "text-white hover:opacity-80"
              )}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Minimal Search Overlay */}
        {searchOverlayOpen && (
          <div
            className={cn(
              "absolute top-full left-0 w-full px-6 sm:px-12 md:px-16 py-6 animate-in fade-in slide-in-from-top-1 duration-200 border-b",
              isWhiteMode
                ? "bg-white text-black border-neutral-200 shadow-lg"
                : "bg-[#090909]/95 text-white border-white/[0.08]"
            )}
          >
            <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto flex items-center gap-4">
              <SearchIcon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isWhiteMode ? "text-neutral-400" : "text-white/40"
                )}
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH CATALOG..."
                aria-label="Search catalog input"
                className={cn(
                  "w-full bg-transparent text-sm sm:text-base tracking-[0.2em] uppercase outline-none",
                  isWhiteMode
                    ? "text-neutral-900 placeholder:text-neutral-400"
                    : "text-white placeholder:text-white/30"
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={cn(
                    "text-xs uppercase tracking-wider",
                    isWhiteMode ? "text-neutral-400 hover:text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  CLEAR
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOverlayOpen(false)}
                className={cn(
                  "p-1",
                  isWhiteMode ? "text-neutral-400 hover:text-black" : "text-white/50 hover:text-white"
                )}
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Mega Menu Dropdown */}
        <MegaMenu
          isOpen={Boolean(activeMenuId && activeSections.length > 0)}
          sections={activeSections}
          onClose={() => {
            clearTimers();
            setActiveMenuId(null);
          }}
          onMouseEnter={clearTimers}
          onMouseLeave={handleNavMouseLeave}
        />
      </header>

      {/* Backdrop for open Mega Menu */}
      {activeMenuId && activeSections.length > 0 && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-200"
          onClick={() => {
            clearTimers();
            setActiveMenuId(null);
          }}
          aria-hidden="true"
        />
      )}

      {/* Mobile Nav Sheet Drawer */}
      <MobileNavSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        navItems={navItems}
      />
    </>
  );
}
