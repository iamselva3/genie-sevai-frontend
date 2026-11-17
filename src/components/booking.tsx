import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Check, Moon, Sun, Sunrise, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { rupees, STATUS_LABEL, time12 } from '../lib/format';
import type { Booking, BookingStatus } from '../lib/types';
import { Skeleton } from './ui';

export interface SlotValue {
  date: string;
  time: string;
}

const PARTS = [
  { label: 'Morning', icon: Sunrise, test: (h: number) => h < 12 },
  { label: 'Afternoon', icon: Sun, test: (h: number) => h >= 12 && h < 16 },
  { label: 'Evening', icon: Moon, test: (h: number) => h >= 16 },
];

export function SlotPicker({
  city,
  category,
  exclude,
  value,
  onChange,
}: {
  city: string;
  category: string;
  exclude?: string;
  value: SlotValue | null;
  onChange: (v: SlotValue | null) => void;
}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['slots', city, category, exclude],
    queryFn: () => api.slots(city, category, exclude),
    staleTime: 30_000,
  });
  const days = useMemo(() => data?.days ?? [], [data]);
  const [date, setDate] = useState<string | null>(value?.date ?? null);

  useEffect(() => {
    if (!days.length) return;
    const current = days.find((d) => d.date === date);
    if (!current || !current.slots.some((s) => s.available)) {
      const first = days.find((d) => d.slots.some((s) => s.available));
      if (first && first.date !== date) setDate(first.date);
    }
  }, [days, date]);

  if (isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-36" />
      </div>
    );
  if (isError)
    return (
      <p className="text-[14px] text-bad">
        Couldn’t load slots.{' '}
        <button type="button" className="font-semibold underline" onClick={() => refetch()}>
          Retry
        </button>
      </p>
    );
  if (data && data.capacity === 0)
    return <p className="rounded-2xl bg-paper p-4 text-[14px]">No professionals are taking this service in your city right now. Please check back soon.</p>;

  const day = days.find((d) => d.date === date);
  return (
    <div data-testid="slot-picker">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="Choose a day">
        {days.map((d, i) => {
          const any = d.slots.some((s) => s.available);
          const active = d.date === date;
          return (
            <button
              key={d.date}
              type="button"
              disabled={!any}
              aria-pressed={active}
              aria-label={`${d.weekday} ${d.day} ${d.month}`}
              onClick={() => {
                setDate(d.date);
                if (value?.date !== d.date) onChange(null);
              }}
              className={clsx(
                'flex w-[68px] flex-none flex-col items-center rounded-2xl border-[1.5px] py-2.5 transition-all disabled:opacity-35',
                active ? 'border-ink bg-ink text-white' : 'border-line-2 bg-white hover:border-ink',
              )}
            >
              <span className="text-[11px] font-semibold uppercase">{i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.weekday}</span>
              <span className="display text-2xl font-bold">{d.day}</span>
              <span className="text-[11px]">{d.month}</span>
            </button>
          );
        })}
      </div>
      {day && (
        <div className="mt-4 space-y-4">
          {PARTS.map(({ label, icon: Icon, test }) => {
            const slots = day.slots.filter((s) => test(Number(s.time.slice(0, 2))));
            if (!slots.length) return null;
            return (
              <div key={label}>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-mute">
                  <Icon className="size-3.5" aria-hidden /> {label}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => {
                    const active = value?.date === day.date && value.time === s.time;
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        aria-pressed={active}
                        data-time={s.time}
                        onClick={() => onChange({ date: day.date, time: s.time })}
                        className={clsx(
                          'h-11 rounded-xl border-[1.5px] text-[14px] font-semibold transition-all disabled:border-line disabled:bg-paper disabled:text-mute-2 disabled:line-through',
                          active ? 'border-ink bg-sun shadow-block' : 'border-line-2 bg-white hover:border-ink',
                        )}
                      >
                        {time12(s.time)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BillCard({
  pricing,
  savings,
  freeVisitAbove,
  title = 'Bill',
}: {
  pricing: { subtotal: number; discount: number; visitFee: number; total: number; couponCode?: string };
  savings?: number;
  freeVisitAbove?: number;
  title?: string;
}) {
  return (
    <div className="space-y-2.5 text-[14px]" data-testid="bill">
      <p className="text-[12px] font-bold uppercase tracking-wider text-mute">{title}</p>
      <Row label="Item total" value={rupees(pricing.subtotal)} />
      {pricing.discount > 0 && <Row label={`Coupon ${pricing.couponCode ?? ''}`.trim()} value={`− ${rupees(pricing.discount)}`} strong />}
      <Row label="Visit fee" value={pricing.visitFee ? rupees(pricing.visitFee) : 'Free'} />
      {freeVisitAbove && pricing.visitFee > 0 && (
        <p className="text-[12px] text-mute">Add {rupees(freeVisitAbove - pricing.subtotal)} more to skip the visit fee.</p>
      )}
      <div className="flex items-center justify-between border-t border-dashed border-line-2 pt-3 text-[17px] font-bold">
        <span>Total</span>
        <span data-testid="bill-total">{rupees(pricing.total)}</span>
      </div>
      {!!savings && savings > 0 && (
        <p className="rounded-xl bg-sun-soft px-3 py-2 text-[13px] font-semibold">You save {rupees(savings)} on this booking</p>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-mute">{label}</span>
      <span className={clsx('font-semibold', strong && 'text-ok')}>{value}</span>
    </div>
  );
}

const CHIP: Record<BookingStatus, string> = {
  pending: 'bg-white border-ink',
  assigned: 'bg-sun border-ink',
  on_the_way: 'bg-sun border-ink',
  in_progress: 'bg-ink text-white border-ink',
  completed: 'bg-white text-ok border-ok',
  cancelled: 'bg-paper text-mute border-line-2',
};

export function StatusChip({ status }: { status: BookingStatus }) {
  return (
    <span data-testid="status-chip" className={clsx('inline-flex items-center rounded-full border-[1.5px] px-3 py-1 text-[12px] font-bold', CHIP[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const STEPS: { status: BookingStatus; label: string; detail: string }[] = [
  { status: 'pending', label: 'Booking placed', detail: 'We’re matching you with a professional' },
  { status: 'assigned', label: 'Professional assigned', detail: 'Your pro has accepted the job' },
  { status: 'on_the_way', label: 'On the way', detail: 'Your pro is heading to you' },
  { status: 'in_progress', label: 'Job started', detail: 'Started after your PIN check' },
  { status: 'completed', label: 'Completed', detail: 'Pay your pro by UPI or cash' },
];

export function StatusTrack({ booking }: { booking: Booking }) {
  const when = (s: string) => {
    const entry = [...booking.timeline].reverse().find((t) => t.status === s);
    return entry ? new Date(entry.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;
  };
  if (booking.status === 'cancelled') {
    return (
      <div className="flex gap-4">
        <span className="grid size-9 flex-none place-items-center rounded-full border-[1.5px] border-ink bg-paper">
          <X className="size-4" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">Booking cancelled</p>
          <p className="text-[13px] text-mute">
            {booking.cancellation?.reason}
            {booking.cancellation?.by === 'admin' ? ' · by Genie Sevai support' : ''}
          </p>
        </div>
      </div>
    );
  }
  const current = STEPS.findIndex((s) => s.status === booking.status);
  return (
    <ol className="relative" data-testid="status-track">
      {STEPS.map((s, i) => {
        const done = i < current || booking.status === 'completed';
        const now = i === current && booking.status !== 'completed';
        return (
          <li key={s.status} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STEPS.length - 1 && <span className={clsx('absolute left-[17px] top-9 h-[calc(100%-36px)] w-[2px]', done ? 'bg-ink' : 'bg-line')} aria-hidden />}
            <span
              className={clsx(
                'track-dot grid size-9 flex-none place-items-center rounded-full border-[1.5px] text-[13px] font-bold',
                done ? 'border-ink bg-ink text-white' : now ? 'is-now border-ink bg-sun' : 'border-line-2 bg-white text-mute',
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <div className="pt-1">
              <p className={clsx('font-semibold', !done && !now && 'text-mute')}>{s.label}</p>
              <p className="text-[13px] text-mute">{when(s.status) ?? s.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
