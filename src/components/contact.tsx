import { useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '../context/auth';
import { api, ApiError } from '../lib/api';
import { isValidPhone } from '../lib/format';
import type { Customer } from '../lib/types';
import { Button, Field, FormError } from './ui';

/** A customer needs a name and a mobile number (for the professional) before they can book. */
export const needsContact = (c: Customer | null | undefined) => !!c && (!c.name || !c.phone);

/** Asks for whatever is missing: the name (Google may not share one) and the mobile number. */
export function ContactForm({ customer, onSaved, submit = 'Continue' }: { customer: Customer; onSaved?: (c: Customer) => void; submit?: ReactNode }) {
  const { setCustomer } = useAuth();
  // Decide once which fields to show, so the name field doesn't vanish while typing.
  const [askName] = useState(!customer.name);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (askName && name.trim().length < 2) next.name = 'Enter your name';
    if (!isValidPhone(phone)) next.phone = 'Enter a valid 10-digit mobile number';
    setErrors(next);
    if (next.name || next.phone) return;
    setBusy(true);
    setFailed(null);
    try {
      const res = await api.updateMe({ phone, ...(askName ? { name: name.trim() } : {}) });
      setCustomer(res.customer);
      onSaved?.(res.customer);
    } catch (err) {
      setFailed(err instanceof ApiError ? err.message : 'Could not save your details');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4" noValidate data-testid="contact-form">
      {askName && <Field label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" error={errors.name} />}
      <Field
        label="Mobile number"
        lead="+91"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder="98765 43210"
        error={errors.phone}
        hint="Your professional calls this number before the visit."
      />
      <FormError>{failed}</FormError>
      <Button type="submit" block size="lg" busy={busy}>
        {submit}
      </Button>
    </form>
  );
}
