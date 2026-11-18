import { ChevronDown, MessageCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Field, FormError, TextArea } from '../components/ui';
import { useAuth } from '../context/auth';
import { api, ApiError } from '../lib/api';
import { isValidPhone } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

const FAQS = [
  ['When do I pay?', 'After the job. Pay your professional by UPI or cash once the work is done. There is no advance payment.'],
  ['What is the service PIN?', 'A 4-digit code shown on your booking once a pro is assigned. Your pro enters it when they arrive, so work only starts with the right person at your door.'],
  ['Can I reschedule or cancel?', 'Yes. Reschedule for free up to 2 hours before your slot, and cancel any time before the pro starts the job, from the booking page.'],
  ['Why is there a visit fee?', 'Orders under ₹499 carry a small visit fee that covers travel. It disappears automatically when your cart crosses ₹499.'],
  ['What if I’m not happy with the work?', 'Raise it below within 7 days and we’ll send a pro for a free re-visit.'],
  ['Are professionals verified?', 'Every professional is background-verified and trained on our checklists before their first job, and rated after every booking.'],
];

const TOPICS = ['Booking issue', 'Payment', 'Professional feedback', 'Account', 'Other'];

export default function Help() {
  useDocumentTitle('Help & support');
  const [params] = useSearchParams();
  const { customer } = useAuth();
  const [open, setOpen] = useState<number | null>(0);
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [topic, setTopic] = useState(params.get('booking') ? 'Booking issue' : TOPICS[0]);
  const [bookingCode, setBookingCode] = useState(params.get('booking') ?? '');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Tell us your name';
    if (!isValidPhone(phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (message.trim().length < 10) next.message = 'Tell us a little more (10+ characters)';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.enquiry({ name: name.trim(), phone, topic, message: message.trim(), bookingCode: bookingCode.trim() || undefined });
      setSent(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not send your message');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <h1 className="display text-[26px] font-semibold md:text-[34px]">
        How can we <span className="mark">help?</span>
      </h1>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_440px]">
        <section aria-labelledby="faq-title">
          <h2 id="faq-title" className="sr-only">
            Frequently asked questions
          </h2>
          <div className="card-soft divide-y divide-line">
            {FAQS.map(([q, a], i) => (
              <div key={q}>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-7">
                  <span className="text-[16px] font-semibold">{q}</span>
                  <ChevronDown className={`size-5 flex-none transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {open === i && <p className="animate-fade px-5 pb-5 text-[15px] leading-relaxed text-mute md:px-7">{a}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 md:p-7" aria-labelledby="contact-title">
          {sent ? (
            <div className="py-10 text-center" role="status">
              <span className="block-icon mx-auto size-16">
                <MessageCircle className="size-7" aria-hidden />
              </span>
              <h2 className="mt-6 text-[22px] font-semibold tracking-[-0.02em]">Message sent</h2>
              <p className="mt-2 text-mute">Our support team will call you back within a few hours.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <h2 id="contact-title" className="text-[22px] font-semibold tracking-[-0.02em]">
                Talk to us
              </h2>
              <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
              <Field label="Mobile number" lead="+91" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} error={errors.phone} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="help-topic" className="label">
                    Topic
                  </label>
                  <select id="help-topic" className="field" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    {TOPICS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <Field label="Booking code (optional)" value={bookingCode} onChange={(e) => setBookingCode(e.target.value.toUpperCase())} placeholder="SV…" />
              </div>
              <TextArea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} rows={4} />
              <FormError>{formError}</FormError>
              <Button type="submit" block size="lg" busy={busy}>
                Send message
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
