import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addItem, emptyCart, qtyOf, replaceWith, sanitize, setQty as setQtyPure, totals, type CartItem, type CartState } from '../lib/cart';
import { storage } from '../lib/storage';
import type { Service } from '../lib/types';
import { useUi } from './ui';

interface PendingReplace {
  category: { slug: string; name: string };
  item: Omit<CartItem, 'qty'>;
}

interface CartValue {
  cart: CartState;
  count: number;
  subtotal: number;
  savings: number;
  add: (service: Service) => void;
  setQty: (serviceId: string, qty: number) => void;
  qty: (serviceId: string) => number;
  setCoupon: (code: string) => void;
  clear: () => void;
  pendingReplace: PendingReplace | null;
  confirmReplace: () => void;
  cancelReplace: () => void;
}

const CartContext = createContext<CartValue | null>(null);
const KEY = 'sevai:cart';

function toItem(s: Service): Omit<CartItem, 'qty'> {
  return { serviceId: s.id, slug: s.slug, name: s.name, price: s.price, mrp: s.mrp, durationMinutes: s.durationMinutes };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useUi();
  const [cart, setCart] = useState<CartState>(() => sanitize(storage.get(KEY, null)));
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(null);

  useEffect(() => storage.set(KEY, cart), [cart]);

  const add = useCallback(
    (service: Service) => {
      if (!service.bookable || !service.category) return;
      const category = { slug: service.category.slug, name: service.category.name };
      const result = addItem(cart, category, toItem(service));
      if (result.conflict) {
        setPendingReplace({ category, item: toItem(service) });
        return;
      }
      if (qtyOf(cart, service.id) === 0) toast(`${service.name} added`, 'ink');
      setCart(result.state);
    },
    [cart, toast],
  );

  const value = useMemo<CartValue>(() => {
    const t = totals(cart);
    return {
      cart,
      ...t,
      add,
      setQty: (id, q) => setCart((c) => setQtyPure(c, id, q)),
      qty: (id) => qtyOf(cart, id),
      setCoupon: (code) => setCart((c) => ({ ...c, couponCode: code.trim().toUpperCase() })),
      clear: () => setCart(emptyCart),
      pendingReplace,
      confirmReplace: () => {
        if (!pendingReplace) return;
        setCart(replaceWith(pendingReplace.category, pendingReplace.item));
        toast(`Cart switched to ${pendingReplace.category.name}`, 'ink');
        setPendingReplace(null);
      },
      cancelReplace: () => setPendingReplace(null),
    };
  }, [cart, add, pendingReplace, toast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
