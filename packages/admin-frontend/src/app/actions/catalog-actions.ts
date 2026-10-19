"use server";

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Server Action to bust Next.js data cache on demand after brand mutations.
 */
export async function revalidateBrandsAction() {
  revalidateTag("catalog-brands");
  revalidatePath("/catalog/brands");
  revalidatePath("/dashboard");
}

/**
 * Server Action to bust Next.js data cache on demand after category mutations.
 */
export async function revalidateCategoriesAction() {
  revalidateTag("catalog-categories");
  revalidatePath("/catalog/categories");
  revalidatePath("/dashboard");
}

/**
 * Server Action to bust Next.js data cache on demand after product mutations.
 */
export async function revalidateProductsAction() {
  revalidateTag("catalog-products");
  revalidatePath("/catalog/products");
  revalidatePath("/dashboard");
}
