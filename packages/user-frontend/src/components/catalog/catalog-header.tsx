import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface CatalogHeaderProps {
  title: string;
  totalProducts: number;
  activeFilter?: string;
  activeBrand?: string;
  searchQuery?: string;
  categoryBreadcrumbs?: BreadcrumbItem[];
}

export function CatalogHeader({
  title,
  totalProducts,
  activeFilter,
  activeBrand,
  searchQuery,
  categoryBreadcrumbs,
}: CatalogHeaderProps) {
  return (
    <div className="w-full pb-6 border-b border-neutral-200">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-4"
      >
        <Link href="/" className="hover:text-black transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-neutral-300" />
        <Link href="/catalog" className="hover:text-black transition-colors">
          Catalog
        </Link>

        {/* Dynamic Category Ancestor Breadcrumb Trail */}
        {categoryBreadcrumbs &&
          categoryBreadcrumbs.length > 0 &&
          categoryBreadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href || idx}>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              {idx === categoryBreadcrumbs.length - 1 && !activeBrand && !activeFilter && !searchQuery ? (
                <span className="text-neutral-900 font-bold">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-black transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}

        {/* Brand Chip in Breadcrumbs */}
        {activeBrand && (
          <>
            <ChevronRight className="w-3 h-3 text-neutral-300" />
            <span className="text-neutral-900 font-bold">{activeBrand}</span>
          </>
        )}

        {/* Tag / Collection Chip in Breadcrumbs */}
        {activeFilter && (
          <>
            <ChevronRight className="w-3 h-3 text-neutral-300" />
            <span className="text-neutral-900 font-bold capitalize">
              {activeFilter}
            </span>
          </>
        )}

        {/* Search Query in Breadcrumbs */}
        {searchQuery && (
          <>
            <ChevronRight className="w-3 h-3 text-neutral-300" />
            <span className="text-neutral-900">
              Search: &quot;{searchQuery}&quot;
            </span>
          </>
        )}
      </nav>

      {/* Main Title & Meta Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 leading-none">
            {title}
          </h1>
          {searchQuery && (
            <p className="mt-2 text-xs text-neutral-500">
              Showing matching streetwear results for &ldquo;
              <strong className="text-neutral-900">{searchQuery}</strong>
              &rdquo;
            </p>
          )}
        </div>

        <div className="text-xs font-mono font-medium tracking-wider text-neutral-500 uppercase">
          {totalProducts} {totalProducts === 1 ? "Product" : "Products"}
        </div>
      </div>
    </div>
  );
}
