import clsx from 'clsx';
import { Check, Clock, Info, Plus, ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/cart';
import { compact, duration, rupees } from '../lib/format';
import { useTilt } from '../lib/hooks';
import type { Category, Service } from '../lib/types';
import { CategoryArt } from './art';
import { Button, Modal, Pill, Rating, Stepper } from './ui';

/** Category tile: soft tile with an illustration (or the admin's image), name underneath, price badge. */
export function CategoryTile({ category }: { category: Category }) {
  const ref = useTilt<HTMLSpanElement>(10);
  const unavailable = category.bookableCount === 0;
  const badge = unavailable ? 'Back soon' : category.startingPrice != null ? `from ${rupees(category.startingPrice)}` : null;
  return (
    <Link to={`/c/${category.slug}`} data-testid="category-tile" data-slug={category.slug} className="group flex flex-col items-center gap-2 text-center">
      <span ref={ref} className="tilt relative grid aspect-[4/3] w-full place-items-center rounded-2xl bg-tile transition-colors duration-300 group-hover:bg-brand-soft">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt="" loading="lazy" className="pop-z size-3/4 object-contain" />
        ) : (
          <CategoryArt icon={category.icon} className="pop-z w-[78%]" />
        )}
        {badge && (
          <span
            className={clsx(
              'absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border bg-white px-1.5 py-px text-[10.5px] font-semibold md:text-[11.5px]',
              unavailable ? 'border-line-2 text-mute' : 'border-[#c9ecd5] text-ok',
            )}
          >
            {badge}
          </span>
        )}
      </span>
      <span className="mt-1 text-[13px] leading-snug text-ink-2 md:text-[15px]">{category.name}</span>
    </Link>
  );
}

const TONES = ['bg-tile', 'bg-brand-soft', 'bg-brand-mist', 'bg-[#eef2f6]'];

/** Stable per-service look (background tone, mirrored art) so rows of one category don't repeat. */
function artLook(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return { tone: TONES[h % TONES.length], flip: (h >> 3) % 2 === 1 };
}

function ServiceArt({ service, className }: { service: Service; className?: string }) {
  const look = artLook(service.slug);
  return <CategoryArt icon={service.category?.icon} className={clsx(className, look.flip && '-scale-x-100')} />;
}

/** Add button that turns into a quantity stepper; disabled for services that can't be booked. */
export function AddControl({ service, size = 'md' }: { service: Service; size?: 'sm' | 'md' }) {
  const { qty, add, setQty } = useCart();
  const n = qty(service.id);
  if (!service.bookable) {
    return <span className="inline-flex h-9 items-center rounded-lg border border-dashed border-line-2 bg-white px-3 text-[12px] font-medium text-mute">Unavailable</span>;
  }
  if (n > 0) return <Stepper value={n} onChange={(v) => setQty(service.id, v)} label={service.name} size={size} />;
  return (
    <Button variant="sun" size="sm" onClick={() => add(service)} aria-label={`Add ${service.name}`} className={clsx('bg-white shadow-block', size === 'md' ? 'h-10 min-w-[84px]' : 'min-w-[72px]')}>
      <Plus className="size-4" strokeWidth={2.5} aria-hidden /> Add
    </Button>
  );
}

function PriceLine({ service }: { service: Service }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px]">
      <span className="font-semibold">{rupees(service.price)}</span>
      {service.mrp > service.price && <span className="text-mute line-through">{rupees(service.mrp)}</span>}
      <span className="inline-flex items-center gap-1 text-mute">
        <Clock className="size-3.5" aria-hidden /> {duration(service.durationMinutes)}
      </span>
    </div>
  );
}

export function ServiceRow({ service, onDetails }: { service: Service; onDetails: () => void }) {
  const off = service.mrp > service.price ? Math.round(((service.mrp - service.price) / service.mrp) * 100) : 0;
  return (
    <article data-testid="service-row" data-slug={service.slug} data-bookable={service.bookable} className="flex gap-4 border-b border-line py-6 last:border-0">
      <div className="min-w-0 flex-1">
        {off > 0 && service.bookable && <p className="mb-1 text-[12px] font-semibold text-ok">{off}% off</p>}
        <h3 className={clsx('text-[16.5px] font-semibold leading-snug', !service.bookable && 'text-mute')}>{service.name}</h3>
        <div className="mt-1">
          <Rating value={service.rating} count={`${compact(service.ratingCount)} reviews`} />
        </div>
        <div className="mt-2">
          <PriceLine service={service} />
        </div>
        {!service.bookable && (
          <div className="mt-2">
            <Pill tone="bad">{service.unavailableReason || 'Unavailable'}</Pill>
          </div>
        )}
        <ul className="mt-3 hidden space-y-1 text-[13px] text-mute sm:block">
          {service.inclusions.slice(0, 2).map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-mute-2" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onDetails} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-dark">
          <Info className="size-3.5" aria-hidden /> View details
        </button>
      </div>
      <div className="relative flex w-[112px] flex-none flex-col items-center md:w-[132px]">
        <span className={clsx('grid aspect-square w-full place-items-center rounded-2xl', artLook(service.slug).tone)}>
          <ServiceArt service={service} className="w-[80%]" />
        </span>
        <div className="-mt-5">
          <AddControl service={service} size="sm" />
        </div>
      </div>
    </article>
  );
}

export function ServiceTile({ service }: { service: Service }) {
  const ref = useTilt<HTMLElement>(6);
  return (
    <article ref={ref} data-testid="service-tile" className="tilt flex w-[240px] flex-none snap-start flex-col md:w-[264px]">
      <Link to={`/c/${service.category?.slug}?s=${service.slug}`} className="group block">
        <span className={clsx('relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl', artLook(service.slug).tone)}>
          <ServiceArt service={service} className="pop-z w-[66%]" />
          {service.mrp > service.price && (
            <span className="absolute left-3 top-3 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ok">
              {Math.round(((service.mrp - service.price) / service.mrp) * 100)}% off
            </span>
          )}
          {service.group && <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink-3">{service.group}</span>}
        </span>
        <p className="mt-3 line-clamp-2 min-h-[2.5em] text-[15px] font-semibold leading-snug group-hover:text-brand">{service.name}</p>
      </Link>
      <div className="mt-1">
        <Rating value={service.rating} count={compact(service.ratingCount)} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5 text-[14px]">
          <span className="font-semibold">{rupees(service.price)}</span>
          {service.mrp > service.price && <span className="text-[12.5px] text-mute line-through">{rupees(service.mrp)}</span>}
        </div>
        <AddControl service={service} size="sm" />
      </div>
    </article>
  );
}

export function ServiceSheet({ service, onClose }: { service: Service | null; onClose: () => void }) {
  return (
    <Modal open={!!service} onClose={onClose} title={service?.name ?? ''} variant="side" footer={service && <SheetFooter service={service} />}>
      {service && (
        <div className="space-y-6">
          <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-tile">
            <CategoryArt icon={service.category?.icon} className="w-[46%]" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Rating value={service.rating} count={`${compact(service.ratingCount)} reviews`} />
            <span className="text-line-2">•</span>
            <span className="inline-flex items-center gap-1 text-[13px] text-ink-3">
              <Clock className="size-3.5" aria-hidden /> {duration(service.durationMinutes)}
            </span>
            {service.group && <Pill>{service.group}</Pill>}
          </div>
          {!service.bookable && <Pill tone="bad">{service.unavailableReason || 'Unavailable'}</Pill>}
          <p className="text-[15px] leading-relaxed text-ink-3">{service.description || service.shortDescription}</p>
          {service.inclusions.length > 0 && (
            <section>
              <h3 className="mb-3 text-[15px] font-semibold">What’s included</h3>
              <ul className="space-y-2.5">
                {service.inclusions.map((i) => (
                  <li key={i} className="flex gap-3 text-[14.5px] text-ink-2">
                    <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-ok-soft text-ok">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    {i}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {service.exclusions.length > 0 && (
            <section>
              <h3 className="mb-3 text-[15px] font-semibold">Not included</h3>
              <ul className="space-y-2.5">
                {service.exclusions.map((i) => (
                  <li key={i} className="flex gap-3 text-[14.5px] text-mute">
                    <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-tile">
                      <X className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    {i}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="flex gap-3 rounded-2xl bg-brand-mist p-4 text-[14px] leading-relaxed text-ink-3">
            <ShieldCheck className="mt-0.5 size-5 flex-none text-brand" aria-hidden />
            <p>
              <strong className="font-semibold text-ink">Pay after the job.</strong> Your professional checks a 4-digit PIN before starting, and you pay by UPI or cash once you’re happy.
            </p>
          </section>
        </div>
      )}
    </Modal>
  );
}

function SheetFooter({ service }: { service: Service }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[19px] font-semibold">{rupees(service.price)}</div>
        {service.mrp > service.price && <div className="text-[13px] text-mute line-through">{rupees(service.mrp)}</div>}
      </div>
      <AddControl service={service} />
    </div>
  );
}
