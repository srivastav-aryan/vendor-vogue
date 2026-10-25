import { StorefrontLanding } from "@/components/home/storefront-landing";
import { getStorefrontNavigation } from "@/lib/api/categories";
import { getBestsellerProducts } from "@/lib/api/products";

export const revalidate = 300; // Cache page for 5 minutes (ISR)

export default async function HomePage() {
  // Fetch category tree and bestseller products in parallel on the server
  const [navItems, bestsellers] = await Promise.all([
    getStorefrontNavigation(),
    getBestsellerProducts(),
  ]);

  return (
    <StorefrontLanding
      navItems={navItems}
      initialBestsellers={bestsellers}
    />
  );
}
