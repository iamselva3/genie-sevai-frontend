import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, BadgeCheck, ShoppingBag, Star, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ServiceRow, ServiceSheet } from '../components/catalog';
import { Button, Empty, Skeleton, Stepper } from '../components/ui';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { api, ApiError } from '../lib/api';
import { duration, rupees } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import { CategoryArt } from '../components/art';

const groupId = (g: string) => `group-${g.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { citySlug, city } = useCity();
  const { cart, count, subtotal, setQty } = useCart();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['category', slug, citySlug],
    queryFn: () => api.category(slug, citySlug),
    enabled: !!citySlug,
    staleTime: 60_000,
    retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 2,
  });
  useDocumentTitle(data?.category.name ?? 'Services');

  const sheetSlug = params.get('s');
  const sheetService = useMemo(() => data?.services.find((s) => s.slug === sheetSlug) ?? null, [data, sheetSlug]);
  const openSheet = (s: string) => setParams((p) => (p.set('s', s), p), { replace: true });
  const closeSheet = () => setParams((p) => (p.delete('s'), p), { replace: true });

  // Highlight the group currently on screen.
  useEffect(() => {
    if (!data?.groups.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveGroup(visible.target.getAttribute('data-group'));
      },
      { rootMargin: '-120px 0px -55% 0px' },
    );
    data.groups.forEach((g) => {
      const el = document.getElementById(groupId(g));
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [data]);

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 pt-10 md:px-8">
        <Empty title="This category isn’t available" action={<Button onClick={() => navigate('/explore')}>See all services</Button>}>
          It may have been paused for now. Have a look at everything else we do.
        </Empty>
      </div>
    );
  }

  if (!data) {
    // One tall placeholder, replaced in a single step, so nothing on screen shifts while loading.
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[1240px] px-4 pt-4 md:px-8 md:pt-8" aria-busy="true">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-mute hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> All services
        </Link>
        <Skeleton className="mt-5 h-[80dvh] rounded-[22px]" />
      </div>
    );
  }

  const inThisCategory = cart.category?.slug === slug;
  const avgRating = data?.services.length ? data.services.reduce((n, s) => n + s.rating, 0) / data.services.length : null;

  return (
    <div className="mx-auto max-w-[1240px] px-4 md:px-8">
      {/* Header */}
      <header className="pt-4 md:pt-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-mute hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> All services
        </Link>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-5">
            <span className="grid size-[72px] flex-none place-items-center rounded-2xl bg-tile md:size-24">
              <CategoryArt icon={data.category.icon} className="w-[84%]" />
            </span>
            <div>
              {data ? (
                <h1 className="display text-[26px] font-semibold md:text-[34px]">{data.category.name}</h1>
              ) : (
                <Skeleton className="h-12 w-64" />
              )}
              <p className="mt-2 text-[15px] text-mute md:text-[17px]">{data?.category.tagline}</p>
            </div>
          </div>
          {data && (
            <div className="flex flex-wrap gap-2">
              {avgRating && (
                <span className="chip">
                  <Star className="size-3.5 fill-ink" aria-hidden /> {avgRating.toFixed(1)} average
                </span>
              )}
              <span className="chip">
                <Users className="size-3.5" aria-hidden /> {data.category.professionals} pros in {city?.name}
              </span>
              <span className="chip">
                <BadgeCheck className="size-3.5" aria-hidden /> Pay after service
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Group chips (mobile & tablet) */}
      {data && data.groups.length > 1 && (
        <nav aria-label="Service groups" className="no-scrollbar sticky top-[var(--header-h)] z-20 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-paper px-4 py-3 lg:hidden">
          {data.groups.map((g) => (
            <a key={g} href={`#${groupId(g)}`} className={clsx('chip', activeGroup === g && 'is-active')}>
              {g}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-6 grid gap-8 lg:mt-10 lg:grid-cols-[200px_1fr_340px]">
        {/* Group index (desktop) */}
        <nav aria-label="Service groups" className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+16px)] space-y-1">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-mute">Jump to</p>
            {data?.groups.map((g, i) => (
              <a
                key={g}
                href={`#${groupId(g)}`}
                className={clsx('flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-semibold transition-colors', activeGroup === g ? 'bg-brand text-white' : 'hover:bg-white')}
              >
                <span className={clsx('font-mono text-[11px]', activeGroup !== g && 'opacity-60')}>{String(i + 1).padStart(2, '0')}</span>
                {g}
              </a>
            ))}
          </div>
        </nav>

        {/* Services */}
        <div className="min-w-0">
          {isLoading || !data ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : data.services.length === 0 ? (
            <Empty title="Nothing to book here yet">We’re adding services to this category soon.</Empty>
          ) : (
            data.groups.map((g) => (
              <section key={g} id={groupId(g)} data-group={g} className="card-soft mb-5 px-5 py-2 md:px-7">
                <h2 className="pb-1 pt-5 text-[19px] font-semibold tracking-[-0.01em]">{g}</h2>
                {data.services
                  .filter((s) => s.group === g)
                  .map((s) => (
                    <ServiceRow key={s.id} service={s} onDetails={() => openSheet(s.slug)} />
                  ))}
              </section>
            ))
          )}
        </div>

        {/* Cart summary (desktop) */}
        <aside className="hidden lg:block" aria-label="Your cart">
          <div className="card sticky top-[calc(var(--header-h)+16px)] p-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5" aria-hidden />
              <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Your cart</h2>
            </div>
            {count === 0 ? (
              <p className="mt-4 text-[14px] text-mute">Add services to see your total here.</p>
            ) : !inThisCategory ? (
              <div className="mt-4 text-[14px] text-mute">
                You have {count} item{count > 1 ? 's' : ''} from <strong className="text-ink">{cart.category?.name}</strong>.
                <Link to="/cart" className="mt-4 flex h-11 items-center justify-center rounded-xl bg-brand font-semibold text-white">
                  Go to cart
                </Link>
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-4">
                  {cart.items.map((i) => (
                    <li key={i.serviceId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold">{i.name}</p>
                        <p className="text-[12px] text-mute">
                          {rupees(i.price * i.qty)} · {duration(i.durationMinutes * i.qty)}
                        </p>
                      </div>
                      <Stepper size="sm" value={i.qty} onChange={(v) => setQty(i.serviceId, v)} label={i.name} />
                    </li>
                  ))}
                </ul>
                <Link to="/cart" className="mt-5 flex h-12 items-center justify-between rounded-xl bg-brand pl-5 pr-2 font-semibold text-white">
                  <span>{rupees(subtotal)}</span>
                  <span className="inline-flex h-9 items-center gap-1 rounded-full bg-brand-soft px-4 text-[14px] text-ink">
                    Continue <ArrowRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <ServiceSheet service={sheetService} onClose={closeSheet} />
    </div>
  );
}
