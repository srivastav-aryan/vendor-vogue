import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { getStorefrontNavigation } from "@/lib/api/categories";
import { getProductStorefront } from "@/lib/api/products";
import { ProductGallery } from "@/components/pdp/product-gallery";
import { ProductInfoPanel } from "@/components/pdp/product-info-panel";
import { InfiniteMarquee } from "@/components/common/infinite-marquee";

export const revalidate = 60; // ISR cache for 1 minute

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Generate high-fidelity SEO metadata for the product detail page.
 */
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductStorefront(slug);

  if (!product) {
    return {
      title: "Product Not Found | Vendor Vogue",
      description: "The requested apparel product could not be found.",
    };
  }

  const primaryImage = product.images?.[0] || "/images/hero/hero.jpg";

  return {
    title: `${product.name} | Vendor Vogue`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Vendor Vogue`,
      description: product.description.slice(0, 160),
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 1600,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description.slice(0, 160),
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Fetch product data and navigation in parallel
  const [product, navItems] = await Promise.all([
    getProductStorefront(slug),
    getStorefrontNavigation(),
  ]);

  // If product is not found, trigger Next.js notFound()
  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Header Navigation (White mode on PDP) */}
      <Header isScrolled={true} navItems={navItems} />

      {/* Main PDP Content */}
      <main id="main-content" className="pt-24 md:pt-28 pb-20">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumbs"
            className="mb-6 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
          >
            <Link
              href="/"
              className="hover:text-black transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-neutral-300" />
            <Link
              href="/catalog"
              className="hover:text-black transition-colors"
            >
              Catalog
            </Link>
            {product.category?.name && (
              <>
                <ChevronRight className="h-3 w-3 text-neutral-300" />
                <Link
                  href={`/catalog/${product.category.slug}`}
                  className="hover:text-black transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3 text-neutral-300" />
            <span className="text-neutral-900 line-clamp-1 max-w-[200px] sm:max-w-md">
              {product.name}
            </span>
          </nav>

          {/* 2-COLUMN EDITORIAL SPLIT: Desktop 60% Left Gallery, 40% Right Sticky Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column (Desktop 60% / col-span-7) */}
            <div className="lg:col-span-7 w-full">
              <ProductGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            {/* Right Column (Desktop 40% / col-span-5): Sticky purchase info panel */}
            <div className="lg:col-span-5 w-full lg:sticky lg:top-28 lg:self-start">
              <ProductInfoPanel product={product} />
            </div>
          </div>
        </div>
      </main>

      {/* Infinite Brand Marquee Banner (react-fast-marquee) */}
      <InfiniteMarquee text="Vendor Vogue™" />
    </div>
  );
}
