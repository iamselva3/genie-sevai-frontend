import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowRight, Check, CornerDownLeft, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useCart } from '../context/cart';
import { useCity } from '../context/city';
import { useUi } from '../context/ui';
import { api } from '../lib/api';
import { rupees } from '../lib/format';
import { GoogleCancelled, googleAccessToken, googleReady, loadGoogle } from '../lib/google';
import { useDebounced, useScrollLock } from '../lib/hooks';
import { categoryIcon } from '../lib/icons';
import { ContactForm, needsContact } from './contact';
import { Button, FormError, Modal } from './ui';

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

/* ---------------- Sign in with Google ---------------- */

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5Z" />
    </svg>
  );
}

function AuthSheet() {
  const { auth, closeAuth, toast } = useUi();
  const { signIn, customer } = useAuth();
  const [step, setStep] = useState<'google' | 'details'>('google');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth) return;
    setStep('google');
    setError(null);
    setBusy(false);
    // Fetch Google's script while the customer reads the sheet, so the click opens the window at once.
    if (googleReady) loadGoogle().catch(() => undefined);
  }, [auth]);

  const finish = (name: string) => {
    const onSuccess = auth?.onSuccess;
    closeAuth();
    toast(name ? `Welcome, ${name.split(' ')[0]}` : 'Signed in', 'ok');
    onSuccess?.();
  };

  const continueWithGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const accessToken = await googleAccessToken();
      const res = await api.googleSignIn(accessToken);
      signIn(res.token, res.customer);
      if (needsContact(res.customer)) setStep('details');
      else finish(res.customer.name);
    } catch (err) {
      if (!(err instanceof GoogleCancelled)) setError(err instanceof Error ? err.message : 'Could not sign you in');
    } finally {
      setBusy(false);
    }
  };

  const titles = { google: 'Sign in to Genie Sevai', details: 'One last step' };

  return (
    <Modal open={!!auth} onClose={closeAuth} title={titles[step]} variant="center">
      {step === 'google' && (
        <div className="space-y-4">
          {auth?.reason && <p className="-mt-1 text-[14px] text-mute">{auth.reason}</p>}
          <Button variant="outline" block size="lg" busy={busy} onClick={continueWithGoogle}>
            {!busy && <GoogleMark />} Continue with Google
          </Button>
          <FormError>{error}</FormError>
          <p className="text-center text-[12px] text-mute">
            We only use your name and email from Google. By continuing you agree to our{' '}
            <Link to="/terms" onClick={closeAuth} className="underline">
              terms
            </Link>
            .
          </p>
        </div>
      )}
      {step === 'details' && customer && (
        <div className="space-y-4">
          <p className="-mt-1 text-[14px] text-mute">
            Signed in as <strong className="text-ink">{customer.email}</strong>. Add your mobile number so your professional can reach you.
          </p>
          <ContactForm customer={customer} onSaved={(c) => finish(c.name)} />
        </div>
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
