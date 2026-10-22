import { StorefrontLanding } from "@/components/home/storefront-landing";
import { getStorefrontNavigation } from "@/lib/api/categories";

export const revalidate = 300; // Cache page for 5 minutes (ISR)

export default async function HomePage() {
  // Fetch real category tree from backend endpoint:
  // GET /api/catalog/categories/storefront
  const navItems = await getStorefrontNavigation();

  return <StorefrontLanding navItems={navItems} />;
}
