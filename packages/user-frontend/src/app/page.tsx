import { StorefrontLanding } from "@/components/home/storefront-landing";
import { getStorefrontNavigation } from "@/lib/api/categories";
import {
  getBestsellerProducts,
  getTrendingProducts,
  getLimitedProducts,
} from "@/lib/api/products";

export const revalidate = 300; // Cache page for 5 minutes (ISR)

export default async function HomePage() {
  // Fetch category tree, bestsellers, trending, and limited products in parallel on the server
  const [navItems, bestsellers, trending, limited] = await Promise.all([
    getStorefrontNavigation(),
    getBestsellerProducts(),
    getTrendingProducts(),
    getLimitedProducts(),
  ]);

  return (
    <StorefrontLanding
      navItems={navItems}
      initialBestsellers={bestsellers}
      initialTrending={trending}
      initialLimited={limited}
    />
  );
}
