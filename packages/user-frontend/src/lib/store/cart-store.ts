import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

  // Actions
  addItem: (item: Omit<CartItem, "id" | "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setDrawerOpen: (open: boolean) => void;

  // Computed helpers
  getTotalCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

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
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, quantity: Math.min(quantity, i.maxStock || 99) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),

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
