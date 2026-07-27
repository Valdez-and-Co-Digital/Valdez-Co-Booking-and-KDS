import { create } from 'zustand';
import type { Order } from '@/types/database';

interface OrdersStore {
  orders: Order[];
  isLoading: boolean;
  // Actions
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Partial<Order> & { id: string }) => void;
  setLoading: (loading: boolean) => void;
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  orders: [],
  isLoading: false,

  setOrders: (orders) => set({ orders }),

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  updateOrder: (updated) =>
    set((state) => ({
      orders: state.orders.map(o =>
        o.id === updated.id ? { ...o, ...updated } : o
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));

// ============================================================
// Selector Hooks — KDS-specific views
// ============================================================

/** Orders filtered by status for KDS Kanban columns */
export const useOrdersByStatus = (status: Order['status']) =>
  useOrdersStore(s => s.orders).filter(o => o.status === status);

/** Active orders (all non-terminal states) sorted by time */
export const useActiveOrders = () =>
  useOrdersStore(s => s.orders)
    .filter(o => !['completed', 'cancelled', 'no_show'].includes(o.status))
    .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());

/** Today's orders only */
export const useTodaysOrders = () => {
  const orders = useOrdersStore(s => s.orders);
  const todayStr = new Date().toISOString().slice(0, 10);
  return orders.filter(o => o.slot_start.startsWith(todayStr));
};
