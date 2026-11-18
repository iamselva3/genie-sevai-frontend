import { useDocumentTitle } from '../lib/hooks';

const TERMS = [
  ['Bookings', 'A booking is confirmed when it appears in your Bookings with a code. Prices shown at checkout are final for the listed scope of work; extra work or materials are quoted by the professional before they start and need your approval.'],
  ['Payment', 'You pay the professional after the job by UPI or cash. Visit fees apply to orders under the free-visit threshold shown at checkout.'],
  ['Rescheduling and cancellation', 'You can reschedule free up to 2 hours before the slot and cancel any time before the job starts. Repeated late cancellations may limit future bookings.'],
  ['Service PIN', 'Share your 4-digit PIN only with the professional assigned to your booking, after they arrive.'],
  ['Quality', 'If the work does not match the listed scope, tell us within 7 days and we will arrange a free re-visit.'],
  ['Conduct', 'We expect respectful behaviour from customers and professionals alike. Accounts that harass or endanger others may be suspended.'],
];

const PRIVACY = [
  ['What we collect', 'Your name, email and profile photo from your Google account, your mobile number, saved addresses and booking history.'],
  ['Why', 'To sign you in, match you with a professional, share your address, number and slot with them, and send booking updates.'],
  ['Who sees it', 'Only the professional assigned to your booking sees your name, phone and address, and only for that booking. We do not sell personal data.'],
  ['Retention', 'Booking records are kept for accounting and dispute resolution. You can ask us to delete your account from Help & support.'],
  ['Your choices', 'You can edit your profile and addresses at any time from Account.'],
];

function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: string[][] }) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 md:px-8 md:pt-10">
      <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-mute">Updated {updated}</p>
      <h1 className="display mt-3 text-[26px] font-semibold md:text-[34px]">{title}</h1>
      <div className="mt-10 space-y-8">
        {sections.map(([h, p], i) => (
          <section key={h} className="grid gap-2 md:grid-cols-[48px_1fr]">
            <span className="font-mono text-[13px] font-semibold text-mute">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2 className="text-[19px] font-semibold">{h}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{p}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Terms() {
  return <LegalPage title="Terms of service" updated="November 2026" sections={TERMS} />;
}

export function Privacy() {
  return <LegalPage title="Privacy policy" updated="November 2026" sections={PRIVACY} />;
}
