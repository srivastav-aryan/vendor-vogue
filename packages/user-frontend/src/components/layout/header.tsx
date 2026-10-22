"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@e-com/shared/types";
import { DEFAULT_NAV_ITEMS } from "@/lib/constants/navigation";
import { TickerBar } from "./ticker";
import { MegaMenu } from "./mega-menu";
import { MobileNavSheet } from "./mobile-nav-sheet";

interface HeaderProps {
  isScrolled?: boolean;
  navItems?: NavigationItem[];
}

export function Header({
  isScrolled = true,
  navItems = DEFAULT_NAV_ITEMS,
}: HeaderProps) {
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const mobileSearchInputRef = React.useRef<HTMLInputElement | null>(null);
  const openTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Compute if header renders light (white) theme
  const isLightMode = isScrolled || activeMenuId !== null || mobileSheetOpen || mobileSearchOpen;

  // Active megamenu data
  const activeNavItem = navItems.find((item) => item.id === activeMenuId);
  const activeSections = activeNavItem?.hasMenu || [];

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

  // Close megamenu on window resize to mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && activeMenuId !== null) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeMenuId]);

  // Focus input when mobile search bar opens
  React.useEffect(() => {
    if (mobileSearchOpen) {
      const timer = setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [mobileSearchOpen]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileSearchOpen(false);
      clearTimers();
      setActiveMenuId(null);
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // When hovering on a nav item
  const handleNavItemMouseEnter = (itemId: string, hasMenu: boolean) => {
    clearTimers();

    if (!hasMenu) {
      closeTimerRef.current = setTimeout(() => {
        setActiveMenuId(null);
      }, 100);
      return;
    }

    if (activeMenuId !== null) {
      setActiveMenuId(itemId);
    } else {
      openTimerRef.current = setTimeout(() => {
        setActiveMenuId(itemId);
      }, 120);
    }
  };

  // When cursor leaves the nav item
  const handleNavItemMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setActiveMenuId(null);
    }, 180);
  };

  const handleMegaMenuMouseEnter = () => {
    clearTimers();
  };

  const handleMegaMenuMouseLeave = () => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => {
      setActiveMenuId(null);
    }, 180);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-all duration-300",
          isLightMode
            ? "bg-white/95 backdrop-blur-md text-neutral-900 border-b border-neutral-200/80 shadow-xs"
            : "bg-gradient-to-b from-black/90 via-black/55 to-transparent text-white border-transparent"
        )}
      >
        {/* Top Announcement Bar */}
        <TickerBar isLightMode={isLightMode} />

        {/* Main Navigation Bar (h-14 on mobile, h-16 on tablet/desktop) */}
        <nav
          className={cn(
            "w-full px-4 sm:px-8 md:px-12 h-14 sm:h-16 flex items-center justify-between relative transition-all duration-300",
            !isLightMode ? "sm:border-t sm:border-white/20 bg-transparent" : "border-t border-transparent bg-transparent"
          )}
        >
          {/* Left Side: Brand Logo + Primary Nav Links */}
          <div className="flex items-center gap-6 sm:gap-8 lg:gap-12 min-w-0">
            {/* Brand Wordmark (whitespace-nowrap & shrink-0 prevent wrapping on narrow viewports) */}
            <Link
              href="/"
              onMouseEnter={() => {
                clearTimers();
                setActiveMenuId(null);
              }}
              className={cn(
                "text-xl sm:text-2xl md:text-3xl font-black font-display tracking-tight uppercase select-none transition-colors shrink-0 whitespace-nowrap",
                !isLightMode && "drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] text-white"
              )}
            >
              Vendor Vogue
            </Link>

            {/* Desktop Nav Items */}
            <ul className="hidden md:flex items-center gap-6 lg:gap-10 text-[13px] md:text-sm font-bold uppercase tracking-wider whitespace-nowrap">
              {navItems.map((item) => {
                const hasMegamenu = Boolean(item.hasMenu && item.hasMenu.length > 0);
                const isActive = activeMenuId === item.id;

                return (
                  <li
                    key={item.id}
                    className="relative py-5 cursor-pointer"
                    onMouseEnter={() => handleNavItemMouseEnter(item.id, hasMegamenu)}
                    onMouseLeave={handleNavItemMouseLeave}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (hasMegamenu) {
                          e.preventDefault();
                          clearTimers();
                          setActiveMenuId(isActive ? null : item.id);
                        }
                      }}
                      className={cn(
                        "transition-colors duration-150 relative py-1",
                        isLightMode
                          ? "text-neutral-800 hover:text-black"
                          : "text-white/95 hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]",
                        isActive && (isLightMode ? "text-black font-extrabold" : "text-white font-extrabold")
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-current transition-all" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Side: Quick Action Utilities */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
            {/* Desktop Quick Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className={cn(
                "hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-sm transition-all duration-200 focus-within:ring-1",
                isLightMode
                  ? "border-neutral-200 bg-neutral-100/60 text-neutral-900 focus-within:border-black focus-within:ring-black/20"
                  : "border-white/40 bg-black/40 backdrop-blur-xs text-white shadow-md focus-within:border-white focus-within:ring-white/30"
              )}
            >
              <Search className="w-4 h-4 opacity-80 shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog..."
                className={cn(
                  "bg-transparent text-sm outline-none w-28 focus:w-44 transition-all placeholder:text-sm placeholder:opacity-70",
                  isLightMode
                    ? "text-neutral-900 placeholder:text-neutral-500"
                    : "text-white placeholder:text-white/80"
                )}
                aria-label="Search catalog"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Mobile / Tablet search icon trigger (toggles responsive inline search bar) */}
            <button
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label={mobileSearchOpen ? "Close search bar" : "Open search bar"}
              aria-expanded={mobileSearchOpen}
              className={cn(
                "lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-full hover:opacity-75 transition-opacity cursor-pointer",
                !isLightMode && "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              )}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Account Icon (accessible 40px+ touch target) */}
            <Link
              href="/account"
              aria-label="Account"
              className={cn(
                "hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center p-2 rounded-full hover:opacity-75 transition-opacity",
                !isLightMode && "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              )}
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Wishlist Icon (accessible 40px+ touch target) */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className={cn(
                "hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center p-2 rounded-full hover:opacity-75 transition-opacity",
                !isLightMode && "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              )}
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart / Bag Icon */}
            <Link
              href="/cart"
              aria-label="Shopping Bag"
              className={cn(
                "relative min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-full hover:opacity-75 transition-opacity",
                !isLightMode && "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              )}
            >
              <ShoppingBag className="w-5 h-5" />
              <span
                className={cn(
                  "absolute top-1 right-1 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center transition-colors shadow-xs pointer-events-none",
                  isLightMode ? "bg-black text-white" : "bg-white text-black"
                )}
              >
                0
              </span>
            </Link>

            {/* Mobile Menu Hamburger Trigger */}
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setMobileSheetOpen(true);
              }}
              aria-label="Open navigation sidebar"
              className={cn(
                "md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-full hover:opacity-75 transition-opacity cursor-pointer",
                !isLightMode && "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
              )}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>

        {/* Responsive Mobile Search Dropdown Bar (< 1024px) */}
        {mobileSearchOpen && (
          <div
            className={cn(
              "lg:hidden w-full px-4 sm:px-8 py-3 border-t transition-all animate-in fade-in slide-in-from-top-2 duration-200",
              isLightMode
                ? "bg-white/95 border-neutral-200 shadow-sm"
                : "bg-black/90 backdrop-blur-md border-white/20 text-white"
            )}
          >
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="flex items-center gap-3 w-full"
            >
              <div
                className={cn(
                  "flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-full border text-sm transition-colors",
                  isLightMode
                    ? "border-neutral-200 bg-neutral-100/80 text-neutral-900"
                    : "border-white/30 bg-white/10 text-white"
                )}
              >
                <Search className="w-4 h-4 opacity-70 shrink-0" />
                <input
                  ref={mobileSearchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog..."
                  className={cn(
                    "w-full bg-transparent text-sm outline-none",
                    isLightMode
                      ? "placeholder:text-neutral-500"
                      : "placeholder:text-white/70"
                  )}
                  aria-label="Search catalog input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                    aria-label="Clear search input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-2 py-1.5 hover:opacity-70 transition-opacity cursor-pointer shrink-0",
                  isLightMode ? "text-neutral-600" : "text-white/80"
                )}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* FULL-WIDTH Desktop Mega Menu Dropdown */}
        <MegaMenu
          isOpen={activeMenuId !== null && activeSections.length > 0}
          sections={activeSections}
          onClose={() => {
            clearTimers();
            setActiveMenuId(null);
          }}
          onMouseEnter={handleMegaMenuMouseEnter}
          onMouseLeave={handleMegaMenuMouseLeave}
        />
      </header>

      {/* Backdrop overlay for MegaMenu */}
      {activeMenuId !== null && activeSections.length > 0 && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-200"
          onClick={() => {
            clearTimers();
            setActiveMenuId(null);
          }}
          aria-hidden="true"
        />
      )}

      {/* shadcn Responsive Mobile Sidebar Modal (Sheet) */}
      <MobileNavSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        navItems={navItems}
      />
    </>
  );
}
