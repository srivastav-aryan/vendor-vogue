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
  { label: "Best Sellers", href: "/catalog?filter=bestsellers" },
  { label: "FW26 Campaign", href: "/catalog?collection=fw26", badge: "New" },
  { label: "The Uniform", href: "/catalog?collection=the-uniform" },
];

/**
 * Default Storefront Navigation tree:
 * - "Shop": Direct link to /catalog without mega menu
 * - "Men", "Women", "Kids": Root categories that open mega menus without navigating away
 */
export const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  {
    id: "nav-shop",
    label: "Shop",
    href: "/catalog",
  },
  {
    id: "nav-men",
    label: "Men",
    href: "#",
    hasMenu: [
      {
        name: "Topwear",
        items: [
          { id: "men-t-shirts", label: "T-Shirts", href: "/catalog/men-t-shirts" },
          { id: "men-shirts", label: "Shirts", href: "/catalog/men-shirts" },
          { id: "men-hoodies", label: "Hoodies & Sweatshirts", href: "/catalog/men-hoodies" },
        ],
      },
      {
        name: "Bottomwear",
        items: [
          { id: "men-jeans", label: "Jeans", href: "/catalog/men-jeans" },
          { id: "men-trousers", label: "Trousers & Cargos", href: "/catalog/men-trousers" },
        ],
      },
      {
        name: "Outerwear",
        items: [
          { id: "men-jackets", label: "Jackets & Coats", href: "/catalog/men-jackets" },
        ],
      },
    ],
  },
  {
    id: "nav-women",
    label: "Women",
    href: "#",
    hasMenu: [
      {
        name: "Topwear",
        items: [
          { id: "women-tops", label: "Tops & Tees", href: "/catalog/women-tops" },
          { id: "women-shirts", label: "Shirts & Blouses", href: "/catalog/women-shirts" },
        ],
      },
      {
        name: "Bottomwear",
        items: [
          { id: "women-skirts-pants", label: "Skirts & Pants", href: "/catalog/women-skirts-pants" },
          { id: "women-denim", label: "Denim", href: "/catalog/women-denim" },
        ],
      },
      {
        name: "Dresses",
        items: [
          { id: "women-maxi-dresses", label: "Maxi & Midi Dresses", href: "/catalog/women-maxi-dresses" },
        ],
      },
    ],
  },
  {
    id: "nav-kids",
    label: "Kids",
    href: "#",
    hasMenu: [
      {
        name: "Boys",
        items: [
          { id: "kids-boys-tees", label: "Tees & Polos", href: "/catalog/kids-boys-tees" },
          { id: "kids-boys-bottoms", label: "Shorts & Joggers", href: "/catalog/kids-boys-bottoms" },
        ],
      },
      {
        name: "Girls",
        items: [
          { id: "kids-girls-dresses", label: "Dresses & Jumpsuits", href: "/catalog/kids-girls-dresses" },
          { id: "kids-girls-tops", label: "Tops & Leggings", href: "/catalog/kids-girls-tops" },
        ],
      },
    ],
  },
];
