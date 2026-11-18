import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, CalendarCheck, Check, KeyRound, MousePointerClick, Wallet } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AcBanner, BathroomBanner, CategoryArt, GiftBanner } from '../components/art';
import { CategoryTile, ServiceTile } from '../components/catalog';
import { Skeleton } from '../components/ui';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { api } from '../lib/api';
import { rupees } from '../lib/format';
import { useDocumentTitle, useInView, useTilt } from '../lib/hooks';
import type { Category, Coupon, Service } from '../lib/types';

/* ---------------- Shelf: heading + horizontal scroller ---------------- */

/** Below-the-fold shelf. Its cards are only created once it scrolls near, which keeps first load light. */
function Shelf({
  title,
  action,
  children,
  testId,
  placeholder = 'h-[262px] w-[240px] rounded-2xl md:w-[264px]',
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  testId?: string;
  placeholder?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [section, near] = useInView<HTMLElement>({ rootMargin: '500px 0px', threshold: 0 });
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * Math.max(320, (scroller.current?.clientWidth ?? 600) * 0.8), behavior: 'smooth' });
  return (
    <section ref={section} className="lazy-section mx-auto max-w-[1320px] px-4 pt-14 md:px-8 md:pt-16" data-testid={testId}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] md:text-[28px]">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className="hidden size-9 place-items-center rounded-full border border-line-2 bg-white hover:border-ink-3 md:grid">
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className="hidden size-9 place-items-center rounded-full border border-line-2 bg-white hover:border-ink-3 md:grid">
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div ref={scroller} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:gap-5 md:px-8">
        {near ? children : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className={clsx('flex-none', placeholder)} />)}
      </div>
    </section>
  );
}

/* ---------------- Offer banners ---------------- */

type Slide = { key: string; tone: string; content: ReactNode };

function couponHeadline(c: Coupon) {
  if (c.type === 'flat') return `Flat ${rupees(c.value)} off`;
  return c.maxDiscount ? `${c.value}% off, up to ${rupees(c.maxDiscount)}` : `${c.value}% off`;
}

function PriceSeal({ price, mrp, dark }: { price: number; mrp: number; dark?: boolean }) {
  return (
    <span
      className={clsx(
        'absolute right-[4%] top-[8%] z-10 grid size-[74px] rotate-[-8deg] place-items-center rounded-full text-center leading-none md:size-[92px]',
        dark ? 'bg-white text-brand-navy' : 'bg-brand-navy text-white',
      )}
    >
      <span>
        <span className="block text-[19px] font-bold md:text-[24px]">{rupees(price)}</span>
        {mrp > price && <span className="mt-1 block text-[12px] line-through opacity-70 md:text-[13px]">{rupees(mrp)}</span>}
      </span>
    </span>
  );
}

function OfferBanners({ popular }: { popular: Service[] }) {
  const navigate = useNavigate();
  const { setCoupon } = useCart();
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: api.coupons, staleTime: 5 * 60_000 });
  const [activeKey, setActiveKey] = useState('');
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);

  const bath = popular.find((s) => s.slug === 'bathroom-deep-cleaning' && s.bookable);
  const ac = popular.find((s) => s.slug === 'foam-jet-ac-service-split' && s.bookable);
  const [first, second] = coupons.data?.coupons ?? [];

  const serviceLink = (s: Service) => `/c/${s.category?.slug}?s=${s.slug}`;
  const bookWithCode = (code: string) => {
    setCoupon(code);
    navigate('/explore');
  };

  const couponSlide = (c: Coupon, tone: string, light: boolean): Slide => ({
    key: c.code,
    tone,
    content: (
      <>
        <div className="relative z-10 flex h-full max-w-[60%] flex-col justify-center">
          <p className={clsx('text-[12px] font-semibold uppercase tracking-[0.14em]', light ? 'text-brand' : 'text-brand-light')}>Use code {c.code}</p>
          <p className="mt-2 text-[26px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[34px] md:text-[42px]">{couponHeadline(c)}</p>
          <p className={clsx('mt-2 line-clamp-2 text-[13px] md:text-[15px]', light ? 'text-ink-3' : 'text-white/75')}>{c.description}</p>
          <div>
            <button
              type="button"
              onClick={() => bookWithCode(c.code)}
              className={clsx('mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold md:h-11 md:px-5', light ? 'bg-brand text-white' : 'bg-white text-brand-navy')}
            >
              Book now <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <GiftBanner className="absolute bottom-0 right-0 h-[88%] w-auto" />
      </>
    ),
  });

  const slides: Slide[] = [];
  if (bath)
    slides.push({
      key: 'bathroom',
      tone: 'bg-brand-soft text-brand-navy',
      content: (
        <>
          <svg className="absolute inset-0 size-full" aria-hidden>
            <defs>
              <pattern id="tiles" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M44 0H0V44" fill="none" stroke="#d5e3ff" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tiles)" />
          </svg>
          <div className="relative z-10 flex h-full max-w-[58%] flex-col justify-center">
            <p className="w-fit rounded-md bg-brand-navy px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">Bathroom deep clean</p>
            <p className="mt-3 text-[28px] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-brand sm:text-[40px] md:text-[52px]">
              Shine
              <br />
              shine
            </p>
            <div>
              <Link to={serviceLink(bath)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-navy px-4 text-[14px] font-semibold text-white md:h-11 md:px-5">
                Book now <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <PriceSeal price={bath.price} mrp={bath.mrp} />
          <BathroomBanner className="absolute bottom-0 right-0 h-[96%] w-auto" />
        </>
      ),
    });
  if (first) slides.push(couponSlide(first, 'bg-brand-navy text-white', false));
  if (ac)
    slides.push({
      key: 'ac',
      tone: 'bg-brand text-white',
      content: (
        <>
          <div className="relative z-10 flex h-full max-w-[52%] flex-col justify-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-light">Summer-ready</p>
            <p className="mt-2 text-[26px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[34px] md:text-[42px]">AC service, cool in an hour</p>
            <div>
              <Link to={serviceLink(ac)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-brand md:h-11 md:px-5">
                Book now <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <PriceSeal price={ac.price} mrp={ac.mrp} dark />
          <AcBanner className="absolute bottom-[4%] right-0 h-[80%] w-auto" />
        </>
      ),
    });
  if (second) slides.push(couponSlide(second, 'bg-[#dce8ff] text-brand-navy', true));

  const count = slides.length;
  const keys = slides.map((s) => s.key).join('|');
  const found = slides.findIndex((s) => s.key === activeKey);
  const current = found >= 0 ? found : 0;
  const prev = (current - 1 + count) % count;
  const paused = hovered || focused || stopped;
  // Only build a slide's content once it has been shown (keeps the first render light).
  const seen = useRef(new Set<string>());
  if (slides[current]) seen.current.add(slides[current].key);

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const order = keys.split('|');
    const t = window.setInterval(() => {
      if (document.hidden) return;
      setActiveKey((k) => order[(Math.max(0, order.indexOf(k)) + 1) % order.length]);
    }, 5000);
    return () => window.clearInterval(t);
  }, [paused, count, keys]);

  if (!count) return <Skeleton className="h-[200px] rounded-3xl sm:h-[240px] md:h-[300px]" />;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="promo relative h-[200px] sm:h-[240px] md:h-[300px]">
        {slides.map((s, n) => (
          <div
            key={s.key}
            data-testid="promo-slide"
            ref={(el) => {
              if (el) el.inert = n !== current;
            }}
            className={clsx(
              'promo-slide overflow-hidden rounded-3xl p-5 sm:p-7 md:p-9',
              s.tone,
              n === current && 'is-active',
              count > 1 && n === prev && n !== current && 'is-prev',
            )}
          >
            {seen.current.has(s.key) || n === current ? s.content : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        {slides.map((s, n) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Show offer ${n + 1}`}
            aria-pressed={n === current}
            onClick={() => {
              setStopped(true);
              setActiveKey(s.key);
            }}
            className="group grid h-6 min-w-6 place-items-center px-1"
          >
            <span className={clsx('block h-1.5 rounded-full transition-all duration-300', n === current ? 'w-6 bg-brand' : 'w-3 bg-line-2 group-hover:bg-mute-2')} />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Promises ---------------- */

const PROMISES = ['Trained, background-verified professionals', 'Fixed prices, shown before you book', 'Pay only after the job is done', 'Free re-visit if something isn’t right'];

function ShieldBadge() {
  return (
    <svg viewBox="0 0 40 44" className="h-10 w-9 flex-none" aria-hidden>
      <path d="M20 2 36 8v12c0 11-7 18-16 22C11 38 4 31 4 20V8Z" fill="#2563EB" />
      <path d="M20 2 36 8v12c0 11-7 18-16 22Z" fill="#1D4ED8" />
      <path d="m12.5 21.5 5.2 5.2 10-11" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Promises() {
  return (
    <section aria-labelledby="promise-title">
      <div className="flex items-center gap-3.5">
        <ShieldBadge />
        <h2 id="promise-title" className="text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">
          Our promises
        </h2>
      </div>
      <ul className="mt-5 space-y-4">
        {PROMISES.map((p) => (
          <li key={p} className="flex items-center gap-3.5 text-[15px] text-ink-2 md:text-[16.5px]">
            <Check className="size-5 flex-none text-brand" strokeWidth={2.5} aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Tiles ---------------- */

function QuickTile({ service }: { service: Service }) {
  return (
    <Link to={`/c/${service.category?.slug}?s=${service.slug}`} className="group flex flex-col items-center gap-2 text-center" data-testid="quick-tile">
      <span className="relative grid aspect-[4/3] w-full place-items-center rounded-2xl bg-tile transition-colors duration-300 group-hover:bg-brand-soft">
        <CategoryArt icon={service.category?.icon} className="w-[72%] transition-transform duration-300 group-hover:-translate-y-1" />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-2 bg-white px-1.5 py-px text-[10.5px] font-semibold md:text-[11.5px]">
          {rupees(service.price)}
        </span>
      </span>
      <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-2 md:text-[15px]">{service.name}</span>
    </Link>
  );
}

function SpotlightCard({ category }: { category: Category }) {
  const ref = useTilt<HTMLAnchorElement>(6);
  return (
    <Link ref={ref} to={`/c/${category.slug}`} data-testid="spotlight-card" className="tilt group flex w-[230px] flex-none snap-start flex-col md:w-[260px]">
      <span className="grid aspect-[5/4] place-items-center rounded-2xl bg-brand-mist transition-colors duration-300 group-hover:bg-brand-soft">
        <CategoryArt icon={category.icon} className="pop-z w-[64%]" />
      </span>
      <span className="mt-3 text-[15px] font-semibold group-hover:text-brand">{category.name}</span>
      <span className="mt-0.5 line-clamp-1 text-[13px] text-mute">{category.tagline}</span>
    </Link>
  );
}

const STEPS = [
  { icon: MousePointerClick, title: 'Pick a service', text: 'Fixed prices with what’s included, upfront.' },
  { icon: CalendarCheck, title: 'Choose a slot', text: 'Any hour, 8 AM – 8 PM, up to a week ahead.' },
  { icon: KeyRound, title: 'Share your PIN', text: 'Work starts only after your pro reads your PIN.' },
  { icon: Wallet, title: 'Pay after the job', text: 'UPI or cash, straight to your professional.' },
];

/* ---------------- Page ---------------- */

export default function Home() {
  useDocumentTitle('');
  const { citySlug, city } = useCity();
  const { data, isLoading } = useQuery({
    queryKey: ['home', citySlug],
    queryFn: () => api.home(citySlug),
    enabled: !!citySlug,
    staleTime: 60_000,
  });
  const categories = data?.categories ?? [];
  const loading = isLoading || !citySlug;
  const quick = (data?.popular ?? []).filter((s) => s.bookable && s.price < 500).slice(0, 3);

  return (
    <>
      {/* Full height while loading, so the shelves below never start on screen and then jump. */}
      <section className={clsx('mx-auto max-w-[1320px] px-4 pt-6 md:px-8 md:pt-10', loading && 'min-h-[100dvh]')}>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-14">
          <div>
            <h1 className="text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] md:text-[38px]">
              Home services, <span className="text-brand">booked in seconds</span>
            </h1>
            <div className="card-soft mt-5 p-5 md:mt-7 md:p-7">
              <h2 className="text-[17px] font-medium text-mute md:text-[19px]">What do you need help with?</h2>
              <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8" data-testid="category-grid">
                {loading
                  ? Array.from({ length: 9 }, (_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))
                  : categories.map((c) => <CategoryTile key={c.slug} category={c} />)}
              </div>
              {quick.length > 0 && (
                <>
                  <h2 className="mt-10 text-[17px] font-semibold md:text-[19px]">Quick fixes under ₹500</h2>
                  <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-6 md:gap-x-4">
                    {quick.map((s) => (
                      <QuickTile key={s.id} service={s} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-8 lg:pt-[60px]">
            {loading ? <Skeleton className="h-[200px] rounded-3xl sm:h-[240px] md:h-[300px]" /> : <OfferBanners popular={data?.popular ?? []} />}
            <hr className="border-line" />
            <Promises />
            {data && (
              <p className="flex items-center gap-2.5 rounded-2xl bg-brand-mist px-4 py-3 text-[14px] text-ink-3">
                <span className="size-2 flex-none animate-pulse-soft rounded-full bg-ok" aria-hidden />
                <span>
                  <strong className="font-semibold text-ink">{data.stats.professionals} professionals</strong> working in {city?.name ?? 'your city'}
                  {data.stats.averageRating ? ` · rated ${data.stats.averageRating.toFixed(1)} on average` : ''}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      <Shelf title="In the spotlight" testId="spotlight" placeholder="h-[240px] w-[230px] rounded-2xl md:w-[260px]">
        {categories.slice(0, 6).map((c) => (
          <SpotlightCard key={c.slug} category={c} />
        ))}
      </Shelf>

      <Shelf title="Most booked services" testId="most-booked">
        {data?.popular.map((s) => <ServiceTile key={s.id} service={s} />)}
      </Shelf>

      {(data?.rows ?? []).map((row) => (
        <Shelf
          key={row.category.slug}
          title={row.category.name}
          action={
            <Link to={`/c/${row.category.slug}`} className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[14px] font-semibold text-brand hover:bg-brand-soft">
              See all <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          {row.services.map((s) => (
            <ServiceTile key={s.id} service={s} />
          ))}
        </Shelf>
      ))}

      <section className="lazy-section mx-auto max-w-[1320px] px-4 pt-16 md:px-8 md:pt-20" aria-labelledby="how-title">
        <div className="rounded-3xl bg-brand-mist p-6 md:p-10">
          <h2 id="how-title" className="text-[22px] font-semibold tracking-[-0.02em] md:text-[28px]">
            How Genie Sevai works
          </h2>
          <ol className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-4">
                <span className="relative grid size-12 flex-none place-items-center rounded-2xl bg-white text-brand shadow-block">
                  <Icon className="size-5" aria-hidden />
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{i + 1}</span>
                </span>
                <span>
                  <span className="block text-[15.5px] font-semibold">{title}</span>
                  <span className="mt-1 block text-[14px] text-mute">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
