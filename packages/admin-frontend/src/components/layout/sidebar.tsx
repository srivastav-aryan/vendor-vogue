"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  FolderTree,
  Shirt,
  ShoppingBag,
  Sparkles,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Brands",
    href: "/catalog/brands",
    icon: Tag,
  },
  {
    title: "Categories",
    href: "/catalog/categories",
    icon: FolderTree,
  },
  {
    title: "Products & Variants",
    href: "/catalog/products",
    icon: Shirt,
  },
  {
    title: "Orders & Fulfillment",
    href: "/orders",
    icon: ShoppingBag,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-300">
      {/* Brand Logo & Name */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/50">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-white tracking-tight text-sm">
            Vendor Vogue
          </span>
          <span className="block text-[10px] font-medium tracking-wider text-emerald-400 uppercase">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Catalog & Operations
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20"
                  : "hover:bg-slate-800/80 hover:text-white text-slate-400"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive
                    ? "text-emerald-400"
                    : "text-slate-400 group-hover:text-white"
                )}
              />
              <span className="flex-1">{item.title}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Active User Footprint & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="truncate pr-2">
            <div className="text-xs font-semibold text-white truncate">
              {user ? `${user.firstname} ${user.lastname}` : "Platform Admin"}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {user?.email || "admin@vendorvogue.com"}
            </div>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {user?.role || "ADMIN"}
          </span>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
