"use client";

import React from "react";
import { Bell, ShieldCheck, IndianRupee } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && (
          <h1 className="text-lg font-bold text-slate-800 leading-tight">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Compliance & Market Tag */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <IndianRupee className="w-3.5 h-3.5" />
          <span>INR Catalog (5% / 12% GST)</span>
        </div>

        {/* Security Status Tag */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role: {user?.role || "ADMIN"}</span>
        </div>

        {/* User initials bubble */}
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30">
          {user?.firstname ? user.firstname[0].toUpperCase() : "A"}
        </div>
      </div>
    </header>
  );
}
