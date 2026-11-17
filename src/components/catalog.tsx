import clsx from 'clsx';
import { Check, Clock, Info, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/cart';
import { compact, duration, rupees } from '../lib/format';
import { useTilt } from '../lib/hooks';
import { categoryIcon } from '../lib/icons';
import type { Category, Service } from '../lib/types';
import { Button, Modal, Pill, Rating, Stepper } from './ui';

/** Category tile: soft tile with a 3D icon block (or the admin's image), name underneath, price badge. */
export function CategoryTile({ category }: { category: Category }) {
  const ref = useTilt<HTMLSpanElement>(12);
  const Icon = categoryIcon(category.icon);
  const unavailable = category.bookableCount === 0;
  const badge = unavailable ? 'Back soon' : category.startingPrice != null ? `from ${rupees(category.startingPrice)}` : null;
  return (
    <Link to={`/c/${category.slug}`} data-testid="category-tile" data-slug={category.slug} className="group flex flex-col items-center gap-2 text-center">
      <span ref={ref} className="tilt relative grid aspect-square w-full place-items-center rounded-2xl bg-tile sm:aspect-[4/3] transition-colors duration-300 group-hover:bg-sun-soft">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt="" loading="lazy" className="pop-z size-3/4 object-contain" />
        ) : (
          <span className="pop-z block-icon size-12 -rotate-6 transition-[rotate] duration-300 group-hover:rotate-0 md:size-14">
            <Icon className="size-6 md:size-7" strokeWidth={1.75} aria-hidden />
          </span>
        )}
        {badge && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-2 bg-white px-1.5 py-px text-[10px] font-bold md:text-[11px]">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[13px] font-medium leading-snug md:text-[15px]">{category.name}</span>
    </Link>
  );
}

/** Add button that turns into a quantity stepper; disabled for services that can't be booked. */
export function AddControl({ service, size = 'md' }: { service: Service; size?: 'sm' | 'md' }) {
  const { qty, add, setQty } = useCart();
  const n = qty(service.id);
  if (!service.bookable) {
    return (
      <span className="inline-flex h-9 items-center rounded-full border border-dashed border-line-2 px-3 text-[12px] font-semibold text-mute">
        Unavailable
      </span>
    );
  }
  if (n > 0) return <Stepper value={n} onChange={(v) => setQty(service.id, v)} label={service.name} size={size} />;
  return (
    <Button variant="sun" size={size === 'sm' ? 'sm' : 'md'} onClick={() => add(service)} aria-label={`Add ${service.name}`} className="min-w-[86px]">
      <Plus className="size-4" strokeWidth={2.5} aria-hidden /> Add
    </Button>
  );
}

function PriceLine({ service }: { service: Service }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-[17px] font-bold">{rupees(service.price)}</span>
      {service.mrp > service.price && <span className="text-[13px] text-mute line-through">{rupees(service.mrp)}</span>}
      <span className="inline-flex items-center gap-1 text-[13px] text-mute">
        <Clock className="size-3.5" aria-hidden /> {duration(service.durationMinutes)}
      </span>
    </div>
  );
}

export function ServiceRow({ service, onDetails }: { service: Service; onDetails: () => void }) {
  return (
    <article
      data-testid="service-row"
      data-slug={service.slug}
      data-bookable={service.bookable}
      className="flex gap-4 border-b border-line py-5 last:border-0"
    >
      <div className="min-w-0 flex-1">
        <h3 className={clsx('text-[17px] font-semibold leading-snug', !service.bookable && 'text-mute')}>{service.name}</h3>
        <div className="mt-1.5">
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
        <button type="button" onClick={onDetails} className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold underline decoration-2 underline-offset-4 hover:decoration-sun">
          <Info className="size-3.5" aria-hidden /> View details
        </button>
      </div>
      <div className="flex flex-none flex-col items-end justify-center">
        <AddControl service={service} />
      </div>
    </article>
  );
}

export function ServiceTile({ service }: { service: Service }) {
  const Icon = categoryIcon(service.category?.icon);
  return (
    <article data-testid="service-tile" className="card-soft flex w-[260px] flex-none snap-start flex-col p-4 md:w-[280px]">
      <div className="flex items-start justify-between gap-3">
        <span className="block-icon size-11 rotate-[-4deg]">
          <Icon className="size-5" strokeWidth={1.8} aria-hidden />
        </span>
        <Rating value={service.rating} count={compact(service.ratingCount)} />
      </div>
      <Link to={`/c/${service.category?.slug}?s=${service.slug}`} className="mt-4 block">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-mute">{service.category?.name}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-[16px] font-semibold leading-snug hover:underline">{service.name}</h3>
      </Link>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div>
          <div className="text-[17px] font-bold">{rupees(service.price)}</div>
          <div className="text-[12px] text-mute">{duration(service.durationMinutes)}</div>
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
          <div className="flex flex-wrap items-center gap-3">
            <Rating value={service.rating} count={`${compact(service.ratingCount)} reviews`} />
            <span className="text-mute">·</span>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold">
              <Clock className="size-3.5" aria-hidden /> {duration(service.durationMinutes)}
            </span>
            {service.group && <Pill>{service.group}</Pill>}
          </div>
          {!service.bookable && <Pill tone="bad">{service.unavailableReason || 'Unavailable'}</Pill>}
          <p className="text-[15px] leading-relaxed text-ink/80">{service.description || service.shortDescription}</p>
          {service.inclusions.length > 0 && (
            <section>
              <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider">What’s included</h3>
              <ul className="space-y-2.5">
                {service.inclusions.map((i) => (
                  <li key={i} className="flex gap-3 text-[15px]">
                    <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-sun">
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
              <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider">Not included</h3>
              <ul className="space-y-2.5">
                {service.exclusions.map((i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-mute">
                    <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full border border-line-2">
                      <X className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    {i}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="rounded-2xl bg-paper p-4 text-[14px] leading-relaxed">
            <strong>Pay after the job.</strong> Your professional shares a 4-digit PIN check before starting, and you pay by UPI or cash once you’re happy.
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
        <div className="text-xl font-bold">{rupees(service.price)}</div>
        {service.mrp > service.price && <div className="text-[13px] text-mute line-through">{rupees(service.mrp)}</div>}
      </div>
      <AddControl service={service} />
    </div>
  );
}
