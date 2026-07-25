import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/database';

interface CartStore {
  items: CartItem[];
  tenantType: 'salon' | 'foodtruck' | null;
  tenantId: string | null;
  // Actions
  setTenantContext: (tenantId: string, tenantType: 'salon' | 'foodtruck') => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tenantType: null,
      tenantId: null,

      setTenantContext: (tenantId, tenantType) =>
        set({ tenantId, tenantType }),

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(i => i.service_id === item.service_id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.service_id === item.service_id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (serviceId) =>
        set((state) => ({
          items: state.items.filter(i => i.service_id !== serviceId),
        })),

      updateQuantity: (serviceId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(i => i.service_id !== serviceId)
              : state.items.map(i =>
                  i.service_id === serviceId ? { ...i, quantity } : i
                ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'swiftkds-cart',
      partialize: (state) => ({
        items: state.items,
        tenantId: state.tenantId,
        tenantType: state.tenantType,
      }),
    }
  )
);

// ============================================================
// Computed Selector Hooks
// Derived values are computed on each call — no stale state.
// ============================================================

/** Total price in cents */
export const useCartTotalCents = () =>
  useCartStore(s => s.items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0));

/** Total price formatted as USD string */
export const useCartTotalFormatted = () =>
  useCartStore(s => {
    const cents = s.items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  });

/**
 * Salon mode: Sequential total duration (sum of all item durations × qty)
 * e.g. Haircut(60min) + Color(120min) = 180 minutes total slot needed
 */
export const useCartTotalDuration = () =>
  useCartStore(s =>
    s.items.reduce((sum, i) => sum + (i.duration_minutes ?? 0) * i.quantity, 0)
  );

/**
 * Food truck mode: Parallel max prep time (max of all item prep_times)
 * e.g. Tacos(8min) + Drink(1min) = 8 minutes (they're made simultaneously)
 */
export const useCartMaxPrepTime = () =>
  useCartStore(s =>
    s.items.length === 0
      ? 0
      : Math.max(...s.items.map(i => i.prep_time_minutes ?? 0))
  );

/** Total item count */
export const useCartItemCount = () =>
  useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
