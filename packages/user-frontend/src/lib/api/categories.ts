import "server-only";
import { env } from "@/lib/env";
import type { CategoryResponse } from "@e-com/shared/types";
import type { NavigationItem, MegamenuSection, MegamenuItem } from "@e-com/shared/types";
import { DEFAULT_NAV_ITEMS } from "@/lib/constants/navigation";

export interface StorefrontCategoriesResponse {
  success: boolean;
  data: CategoryResponse[];
}

/**
 * Transforms flat category list with parent/child relationships from
 * GET /api/catalog/categories/storefront into hierarchical NavigationItem[] for the Mega Menu.
 */
export function transformCategoriesToNavItems(
  categories: CategoryResponse[]
): NavigationItem[] {
  if (!categories || categories.length === 0) {
    return DEFAULT_NAV_ITEMS;
  }

  // Filter only active categories
  const activeCategories = categories.filter(
    (c) => c.isActive !== false && c.isEffectivelyActive !== false
  );

  // Group by parent ID
  const childrenMap = new Map<string, CategoryResponse[]>();
  const rootCategories: CategoryResponse[] = [];

  for (const cat of activeCategories) {
    if (!cat.parent) {
      rootCategories.push(cat);
    } else {
      const existing = childrenMap.get(cat.parent) || [];
      existing.push(cat);
      childrenMap.set(cat.parent, existing);
    }
  }

  // If no explicit roots found, fall back
  if (rootCategories.length === 0) {
    return DEFAULT_NAV_ITEMS;
  }

  // Build Navigation Items from Root Categories (e.g., Men, Women)
  const navItems: NavigationItem[] = rootCategories.map((root) => {
    const level1Children = childrenMap.get(root.id) || [];

    // Each level 1 child becomes a MegamenuSection (e.g. "Topwear", "Bottomwear", "Western Wear")
    const sections: MegamenuSection[] = level1Children.map((level1) => {
      const level2Children = childrenMap.get(level1.id) || [];

      let items: MegamenuItem[] = [];

      if (level2Children.length > 0) {
        items = level2Children.map((leaf) => ({
          id: leaf.id,
          label: leaf.name,
          href: `/catalog/${leaf.slug}`,
        }));
      } else {
        // If leaf level 1 with no deeper subcategories
        items = [
          {
            id: level1.id,
            label: `All ${level1.name}`,
            href: `/catalog/${level1.slug}`,
          },
        ];
      }

      return {
        name: level1.name,
        items,
      };
    });

    return {
      id: `nav-${root.slug}`,
      label: root.name,
      href: `/catalog/${root.slug}`,
      hasMenu: sections.length > 0 ? sections : undefined,
    };
  });

  return navItems;
}

/**
 * Server-side data fetcher for storefront categories.
 * Calls localhost:5000/api/catalog/categories/storefront on the server with Next.js caching.
 */
export async function getStorefrontNavigation(): Promise<NavigationItem[]> {
  try {
    const endpoint = `${env.API_INTERNAL_URL}/api/catalog/categories/storefront`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300, // ISR: Cache for 5 minutes
        tags: ["categories", "navigation"],
      },
    });

    if (!res.ok) {
      console.warn(
        `[Storefront Nav] Backend endpoint ${endpoint} returned status ${res.status}. Using fallback navigation.`
      );
      return DEFAULT_NAV_ITEMS;
    }

    const payload: StorefrontCategoriesResponse = await res.json();

    if (!payload.success || !Array.isArray(payload.data)) {
      return DEFAULT_NAV_ITEMS;
    }

    return transformCategoriesToNavItems(payload.data);
  } catch (error) {
    // Graceful degradation: in local dev when backend isn't booted, never crash the storefront build
    console.warn(
      "[Storefront Nav] Backend unreachable during fetch. Using resilient fallback navigation.",
      error instanceof Error ? error.message : error
    );
    return DEFAULT_NAV_ITEMS;
  }
}
