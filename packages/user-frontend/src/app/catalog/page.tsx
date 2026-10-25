import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ProductCard } from "@/components/home/product-card";
import { getStorefrontNavigation } from "@/lib/api/categories";
import { getStorefrontBrands } from "@/lib/api/brands";
import { getCatalogProducts } from "@/lib/api/products";
import { CatalogHeader, type BreadcrumbItem } from "@/components/catalog/catalog-header";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogSort } from "@/components/catalog/catalog-sort";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { Button } from "@/components/ui/button";
import type { NavigationItem } from "@e-com/shared/types";

export const revalidate = 60; // ISR cache for 1 minute

interface CatalogPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    categoryId?: string;
    category?: string;
    brandId?: string;
    brand?: string;
    tags?: string;
    filter?: string;
    search?: string;
    q?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

/**
 * Resolves ancestor category breadcrumb trail based on current categoryId and navigation tree
 */
function resolveCategoryBreadcrumbs(
  navItems: NavigationItem[],
  categoryId?: string
): BreadcrumbItem[] {
  if (!categoryId) return [];
  const normalized = categoryId.toLowerCase().trim();

  for (const root of navItems) {
    const rootMatches =
      root.id.toLowerCase() === normalized ||
      root.id.toLowerCase().replace(/^nav-/, "") === normalized ||
      root.label.toLowerCase() === normalized;

    if (rootMatches) {
      return [
        {
          label: root.label,
          href: `/catalog?categoryId=${encodeURIComponent(root.id.replace(/^nav-/, ""))}`,
        },
      ];
    }

    if (root.hasMenu) {
      for (const section of root.hasMenu) {
        if (section.name.toLowerCase() === normalized) {
          return [
            {
              label: root.label,
              href: `/catalog?categoryId=${encodeURIComponent(root.id.replace(/^nav-/, ""))}`,
            },
            {
              label: section.name,
              href: `/catalog?categoryId=${encodeURIComponent(section.name.toLowerCase())}`,
            },
          ];
        }

        for (const item of section.items) {
          const itemMatches =
            item.id.toLowerCase() === normalized ||
            item.id.toLowerCase().replace(/^nav-/, "") === normalized ||
            item.label.toLowerCase() === normalized ||
            item.href.endsWith(`/${normalized}`);

          if (itemMatches) {
            return [
              {
                label: root.label,
                href: `/catalog?categoryId=${encodeURIComponent(root.id.replace(/^nav-/, ""))}`,
              },
              {
                label: section.name,
                href: `/catalog?categoryId=${encodeURIComponent(section.name.toLowerCase())}`,
              },
              {
                label: item.label,
                href: `/catalog?categoryId=${encodeURIComponent(item.id)}`,
              },
            ];
          }
        }
      }
    }
  }

  // Fallback for custom or backend-only category identifiers
  const fallbackLabel = categoryId
    .replace(/^cat-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return [{ label: fallbackLabel, href: `/catalog?categoryId=${encodeURIComponent(categoryId)}` }];
}

export async function generateMetadata({
  searchParams,
}: CatalogPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const search = sp.search || sp.q;
  const tag = sp.tags || sp.filter;
  const brand = sp.brandId || sp.brand;

  let title = "Catalog - Shop All";
  if (search) {
    title = `Search results for "${search}" | Catalog`;
  } else if (brand) {
    title = `${brand.toUpperCase()} | Catalog`;
  } else if (tag) {
    title = `${tag.toUpperCase()} Streetwear | Catalog`;
  }

  return {
    title: `${title} | Vendor Vogue`,
    description:
      "Explore the complete Vendor Vogue streetwear catalog. Heavyweight cotton tees, thermal waffle knitwear, tactical cargos, and boxy oversized outerwear.",
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const sp = await searchParams;

  const page = Number(sp.page) || 1;
  const limit = Number(sp.limit) || 12;
  const rawTag = sp.tags || sp.filter;
  const tags = rawTag === "bestsellers" ? "bestseller" : rawTag;
  const search = sp.search || sp.q;
  const sort = sp.sort || "featured";
  const categoryId = sp.categoryId || sp.category;
  const brandId = sp.brandId || sp.brand;
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  // Fetch navigation, brands & catalog products in parallel on the server
  const [navItems, brands, catalogResult] = await Promise.all([
    getStorefrontNavigation(),
    getStorefrontBrands(),
    getCatalogProducts({
      page,
      limit,
      categoryId,
      brandId,
      tags,
      search,
      sort,
      minPrice,
      maxPrice,
    }),
  ]);

  // Resolve category ancestor breadcrumbs
  const categoryBreadcrumbs = resolveCategoryBreadcrumbs(navItems, categoryId);

  // Resolve active brand display name
  const matchedBrand = brands.find(
    (b) =>
      b.id.toLowerCase() === (brandId || "").toLowerCase() ||
      b.slug.toLowerCase() === (brandId || "").toLowerCase()
  );
  const activeBrandName = matchedBrand
    ? matchedBrand.name
    : brandId
      ? brandId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : undefined;

  // Derive dynamic page heading
  let pageHeading = "All Products";
  if (search) {
    pageHeading = `Search: "${search}"`;
  } else if (activeBrandName && !tags) {
    pageHeading = activeBrandName;
  } else if (tags === "bestseller") {
    pageHeading = "Bestsellers";
  } else if (tags === "trending") {
    pageHeading = "Trending Drops";
  } else if (tags === "limited") {
    pageHeading = "Limited Edition";
  } else if (tags === "new-arrival") {
    pageHeading = "New Arrivals";
  } else if (categoryBreadcrumbs.length > 0) {
    pageHeading = categoryBreadcrumbs[categoryBreadcrumbs.length - 1].label;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Header Navigation (White mode on Catalog) */}
      <Header isScrolled={true} navItems={navItems} />

      {/* Main Catalog Viewport */}
      <main id="main-content" className="pt-24 md:pt-28 pb-20">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* 1. Header with Breadcrumbs & Product Count */}
          <CatalogHeader
            title={pageHeading}
            totalProducts={catalogResult.pagination.totalCount ?? catalogResult.pagination.total}
            activeFilter={tags}
            activeBrand={activeBrandName}
            searchQuery={search}
            categoryBreadcrumbs={categoryBreadcrumbs}
          />

          {/* 2. Top Filter Controls Bar (Mobile Drawer Trigger + Sort Select) */}
          <div className="py-4 flex items-center justify-between border-b border-neutral-200 mb-8">
            <CatalogFilters
              mode="mobile"
              navItems={navItems}
              brands={brands}
              activeCategory={categoryId}
              activeBrandId={brandId}
              activeTags={tags}
              activeMinPrice={minPrice}
              activeMaxPrice={maxPrice}
              searchQuery={search}
            />

            <CatalogSort currentSort={sort} />
          </div>

          {/* 3. Main Catalog Content Area: Sidebar + Product Grid */}
          <div className="flex gap-10 items-start">
            {/* Desktop Left Sidebar Filter Column */}
            <div className="hidden lg:block w-64 shrink-0">
              <CatalogFilters
                mode="desktop"
                navItems={navItems}
                brands={brands}
                activeCategory={categoryId}
                activeBrandId={brandId}
                activeTags={tags}
                activeMinPrice={minPrice}
                activeMaxPrice={maxPrice}
                searchQuery={search}
              />
            </div>

            {/* Right Products Grid Column */}
            <div className="flex-1 min-w-0">
              {catalogResult.items.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12">
                    {catalogResult.items.map((product, idx) => (
                      <ProductCard
                        key={product.id || product.slug}
                        product={product}
                        priority={idx < 4}
                      />
                    ))}
                  </div>

                  {/* Accessible Server Pagination */}
                  <CatalogPagination
                    currentPage={catalogResult.pagination.page}
                    totalPages={catalogResult.pagination.totalPages}
                    searchParams={sp}
                  />
                </>
              ) : (
                /* Empty Search / Filter State */
                <div className="py-24 text-center space-y-4">
                  <p className="text-base font-bold uppercase tracking-wider text-neutral-900">
                    No products found
                  </p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    We couldn&apos;t find any apparel matching your active filters. Try resetting your filters or search terms.
                  </p>
                  <Button asChild variant="outline" className="rounded-none mt-2">
                    <Link href="/catalog">Reset All Filters</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
