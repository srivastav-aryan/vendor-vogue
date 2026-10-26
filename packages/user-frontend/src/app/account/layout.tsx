"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, MapPin, Package, LogOut, Loader2, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Header } from "@/components/layout/header";
import { getUserOrders } from "@/lib/api/orders";
import { cn } from "@/lib/utils";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isInitialized, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [ordersCount, setOrdersCount] = React.useState<number | undefined>(undefined);

  // Fetch real order count dynamically
  React.useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    getUserOrders({ limit: 1 })
      .then((res) => {
        if (isMounted) {
          const total = res.pagination?.total ?? res.pagination?.totalCount ?? res.items.length;
          setOrdersCount(total);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, pathname]);

  // Authentication Guard
  React.useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/account")}`);
    }
  }, [isInitialized, isLoading, isAuthenticated, router, pathname]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Hydration skeleton
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Header isScrolled={true} />
        <div className="flex-1 max-w-5xl w-full mx-auto px-6 pt-32 pb-20">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-28 bg-neutral-200" />
            <div className="h-8 w-60 bg-neutral-200" />
            <div className="h-10 w-full bg-neutral-200" />
            <div className="h-64 w-full bg-neutral-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const userInitials =
    ((user.firstname?.[0] || "") + (user.lastname?.[0] || "")).toUpperCase() || "VV";

  const navTabs = [
    { label: "PROFILE", href: "/account", icon: User, count: undefined },
    { label: "ADDRESSES", href: "/account/addresses", icon: MapPin, count: user.addresses?.length ?? 0 },
    { label: "ORDERS", href: "/account/orders", icon: Package, count: ordersCount },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col">
      <Header isScrolled={true} />

      <main className="flex-1 pt-24 sm:pt-28 pb-24">
        {/* Account Header Banner */}
        <section className="bg-white border-b border-neutral-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 pt-6 sm:pt-10">
            {/* Breadcrumb Eyebrow */}
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400 mb-6">
              <Link href="/" className="hover:text-black transition-colors">
                HOME
              </Link>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-neutral-900 font-semibold">CLIENT PORTAL</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8">
              {/* Client Profile Identity Block */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black text-white flex items-center justify-center font-mono text-base sm:text-lg font-bold tracking-wider shrink-0 shadow-sm">
                  {userInitials}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400">
                      CLIENT ID: {user.id ? user.id.slice(0, 8).toUpperCase() : "MEMBER"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-700 font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>AUTHENTICATED CLIENT</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-[0.06em] text-black truncate">
                    {user.firstname} {user.lastname}
                  </h1>

                  <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 flex-wrap">
                    <span>{user.email}</span>
                    {user.phone && (
                      <>
                        <span className="text-neutral-300">•</span>
                        <span>{user.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sign Out Action */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] border border-rose-200/90 bg-rose-50/50 text-rose-600 hover:text-rose-700 hover:bg-rose-100/70 hover:border-rose-300 transition-colors disabled:opacity-50 cursor-pointer shadow-xs group"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                ) : (
                  <LogOut className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-700 group-hover:-translate-x-0.5 transition-transform" />
                )}
                <span>{isLoggingOut ? "SIGNING OUT..." : "SIGN OUT"}</span>
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-6 sm:gap-8 border-t border-neutral-100 overflow-x-auto scrollbar-none">
              {navTabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "inline-flex items-center gap-2 py-3.5 text-xs font-bold uppercase tracking-[0.22em] whitespace-nowrap transition-all border-b-2",
                      isActive
                        ? "border-black text-black"
                        : "border-transparent text-neutral-400 hover:text-black"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1.5 py-0.2 rounded-xs font-semibold",
                          isActive
                            ? "bg-black text-white"
                            : "bg-neutral-100 text-neutral-600"
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dynamic Route Content */}
        <section className="max-w-5xl mx-auto px-6 sm:px-8 pt-8 sm:pt-10">
          {children}
        </section>
      </main>
    </div>
  );
}
