import { ArrowUpRight, LogOut, MapPin, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AddressForm, addressLine } from '../components/address';
import { Button, Field, FormError, Modal, Pill, Skeleton } from '../components/ui';
import { useAuth } from '../context/auth';
import { useCity } from '../context/city';
import { useUi } from '../context/ui';
import { api, ApiError } from '../lib/api';
import { initials, isValidPhone } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';
import type { Address } from '../lib/types';
import { SignInPrompt } from './Bookings';

export default function Account() {
  useDocumentTitle('Account');
  const { customer, token, ready, signOut, setCustomer } = useAuth();
  const { cities } = useCity();
  const { toast } = useUi();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Address | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
    }
  }, [customer]);

  if (ready && !token) return <SignInPrompt title="Your Genie Sevai account" text="Sign in with your Google account to manage your profile and addresses." />;
  if (!customer) {
    return (
      <div className="mx-auto max-w-[1240px] space-y-4 px-4 pt-8 md:px-8">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateMe({ name: name.trim(), phone });
      setCustomer(res.customer);
      toast('Profile saved', 'ok');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (a: Address) => {
    try {
      const res = await api.updateAddress(a.id, { isDefault: true });
      setCustomer(res.customer);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not update', 'bad');
    }
  };

  const remove = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      const res = await api.deleteAddress(removing.id);
      setCustomer(res.customer);
      setRemoving(null);
      toast('Address removed');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not remove', 'bad');
    } finally {
      setRemoveBusy(false);
    }
  };

  const cityName = (slug: string) => cities.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <div className="flex items-center gap-5">
        <span className="display grid size-20 flex-none place-items-center overflow-hidden rounded-[22px] border border-line-2 bg-brand-soft text-3xl font-semibold shadow-block-md">
          {customer.avatarUrl ? (
            <img src={customer.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" width={80} height={80} />
          ) : (
            initials(customer.name || 'You')
          )}
        </span>
        <div className="min-w-0">
          <h1 className="display text-[24px] font-semibold md:text-[32px]">{customer.name || 'Your account'}</h1>
          <p className="truncate text-[15px] text-mute">
            {customer.email}
            {customer.phone && ` · +91 ${customer.phone}`}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card-soft p-5 md:p-7" aria-labelledby="profile-title">
          <h2 id="profile-title" className="text-[20px] font-semibold tracking-[-0.02em]">
            Profile
          </h2>
          <form onSubmit={save} className="mt-5 space-y-4" noValidate>
            <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <Field
              label="Mobile number"
              lead="+91"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              hint="Your professional calls this number before the visit."
            />
            <Field label="Email" type="email" value={customer.email} readOnly disabled hint="From your Google account." />
            <FormError>{error}</FormError>
            <Button type="submit" busy={saving}>
              Save profile
            </Button>
          </form>
        </section>

        <section className="card-soft p-5 md:p-7" aria-labelledby="addr-title">
          <div className="flex items-center justify-between">
            <h2 id="addr-title" className="text-[20px] font-semibold tracking-[-0.02em]">
              Saved addresses
            </h2>
            {!adding && (
              <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                <Plus className="size-4" aria-hidden /> Add
              </Button>
            )}
          </div>
          <div className="mt-5 space-y-3">
            {adding && <AddressForm onSaved={() => { setAdding(false); toast('Address saved', 'ok'); }} onCancel={() => setAdding(false)} />}
            {!adding && customer.addresses.length === 0 && <p className="text-[14px] text-mute">No addresses yet. You can also add one at checkout.</p>}
            {!adding &&
              customer.addresses.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-line-2 p-4">
                  <MapPin className="mt-0.5 size-4 flex-none" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {a.label} <Pill>{cityName(a.city)}</Pill> {a.isDefault && <Pill tone="sun">Default</Pill>}
                    </p>
                    <p className="text-[14px] text-mute">{addressLine(a)}</p>
                    {!a.isDefault && (
                      <button type="button" onClick={() => makeDefault(a)} className="mt-1 text-[13px] font-semibold underline">
                        Make default
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => setRemoving(a)} aria-label={`Remove ${a.label} address`} className="grid size-9 place-items-center rounded-full hover:bg-paper">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
          </div>
        </section>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="More">
        {[
          { to: '/pro', label: 'Become a professional', text: 'Earn with flexible hours' },
          { to: '/help', label: 'Help & support', text: 'FAQs and contact' },
          { to: '/terms', label: 'Terms & privacy', text: 'How we work' },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="card-soft group flex items-center justify-between p-5 hover:border-line-2">
            <span>
              <span className="block font-semibold">{l.label}</span>
              <span className="text-[13px] text-mute">{l.text}</span>
            </span>
            <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </section>

      <Button variant="outline" className="mt-8" onClick={() => setConfirmOut(true)}>
        <LogOut className="size-4" aria-hidden /> Sign out
      </Button>

      <Modal open={!!removing} onClose={() => setRemoving(null)} title="Remove this address?" variant="center">
        <p className="text-[15px] text-mute">{removing && addressLine(removing)}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setRemoving(null)}>
            Keep
          </Button>
          <Button variant="danger" busy={removeBusy} onClick={remove}>
            Remove
          </Button>
        </div>
      </Modal>
      <Modal open={confirmOut} onClose={() => setConfirmOut(false)} title="Sign out?" variant="center">
        <p className="text-[15px] text-mute">Your cart stays on this device.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmOut(false)}>
            Stay
          </Button>
          <Button
            onClick={() => {
              setConfirmOut(false);
              signOut();
              toast('Signed out');
            }}
          >
            Sign out
          </Button>
        </div>
      </Modal>
    </div>
  );
}
