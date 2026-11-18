import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusChip } from '../components/booking';
import { Button, Empty, Skeleton } from '../components/ui';
import { useAuth } from '../context/auth';
import { api } from '../lib/api';
import { longDate, rupees, time12, UPCOMING } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

export function SignInPrompt({ title, text }: { title: string; text: string }) {
  const { requireAuth } = useAuth();
  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8">
      <Empty icon={<CalendarDays className="size-7" />} title={title} action={<Button onClick={() => requireAuth()}>Sign in with Google</Button>}>
        {text}
      </Empty>
    </div>
  );
}

export default function Bookings() {
  useDocumentTitle('My bookings');
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data, isLoading } = useQuery({ queryKey: ['bookings'], queryFn: api.bookings, enabled: !!token, refetchInterval: 30_000 });

  if (ready && !token) return <SignInPrompt title="Your bookings live here" text="Sign in to see upcoming visits, your service PIN and past jobs." />;

  const all = data?.bookings ?? [];
  const upcoming = all.filter((b) => UPCOMING.includes(b.status)).sort((a, b) => a.slot.start.localeCompare(b.slot.start));
  const past = all.filter((b) => !UPCOMING.includes(b.status));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <h1 className="display text-[44px] font-extrabold md:text-[64px]">Bookings</h1>
      <div className="mt-6 inline-flex rounded-full border-[1.5px] border-ink bg-white p-1" role="tablist" aria-label="Booking lists">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx('h-10 rounded-full px-5 text-[14px] font-semibold transition-colors', tab === t ? 'bg-ink text-white' : 'text-ink')}
          >
            {t === 'upcoming' ? 'Upcoming' : 'Past'}
            {t === 'upcoming' && upcoming.length > 0 && ` (${upcoming.length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2" role="tabpanel">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-[20px]" />)
        ) : list.length === 0 ? (
          <div className="md:col-span-2">
            <Empty title={tab === 'upcoming' ? 'Nothing scheduled' : 'No past bookings yet'} action={<Button onClick={() => navigate('/explore')}>Book a service</Button>}>
              {tab === 'upcoming' ? 'When you book a service it shows up here with live status.' : 'Completed and cancelled bookings appear here.'}
            </Empty>
          </div>
        ) : (
          list.map((b) => (
            <Link key={b.id} to={`/bookings/${b.id}`} data-testid="booking-card" data-code={b.code} className="card-soft group flex flex-col p-5 transition-all hover:border-ink hover:shadow-block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[12px] font-semibold text-mute">{b.code}</p>
                  <h2 className="mt-1 truncate text-[17px] font-semibold">{b.items.map((i) => i.name).join(', ')}</h2>
                  <p className="text-[13px] text-mute">{b.categoryName}</p>
                </div>
                <ArrowUpRight className="size-5 flex-none transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[14px] font-semibold">
                  {longDate(b.slot.date)} · {time12(b.slot.time)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-[14px] font-bold">{rupees(b.pricing.total)}</span>
                  <StatusChip status={b.status} />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
