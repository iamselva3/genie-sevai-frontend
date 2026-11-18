import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowLeft, Check, MapPin, Plus, Wallet } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AddressForm, addressLine } from '../components/address';
import { BillCard, SlotPicker, type SlotValue } from '../components/booking';
import { ContactForm, needsContact } from '../components/contact';
import { Button, FormError, Skeleton, TextArea } from '../components/ui';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { useUi } from '../context/ui';
import { api, ApiError } from '../lib/api';
import { duration, longDate, rupees, time12 } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import { MobileBar, useQuote } from './Cart';

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: ReactNode }) {
  return (
    <section className="card-soft p-5 md:p-7" aria-labelledby={`step-${n}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className={clsx('grid size-8 place-items-center rounded-full border-[1.5px] border-ink text-[13px] font-bold', done ? 'bg-ink text-white' : 'bg-sun')}>
          {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : n}
        </span>
        <h2 id={`step-${n}`} className="display text-2xl font-bold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { cart, count, clear } = useCart();
  const { citySlug, city } = useCity();
  const { customer, token, ready, requireAuth } = useAuth();
  const { toast } = useUi();
  const quote = useQuote();
  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [slot, setSlot] = useState<SlotValue | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const placed = useRef(false);

  const addresses = (customer?.addresses ?? []).filter((a) => a.city === citySlug);
  const otherCity = (customer?.addresses.length ?? 0) - addresses.length;

  useEffect(() => {
    if (!addressId && addresses.length) setAddressId((addresses.find((a) => a.isDefault) ?? addresses[0]).id);
    if (customer && !addresses.length) setAdding(true);
  }, [addresses, addressId, customer]);

  // After a booking is placed the cart is emptied; don't bounce to /cart while we navigate to the confirmation.
  if (!count) return placed.current ? null : <Navigate to="/cart" replace />;
  if (ready && !token) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-10 text-center">
        <h1 className="display text-4xl font-extrabold">Sign in to continue</h1>
        <p className="mt-3 text-mute">Use your Google account. It only takes a tap.</p>
        <Button size="lg" className="mt-6" onClick={() => requireAuth()}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  const q = quote.data?.quote;
  const missingContact = needsContact(customer);
  const canPlace = !!q && !!addressId && !!slot && !missingContact && !busy;
  const placeLabel = missingContact ? 'Add your mobile number' : !addressId ? 'Add an address' : !slot ? 'Pick a slot' : 'Place booking';

  const place = async () => {
    if (!q || !addressId || !slot || !citySlug) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.createBooking({
        city: citySlug,
        items: cart.items.map((i) => ({ serviceId: i.serviceId, qty: i.qty })),
        couponCode: cart.couponCode || null,
        addressId,
        date: slot.date,
        time: slot.time,
        notes: notes.trim() || undefined,
      });
      placed.current = true;
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast('Booking confirmed', 'ok');
      navigate(`/bookings/${res.booking.id}?new=1`, { replace: true });
      clear();
    } catch (err) {
      const e = err as ApiError;
      setError(e.message);
      if (e.code === 'SLOT_UNAVAILABLE') {
        setSlot(null);
        qc.invalidateQueries({ queryKey: ['slots'] });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to cart
      </Link>
      <h1 className="display mt-4 text-[44px] font-extrabold md:text-[64px]">Almost there</h1>
      {customer && !missingContact && (
        <p className="mt-2 text-[15px] text-mute">
          Booking for <strong className="text-ink">{customer.name}</strong> · +91 {customer.phone}
        </p>
      )}
      {customer && missingContact && (
        <section className="card-soft mt-6 max-w-xl p-5 md:p-7" aria-labelledby="contact-title">
          <h2 id="contact-title" className="display text-2xl font-bold">
            How can your professional reach you?
          </h2>
          <div className="mt-4">
            <ContactForm customer={customer} submit="Save number" onSaved={() => toast('Mobile number saved', 'ok')} />
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <Step n={1} title={`Address in ${city?.name ?? 'your city'}`} done={!!addressId && !adding}>
            {!customer ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                {addresses.length > 0 && !adding && (
                  <div className="grid gap-3" role="radiogroup" aria-label="Saved addresses">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        role="radio"
                        aria-checked={addressId === a.id}
                        onClick={() => setAddressId(a.id)}
                        className={clsx(
                          'flex items-start gap-3 rounded-2xl border-[1.5px] p-4 text-left transition-all',
                          addressId === a.id ? 'border-ink bg-sun-soft shadow-block' : 'border-line-2 bg-white hover:border-ink',
                        )}
                      >
                        <MapPin className="mt-0.5 size-4 flex-none" aria-hidden />
                        <span>
                          <span className="block font-semibold">{a.label}</span>
                          <span className="text-[14px] text-mute">{addressLine(a)}</span>
                        </span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-line-2 p-4 text-[14px] font-semibold hover:border-ink">
                      <Plus className="size-4" aria-hidden /> Add a new address
                    </button>
                  </div>
                )}
                {adding && (
                  <AddressForm
                    fixedCity={citySlug}
                    onSaved={(id) => {
                      setAddressId(id);
                      setAdding(false);
                    }}
                    onCancel={addresses.length ? () => setAdding(false) : undefined}
                  />
                )}
                {otherCity > 0 && <p className="mt-3 text-[12px] text-mute">{otherCity} saved address(es) in other cities are hidden. Change city from the top bar to use them.</p>}
              </>
            )}
          </Step>

          <Step n={2} title="Pick a time slot" done={!!slot}>
            {cart.category && citySlug && <SlotPicker city={citySlug} category={cart.category.slug} value={slot} onChange={setSlot} />}
            {q && <p className="mt-4 text-[13px] text-mute">The job takes about {duration(q.durationMinutes)}.</p>}
          </Step>

          <Step n={3} title="Payment" done>
            <div role="radiogroup" aria-label="Payment method" className="grid gap-3">
              <div role="radio" aria-checked="true" className="flex items-start gap-3 rounded-2xl border-[1.5px] border-ink bg-sun-soft p-4">
                <Wallet className="mt-0.5 size-5 flex-none" aria-hidden />
                <span>
                  <span className="block font-semibold">Pay after service</span>
                  <span className="text-[14px] text-mute">UPI or cash to your professional once the job is done.</span>
                </span>
              </div>
            </div>
            <TextArea className="mt-5" label="Notes for your pro (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Gate code, parking, pets at home…" />
          </Step>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
          <div className="card p-5 md:p-6">
            <p className="text-[12px] font-bold uppercase tracking-wider text-mute">{cart.category?.name}</p>
            <ul className="mt-3 space-y-2 border-b border-dashed border-line-2 pb-4 text-[14px]">
              {cart.items.map((i) => (
                <li key={i.serviceId} className="flex justify-between gap-3">
                  <span>
                    {i.name} <span className="text-mute">× {i.qty}</span>
                  </span>
                  <span className="font-semibold">{rupees(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            {slot && (
              <p className="mt-4 rounded-xl bg-paper px-3 py-2 text-[14px] font-semibold" data-testid="chosen-slot">
                {longDate(slot.date)} · {time12(slot.time)}
              </p>
            )}
            <div className="mt-4">{q ? <BillCard pricing={{ ...q, couponCode: q.coupon?.code }} savings={q.savings} /> : <Skeleton className="h-40" />}</div>
            {error && <div className="mt-4 hidden lg:block"><FormError>{error}</FormError></div>}
            <div className="mt-6 hidden lg:block">
              <Button block size="lg" variant="sun" disabled={!canPlace} busy={busy} onClick={place}>
                {placeLabel}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <MobileBar total={q?.total} top={error ? <div className="mb-2"><FormError>{error}</FormError></div> : null}>
        <Button block size="lg" variant="sun" disabled={!canPlace} busy={busy} onClick={place}>
          {placeLabel}
        </Button>
      </MobileBar>
    </div>
  );
}
