import clsx from 'clsx';
import { ArrowRight, CalendarDays, ChevronDown, CircleHelp, Compass, House, Search, ShoppingBag, User } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { useUi } from '../context/ui';
import { initials, rupees } from '../lib/format';
import { Overlays } from './overlays';

/**
 * Genie Sevai mark: the Genie lamp, its smoke rising to draw a house roof, with sparkles.
 * Solid brand colours only. `ring` adds a yellow outline for dark backgrounds.
 */
export function LogoMark({ className, ring }: { className?: string; ring?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#0B0B0C" />
      <path d="M52.6 33.4C58 28.4 56.6 23.4 50.6 20.4L40.5 12 30.4 20.4" fill="none" stroke="#FAFAF7" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M47.6 26.6C45 25.4 45.6 22.4 48.2 22.6" fill="none" stroke="#FAFAF7" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 11.5 18.4 15.6 22.5 17 18.4 18.4 17 22.5 15.6 18.4 11.5 17 15.6 15.6Z" fill="#FFD400" />
      <path d="M50 43 50.9 45.6 53.5 46.5 50.9 47.4 50 50 49.1 47.4 46.5 46.5 49.1 45.6Z" fill="#FFD400" />
      <path d="M13.2 38.2C8 36.8 7 44 13.4 43.4" fill="none" stroke="#FFD400" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22.5 47.6h11l2.6 3.9H19.9Z" fill="#E5BE00" stroke="#0B0B0C" strokeWidth="1.2" strokeLinejoin="round" />
      <path
        d="M12.4 39C12.4 45.4 19.3 48 28 48S41 45.6 44.2 42.2L53.4 35.6C54.6 34.7 53.8 33 52.4 33.5L43.6 36.7C40 35.6 35 35.1 28 35.1S12.4 36 12.4 39Z"
        fill="#FFD400"
        stroke="#0B0B0C"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M19.2 35.4C19.6 30.6 23.6 28.5 28 28.5S36.4 30.6 36.8 35.4Z" fill="#E5BE00" stroke="#0B0B0C" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="28" cy="26.4" r="2.2" fill="#FFD400" stroke="#0B0B0C" strokeWidth="1.1" />
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#FFD400" strokeWidth="1.2" />}
    </svg>
  );
}

/** "Genie" with the Genie smile underneath, then "Sevai" on a yellow tag. */
export function Wordmark({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span role="img" aria-label="Genie Sevai" className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-10" ring={dark} />
      <span aria-hidden className={clsx('display inline-flex items-baseline gap-1.5 pb-[0.3em] text-[25px] font-extrabold !leading-none', dark ? 'text-white' : 'text-ink')}>
        <span className="relative">
          Genie
          <svg viewBox="0 0 100 22" className="absolute -bottom-[0.3em] right-[-4%] w-[58%]">
            <path d="M6 5Q50 27 94 5" fill="none" stroke="#FFD400" strokeWidth="10" strokeLinecap="round" />
          </svg>
        </span>
        <span className="rounded-md bg-sun px-1.5 pb-0.5 text-[0.82em] text-ink">Sevai</span>
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

/** Sticky header: brand, where we're serving, search, cart and account. */
function Header() {
  const { city } = useCity();
  const { openCity, openSearch, openAuth } = useUi();
  const { customer, token } = useAuth();
  const { count } = useCart();
  const home = customer?.addresses.find((a) => a.city === city?.slug && a.isDefault) ?? customer?.addresses.find((a) => a.city === city?.slug);
  const where = home ? `${home.label} · ${[home.line1, home.line2].filter(Boolean).join(', ')}` : city ? `${city.state} · slots 8 AM – 8 PM` : 'Choose where you need us';

  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-line bg-white">
      <div className="mx-auto grid h-full max-w-[1320px] grid-cols-[auto_1fr_auto] grid-rows-[60px_auto] items-center gap-x-3 px-4 md:grid-cols-[auto_minmax(0,320px)_1fr_auto] md:grid-rows-1 md:gap-x-6 md:px-8">
        <Link to="/" aria-label="Genie Sevai home" className="col-start-1 row-start-1 flex items-center">
          <LogoMark className="size-10 md:hidden" />
          <span className="hidden md:inline-flex">
            <Wordmark />
          </span>
        </Link>

        <button type="button" onClick={openCity} data-testid="city-pill" className="group col-start-2 row-start-1 min-w-0 text-left" aria-label={`Change city, currently ${city?.name ?? 'not set'}`}>
          <span className="display block truncate text-[19px] font-extrabold leading-tight md:text-[24px]">
            In <span className="rounded-md bg-sun px-1.5">{city?.name ?? '…'}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[12px] text-mute md:text-[13px]">
            <span className="truncate">{where}</span>
            <ChevronDown className="size-3.5 flex-none transition-transform group-hover:translate-y-0.5" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          onClick={openSearch}
          aria-label="Search services"
          className="col-span-3 col-start-1 row-start-2 flex h-11 items-center gap-3 self-start rounded-2xl border-[1.5px] border-line-2 bg-white px-4 text-left text-[14px] text-mute transition-colors hover:border-ink md:col-span-1 md:col-start-3 md:row-start-1 md:h-12 md:self-center md:text-[15px]"
        >
          <Search className="size-[18px] flex-none text-ink" aria-hidden />
          <span className="flex-1 truncate">Search for a service</span>
          <kbd className="hidden rounded-md border border-line-2 px-1.5 py-0.5 font-mono text-[11px] lg:inline">Ctrl K</kbd>
        </button>

        <div className="col-start-3 row-start-1 flex items-center gap-2 md:col-start-4">
          <Link
            to="/cart"
            aria-label={`Cart, ${count} items`}
            className="relative grid size-11 place-items-center rounded-full border-[1.5px] border-line-2 bg-white transition-colors hover:border-ink"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-white bg-ink text-[10px] font-bold text-white">{count}</span>}
          </Link>
          {customer ? (
            <Link to="/account" aria-label="Your account" className="grid size-11 place-items-center rounded-full border-[1.5px] border-ink bg-sun text-[13px] font-bold">
              {initials(customer.name || 'You')}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => !token && openAuth()}
              aria-label="Sign in"
              className="grid size-11 place-items-center rounded-full border-[1.5px] border-ink bg-white transition-colors hover:bg-sun"
            >
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
    <nav aria-label="Primary" className="safe-bottom fixed bottom-3 left-1/2 z-40 w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2">
      <div className="flex h-[68px] items-stretch justify-around rounded-[22px] border border-line-2 bg-white px-1.5 shadow-[0_12px_32px_-12px_rgb(11_11_12/0.35)]">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="group flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-mute aria-[current=page]:text-ink md:text-[12px]">
            {({ isActive }) => (
              <>
                <span className={clsx('grid h-8 w-12 place-items-center rounded-full transition-all duration-300', isActive ? 'bg-sun shadow-block' : 'group-hover:bg-paper')}>
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
      className="fixed inset-x-3 bottom-[92px] z-40 flex animate-rise items-center gap-3 rounded-[20px] border-[1.5px] border-ink bg-sun px-4 py-3 shadow-block-md md:inset-x-auto md:bottom-[96px] md:right-6 md:w-[340px]"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-ink text-white">
        <ShoppingBag className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[15px] font-bold">
          {count} item{count > 1 ? 's' : ''} · {rupees(subtotal)}
        </span>
        <span className="block truncate text-[12px] font-medium">{cart.category?.name}</span>
      </span>
      <span className="inline-flex items-center gap-1 text-[14px] font-bold">
        View cart <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}

/** End-of-page "ticket" with the links a footer would normally hold. */
export function SignOff() {
  const year = new Date().getFullYear();
  return (
    <section aria-label="More from Genie Sevai" className="lazy-section mx-auto max-w-[1240px] px-5 pb-10 pt-16 md:px-8">
      <div className="ticket card grid overflow-visible md:grid-cols-[1.3fr_1fr]">
        <div className="p-6 md:p-10">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-mute">Admit one · any day, 8 AM – 8 PM</p>
          <h2 className="display mt-4 text-[44px] font-extrabold !leading-[1.12] md:text-[64px]">
            Got a job <br className="hidden md:block" />
            for <span className="mark">us?</span>
          </h2>
          <Link to="/explore" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white">
            Book a service <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="perforation grid grid-cols-2 gap-6 p-6 text-[14px] md:p-10">
          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-mute">Genie Sevai</p>
            <ul className="space-y-2.5 font-medium">
              <li><Link className="hover:underline" to="/explore">All services</Link></li>
              <li><Link className="hover:underline" to="/pro">Become a professional</Link></li>
              <li><Link className="hover:underline" to="/help">Help & support</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-mute">Legal</p>
            <ul className="space-y-2.5 font-medium">
              <li><Link className="hover:underline" to="/terms">Terms of service</Link></li>
              <li><Link className="hover:underline" to="/privacy">Privacy policy</Link></li>
            </ul>
          </div>
          <p className="col-span-2 mt-2 font-mono text-[12px] text-mute">© {year} Genie Sevai · Made in Tamil Nadu</p>
        </div>
      </div>
    </section>
  );
}

const NO_SIGNOFF = ['/cart', '/checkout'];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-sun focus:px-4 focus:py-2 focus:font-semibold">
        Skip to content
      </a>
      <Header />
      <main id="main" className="pb-32">
        {children}
        {!NO_SIGNOFF.some((p) => pathname.startsWith(p)) && <SignOff />}
      </main>
      <CartPill />
      <BottomNav />
      <Overlays />
    </div>
  );
}
