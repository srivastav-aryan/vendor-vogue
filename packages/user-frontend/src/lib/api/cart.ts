import { apiClient } from "@/lib/api/client";
import type { CartSummaryDto } from "@e-com/shared/types";

export interface CartApiResponse<T = CartSummaryDto> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Fetches the current authenticated user's cart summary,
 * optionally evaluating live coupon rules and inclusive GST.
 */
export async function getBackendCart(coupon?: string): Promise<CartSummaryDto | null> {
  try {
    const res = await apiClient.get<CartApiResponse>(
      "/api/cart",
      coupon ? { params: { coupon } } : undefined
    );
    return res?.data || null;
  } catch (error) {
    console.warn("[Cart API] Error fetching backend cart:", error);
    return null;
  }
}

/**
 * Adds an item or increments quantity on the backend cart.
 */
export async function addBackendCartItem(
  variantId: string,
  quantity: number = 1,
  coupon?: string
): Promise<CartSummaryDto | null> {
  const res = await apiClient.post<CartApiResponse>(
    "/api/cart",
    { variantId, quantity },
    coupon ? { params: { coupon } } : undefined
  );
  return res?.data || null;
}

/**
 * Updates an item's exact quantity on the backend cart.
 */
export async function updateBackendCartItemQuantity(
  variantId: string,
  quantity: number
): Promise<CartSummaryDto | null> {
  const res = await apiClient<CartApiResponse>(`/api/cart/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  return res?.data || null;
}

/**
 * Removes a variant from the backend cart.
 */
export async function removeBackendCartItem(
  variantId: string
): Promise<CartSummaryDto | null> {
  const res = await apiClient.delete<CartApiResponse>(`/api/cart/${variantId}`);
  return res?.data || null;
}

/**
 * Clears the user's active cart in the database.
 */
export async function clearBackendCart(): Promise<boolean> {
  try {
    const res = await apiClient.delete<{ success: boolean }>("/api/cart");
    return res?.success ?? false;
  } catch (error) {
    console.warn("[Cart API] Error clearing backend cart:", error);
    return false;
  }
}

/**
 * Synchronizes client-side guest cart items to the authenticated backend cart.
 * Filters out invalid IDs (e.g. synthetic non-ObjectId fallbacks) to prevent schema rejection.
 */
export async function syncGuestCartItems(
  items: Array<{ variantId: string; quantity: number }>
): Promise<CartSummaryDto | null> {
  if (!items || items.length === 0) return null;

  // 24-character hexadecimal regex matching MongoDB ObjectId
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  const validItems = items.filter((item) => objectIdRegex.test(item.variantId));

  if (validItems.length === 0) return null;

  let lastSummary: CartSummaryDto | null = null;
  for (const item of validItems) {
    try {
      const updated = await addBackendCartItem(item.variantId, item.quantity);
      if (updated) lastSummary = updated;
    } catch (err) {
      console.warn(`[Cart Sync] Failed syncing variant ${item.variantId}:`, err);
    }
  }

  return lastSummary;
}
