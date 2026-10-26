"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search as SearchIcon, User as UserIcon, LogOut, ChevronDown, Loader2, MapPin, Package, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@e-com/shared/types";
import { DEFAULT_NAV_ITEMS } from "@/lib/constants/navigation";
import { MegaMenu } from "./mega-menu";
import { MobileNavSheet } from "./mobile-nav-sheet";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useCartStore } from "@/lib/store/cart-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useHydratedStore } from "@/lib/store/use-store";

interface HeaderProps {
  isScrolled?: boolean;
  navItems?: NavigationItem[];
}

export function Header({
  isScrolled,
  navItems = DEFAULT_NAV_ITEMS,
}: HeaderProps) {
  const router = useRouter();
  const [internalScrolled, setInternalScrolled] = React.useState(false);

  React.useEffect(() => {
    if (isScrolled !== undefined) return;
    const handleScroll = () => {
      const past = window.scrollY > 40;
      setInternalScrolled((prev) => (prev !== past ? past : prev));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const isHydrated = useHydratedStore(useAuthStore, () => true) ?? false;
  const { user, isAuthenticated, logout } = useAuthStore();
  const [accountMenuOpen, setAccountMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement | null>(null);

  const setCartDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const totalCartCount = useHydratedStore(useCartStore, (s) =>
    s.items.reduce((acc, i) => acc + i.quantity, 0)
  ) ?? 0;

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const openTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Close account menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setAccountMenuOpen(false);
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Header turns white when user scrolls past hero OR when megamenu/search/account is open
  const activeScrolled = isScrolled !== undefined ? isScrolled : internalScrolled;
  const isWhiteMode = activeScrolled || activeMenuId !== null || searchOverlayOpen || accountMenuOpen;

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
                    {hasMenu ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          clearTimers();
                          setActiveMenuId(activeMenuId === item.id ? null : item.id);
                        }}
                        className={cn(
                          "transition-colors duration-200 relative py-1 cursor-pointer bg-transparent border-none text-xs uppercase tracking-[0.22em] font-medium p-0 select-none",
                          isWhiteMode
                            ? "text-neutral-700 hover:text-black"
                            : "text-white/90 hover:text-white drop-shadow-sm",
                          isActive && (isWhiteMode ? "text-black font-bold" : "text-white font-bold")
                        )}
                        aria-expanded={isActive}
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
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => {
                          clearTimers();
                          setActiveMenuId(null);
                        }}
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
                    )}
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

            {/* ACCOUNT / LOG IN */}
            {!isHydrated ? (
              <div className="hidden md:inline-block w-16 h-4 bg-transparent" />
            ) : isAuthenticated ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className={cn(
                    "hidden md:inline-flex items-center gap-1.5 tracking-[0.22em] transition-colors cursor-pointer py-1 font-medium select-none",
                    isWhiteMode ? "text-neutral-800 hover:text-black" : "text-white/90 hover:text-white drop-shadow-sm"
                  )}
                  aria-expanded={accountMenuOpen}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{user?.firstname ? user.firstname.toUpperCase() : "ACCOUNT"}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", accountMenuOpen && "rotate-180")} />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-72 bg-white text-neutral-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-neutral-200/90 p-4 animate-in fade-in zoom-in-95 duration-150 z-50">
                    {/* User Identity Header */}
                    <div className="pb-3.5 mb-2 border-b border-neutral-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-400">
                          CLIENT ARCHIVE
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-neutral-100 text-neutral-700 tracking-wider font-semibold">
                          MEMBER
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-mono text-[11px] font-bold shrink-0 tracking-wider">
                          {((user?.firstname?.[0] || "") + (user?.lastname?.[0] || "")).toUpperCase() || "VV"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-black truncate leading-tight">
                            {user?.firstname} {user?.lastname}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono truncate mt-0.5">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1 space-y-0.5 text-[11px] uppercase tracking-[0.2em] font-medium">
                      <Link
                        href="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between px-2.5 py-2 text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" />
                          <span>PROFILE & ACCOUNT</span>
                        </div>
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-400 group-hover:text-black" />
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between px-2.5 py-2 text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" />
                          <span>SAVED ADDRESSES</span>
                        </div>
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-400 group-hover:text-black" />
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between px-2.5 py-2 text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Package className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors" />
                          <span>MY ORDERS</span>
                        </div>
                        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-400 group-hover:text-black" />
                      </Link>
                    </div>

                    {/* Sign Out Action */}
                    <div className="pt-2 mt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full px-2.5 py-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <LogOut className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-700 group-hover:-translate-x-0.5 transition-all" />
                          <span>{isLoggingOut ? "SIGNING OUT..." : "LOG OUT"}</span>
                        </div>
                        {isLoggingOut && <Loader2 className="w-3 h-3 animate-spin text-rose-600" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "hidden md:inline-flex items-center gap-1.5 tracking-[0.22em] transition-colors cursor-pointer py-1",
                  isWhiteMode ? "text-neutral-700 hover:text-black" : "text-white/90 hover:text-white drop-shadow-sm"
                )}
              >
                <span>LOG IN</span>
              </Link>
            )}

            {/* BAG Button: Opens Cart Drawer directly */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 tracking-[0.2em] transition-colors cursor-pointer py-1 font-semibold",
                isWhiteMode ? "text-neutral-900 hover:text-black" : "text-white/90 hover:text-white drop-shadow-sm"
              )}
              aria-label={`Shopping bag (${totalCartCount} items)`}
            >
              <span>BAG</span>
              {totalCartCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-black text-white rounded-xs">
                  {totalCartCount}
                </span>
              )}
            </button>

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

      {/* Slide-out Shopping Bag Drawer */}
      <CartDrawer />
    </>
  );
}
