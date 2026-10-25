"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp } from "lucide-react";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest Drops" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

interface CatalogSortProps {
  currentSort?: string;
}

export function CatalogSort({ currentSort = "featured" }: CatalogSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (newSort === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    params.set("page", "1"); // Reset to page 1 on sort change

    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <ArrowDownUp className="w-3.5 h-3.5 mr-1 text-neutral-400" />
        Sort:
      </span>
      <select
        value={currentSort}
        onChange={handleSortChange}
        aria-label="Sort products"
        className="h-9 px-3 text-xs font-semibold uppercase tracking-wider bg-white border border-neutral-300 rounded-none text-neutral-900 focus:outline-none focus:border-black cursor-pointer"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
