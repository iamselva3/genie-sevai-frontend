import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, CalendarClock, Check, KeyRound, LayoutGrid, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryTile, ServiceTile } from '../components/catalog';
import { Coin, HeroCube, Marquee, StackCards } from '../components/three';
import { Skeleton } from '../components/ui';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { api } from '../lib/api';
import { rupees } from '../lib/format';
import { useDocumentTitle, useInView, useTilt } from '../lib/hooks';
import { categoryIcon } from '../lib/icons';
import type { Category, Coupon, Service } from '../lib/types';

/* ---------------- Shelf: heading + horizontal scroller ---------------- */

/** Below-the-fold shelf. Its cards are only created once it scrolls near, which keeps first load light. */
function Shelf({
  title,
  action,
  children,
  testId,
  placeholder = 'h-[214px] w-[260px] rounded-[20px]',
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
    <section ref={section} className="lazy-section mx-auto max-w-[1320px] px-4 pt-14 md:px-8 md:pt-20" data-testid={testId}>
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
        <h2 className="display text-[28px] font-extrabold md:text-[40px]">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className="hidden size-10 place-items-center rounded-full border-[1.5px] border-line-2 bg-white hover:border-ink md:grid">
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className="hidden size-10 place-items-center rounded-full border-[1.5px] border-ink bg-ink text-white md:grid">
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div ref={scroller} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:gap-4 md:px-8">
        {near ? children : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className={clsx('flex-none', placeholder)} />)}
      </div>
    </section>
  );
}

/** True once the browser is idle after `delay` ms (falls back to a timer where idle callbacks don't exist). */
function useIdle(delay: number) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idle = 0;
    const t = window.setTimeout(() => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setReady(true), { timeout: 1500 });
      else setReady(true);
    }, delay);
    return () => {
      window.clearTimeout(t);
      if (idle) w.cancelIdleCallback?.(idle);
    };
  }, [delay]);
  return ready;
}

/** Mounts children only when the wrapper scrolls near the viewport. */
function NearMount({ children, minHeight }: { children: ReactNode; minHeight: number }) {
  const [ref, near] = useInView<HTMLDivElement>({ rootMargin: '500px 0px', threshold: 0 });
  return (
    <div ref={ref} style={near ? undefined : { minHeight }}>
      {near ? children : null}
    </div>
  );
}

/* ---------------- 3D offer carousel ---------------- */

type Slide = { key: string; tone: string; content: ReactNode };

function couponHeadline(c: Coupon) {
  if (c.type === 'flat') return `Flat ${rupees(c.value)} off`;
  return c.maxDiscount ? `${c.value}% off, up to ${rupees(c.maxDiscount)}` : `${c.value}% off`;
}

function PromoCarousel({ categories }: { categories: Category[] }) {
  const navigate = useNavigate();
  const { setCoupon } = useCart();
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: api.coupons, staleTime: 5 * 60_000 });
  // Track the slide by key so it stays put when coupon slides load in.
  const [activeKey, setActiveKey] = useState('box');
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Once someone picks a slide themselves, stop rotating.
  const [stopped, setStopped] = useState(false);
  // The 3D cube is the heaviest thing above the fold; build it once the page is idle.
  const cubeReady = useIdle(1200);

  const bookWithCode = (code: string) => {
    setCoupon(code);
    navigate('/explore');
  };

  const slides: Slide[] = [
    {
      key: 'box',
      tone: 'bg-ink text-white',
      content: (
        <>
          <div className="relative z-10 max-w-[60%]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-sun">The Genie box</p>
            <p className="display mt-2 text-[24px] font-extrabold leading-[1.02] sm:text-[30px] md:text-[36px]">Book in a minute. Pay after the job.</p>
            <Link to="/explore" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-sun px-4 text-[14px] font-bold text-ink md:mt-5 md:h-11 md:px-5">
              Explore services <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="absolute inset-y-0 right-0 w-[44%]">{cubeReady && <div className="h-full animate-fade"><HeroCube categories={categories} compact /></div>}</div>
        </>
      ),
    },
    ...(coupons.data?.coupons ?? []).slice(0, 2).map<Slide>((c, i) => ({
      key: c.code,
      tone: i === 0 ? 'bg-sun text-ink' : 'bg-white text-ink',
      content: (
        <>
          <div className="relative z-10 max-w-[62%]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">Use code {c.code}</p>
            <p className="display mt-2 text-[26px] font-extrabold leading-[1.02] sm:text-[32px] md:text-[40px]">{couponHeadline(c)}</p>
            <p className="mt-1.5 line-clamp-2 text-[13px] text-ink/70 md:text-[14px]">{c.description}</p>
            <button type="button" onClick={() => bookWithCode(c.code)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-bold text-white md:mt-4 md:h-11 md:px-5">
              Book now <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
          <div className="absolute inset-y-0 right-4 grid w-[34%] place-items-center md:right-8">
            {i === 0 ? (
              <Coin className="size-24 sm:size-28 md:size-36" />
            ) : (
              <span className="display block rounded-2xl border-[1.5px] border-ink bg-sun px-3 py-4 text-center text-[15px] font-extrabold shadow-block-lg [transform:perspective(500px)_rotateY(-18deg)_rotate(-8deg)] md:text-[20px]">
                {c.code}
              </span>
            )}
          </div>
        </>
      ),
    })),
    {
      key: 'pin',
      tone: 'bg-tile text-ink',
      content: (
        <>
          <div className="relative z-10 max-w-[56%]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Safe by design</p>
            <p className="display mt-2 text-[24px] font-extrabold leading-[1.02] sm:text-[30px] md:text-[36px]">Work starts only after your PIN.</p>
            <Link to="/help" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 text-[14px] font-bold md:mt-5 md:h-11 md:px-5">
              How it works <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 [perspective:600px] md:right-8 md:gap-2" aria-hidden>
            {['4', '8', '2', '1'].map((d, n) => (
              <span
                key={d}
                className="display grid size-9 place-items-center rounded-xl border-[1.5px] border-ink bg-white text-lg font-extrabold shadow-block sm:size-11 md:size-14 md:text-2xl"
                style={{ transform: `rotateY(-24deg) translateZ(${n * 6}px)` }}
              >
                {d}
              </span>
            ))}
          </div>
        </>
      ),
    },
  ];

  const count = slides.length;
  const keys = slides.map((s) => s.key).join('|');
  const current = Math.max(0, slides.findIndex((s) => s.key === activeKey));
  const prev = (current - 1 + count) % count;
  const paused = hovered || focused || stopped;
  // Only build a slide's content once it has been shown (keeps the first render light).
  const seen = useRef(new Set<string>());
  seen.current.add(slides[current]?.key ?? 'box');

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const order = keys.split('|');
    const t = window.setInterval(() => {
      if (document.hidden) return;
      setActiveKey((k) => order[(order.indexOf(k) + 1) % order.length]);
    }, 5500);
    return () => window.clearInterval(t);
  }, [paused, count, keys]);

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
      <div className="promo relative h-[200px] sm:h-[230px] md:h-[270px]">
        {slides.map((s, n) => (
          <div
            key={s.key}
            data-testid="promo-slide"
            // Inactive slides are inert: hidden from screen readers and not focusable.
            ref={(el) => {
              if (el) el.inert = n !== current;
            }}
            className={clsx(
              'promo-slide overflow-hidden rounded-[24px] border-[1.5px] border-ink p-5 sm:p-7 md:p-9',
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
            <span className={clsx('block h-2 rounded-full transition-all duration-300', n === current ? 'w-7 bg-ink' : 'w-2 bg-line-2 group-hover:bg-mute-2')} />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Promises ---------------- */

const PROMISES = ['Trained, background-verified professionals', 'Fixed prices, shown before you book', 'Pay only after the job is done', 'Free re-visit if something isn’t right'];

function Promises() {
  return (
    <section aria-labelledby="promise-title">
      <div className="flex items-center gap-3">
        <span className="block-icon size-11 -rotate-6">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <h2 id="promise-title" className="display text-[26px] font-extrabold md:text-[30px]">
          Our promises
        </h2>
      </div>
      <ul className="mt-5 space-y-4">
        {PROMISES.map((p) => (
          <li key={p} className="flex items-center gap-3 text-[15px] md:text-[17px]">
            <Check className="size-5 flex-none" strokeWidth={2.5} aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- Tiles ---------------- */

function QuickTile({ service }: { service: Service }) {
  const Icon = categoryIcon(service.category?.icon);
  return (
    <Link to={`/c/${service.category?.slug}?s=${service.slug}`} className="group flex flex-col items-center gap-2 text-center" data-testid="quick-tile">
      <span className="relative grid aspect-square w-full place-items-center rounded-2xl bg-tile sm:aspect-[4/3] transition-colors duration-300 group-hover:bg-sun-soft">
        <span className="grid size-12 place-items-center rounded-[14px] border-[1.5px] border-ink bg-white shadow-block transition-transform duration-300 group-hover:-translate-y-1 md:size-14">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-2 bg-white px-1.5 py-px text-[10px] font-bold md:text-[11px]">{rupees(service.price)}</span>
      </span>
      <span className="line-clamp-2 text-[13px] font-medium leading-snug md:text-[15px]">{service.name}</span>
    </Link>
  );
}

const SPOT_TONES = ['bg-ink text-white', 'bg-sun text-ink', 'bg-white text-ink', 'bg-sun-soft text-ink'];

function SpotlightCard({ category, index }: { category: Category; index: number }) {
  const ref = useTilt<HTMLAnchorElement>(8);
  const Icon = categoryIcon(category.icon);
  return (
    <Link
      ref={ref}
      to={`/c/${category.slug}`}
      data-testid="spotlight-card"
      className={clsx(
        'tilt relative flex h-[200px] w-[290px] flex-none snap-start flex-col justify-between overflow-hidden rounded-[24px] border-[1.5px] border-ink p-6 md:h-[230px] md:w-[380px]',
        SPOT_TONES[index % SPOT_TONES.length],
      )}
    >
      <div className="relative z-10 max-w-[68%]">
        <p className={clsx('text-[12px] font-bold uppercase tracking-wider', index % 4 === 0 ? 'text-sun' : 'text-ink/60')}>{category.name}</p>
        <p className="display mt-2 text-[24px] font-extrabold leading-[1.02] md:text-[30px]">{category.tagline}</p>
      </div>
      <span className="relative z-10 inline-flex items-center gap-1.5 text-[14px] font-bold">
        {category.startingPrice != null ? `From ${rupees(category.startingPrice)}` : 'Explore'} <ArrowRight className="size-4" aria-hidden />
      </span>
      <span className="pop-z absolute -bottom-3 -right-3 grid size-28 rotate-[-12deg] place-items-center rounded-[26px] border-[1.5px] border-ink bg-sun text-ink shadow-block-lg md:size-32">
        <Icon className="size-12 md:size-14" strokeWidth={1.5} aria-hidden />
      </span>
    </Link>
  );
}

/* ---------------- Page ---------------- */

export default function Home() {
  useDocumentTitle('');
  const { citySlug, city, cities } = useCity();
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
      {/* ---------- Top: categories (left), offers + promises (right) ---------- */}
      <section className="mx-auto max-w-[1320px] px-4 pt-5 md:px-8 md:pt-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h1 className="display text-[40px] font-extrabold sm:text-[52px] lg:text-[60px]">
              Home services, <span className="mark">handled.</span>
            </h1>
            <div className="card-soft mt-6 p-5 md:mt-8 md:p-7">
              <h2 className="text-[17px] font-semibold text-mute md:text-[20px]">What do you need help with?</h2>
              <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 md:gap-x-4 md:gap-y-7" data-testid="category-grid">
                {loading
                  ? Array.from({ length: 9 }, (_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="aspect-square w-full rounded-2xl sm:aspect-[4/3]" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))
                  : categories.map((c) => <CategoryTile key={c.slug} category={c} />)}
              </div>
              {quick.length > 0 && (
                <>
                  <h2 className="mt-9 text-[17px] font-semibold md:text-[20px]">Quick fixes under ₹500</h2>
                  <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 md:gap-x-4">
                    {quick.map((s) => (
                      <QuickTile key={s.id} service={s} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-8 lg:pt-3">
            <PromoCarousel categories={categories} />
            <hr className="border-line" />
            <Promises />
            {data && (
              <p className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[14px]">
                <span className="size-2 flex-none animate-pulse-soft rounded-full bg-ok" aria-hidden />
                <span>
                  <strong>{data.stats.professionals} pros</strong> working in {city?.name ?? 'your city'}
                  {data.stats.averageRating ? ` · rated ${data.stats.averageRating.toFixed(1)} on average` : ''}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---------- In the spotlight ---------- */}
      <Shelf title="In the spotlight" testId="spotlight" placeholder="h-[200px] w-[290px] rounded-[24px] md:h-[230px] md:w-[380px]">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[200px] w-[290px] flex-none rounded-[24px] md:h-[230px] md:w-[380px]" />)
          : categories.slice(0, 6).map((c, i) => <SpotlightCard key={c.slug} category={c} index={i} />)}
      </Shelf>

      {/* ---------- Most booked ---------- */}
      <Shelf title="Most booked services" testId="most-booked">
        {loading
          ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[214px] w-[260px] flex-none rounded-[20px]" />)
          : data?.popular.map((s) => <ServiceTile key={s.id} service={s} />)}
      </Shelf>

      {/* ---------- Category shelves ---------- */}
      {(data?.rows ?? []).map((row) => (
        <Shelf
          key={row.category.slug}
          title={row.category.name}
          action={
            <Link to={`/c/${row.category.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white px-4 text-[14px] font-semibold">
              See all <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          {row.services.map((s) => (
            <ServiceTile key={s.id} service={s} />
          ))}
        </Shelf>
      ))}

      {/* ---------- How it works ---------- */}
      <section className="lazy-section mx-auto max-w-[1320px] px-4 pt-16 md:px-8 md:pt-24" aria-labelledby="how-title">
        <h2 id="how-title" className="display mb-6 text-[28px] font-extrabold md:mb-8 md:text-[40px]">
          Three taps. That’s it.
        </h2>
        <NearMount minHeight={280}>
        <StackCards>
          <article className="stack-card card flex min-h-[260px] flex-col p-7">
            <span className="block-icon size-14">
              <LayoutGrid className="size-6" aria-hidden />
            </span>
            <p aria-hidden data-num="01" className="step-num display mt-auto text-[72px] font-extrabold leading-none text-line-2" />
            <h3 className="display text-3xl font-bold">Pick a service</h3>
            <p className="mt-2 text-[15px] text-mute">Fixed prices, what’s included and how long it takes, all upfront.</p>
          </article>
          <article className="stack-card flex min-h-[260px] flex-col rounded-[22px] border-[1.5px] border-ink bg-sun p-7">
            <span className="grid size-14 place-items-center rounded-[14px] border-[1.5px] border-ink bg-white shadow-block">
              <CalendarClock className="size-6" aria-hidden />
            </span>
            <p aria-hidden data-num="02" className="step-num display mt-auto text-[72px] font-extrabold leading-none text-sun-dark" />
            <h3 className="display text-3xl font-bold">Choose a slot</h3>
            <p className="mt-2 text-[15px] text-ink/70">Any hour from 8 AM to 8 PM, up to a week ahead. Reschedule free.</p>
          </article>
          <article className="stack-card flex min-h-[260px] flex-col rounded-[22px] border-[1.5px] border-ink bg-ink p-7 text-white">
            <span className="grid size-14 place-items-center rounded-[14px] border-[1.5px] border-sun bg-ink text-sun">
              <KeyRound className="size-6" aria-hidden />
            </span>
            <p aria-hidden data-num="03" className="step-num display mt-auto text-[72px] font-extrabold leading-none text-ink-3" />
            <h3 className="display text-3xl font-bold">Share your PIN</h3>
            <p className="mt-2 text-[15px] text-mute-2">Your pro arrives, reads your PIN, does the job. You pay after.</p>
          </article>
        </StackCards>
        </NearMount>
      </section>

      {/* ---------- City tape ---------- */}
      <section className="lazy-section overflow-hidden py-14 md:py-20" aria-label="Cities we serve">
        <div className="tape -mx-4 border-y-[1.5px] border-ink bg-sun py-4 md:py-5">
          <NearMount minHeight={44}>
            <Marquee items={cities.length ? [...cities.map((c) => c.name), '8 AM – 8 PM', 'Pay after service'] : ['Genie Sevai', 'Home services', 'Handled']} />
          </NearMount>
        </div>
      </section>
    </>
  );
}
