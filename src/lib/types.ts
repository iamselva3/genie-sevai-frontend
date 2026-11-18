export interface City {
  id: string;
  slug: string;
  name: string;
  state: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  imageUrl: string;
  serviceCount?: number;
  bookableCount?: number;
  startingPrice?: number | null;
  professionals?: number;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  group: string;
  shortDescription: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  price: number;
  mrp: number;
  durationMinutes: number;
  rating: number;
  ratingCount: number;
  isPopular: boolean;
  imageUrl: string;
  category: { id: string; slug: string; name: string; icon: string } | null;
  bookable: boolean;
  unavailableReason: string;
}

/** Home page banner, managed by the team in the admin panel. */
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  ctaLabel: string;
  /** '' | '/uploads/...' (on the API origin) | https URL */
  imageUrl: string;
  /** split = colour + text + picture; image = the picture is the whole banner */
  layout: 'split' | 'image';
  background: string;
  textTone: 'dark' | 'light';
  art: '' | 'bathroom' | 'ac' | 'gift';
  action: 'service' | 'category' | 'coupon' | 'link' | 'none';
  href: string | null;
  service: { slug: string; name: string; price: number; mrp: number } | null;
  couponCode: string | null;
}

export interface HomeData {
  city: { slug: string; name: string } | null;
  categories: Category[];
  /** Missing on older APIs. */
  banners?: Banner[];
  rows: { category: Category; services: Service[] }[];
  popular: Service[];
  stats: { professionals: number; completedBookings: number; averageRating: number | null };
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  email: string;
  addresses: Address[];
}

export interface Quote {
  category: { id: string; slug: string; name: string };
  city: { id: string; slug: string; name: string } | null;
  lines: { serviceId: string; slug: string; name: string; price: number; mrp: number; qty: number; lineTotal: number; durationMinutes: number }[];
  subtotal: number;
  discount: number;
  visitFee: number;
  total: number;
  savings: number;
  durationMinutes: number;
  freeVisitAbove: number;
  coupon: { code: string; description: string } | null;
  couponError: string | null;
}

export interface Coupon {
  code: string;
  description: string;
  type: 'percent' | 'flat';
  value: number;
  maxDiscount: number;
  minOrder: number;
}

export interface SlotDay {
  date: string;
  weekday: string;
  day: number;
  month: string;
  slots: { time: string; available: boolean }[];
}

export type BookingStatus = 'pending' | 'assigned' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled';

export interface TimelineEntry {
  status: BookingStatus | 'rescheduled' | 'unassigned';
  at: string;
  actor: 'customer' | 'admin' | 'professional' | 'system';
  note: string;
}

export interface Booking {
  id: string;
  code: string;
  status: BookingStatus;
  categoryName: string;
  category: string;
  cityName: string;
  items: { serviceId: string; name: string; price: number; mrp: number; qty: number; durationMinutes: number }[];
  address: { label: string; line1: string; line2: string; landmark: string; city: string; pincode: string };
  slot: { date: string; time: string; start: string };
  durationMinutes: number;
  pricing: { subtotal: number; discount: number; visitFee: number; total: number; couponCode: string };
  paymentMethod: 'pay_after_service';
  paymentStatus: 'pending' | 'paid';
  timeline: TimelineEntry[];
  notes: string;
  createdAt: string;
  pin: string | null;
  professional: { id: string; name: string; phone: string; rating: number; ratingCount: number; experienceYears: number; jobsCompleted: number } | null;
  cancellation: { reason: string; by: string; at: string } | null;
  review: { rating: number; comment: string; at: string } | null;
  canCancel: boolean;
  canReschedule: boolean;
  canReview: boolean;
}
