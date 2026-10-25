import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  searchParams,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        params.set(key, value);
      }
    }
    params.set("page", String(pageNumber));
    return `/catalog?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Catalog Pagination"
      className="flex items-center justify-center gap-1.5 pt-12 select-none"
    >
      {/* Previous Page */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="inline-flex h-9 w-9 items-center justify-center border border-neutral-300 text-xs font-bold text-neutral-800 hover:border-black hover:text-black transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span
          className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 text-xs text-neutral-300 cursor-not-allowed"
          aria-disabled="true"
        >
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {/* Numbered Pages */}
      {pages.map((p) => {
        const isCurrent = p === currentPage;
        return isCurrent ? (
          <span
            key={`page-${p}`}
            aria-current="page"
            className="inline-flex h-9 w-9 items-center justify-center bg-black text-white text-xs font-bold font-mono"
          >
            {p}
          </span>
        ) : (
          <Link
            key={`page-${p}`}
            href={createPageUrl(p)}
            className="inline-flex h-9 w-9 items-center justify-center border border-neutral-300 text-xs font-bold font-mono text-neutral-800 hover:border-black hover:text-black transition-colors"
          >
            {p}
          </Link>
        );
      })}

      {/* Next Page */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="inline-flex h-9 w-9 items-center justify-center border border-neutral-300 text-xs font-bold text-neutral-800 hover:border-black hover:text-black transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span
          className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 text-xs text-neutral-300 cursor-not-allowed"
          aria-disabled="true"
        >
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
