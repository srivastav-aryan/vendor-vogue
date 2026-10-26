import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { syncGuestCartItems, getBackendCart, addBackendCartItem, removeBackendCartItem, updateBackendCartItemQuantity, clearBackendCart } from "@/lib/api/cart";
import { apiClient, getClientAccessToken } from "@/lib/api/client";

export interface CartItem {
  id: string; // unique cart entry key (e.g. `${productId}-${variantId}`)
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  size: string;
  price: number;
  mrp?: number;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartStore {
  items: CartItem[];
  isDrawerOpen: boolean;
  isSyncing: boolean;

  // Actions
  addItem: (item: Omit<CartItem, "id" | "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setDrawerOpen: (open: boolean) => void;
  syncCartWithBackend: () => Promise<void>;

  // Computed helpers
  getTotalCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      isSyncing: false,

      addItem: (newItem, quantity = 1) => {
        const cartId = `${newItem.productId}-${newItem.variantId}`;
        const existing = get().items.find((i) => i.id === cartId);

        if (existing) {
          const updatedQuantity = Math.min(
            existing.quantity + quantity,
            existing.maxStock || 99
          );
          set((state) => ({
            items: state.items.map((i) =>
              i.id === cartId ? { ...i, quantity: updatedQuantity } : i
            ),
            isDrawerOpen: true, // Automatically open bag drawer on add
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              {
                ...newItem,
                id: cartId,
                quantity: Math.min(quantity, newItem.maxStock || 99),
              },
            ],
            isDrawerOpen: true, // Automatically open bag drawer on add
          }));
        }

        // Background server sync if authenticated and variantId is a valid ObjectId
        if (getClientAccessToken() && /^[0-9a-fA-F]{24}$/.test(newItem.variantId)) {
          addBackendCartItem(newItem.variantId, quantity).catch(() => {});
        }
      },

      removeItem: (id: string) => {
        const itemToRemove = get().items.find((i) => i.id === id);
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));

        if (getClientAccessToken() && itemToRemove && /^[0-9a-fA-F]{24}$/.test(itemToRemove.variantId)) {
          removeBackendCartItem(itemToRemove.variantId).catch(() => {});
        }
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const item = get().items.find((i) => i.id === id);
        const newQty = Math.min(quantity, item?.maxStock || 99);

        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, quantity: newQty }
              : i
          ),
        }));

        if (getClientAccessToken() && item && /^[0-9a-fA-F]{24}$/.test(item.variantId)) {
          updateBackendCartItemQuantity(item.variantId, newQty).catch(() => {});
        }
      },

      clearCart: () => {
        set({ items: [] });
        if (getClientAccessToken()) {
          clearBackendCart().catch(() => {});
        }
      },

      setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),

      /**
       * Synchronizes all local guest items with the backend database upon user login/registration.
       */
      syncCartWithBackend: async () => {
        let currentItems = get().items;
        if (!getClientAccessToken()) return;

        try {
          set({ isSyncing: true });

          const objectIdRegex = /^[0-9a-fA-F]{24}$/;
          let hasReplacements = false;
          const resolvedItems = [...currentItems];

          // Auto-resolve any synthetic or legacy non-ObjectId variant IDs
          for (let i = 0; i < resolvedItems.length; i++) {
            const item = resolvedItems[i];
            if (!objectIdRegex.test(item.variantId)) {
              try {
                let variants: any[] = [];
                if (objectIdRegex.test(item.productId)) {
                  const res = await apiClient.get<{ success: boolean; data: any[] }>(
                    `/api/catalog/products/${item.productId}/variants`
                  ).catch(() => null);
                  if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
                    variants = res.data;
                  }
                }
                if (variants.length === 0 && item.slug) {
                  const res = await apiClient.get<{ success: boolean; data: { id: string; variants: any[] } }>(
                    `/api/catalog/products/slug/${item.slug}/storefront`
                  ).catch(() => null);
                  if (res?.success && res.data?.variants) {
                    variants = res.data.variants;
                    if (res.data.id && objectIdRegex.test(res.data.id)) {
                      resolvedItems[i].productId = res.data.id;
                    }
                  }
                }

                const matched =
                  variants.find((v) => {
                    const sizeAttr = v.attributes?.find(
                      (a: any) => a.name?.toLowerCase() === "size"
                    );
                    return sizeAttr?.value?.toLowerCase() === item.size?.toLowerCase();
                  }) || variants[0];

                if (matched && (matched._id || matched.id)) {
                  const realVariantId = (matched._id || matched.id).toString();
                  if (objectIdRegex.test(realVariantId)) {
                    resolvedItems[i] = {
                      ...resolvedItems[i],
                      variantId: realVariantId,
                      id: `${resolvedItems[i].productId}-${realVariantId}`,
                    };
                    hasReplacements = true;
                  }
                }
              } catch (err) {
                console.warn("[Cart Store] Failed resolving synthetic variant:", err);
              }
            }
          }

          if (hasReplacements) {
            set({ items: resolvedItems });
            currentItems = resolvedItems;
          }

          // 1. Fetch current server cart first to prevent duplicate additions
          const serverCart = await getBackendCart();
          const serverItems = Array.isArray(serverCart?.items) ? serverCart.items : [];
          const serverVariantMap = new Map(serverItems.map((si) => [si.variantId, si]));

          // 2. Reconcile local items with server cart without doubling quantities
          if (currentItems.length > 0) {
            for (const localItem of currentItems) {
              if (!objectIdRegex.test(localItem.variantId)) continue;
              const existingServerItem = serverVariantMap.get(localItem.variantId);
              if (existingServerItem) {
                // If item already exists on server with different quantity, set the exact quantity
                if (existingServerItem.quantity !== localItem.quantity) {
                  await updateBackendCartItemQuantity(localItem.variantId, localItem.quantity).catch(() => {});
                }
              } else {
                // Item only exists locally (guest item), add to server cart
                await addBackendCartItem(localItem.variantId, localItem.quantity).catch(() => {});
              }
            }
          }

          // 3. Fetch final updated cart from backend to hydrate Zustand with authoritative data
          const finalServerCart = await getBackendCart();
          if (finalServerCart && Array.isArray(finalServerCart.items) && finalServerCart.items.length > 0) {
            const serverCartItems: CartItem[] = finalServerCart.items.map((item) => {
              const sizeAttr = item.attributes?.find(
                (a) => a.name.toLowerCase() === "size"
              );
              const size = sizeAttr?.value || "OS";

              return {
                id: `${item.productId}-${item.variantId}`,
                productId: item.productId,
                variantId: item.variantId,
                name: item.productName,
                slug: item.sku?.toLowerCase() || item.variantId,
                size,
                price: item.discountedUnitPrice || item.originalUnitPrice,
                mrp: item.originalUnitPrice,
                image: item.image || "/images/hero/hero.jpg",
                quantity: item.quantity,
                maxStock: item.availableStock || 99,
              };
            });

            // Reconcile server items with local items
            set({ items: serverCartItems });
          }
        } catch (error) {
          console.warn("[Cart Store] Server synchronization error:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "vendor_vogue_cart",
      storage: createJSONStorage(() => localStorage),
      // Don't persist UI drawer state across reloads
      partialize: (state) => ({ items: state.items } as CartStore),
    }
  )
);
