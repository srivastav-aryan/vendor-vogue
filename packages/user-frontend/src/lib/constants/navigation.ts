import type { NavigationItem } from "@e-com/shared/types";

/**
 * Editorial Quick Links displayed prominently on the left of the mega menu.
 */
export interface EditorialMenuLink {
  label: string;
  href: string;
  badge?: string;
}

export const EDITORIAL_QUICK_LINKS: EditorialMenuLink[] = [
  { label: "New Arrivals", href: "/catalog?sort=newest" },
  { label: "Women's Exclusive", href: "/catalog/womens-exclusive" },
  { label: "Most Wanted", href: "/catalog?filter=bestsellers" },
  { label: "FW26 · 02", href: "/catalog/fw26-02", badge: "New" },
];

/**
 * Default Storefront Navigation tree matching @e-com/shared/types.
 * Used as fallback or initial seed before the dynamic /api/catalog/categories/storefront endpoint loads.
 */
export const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  {
    id: "nav-shop",
    label: "Shop",
    href: "/catalog",
    hasMenu: [
      {
        name: "Clothing",
        items: [
          { id: "c-puffers", label: "Puffers", href: "/catalog/puffers", badge: "New" },
          { id: "c-outerwear", label: "Outerwear", href: "/catalog/outerwear" },
          { id: "c-hoodies", label: "Hoodies | Sweatshirts", href: "/catalog/hoodies-sweatshirts" },
          { id: "c-knitwear", label: "Knitwear", href: "/catalog/knitwear" },
          { id: "c-longsleeves", label: "Long Sleeves", href: "/catalog/long-sleeves", badge: "New" },
          { id: "c-tshirts", label: "T-Shirts", href: "/catalog/t-shirts" },
          { id: "c-shirts", label: "Shirts | Polos", href: "/catalog/shirts-polos" },
          { id: "c-jeans", label: "Jeans", href: "/catalog/jeans" },
          { id: "c-pants", label: "Pants", href: "/catalog/pants" },
          { id: "c-loungewear", label: "Lounge Wear", href: "/catalog/lounge-wear", badge: "New" },
        ],
      },
      {
        name: "Accessories",
        items: [
          { id: "a-all", label: "View All Accessories", href: "/catalog/accessories" },
          { id: "a-headwear", label: "Headwear", href: "/catalog/headwear" },
          { id: "a-bags", label: "Bags | Leather Goods", href: "/catalog/bags-leather-goods" },
          { id: "a-jewelry", label: "Jewelry", href: "/catalog/jewelry" },
          { id: "a-underwear", label: "Underwear", href: "/catalog/underwear" },
          { id: "a-scarves", label: "Scarves & Others", href: "/catalog/scarves-others", badge: "New" },
          { id: "a-objects", label: "Objects", href: "/catalog/objects" },
          { id: "a-giftcard", label: "Gift card", href: "/gift-cards" },
        ],
      },
      {
        name: "Women's Exclusive",
        items: [
          { id: "w-new", label: "New Arrivals", href: "/catalog/womens-new-arrivals" },
          { id: "w-tops", label: "Tops", href: "/catalog/womens-tops" },
          { id: "w-bottoms", label: "Bottoms", href: "/catalog/womens-bottoms" },
          { id: "w-skirts", label: "Skirts & Dresses", href: "/catalog/skirts-dresses" },
          { id: "w-sweatshirts", label: "Knitwear | Sweatshirts", href: "/catalog/womens-sweatshirts" },
          { id: "w-matching", label: "Matching Sets", href: "/catalog/matching-sets" },
          { id: "w-bags", label: "Bags | Leather Goods", href: "/catalog/womens-bags" },
          { id: "w-jewelry", label: "Jewelry", href: "/catalog/womens-jewelry" },
          { id: "w-swimwear", label: "Swimwear", href: "/catalog/swimwear" },
        ],
      },
    ],
  },
  {
    id: "nav-new-in",
    label: "New In",
    href: "/catalog?sort=newest",
  },
];
