import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowLeft, CalendarClock, Check, CircleHelp, MapPin, Phone, Star, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { addressLine } from '../components/address';
import { BillCard, SlotPicker, StatusChip, StatusTrack, type SlotValue } from '../components/booking';
import { Button, Empty, FormError, Modal, Skeleton, StarInput, TextArea } from '../components/ui';
import { useAuth } from '../context/auth';
import { useUi } from '../context/ui';
import { api, ApiError } from '../lib/api';
import { duration, initials, longDate, rupees, STATUS_LABEL, time12 } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import type { Booking } from '../lib/types';
import { SignInPrompt } from './Bookings';

const REASONS = ['Booked by mistake', 'Need a different time', 'Got it done elsewhere', 'Price is too high', 'Other'];

export default function BookingDetail() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get('new') === '1';
  const { token, ready } = useAuth();
  const qc = useQueryClient();
  const { toast } = useUi();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.booking(id),
    enabled: !!token,
    refetchInterval: (q) => {
      const s = q.state.data?.booking.status;
      return s && ['completed', 'cancelled'].includes(s) ? false : 15_000;
    },
  });
  const booking = data?.booking;
  useDocumentTitle(booking ? `Booking ${booking.code}` : 'Booking');

  const update = (b: Booking) => {
    qc.setQueryData(['booking', id], { booking: b });
    qc.invalidateQueries({ queryKey: ['bookings'] });
  };

  if (ready && !token) return <SignInPrompt title="Sign in to see this booking" text="Bookings are private to the account that made them." />;
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8">
        <Empty title="Booking not found" action={<Link className="font-semibold underline" to="/bookings">All bookings</Link>} />
      </div>
    );
  }
  if (isLoading || !booking) {
    return (
      <div className="mx-auto max-w-[1240px] space-y-4 px-4 pt-8 md:px-8">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <Link to="/bookings" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All bookings
      </Link>

      {isNew && booking.status === 'pending' && (
        <div className="mt-5 flex items-center gap-5 rounded-[26px] border-[1.5px] border-ink bg-sun p-5 md:p-7" data-testid="booking-confirmed">
          <span className="badge-flip grid size-16 flex-none place-items-center rounded-full border-[1.5px] border-ink bg-ink text-sun md:size-20">
            <Check className="size-8 md:size-10" strokeWidth={3} aria-hidden />
          </span>
          <div>
            <h1 className="display text-3xl font-extrabold md:text-5xl">Booking confirmed!</h1>
            <p className="mt-1 text-[15px]">We’re assigning the best-rated pro near you. You’ll see them here.</p>
          </div>
        </div>
      )}

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] font-semibold text-mute" data-testid="booking-code">
            {booking.code}
          </p>
          {!isNew || booking.status !== 'pending' ? (
            <h1 className="display mt-1 text-[40px] font-extrabold md:text-[56px]">{STATUS_LABEL[booking.status]}</h1>
          ) : (
            <h2 className="display mt-1 text-[32px] font-extrabold md:text-[44px]">{booking.categoryName}</h2>
          )}
        </div>
        <StatusChip status={booking.status} />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {booking.pin && (
            <section className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-ink bg-ink p-5 text-white md:flex-row md:items-center md:justify-between md:p-7" aria-label="Service PIN">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-sun">Your service PIN</p>
                <p className="mt-1 max-w-xs text-[14px] text-mute-2">Share it only when your pro arrives. Work starts after they enter it.</p>
              </div>
              <p className="flex gap-2" data-testid="service-pin" data-pin={booking.pin}>
                {booking.pin.split('').map((d, i) => (
                  <span key={i} className="display grid size-14 place-items-center rounded-2xl bg-sun text-3xl font-extrabold text-ink md:size-16">
                    {d}
                  </span>
                ))}
              </p>
            </section>
          )}

          {booking.professional && (
            <section className="card-soft flex items-center gap-4 p-5" aria-label="Your professional" data-testid="pro-card">
              <span className="display grid size-14 flex-none place-items-center rounded-2xl border-[1.5px] border-ink bg-sun text-xl font-bold">{initials(booking.professional.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Your professional</p>
                <p className="truncate text-[18px] font-semibold">{booking.professional.name}</p>
                <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-mute">
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Star className="size-3.5 fill-ink" aria-hidden /> {booking.professional.rating ? booking.professional.rating.toFixed(1) : 'New'}
                  </span>
                  <span>{booking.professional.jobsCompleted} jobs</span>
                  <span>{booking.professional.experienceYears} yrs experience</span>
                </p>
              </div>
              {['assigned', 'on_the_way', 'in_progress'].includes(booking.status) && (
                <a href={`tel:+91${booking.professional.phone}`} aria-label={`Call ${booking.professional.name}`} className="grid size-12 flex-none place-items-center rounded-full bg-ink text-white">
                  <Phone className="size-5" aria-hidden />
                </a>
              )}
            </section>
          )}

          <section className="card-soft p-5 md:p-7" aria-labelledby="track-title">
            <h2 id="track-title" className="display mb-5 text-2xl font-bold">
              Live status
            </h2>
            <StatusTrack booking={booking} />
          </section>

          {booking.canReview && <ReviewCard booking={booking} onDone={update} />}
          {booking.review && (
            <section className="card-soft p-5" aria-label="Your review">
              <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Your rating</p>
              <p className="mt-2 flex gap-1" aria-label={`${booking.review.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={clsx('size-5', n <= booking.review!.rating ? 'fill-ink' : 'text-line-2')} aria-hidden />
                ))}
              </p>
              {booking.review.comment && <p className="mt-2 text-[15px]">“{booking.review.comment}”</p>}
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:self-start">
          <section className="card p-5 md:p-6">
            <div className="space-y-4 text-[14px]">
              <div className="flex gap-3">
                <CalendarClock className="mt-0.5 size-4 flex-none" aria-hidden />
                <div>
                  <p className="font-semibold" data-testid="booking-slot">
                    {longDate(booking.slot.date)} · {time12(booking.slot.time)}
                  </p>
                  <p className="text-mute">About {duration(booking.durationMinutes)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 flex-none" aria-hidden />
                <div>
                  <p className="font-semibold">{booking.address.label}</p>
                  <p className="text-mute">
                    {addressLine(booking.address)}, {booking.address.city}
                  </p>
                </div>
              </div>
            </div>
            <ul className="mt-5 space-y-2 border-y border-dashed border-line-2 py-4 text-[14px]">
              {booking.items.map((i) => (
                <li key={i.serviceId} className="flex justify-between gap-3">
                  <span>
                    {i.name} <span className="text-mute">× {i.qty}</span>
                  </span>
                  <span className="font-semibold">{rupees(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <BillCard pricing={booking.pricing} title={booking.paymentStatus === 'paid' ? 'Paid after service' : 'Pay after service'} />
            </div>
          </section>

          <div className="grid gap-2">
            {booking.canReschedule && (
              <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
                <CalendarClock className="size-4" aria-hidden /> Reschedule
              </Button>
            )}
            {booking.canCancel && (
              <Button variant="ghost" className="text-bad" onClick={() => setCancelOpen(true)}>
                <X className="size-4" aria-hidden /> Cancel booking
              </Button>
            )}
            <Link to={`/help?booking=${booking.code}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold hover:bg-line/70">
              <CircleHelp className="size-4" aria-hidden /> Need help with this booking?
            </Link>
          </div>
        </aside>
      </div>

      <CancelDialog
        open={cancelOpen}
        booking={booking}
        onClose={() => setCancelOpen(false)}
        onDone={(b) => {
          update(b);
          setCancelOpen(false);
          toast('Booking cancelled');
        }}
      />
      <RescheduleSheet
        open={rescheduleOpen}
        booking={booking}
        onClose={() => setRescheduleOpen(false)}
        onDone={(b) => {
          update(b);
          setRescheduleOpen(false);
          toast('Booking rescheduled', 'ok');
        }}
      />
    </div>
  );
}

function CancelDialog({ open, booking, onClose, onDone }: { open: boolean; booking: Booking; onClose: () => void; onDone: (b: Booking) => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState('');
  const m = useMutation({
    mutationFn: () => api.cancelBooking(booking.id, reason === 'Other' ? other.trim() : reason),
    onSuccess: (res) => onDone(res.booking),
  });
  return (
    <Modal open={open} onClose={onClose} title="Cancel this booking?" variant="center">
      <fieldset className="space-y-2">
        <legend className="mb-3 text-[14px] text-mute">Tell us why, so we can do better.</legend>
        {REASONS.map((r) => (
          <label key={r} className={clsx('flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 text-[14px] font-medium', reason === r ? 'border-ink bg-sun-soft' : 'border-line-2')}>
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-ink" />
            {r}
          </label>
        ))}
      </fieldset>
      {reason === 'Other' && <TextArea className="mt-3" label="Reason" value={other} onChange={(e) => setOther(e.target.value)} />}
      {m.error && <div className="mt-3"><FormError>{(m.error as Error).message}</FormError></div>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onClose}>
          Keep booking
        </Button>
        <Button variant="danger" busy={m.isPending} disabled={reason === 'Other' && other.trim().length < 3} onClick={() => m.mutate()}>
          Cancel booking
        </Button>
      </div>
    </Modal>
  );
}

function RescheduleSheet({ open, booking, onClose, onDone }: { open: boolean; booking: Booking; onClose: () => void; onDone: (b: Booking) => void }) {
  const [slot, setSlot] = useState<SlotValue | null>(null);
  const { data: cities } = useQuery({ queryKey: ['cities'], queryFn: api.cities, staleTime: 10 * 60_000 });
  const { data: cats } = useQuery({ queryKey: ['categories', 'all'], queryFn: () => api.categories(), enabled: open, staleTime: 5 * 60_000 });
  const citySlug = cities?.cities.find((c) => c.name === booking.cityName)?.slug;
  const categorySlug = cats?.categories.find((c) => c.id === booking.category)?.slug;
  const m = useMutation({
    mutationFn: () => api.rescheduleBooking(booking.id, slot!.date, slot!.time),
    onSuccess: (res) => onDone(res.booking),
  });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pick a new time"
      footer={
        <div className="space-y-3">
          {m.error && <FormError>{(m.error as Error).message}</FormError>}
          <Button block size="lg" disabled={!slot} busy={m.isPending} onClick={() => m.mutate()}>
            {slot ? `Move to ${longDate(slot.date)}, ${time12(slot.time)}` : 'Choose a slot'}
          </Button>
        </div>
      }
    >
      <p className="mb-5 text-[14px] text-mute">
        Currently {longDate(booking.slot.date)} at {time12(booking.slot.time)}. Rescheduling is free.
      </p>
      {citySlug && categorySlug ? <SlotPicker city={citySlug} category={categorySlug} exclude={booking.id} value={slot} onChange={setSlot} /> : <Skeleton className="h-48" />}
    </Modal>
  );
}

function ReviewCard({ booking, onDone }: { booking: Booking; onDone: (b: Booking) => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const m = useMutation({ mutationFn: () => api.reviewBooking(booking.id, rating, comment), onSuccess: (r) => onDone(r.booking) });
  return (
    <section className="rounded-[22px] border-[1.5px] border-ink bg-sun p-5 md:p-7" aria-labelledby="rate-title">
      <h2 id="rate-title" className="display text-2xl font-bold">
        How did {booking.professional?.name.split(' ')[0] ?? 'it'} do?
      </h2>
      <p className="mt-1 text-[14px]">Your rating helps other customers and rewards great pros.</p>
      <div className="mt-5">
        <StarInput value={rating} onChange={setRating} />
      </div>
      <TextArea className="mt-4 [&_textarea]:bg-white" label="Anything to add? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      {m.error && <div className="mt-3"><FormError>{(m.error as Error).message}</FormError></div>}
      <Button className="mt-4" disabled={!rating} busy={m.isPending} onClick={() => m.mutate()}>
        Submit rating
      </Button>
    </section>
  );
}
