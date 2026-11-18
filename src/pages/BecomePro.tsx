import { useQuery } from '@tanstack/react-query';
import { BadgeIndianRupee, CalendarCheck, GraduationCap, PartyPopper } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Field, FormError, TextArea } from '../components/ui';
import { useCity } from '../context/city';
import { api, ApiError } from '../lib/api';
import { isValidPhone } from '../lib/format';
import { useDocumentTitle } from '../lib/hooks';

export default function BecomePro() {
  useDocumentTitle('Become a professional');
  const { cities, city } = useCity();
  const cats = useQuery({ queryKey: ['categories', 'all'], queryFn: () => api.categories(), staleTime: 5 * 60_000 });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cityName, setCityName] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [years, setYears] = useState('2');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { duplicate: boolean }>(null);

  const toggle = (s: string) => setSkills((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Tell us your name';
    if (!isValidPhone(phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (!skills.length) next.skills = 'Pick at least one skill';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await api.proApplication({
        name: name.trim(),
        phone,
        city: cityName || city?.name || '',
        skills,
        experienceYears: Number(years) || 0,
        message: message.trim() || undefined,
      });
      setDone({ duplicate: res.duplicate });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not send your application');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_480px]">
        <div>
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-mute">Genie Sevai for professionals</p>
          <h1 className="display mt-3 text-[34px] font-semibold md:text-[48px]">
            Your skill. <br />
            <span className="mark">Your hours.</span>
          </h1>
          <p className="mt-6 max-w-lg text-[17px] text-ink/75">Join hundreds of cleaners, beauticians, electricians and technicians who get steady jobs near home through Genie Sevai.</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { icon: BadgeIndianRupee, title: 'Weekly payouts', text: 'Keep what you earn, paid every week.' },
              { icon: CalendarCheck, title: 'Pick your slots', text: 'Work mornings, evenings or weekends.' },
              { icon: GraduationCap, title: 'Free training', text: 'Learn our checklists and grow ratings.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="card-soft p-5">
                <span className="block-icon size-11">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="text-[13px] text-mute">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="card p-5 md:p-8" aria-labelledby="apply-title">
          {done ? (
            <div className="py-8 text-center" role="status">
              <span className="block-icon mx-auto size-16">
                <PartyPopper className="size-7" aria-hidden />
              </span>
              <h2 className="mt-6 text-[22px] font-semibold tracking-[-0.02em]">{done.duplicate ? 'We already have your details' : 'Application received'}</h2>
              <p className="mt-2 text-mute">Our partner team will call you within 2 working days.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <h2 id="apply-title" className="text-[22px] font-semibold tracking-[-0.02em]">
                Apply in 2 minutes
              </h2>
              <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
              <Field
                label="Mobile number"
                lead="+91"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                error={errors.phone}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pro-city" className="label">
                    City
                  </label>
                  <select id="pro-city" className="field" value={cityName || city?.name || ''} onChange={(e) => setCityName(e.target.value)}>
                    {cities.map((c) => (
                      <option key={c.slug}>{c.name}</option>
                    ))}
                    <option>Other</option>
                  </select>
                </div>
                <Field label="Years of experience" type="number" min={0} max={50} value={years} onChange={(e) => setYears(e.target.value)} />
              </div>
              <fieldset>
                <legend className="label">Skills</legend>
                <div className="flex flex-wrap gap-2">
                  {cats.data?.categories.map((c) => (
                    <button key={c.slug} type="button" aria-pressed={skills.includes(c.name)} onClick={() => toggle(c.name)} className="chip">
                      {c.name}
                    </button>
                  ))}
                </div>
                {errors.skills && (
                  <p className="mt-1.5 text-[13px] font-medium text-bad" role="alert">
                    {errors.skills}
                  </p>
                )}
              </fieldset>
              <TextArea label="Anything else? (optional)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
              <FormError>{formError}</FormError>
              <Button type="submit" block size="lg" busy={busy}>
                Send application
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
