import { describe, expect, it } from 'vitest';
import { addItem, emptyCart, MAX_QTY, qtyOf, replaceWith, sanitize, setQty, totals } from './cart';
import { compact, duration, longDate, rupees, time12 } from './format';

const cleaning = { slug: 'cleaning', name: 'Home Cleaning' };
const plumbing = { slug: 'plumbing', name: 'Plumbing' };
const bath = { serviceId: 'a', slug: 'bath', name: 'Bathroom', price: 499, mrp: 599, durationMinutes: 60 };
const kitchen = { serviceId: 'b', slug: 'kitchen', name: 'Kitchen', price: 1299, mrp: 0, durationMinutes: 150 };
const tap = { serviceId: 'c', slug: 'tap', name: 'Tap', price: 129, mrp: 0, durationMinutes: 30 };

describe('cart', () => {
  it('adds items and increments quantities', () => {
    let s = addItem(emptyCart, cleaning, bath).state;
    s = addItem(s, cleaning, bath).state;
    s = addItem(s, cleaning, kitchen).state;
    expect(qtyOf(s, 'a')).toBe(2);
    expect(qtyOf(s, 'b')).toBe(1);
    expect(s.category).toEqual(cleaning);
  });

  it('reports a conflict instead of mixing categories', () => {
    const s = addItem(emptyCart, cleaning, bath).state;
    const r = addItem(s, plumbing, tap);
    expect(r.conflict).toBe(true);
    expect(r.state).toBe(s);
    const replaced = replaceWith(plumbing, tap);
    expect(replaced.items).toHaveLength(1);
    expect(replaced.category).toEqual(plumbing);
  });

  it('caps quantity and removes at zero', () => {
    let s = addItem(emptyCart, cleaning, bath).state;
    s = setQty(s, 'a', 99);
    expect(qtyOf(s, 'a')).toBe(MAX_QTY);
    s = setQty(s, 'a', 0);
    expect(s).toEqual(emptyCart);
  });

  it('computes count, subtotal and savings', () => {
    let s = addItem(emptyCart, cleaning, bath).state;
    s = setQty(s, 'a', 2);
    s = addItem(s, cleaning, kitchen).state;
    expect(totals(s)).toEqual({ count: 3, subtotal: 499 * 2 + 1299, savings: 200 });
  });

  it('sanitizes stored carts', () => {
    expect(sanitize(null)).toEqual(emptyCart);
    expect(sanitize({ category: cleaning, items: [{ serviceId: 1 }] })).toEqual(emptyCart);
    // a coupon picked from an offer banner survives with an empty cart
    expect(sanitize({ category: null, items: [], couponCode: 'WELCOME100' })).toEqual({ ...emptyCart, couponCode: 'WELCOME100' });
    const ok = sanitize({ category: cleaning, items: [{ ...bath, qty: 50 }], couponCode: 'X' });
    expect(ok.items[0].qty).toBe(MAX_QTY);
    expect(ok.couponCode).toBe('X');
  });
});

describe('format', () => {
  it('formats rupees in Indian grouping', () => {
    expect(rupees(129)).toBe('₹129');
    expect(rupees(123456)).toBe('₹1,23,456');
  });
  it('formats durations', () => {
    expect(duration(45)).toBe('45 min');
    expect(duration(60)).toBe('1 hr');
    expect(duration(150)).toBe('2 hr 30 min');
    expect(duration(480)).toBe('8 hrs');
  });
  it('formats counts and times', () => {
    expect(compact(950)).toBe('950');
    expect(compact(12400)).toBe('12.4K');
    expect(compact(250000)).toBe('2.5L');
    expect(time12('08:00')).toBe('8:00 AM');
    expect(time12('12:00')).toBe('12:00 PM');
    expect(time12('19:00')).toBe('7:00 PM');
    expect(longDate('2026-11-18')).toBe('Wednesday, 18 Nov');
  });
});
