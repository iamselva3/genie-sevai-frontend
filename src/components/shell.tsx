import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowRight, CalendarDays, ChevronDown, CircleHelp, Compass, House, MapPin, Search, ShoppingBag, User } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { useUi } from '../context/ui';
import { api } from '../lib/api';
import { initials, rupees, time12 } from '../lib/format';
import { Overlays } from './overlays';

/**
 * Genie Sevai mark: the Genie lamp, its smoke rising to draw a house roof, with sparkles.
 * Black & white edition. `ring` adds a white outline for dark backgrounds.
 */
export function LogoMark({ className, ring }: { className?: string; ring?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#111111" />
      <path d="M52.6 33.4C58 28.4 56.6 23.4 50.6 20.4L40.5 12 30.4 20.4" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M47.6 26.6C45 25.4 45.6 22.4 48.2 22.6" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 11.5 18.4 15.6 22.5 17 18.4 18.4 17 22.5 15.6 18.4 11.5 17 15.6 15.6Z" fill="#FFFFFF" />
      <path d="M50 43 50.9 45.6 53.5 46.5 50.9 47.4 50 50 49.1 47.4 46.5 46.5 49.1 45.6Z" fill="#A1A1AA" />
      <path d="M13.2 38.2C8 36.8 7 44 13.4 43.4" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22.5 47.6h11l2.6 3.9H19.9Z" fill="#D4D4D8" stroke="#111111" strokeWidth="1.1" strokeLinejoin="round" />
      <path
        d="M12.4 39C12.4 45.4 19.3 48 28 48S41 45.6 44.2 42.2L53.4 35.6C54.6 34.7 53.8 33 52.4 33.5L43.6 36.7C40 35.6 35 35.1 28 35.1S12.4 36 12.4 39Z"
        fill="#FFFFFF"
        stroke="#111111"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M19.2 35.4C19.6 30.6 23.6 28.5 28 28.5S36.4 30.6 36.8 35.4Z" fill="#D4D4D8" stroke="#111111" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="28" cy="26.4" r="2.2" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />}
    </svg>
  );
}

/** "Genie" with the Genie smile underneath, then "Sevai" on a black tag. */
export function Wordmark({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span role="img" aria-label="Genie Sevai" className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-10" ring={dark} />
      <span aria-hidden className={clsx('inline-flex items-baseline gap-1.5 pb-[0.3em] text-[23px] font-bold leading-none tracking-[-0.03em]', dark ? 'text-white' : 'text-ink')}>
        <span className="relative">
          Genie
          <svg viewBox="0 0 100 22" className="absolute -bottom-[0.3em] right-[-4%] w-[58%]">
            <path d="M6 5Q50 27 94 5" fill="none" stroke={dark ? '#FFFFFF' : '#111111'} strokeWidth="10" strokeLinecap="round" />
          </svg>
        </span>
        <span className={clsx('rounded-md px-1.5 pb-0.5 text-[0.8em]', dark ? 'bg-white text-ink' : 'bg-ink text-white')}>Sevai</span>
      </span>
    </span>
  );
}

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/help', label: 'Help', icon: CircleHelp },
  { to: '/account', label: 'Account', icon: User },
];

/** Earliest bookable slot in the city (from the first category's live availability). */
function useNextSlot(citySlug?: string) {
  const cats = useQuery({ queryKey: ['categories', citySlug], queryFn: () => api.categories(citySlug), enabled: !!citySlug, staleTime: 5 * 60_000 });
  const first = cats.data?.categories.find((c) => (c.bookableCount ?? 0) > 0)?.slug;
  const slots = useQuery({
    queryKey: ['slots', citySlug, first, undefined],
    queryFn: () => api.slots(citySlug!, first!),
    enabled: !!citySlug && !!first,
    staleTime: 60_000,
  });
  const days = slots.data?.days ?? [];
  for (let i = 0; i < days.length; i += 1) {
    const s = days[i].slots.find((x) => x.available);
    if (s) return { when: i === 0 ? 'today' : i === 1 ? 'tomorrow' : days[i].weekday, time: time12(s.time).replace(':00', '') };
  }
  return null;
}

/** Sticky header: brand, next free slot + address, search, cart and account. */
function Header() {
  const { city, citySlug } = useCity();
  const { openCity, openSearch, openAuth } = useUi();
  const { customer, token } = useAuth();
  const { count } = useCart();
  const next = useNextSlot(citySlug);
  const home = customer?.addresses.find((a) => a.city === city?.slug && a.isDefault) ?? customer?.addresses.find((a) => a.city === city?.slug);
  const where = home ? `${home.label} · ${[home.line1, home.line2].filter(Boolean).join(', ')}` : city ? `${city.name}, ${city.state}` : 'Choose your city';

  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-line bg-white">
      <div className="mx-auto grid h-full max-w-[1320px] grid-cols-[auto_1fr_auto] grid-rows-[64px_auto] items-center gap-x-3 px-4 md:grid-cols-[auto_minmax(0,360px)_1fr_auto] md:grid-rows-1 md:gap-x-7 md:px-8">
        <Link to="/" aria-label="Genie Sevai home" className="col-start-1 row-start-1 flex items-center">
          <LogoMark className="size-10 md:hidden" />
          <span className="hidden md:inline-flex">
            <Wordmark />
          </span>
        </Link>

        <button
          type="button"
          onClick={openCity}
          data-testid="city-pill"
          className="group col-start-2 row-start-1 min-w-0 text-left"
          aria-label={`Change location, currently ${city?.name ?? 'not set'}`}
        >
          <span className="block truncate text-[17px] font-semibold leading-tight tracking-[-0.01em] md:text-[21px]">
            {next ? (
              <>
                Next slot <span className="text-ok">{next.time}</span> <span className="text-[0.8em] font-medium text-mute">{next.when}</span>
              </>
            ) : (
              <>Slots 8 AM – 8 PM</>
            )}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-mute md:text-[13.5px]">
            <MapPin className="size-3.5 flex-none text-brand" aria-hidden />
            <span className="truncate">{where}</span>
            <ChevronDown className="size-3.5 flex-none transition-transform group-hover:translate-y-0.5" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          onClick={openSearch}
          aria-label="Search services"
          className="col-span-3 col-start-1 row-start-2 flex h-11 items-center gap-3 self-start rounded-xl border border-line-2 bg-white px-4 text-left text-[14.5px] text-mute transition-colors hover:border-brand md:col-span-1 md:col-start-3 md:row-start-1 md:h-12 md:self-center md:text-[15px]"
        >
          <Search className="size-[18px] flex-none text-ink-3" aria-hidden />
          <span className="flex-1 truncate">Search “AC service”, “deep cleaning”…</span>
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-mute lg:inline">Ctrl K</kbd>
        </button>

        <div className="col-start-3 row-start-1 flex items-center gap-2 md:col-start-4">
          <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative grid size-11 place-items-center rounded-full border border-line-2 bg-white transition-colors hover:border-brand">
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-white bg-brand text-[10px] font-bold text-white">{count}</span>}
          </Link>
          {customer ? (
            <Link to="/account" aria-label="Your account" className="grid size-11 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">
              {initials(customer.name || 'You')}
            </Link>
          ) : (
            <button type="button" onClick={() => !token && openAuth()} aria-label="Sign in" className="grid size-11 place-items-center rounded-full border border-line-2 bg-white transition-colors hover:border-brand">
              <User className="size-5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Floating pill navigation, on phones and desktop alike. */
function BottomNav() {
  return (
    <nav aria-label="Primary" className="safe-bottom fixed bottom-3 left-1/2 z-40 w-[calc(100%-24px)] max-w-[540px] -translate-x-1/2">
      <div className="flex h-[66px] items-stretch justify-around rounded-[20px] border border-line bg-white px-1.5 shadow-[0_10px_30px_-10px_rgb(15_23_42/0.3)]">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="group flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-mute aria-[current=page]:font-semibold aria-[current=page]:text-brand md:text-[12px]">
            {({ isActive }) => (
              <>
                <span className={clsx('grid h-8 w-12 place-items-center rounded-full transition-colors duration-300', isActive ? 'bg-brand-soft' : 'group-hover:bg-tile')}>
                  <Icon className="size-[19px]" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function CartPill() {
  const { count, subtotal, cart } = useCart();
  const { pathname } = useLocation();
  if (!count || pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return null;
  return (
    <Link
      to="/cart"
      data-testid="cart-pill"
      className="fixed inset-x-3 bottom-[90px] z-40 flex animate-rise items-center gap-3 rounded-2xl bg-brand px-4 py-3 text-white shadow-block-lg md:inset-x-auto md:bottom-[96px] md:right-6 md:w-[340px]"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-white/15">
        <ShoppingBag className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[15px] font-semibold">
          {count} item{count > 1 ? 's' : ''} · {rupees(subtotal)}
        </span>
        <span className="block truncate text-[12px] text-white/80">{cart.category?.name}</span>
      </span>
      <span className="inline-flex items-center gap-1 text-[14px] font-semibold">
        View cart <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

/** Site footer. */
export function SignOff() {
  const year = new Date().getFullYear();
  const cols = [
    { title: 'Company', links: [['All services', '/explore'], ['Help & support', '/help']] },
    { title: 'For professionals', links: [['Become a professional', '/pro']] },
    { title: 'Legal', links: [['Terms of service', '/terms'], ['Privacy policy', '/privacy']] },
  ];
  return (
    <footer aria-label="More from Genie Sevai" className="lazy-section mt-20 border-t border-line bg-paper [contain-intrinsic-size:auto_360px]">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8 md:py-16">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-mute">Verified professionals at your door, any day from 8 AM to 8 PM. Fixed prices, and you pay only after the job.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-[13px] font-semibold text-ink">{c.title}</p>
            <ul className="space-y-2.5 text-[14px] text-mute">
              {c.links.map(([label, to]) => (
                <li key={to}>
                  <Link className="hover:text-brand" to={to}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1320px] px-4 py-5 text-[13px] text-mute md:px-8">© {year} Genie Sevai · Made in Tamil Nadu</p>
      </div>
    </footer>
  );
}

const NO_FOOTER = ['/cart', '/checkout'];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      {!NO_FOOTER.some((p) => pathname.startsWith(p)) && <SignOff />}
      <div className="h-28" aria-hidden />
      <CartPill />
      <BottomNav />
      <Overlays />
    </div>
  );
}
