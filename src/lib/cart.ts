/* Pure cart logic (unit-tested). The cart holds services from one category at a time. */

export interface CartItem {
  serviceId: string;
  slug: string;
  name: string;
  price: number;
  mrp: number;
  durationMinutes: number;
  qty: number;
}

export interface CartState {
  category: { slug: string; name: string } | null;
  items: CartItem[];
  couponCode: string;
}

export const MAX_QTY = 10;
export const emptyCart: CartState = { category: null, items: [], couponCode: '' };

export type AddResult = { state: CartState; conflict: false } | { state: CartState; conflict: true };

/** Adds one unit. If the cart holds another category, nothing changes and conflict is reported. */
export function addItem(state: CartState, category: { slug: string; name: string }, item: Omit<CartItem, 'qty'>): AddResult {
  if (state.category && state.category.slug !== category.slug && state.items.length > 0) {
    return { state, conflict: true };
  }
  const existing = state.items.find((i) => i.serviceId === item.serviceId);
  const items = existing
    ? state.items.map((i) => (i.serviceId === item.serviceId ? { ...i, qty: Math.min(MAX_QTY, i.qty + 1) } : i))
    : [...state.items, { ...item, qty: 1 }];
  return { state: { ...state, category, items }, conflict: false };
}

/** Empties the cart and starts it with this item (used after the customer confirms a category switch). */
export function replaceWith(category: { slug: string; name: string }, item: Omit<CartItem, 'qty'>): CartState {
  return { category, items: [{ ...item, qty: 1 }], couponCode: '' };
}

export function setQty(state: CartState, serviceId: string, qty: number): CartState {
  const items =
    qty <= 0
      ? state.items.filter((i) => i.serviceId !== serviceId)
      : state.items.map((i) => (i.serviceId === serviceId ? { ...i, qty: Math.min(MAX_QTY, qty) } : i));
  return items.length ? { ...state, items } : emptyCart;
}

export function qtyOf(state: CartState, serviceId: string) {
  return state.items.find((i) => i.serviceId === serviceId)?.qty ?? 0;
}

export function totals(state: CartState) {
  const count = state.items.reduce((n, i) => n + i.qty, 0);
  const subtotal = state.items.reduce((n, i) => n + i.qty * i.price, 0);
  const mrpTotal = state.items.reduce((n, i) => n + i.qty * Math.max(i.mrp || i.price, i.price), 0);
  return { count, subtotal, savings: mrpTotal - subtotal };
}

/** Restores a cart read from storage, discarding anything malformed. */
export function sanitize(raw: unknown): CartState {
  if (!raw || typeof raw !== 'object') return emptyCart;
  const r = raw as Partial<CartState>;
  const items = Array.isArray(r.items)
    ? r.items.filter(
        (i): i is CartItem =>
          !!i && typeof i.serviceId === 'string' && typeof i.name === 'string' && typeof i.price === 'number' && Number.isInteger(i.qty) && i.qty > 0,
      )
    : [];
  const couponCode = typeof r.couponCode === 'string' ? r.couponCode : '';
  // A coupon chosen from an offer banner is kept even before anything is in the cart.
  if (!items.length || !r.category || typeof r.category.slug !== 'string') return { ...emptyCart, couponCode };
  return {
    category: { slug: r.category.slug, name: String(r.category.name ?? '') },
    items: items.map((i) => ({ ...i, qty: Math.min(MAX_QTY, i.qty) })),
    couponCode,
  };
}
