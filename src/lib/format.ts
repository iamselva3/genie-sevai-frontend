import type { BookingStatus } from './types';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const rupees = (n: number) => `₹${inr.format(Math.round(n))}`;

export function duration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`;
}

/** 12400 -> "12.4K" */
export function compact(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(n >= 1000000 ? 0 : 1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/** "14:00" -> "2:00 PM" */
export function time12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-18" -> "Wednesday, 18 Nov" (calendar date, no timezone math). */
export function longDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[t.getUTCDay()]}, ${d} ${MONTHS[m - 1]}`;
}

export function shortDate(date: string) {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Finding your pro',
  assigned: 'Pro assigned',
  on_the_way: 'Pro on the way',
  in_progress: 'Job in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const UPCOMING: BookingStatus[] = ['pending', 'assigned', 'on_the_way', 'in_progress'];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function isValidPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}
