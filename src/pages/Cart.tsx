import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Clock, ShoppingBag, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BillCard } from '../components/booking';
import { Button, Empty, FormError, Skeleton, Stepper } from '../components/ui';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { api } from '../lib/api';
import { duration, rupees } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

export function useQuote() {
  const { cart } = useCart();
  const { citySlug } = useCity();
  const items = cart.items.map((i) => ({ serviceId: i.serviceId, qty: i.qty }));
  return useQuery({
    queryKey: ['quote', items, cart.couponCode, citySlug],
    queryFn: () => api.quote({ items, couponCode: cart.couponCode || null, city: citySlug }),
    enabled: items.length > 0 && !!citySlug,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export default function CartPage() {
  useDocumentTitle('Cart');
  const { cart, count, setQty, setCoupon } = useCart();
  const { requireAuth } = useAuth();
  const navigate = useNavigate();
  const quote = useQuote();
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: api.coupons, staleTime: 5 * 60_000 });
  const [code, setCode] = useState(cart.couponCode);
  useEffect(() => setCode(cart.couponCode), [cart.couponCode]);

  if (!count) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8">
        <Empty icon={<ShoppingBag className="size-7" />} title="Your cart is empty" action={<Button onClick={() => navigate('/explore')}>Find a service</Button>}>
          Add a service and it will show up here with the full price breakdown.
        </Empty>
      </div>
    );
  }

  const q = quote.data?.quote;
  const applied = q?.coupon?.code;
  const goCheckout = () => requireAuth(() => navigate('/checkout'), 'Sign in to pick an address and time slot.');
  const apply = (e?: FormEvent, value = code) => {
    e?.preventDefault();
    setCoupon(value);
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <Link to={`/c/${cart.category?.slug}`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Add more from {cart.category?.name}
      </Link>
      <h1 className="display mt-4 text-[44px] font-extrabold md:text-[64px]">Your cart</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="card-soft px-5 md:px-7" aria-label="Items">
            <ul>
              {cart.items.map((i) => (
                <li key={i.serviceId} className="flex items-center gap-4 border-b border-line py-5 last:border-0" data-testid="cart-line">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{i.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-mute">
                      <span className="font-semibold text-ink">{rupees(i.price)}</span>
                      {i.mrp > i.price && <span className="line-through">{rupees(i.mrp)}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden /> {duration(i.durationMinutes)}
                      </span>
                    </p>
                  </div>
                  <Stepper value={i.qty} onChange={(v) => setQty(i.serviceId, v)} label={i.name} size="sm" />
                  <button type="button" onClick={() => setQty(i.serviceId, 0)} aria-label={`Remove ${i.name}`} className="grid size-9 place-items-center rounded-full hover:bg-paper">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-soft p-5 md:p-7" aria-labelledby="coupon-title">
            <h2 id="coupon-title" className="flex items-center gap-2 text-[15px] font-bold">
              <Tag className="size-4" aria-hidden /> Coupons
            </h2>
            <form onSubmit={apply} className="mt-4 flex gap-2">
              <label htmlFor="coupon" className="sr-only">
                Coupon code
              </label>
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="field h-12 flex-1 font-mono uppercase tracking-wider"
              />
              {/* Distinct keys: reusing one DOM button would flip it to type=submit mid-click and re-apply the coupon. */}
              {applied ? (
                <Button
                  key="remove"
                  variant="outline"
                  onClick={() => {
                    setCode('');
                    setCoupon('');
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button key="apply" type="submit" disabled={!code.trim()}>
                  Apply
                </Button>
              )}
            </form>
            {q?.couponError && cart.couponCode && (
              <p className="mt-2 text-[13px] font-medium text-bad" role="alert">
                {q.couponError}
              </p>
            )}
            {applied && (
              <p className="mt-2 text-[13px] font-semibold text-ok" role="status">
                {applied} applied · you save {rupees(q!.discount)}
              </p>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {coupons.data?.coupons.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => apply(undefined, c.code)}
                  className="rounded-2xl border-[1.5px] border-dashed border-line-2 p-3 text-left transition-colors hover:border-ink"
                >
                  <span className="font-mono text-[13px] font-bold">{c.code}</span>
                  <span className="mt-1 block text-[12px] text-mute">{c.description}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
          <div className="card p-5 md:p-6">
            {quote.isError ? (
              <FormError>{(quote.error as Error).message}</FormError>
            ) : !q ? (
              <Skeleton className="h-48" />
            ) : (
              <BillCard pricing={{ ...q, couponCode: q.coupon?.code }} savings={q.savings} freeVisitAbove={q.freeVisitAbove} />
            )}
            <div className="mt-6 hidden lg:block">
              <Button block size="lg" disabled={!q || quote.isError} onClick={goCheckout}>
                Choose address & slot <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
            <p className="mt-3 text-center text-[12px] text-mute">No payment now. Pay your pro after the job.</p>
          </div>
        </aside>
      </div>

      <MobileBar total={q?.total}>
        <Button block size="lg" disabled={!q || quote.isError} onClick={goCheckout}>
          Choose slot <ArrowRight className="size-4" aria-hidden />
        </Button>
      </MobileBar>
    </div>
  );
}

/** Sticky total + primary action above the dock on phones. */
export function MobileBar({ total, children, top }: { total?: number; children: ReactNode; top?: ReactNode }) {
  return (
    <>
      <div className="h-24 lg:hidden" aria-hidden />
      <div className="fixed inset-x-3 bottom-[92px] z-30 lg:hidden" data-testid="mobile-bar">
        {top}
        <div className="flex items-center gap-3 rounded-[22px] border-[1.5px] border-ink bg-white p-2.5 pl-4 shadow-block-md">
          <div className="flex-none">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-mute">Total</p>
            <p className="text-[18px] font-bold leading-tight">{total != null ? rupees(total) : '…'}</p>
          </div>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}
