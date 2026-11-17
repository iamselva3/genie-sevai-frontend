import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowRight, Check, CornerDownLeft, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { useUi } from '../context/ui';
import { api, ApiError } from '../lib/api';
import { isValidPhone, rupees } from '../lib/format';
import { useDebounced, useScrollLock } from '../lib/hooks';
import { categoryIcon } from '../lib/icons';
import { Button, Field, Modal } from './ui';

export function Overlays() {
  const { openSearch, closeSearch, searchOpen } = useUi();
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchOpen) closeSearch();
        else openSearch();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [openSearch, closeSearch, searchOpen]);

  return (
    <>
      <AuthSheet />
      <CityPicker />
      <SearchOverlay />
      <ReplaceCartDialog />
      <Toasts />
    </>
  );
}

/* ---------------- Sign in with phone OTP ---------------- */

function AuthSheet() {
  const { auth, closeAuth, toast } = useUi();
  const { signIn } = useAuth();
  const [step, setStep] = useState<'phone' | 'code' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [session, setSession] = useState<{ token: string } | null>(null);

  useEffect(() => {
    if (auth) {
      setStep('phone');
      setCode('');
      setError(null);
      setDevCode(null);
      setSession(null);
    }
  }, [auth]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const finish = (customerName: string) => {
    const onSuccess = auth?.onSuccess;
    closeAuth();
    toast(customerName ? `Welcome, ${customerName.split(' ')[0]}` : 'Signed in', 'ok');
    onSuccess?.();
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!isValidPhone(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.sendOtp(phone);
      setDevCode(res.devCode ?? null);
      setStep('code');
      setResendIn(30);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.verifyOtp(phone, code);
      signIn(res.token, res.customer);
      if (!res.customer.name) {
        setSession({ token: res.token });
        setStep('name');
      } else finish(res.customer.name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify the code');
    } finally {
      setBusy(false);
    }
  };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Enter your name');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.updateMe({ name: name.trim() });
      if (session) signIn(session.token, res.customer);
      finish(res.customer.name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your name');
    } finally {
      setBusy(false);
    }
  };

  const titles = { phone: 'Sign in to Genie Sevai', code: 'Check your phone', name: 'What should we call you?' };

  return (
    <Modal open={!!auth} onClose={closeAuth} title={titles[step]} variant="center">
      {auth?.reason && step === 'phone' && <p className="-mt-1 mb-4 text-[14px] text-mute">{auth.reason}</p>}
      {step === 'phone' && (
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          <Field
            label="Mobile number"
            lead="+91"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            error={error}
          />
          <Button type="submit" block size="lg" busy={busy}>
            Get OTP <ArrowRight className="size-4" aria-hidden />
          </Button>
          <p className="text-center text-[12px] text-mute">
            By continuing you agree to our{' '}
            <Link to="/terms" onClick={closeAuth} className="underline">
              terms
            </Link>
            .
          </p>
        </form>
      )}
      {step === 'code' && (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <p className="-mt-1 text-[14px] text-mute">
            We sent a 6-digit code to <strong className="text-ink">+91 {phone.slice(0, 5)} {phone.slice(5)}</strong>.{' '}
            <button type="button" className="font-semibold text-ink underline" onClick={() => setStep('phone')}>
              Change
            </button>
          </p>
          <Field
            label="One-time code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="[&_input]:text-center [&_input]:font-mono [&_input]:text-2xl [&_input]:tracking-[0.5em]"
            error={error}
            data-autofocus
          />
          {devCode && (
            <p className="rounded-xl border border-dashed border-line-2 bg-paper px-3 py-2 text-[13px]" data-testid="dev-code">
              Test mode · your code is <strong className="font-mono">{devCode}</strong>
            </p>
          )}
          <Button type="submit" block size="lg" busy={busy}>
            Verify & continue
          </Button>
          <button type="button" disabled={resendIn > 0 || busy} onClick={() => sendCode()} className="w-full text-center text-[13px] font-semibold underline disabled:text-mute disabled:no-underline">
            {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          </button>
        </form>
      )}
      {step === 'name' && (
        <form onSubmit={saveName} className="space-y-4" noValidate>
          <Field label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" error={error} />
          <Button type="submit" block size="lg" busy={busy}>
            Continue
          </Button>
        </form>
      )}
    </Modal>
  );
}

/* ---------------- City picker ---------------- */

function CityPicker() {
  const { cityOpen, closeCity, toast } = useUi();
  const { cities, citySlug, setCity } = useCity();
  return (
    <Modal open={cityOpen} onClose={closeCity} title="Where do you need us?" variant="center">
      <p className="-mt-1 mb-5 text-[14px] text-mute">Prices and slots depend on your city.</p>
      <div className="grid grid-cols-2 gap-3">
        {cities.map((c) => {
          const active = c.slug === citySlug;
          return (
            <button
              key={c.slug}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCity(c.slug);
                closeCity();
                toast(`Showing services in ${c.name}`);
              }}
              className={clsx(
                'flex items-start justify-between rounded-2xl border-[1.5px] p-4 text-left transition-all',
                active ? 'border-ink bg-sun shadow-block' : 'border-line-2 bg-white hover:border-ink',
              )}
            >
              <span>
                <span className="block text-[16px] font-bold">{c.name}</span>
                <span className="text-[12px] text-mute">{c.state}</span>
              </span>
              {active ? <Check className="size-4" aria-hidden /> : <MapPin className="size-4 text-mute" aria-hidden />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/* ---------------- Search ---------------- */

const SUGGESTIONS = ['Deep cleaning', 'AC service', 'Haircut', 'Tap repair', 'Fan installation', 'Cockroach control'];

function SearchOverlay() {
  const { searchOpen, closeSearch } = useUi();
  const { citySlug } = useCity();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const term = useDebounced(text.trim(), 220);
  useScrollLock(searchOpen);

  useEffect(() => {
    if (!searchOpen) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && closeSearch();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [searchOpen, closeSearch]);

  const results = useQuery({
    queryKey: ['search', term, citySlug],
    queryFn: () => api.search(term, citySlug),
    enabled: searchOpen && term.length >= 2,
    staleTime: 60_000,
  });
  const categories = useQuery({ queryKey: ['categories', citySlug], queryFn: () => api.categories(citySlug), enabled: searchOpen, staleTime: 5 * 60_000 });

  if (!searchOpen) return null;
  const go = (to: string) => {
    closeSearch();
    setText('');
    navigate(to);
  };
  const services = results.data?.services ?? [];

  return createPortal(
    <div className="fixed inset-0 z-[75]">
      <div className="overlay" onClick={closeSearch} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search services" className="absolute inset-0 flex animate-pop flex-col bg-paper md:inset-x-0 md:top-[8vh] md:mx-auto md:max-h-[78vh] md:max-w-2xl md:rounded-[28px] md:border-[1.5px] md:border-ink md:shadow-block-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (services[0]) go(`/c/${services[0].category?.slug}?s=${services[0].slug}`);
          }}
          className="flex flex-none items-center gap-3 border-b border-line px-4 py-3 md:px-6 md:py-4"
        >
          <Search className="size-5 flex-none" aria-hidden />
          <label htmlFor="search-input" className="sr-only">
            Search services
          </label>
          <input
            id="search-input"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you need done?"
            className="h-12 min-w-0 flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-mute"
            autoComplete="off"
          />
          <button type="button" onClick={closeSearch} aria-label="Close search" className="grid size-10 place-items-center rounded-full border-[1.5px] border-line">
            <X className="size-5" aria-hidden />
          </button>
        </form>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
          {term.length < 2 ? (
            <>
              <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-mute">Try</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => setText(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="mb-3 mt-8 text-[12px] font-bold uppercase tracking-wider text-mute">Categories</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(categories.data?.categories ?? []).map((c) => {
                  const Icon = categoryIcon(c.icon);
                  return (
                    <button key={c.slug} type="button" onClick={() => go(`/c/${c.slug}`)} className="flex items-center gap-3 rounded-2xl p-2 text-left hover:bg-white">
                      <span className="block-icon size-10 rounded-xl shadow-none">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="text-[15px] font-semibold">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : results.isLoading ? (
            <p className="text-mute">Searching…</p>
          ) : services.length === 0 && !results.data?.categories.length ? (
            <div className="py-10 text-center">
              <p className="display text-2xl font-bold">Nothing for “{term}” yet</p>
              <p className="mt-2 text-mute">Try a broader word like “cleaning” or “repair”.</p>
            </div>
          ) : (
            <ul className="space-y-1" data-testid="search-results">
              {results.data?.categories.map((c) => (
                <li key={c.slug}>
                  <button type="button" onClick={() => go(`/c/${c.slug}`)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-white">
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold text-white">Category</span>
                    <span className="flex-1 font-semibold">{c.name}</span>
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
              {services.map((s, i) => (
                <li key={s.id}>
                  <button type="button" onClick={() => go(`/c/${s.category?.slug}?s=${s.slug}`)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-white">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{s.name}</span>
                      <span className="text-[13px] text-mute">
                        {s.category?.name} · {s.bookable ? rupees(s.price) : s.unavailableReason}
                      </span>
                    </span>
                    {i === 0 && <CornerDownLeft className="size-4 text-mute" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Replace cart ---------------- */

function ReplaceCartDialog() {
  const { pendingReplace, confirmReplace, cancelReplace, cart } = useCart();
  return (
    <Modal open={!!pendingReplace} onClose={cancelReplace} title="Start a new cart?" variant="center">
      <p className="text-[15px] text-mute">
        Your cart has <strong className="text-ink">{cart.category?.name}</strong> services. One booking covers one category, so adding{' '}
        <strong className="text-ink">{pendingReplace?.item.name}</strong> will replace them.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={cancelReplace}>
          Keep cart
        </Button>
        <Button variant="sun" onClick={confirmReplace}>
          Replace
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------- Toasts ---------------- */

function Toasts() {
  const { toasts, dismissToast } = useUi();
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[170px] z-[80] flex flex-col items-center gap-2 px-4 md:bottom-[100px]" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={clsx(
            'pointer-events-auto animate-rise rounded-full border-[1.5px] px-5 py-2.5 text-[14px] font-semibold shadow-lift',
            t.tone === 'bad' ? 'border-bad bg-white text-bad' : t.tone === 'ok' ? 'border-ink bg-sun text-ink' : 'border-ink bg-ink text-white',
          )}
        >
          {t.message}
        </button>
      ))}
    </div>,
    document.body,
  );
}
