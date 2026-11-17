import { storage } from './storage';
import type { Address, Booking, Category, City, Coupon, Customer, HomeData, Quote, Service, SlotDay } from './types';

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://localhost:5100/api/v1';
export const TOKEN_KEY = 'sevai:token';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'ERROR',
  ) {
    super(message);
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = storage.get<string | null>(TOKEN_KEY, null);
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Can’t reach Genie Sevai right now. Check your connection and try again.', 'NETWORK');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && init.auth && onUnauthorized) onUnauthorized();
    throw new ApiError(res.status, data?.error?.message || 'Something went wrong. Please try again.', data?.error?.code);
  }
  return data as T;
}

const q = (params: Record<string, string | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) s.set(k, v);
  const str = s.toString();
  return str ? `?${str}` : '';
};

export interface CartLineInput {
  serviceId: string;
  qty: number;
}

export const api = {
  cities: () => request<{ cities: City[] }>('/cities'),
  home: (city?: string) => request<HomeData>(`/catalog/home${q({ city })}`),
  categories: (city?: string) => request<{ categories: Category[] }>(`/catalog/categories${q({ city })}`),
  category: (slug: string, city?: string) =>
    request<{ category: Category; groups: string[]; services: Service[] }>(`/catalog/categories/${encodeURIComponent(slug)}${q({ city })}`),
  service: (slug: string, city?: string) => request<{ service: Service }>(`/catalog/services/${encodeURIComponent(slug)}${q({ city })}`),
  search: (text: string, city?: string) =>
    request<{ categories: Category[]; services: Service[] }>(`/catalog/search${q({ q: text, city })}`),
  slots: (city: string, category: string, exclude?: string) =>
    request<{ capacity: number; days: SlotDay[] }>(`/slots${q({ city, category, exclude })}`),
  coupons: () => request<{ coupons: Coupon[] }>('/coupons'),

  sendOtp: (phone: string) => request<{ sent: boolean; expiresIn: number; devCode?: string }>('/auth/otp/send', { method: 'POST', body: { phone } }),
  verifyOtp: (phone: string, code: string) =>
    request<{ token: string; customer: Customer; isNew: boolean }>('/auth/otp/verify', { method: 'POST', body: { phone, code } }),
  me: () => request<{ customer: Customer }>('/me', { auth: true }),
  updateMe: (body: { name?: string; email?: string }) => request<{ customer: Customer }>('/me', { method: 'PATCH', body, auth: true }),
  addAddress: (body: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) =>
    request<{ customer: Customer; addressId: string }>('/me/addresses', { method: 'POST', body, auth: true }),
  updateAddress: (id: string, body: Partial<Address>) =>
    request<{ customer: Customer }>(`/me/addresses/${id}`, { method: 'PATCH', body, auth: true }),
  deleteAddress: (id: string) => request<{ customer: Customer }>(`/me/addresses/${id}`, { method: 'DELETE', auth: true }),

  quote: (body: { items: CartLineInput[]; couponCode?: string | null; city?: string | null }) =>
    request<{ quote: Quote }>('/bookings/quote', { method: 'POST', body }),
  createBooking: (body: { city: string; items: CartLineInput[]; couponCode?: string | null; addressId: string; date: string; time: string; notes?: string }) =>
    request<{ booking: Booking }>('/bookings', { method: 'POST', body, auth: true }),
  bookings: () => request<{ bookings: Booking[] }>('/bookings', { auth: true }),
  booking: (id: string) => request<{ booking: Booking }>(`/bookings/${encodeURIComponent(id)}`, { auth: true }),
  cancelBooking: (id: string, reason: string) =>
    request<{ booking: Booking }>(`/bookings/${id}/cancel`, { method: 'POST', body: { reason }, auth: true }),
  rescheduleBooking: (id: string, date: string, time: string) =>
    request<{ booking: Booking }>(`/bookings/${id}/reschedule`, { method: 'POST', body: { date, time }, auth: true }),
  reviewBooking: (id: string, rating: number, comment: string) =>
    request<{ booking: Booking }>(`/bookings/${id}/review`, { method: 'POST', body: { rating, comment }, auth: true }),

  enquiry: (body: { name: string; phone: string; email?: string; topic?: string; message: string; bookingCode?: string }) =>
    request<{ enquiry: { id: string } }>('/enquiries', { method: 'POST', body }),
  proApplication: (body: { name: string; phone: string; city: string; skills: string[]; experienceYears: number; message?: string }) =>
    request<{ application: { id: string }; duplicate: boolean }>('/pro-applications', { method: 'POST', body }),
};
