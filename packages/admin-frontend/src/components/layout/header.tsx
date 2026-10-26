"use client";

import React from "react";
import { Menu, ShieldCheck, IndianRupee, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  title?: string;
  description?: string;
  onOpenMobileMenu?: () => void;
}

export function Header({ title, description, onOpenMobileMenu }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand indicator (when sidebar is hidden on mobile) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">
            Vendor Vogue
          </span>
        </div>

        {/* Desktop Title & Subtitle */}
        <div className="hidden lg:block">
          {title && (
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Compliance & Market Tag (hidden on small phone viewports) */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <IndianRupee className="w-3.5 h-3.5" />
          <span>INR Catalog (5% / 12% GST)</span>
        </div>

        {/* Security Status Tag (hidden on extra small screens) */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{user?.role || "ADMIN"}</span>
        </div>

        {/* User initials bubble */}
        <div
          title={user?.email || "Admin User"}
          className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30 shrink-0"
        >
          {user?.firstname ? user.firstname[0].toUpperCase() : "A"}
        </div>
      </div>
    </header>
  );
}
