import clsx from 'clsx';
import { Briefcase, House, MapPin } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/auth';
import { useCity } from '../context/city';
import { api, ApiError } from '../lib/api';
import type { Address } from '../lib/types';
import { Button, Field, FormError } from './ui';

const LABELS: { value: Address['label']; icon: typeof House }[] = [
  { value: 'Home', icon: House },
  { value: 'Work', icon: Briefcase },
  { value: 'Other', icon: MapPin },
];

/** Adds an address to the signed-in customer. `fixedCity` locks the city (checkout). */
export function AddressForm({ fixedCity, onSaved, onCancel }: { fixedCity?: string; onSaved: (addressId: string) => void; onCancel?: () => void }) {
  const { setCustomer } = useAuth();
  const { cities, citySlug } = useCity();
  const [label, setLabel] = useState<Address['label']>('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState(fixedCity ?? citySlug ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (line1.trim().length < 3) next.line1 = 'Enter house / flat number and building';
    if (!/^\d{6}$/.test(pincode)) next.pincode = 'Enter a 6-digit pincode';
    if (!city) next.city = 'Choose a city';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await api.addAddress({ label, line1: line1.trim(), line2: line2.trim(), landmark: landmark.trim(), city, pincode });
      setCustomer(res.customer);
      onSaved(res.addressId);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save the address');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate data-testid="address-form">
      <div role="group" aria-label="Address type" className="flex gap-2">
        {LABELS.map(({ value, icon: Icon }) => (
          <button key={value} type="button" aria-pressed={label === value} onClick={() => setLabel(value)} className="chip">
            <Icon className="size-3.5" aria-hidden /> {value}
          </button>
        ))}
      </div>
      <Field label="House / flat & building" value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="12, Lotus Apartments" error={errors.line1} autoComplete="address-line1" />
      <Field label="Street & area" value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="3rd Main Road, Adyar" autoComplete="address-line2" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Landmark (optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near the bus depot" />
        <Field
          label="Pincode"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="600020"
          error={errors.pincode}
          autoComplete="postal-code"
        />
      </div>
      {fixedCity ? (
        <p className="text-[13px] text-mute">
          City: <strong className="text-ink">{cities.find((c) => c.slug === fixedCity)?.name ?? fixedCity}</strong>
        </p>
      ) : (
        <div>
          <label htmlFor="address-city" className="label">
            City
          </label>
          <select id="address-city" className={clsx('field', errors.city && 'border-bad')} value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <FormError>{formError}</FormError>
      <div className="flex gap-3">
        <Button type="submit" busy={busy}>
          Save address
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function addressLine(a: Pick<Address, 'line1' | 'line2' | 'landmark' | 'pincode'>) {
  return [a.line1, a.line2, a.landmark, a.pincode].filter(Boolean).join(', ');
}
