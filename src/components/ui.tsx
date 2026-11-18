import clsx from 'clsx';
import { LoaderCircle, Minus, Plus, Star, X } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../lib/hooks';

/* ---------------- Button ---------------- */

/** ink = primary (black), sun = outlined accent (e.g. "Add"), outline = neutral, ghost, danger. */
type Variant = 'ink' | 'sun' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  ink: 'bg-brand text-white shadow-[0_1px_2px_rgb(0_0_0/0.12)] hover:bg-brand-dark',
  sun: 'bg-white text-ink border border-ink/30 hover:bg-brand-soft hover:border-ink',
  outline: 'bg-white text-ink border border-line-2 hover:border-ink-3',
  ghost: 'bg-transparent text-ink hover:bg-tile',
  danger: 'bg-bad text-white hover:opacity-90',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
  lg: 'h-[52px] px-6 text-[15.5px] gap-2.5 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  busy?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'ink', size = 'md', busy, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={clsx(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx('grid size-10 place-items-center rounded-full transition-colors hover:bg-tile', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------------- Modal / sheet ---------------- */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** sheet: bottom sheet everywhere; side: bottom sheet on phones, right panel on desktop; center: dialog */
  variant?: 'sheet' | 'side' | 'center';
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, footer, variant = 'side', size = 'md' }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    const t = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, select');
      (first ?? panel.current)?.focus();
    }, 40);
    return () => {
      window.removeEventListener('keydown', key);
      window.clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'md:max-w-md', md: 'md:max-w-lg', lg: 'md:max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="overlay" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx(
          'absolute flex max-h-[92dvh] flex-col bg-white shadow-block-lg outline-none',
          variant === 'center'
            ? 'left-1/2 top-1/2 w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 animate-pop rounded-3xl md:max-w-md'
            : 'sheet inset-x-0 bottom-0 rounded-t-3xl',
          variant === 'side' && 'sheet-side md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-full md:rounded-none md:rounded-l-3xl',
          variant === 'side' && widths[size],
          variant === 'sheet' && 'md:left-1/2 md:max-w-xl md:-translate-x-1/2',
        )}
      >
        {variant !== 'center' && <div className="mx-auto mt-2.5 h-1.5 w-11 flex-none rounded-full bg-line-2 md:hidden" aria-hidden />}
        <div className="flex flex-none items-start justify-between gap-4 px-5 pb-3 pt-4 md:px-7 md:pt-6">
          <h2 id={titleId} className="text-[21px] font-semibold leading-tight tracking-[-0.02em]">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} className="-mr-1.5 -mt-1 bg-tile hover:bg-line">
            <X className="size-[18px]" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-7">{children}</div>
        {footer && <div className="safe-bottom flex-none border-t border-line bg-white px-5 py-4 md:px-7">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Inputs ---------------- */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  lead?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, lead, id, className, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">
        {label}
      </label>
      <div className="relative">
        {lead && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-mute">{lead}</span>}
        <input
          ref={ref}
          id={fid}
          className={clsx('field', !!lead && 'pl-12')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : undefined}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${fid}-err`} className="mt-1.5 text-[13px] font-medium text-bad" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[13px] text-mute">{hint}</p>
      )}
    </div>
  );
});

export function TextArea({ label, error, id, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string | null }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">
        {label}
      </label>
      <textarea id={fid} className="field" rows={3} aria-invalid={error ? true : undefined} {...rest} />
      {error && (
        <p className="mt-1.5 text-[13px] font-medium text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-[#fecdca] bg-[#fef3f2] px-4 py-3 text-sm font-medium text-bad">
      {children}
    </p>
  );
}

/* ---------------- Stepper ---------------- */

export function Stepper({ value, onChange, label, max = 10, size = 'md' }: { value: number; onChange: (n: number) => void; label: string; max?: number; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-10';
  const btn = size === 'sm' ? 'w-8' : 'w-9';
  return (
    <div className={clsx('inline-flex items-center rounded-lg border border-brand/45 bg-brand-soft text-brand-dark', h)}>
      <button type="button" aria-label={`Remove one ${label}`} onClick={() => onChange(value - 1)} className={clsx('grid h-full place-items-center rounded-l-lg hover:bg-brand-soft', btn)}>
        <Minus className="size-4" strokeWidth={2.5} />
      </button>
      <span className="min-w-6 text-center text-[15px] font-semibold tabular-nums" aria-live="polite" aria-label={`${value} in cart`}>
        {value}
      </span>
      <button
        type="button"
        aria-label={`Add one more ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={clsx('grid h-full place-items-center rounded-r-lg hover:bg-brand-soft disabled:opacity-40', btn)}
      >
        <Plus className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ---------------- Rating ---------------- */

export function Rating({ value, count, className }: { value: number; count?: string; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[13px] font-medium text-ink-3', className)}>
      <Star className="size-3.5 fill-ink text-ink" aria-hidden />
      <span className="text-ink">{value.toFixed(2).replace(/0$/, '')}</span>
      {count && <span className="text-mute">({count})</span>}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-2" role="group" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className={clsx(
            'grid size-12 place-items-center rounded-xl border transition-colors duration-200',
            n <= value ? 'border-brand bg-brand text-white' : 'border-line-2 bg-white text-mute-2 hover:border-brand',
          )}
        >
          <Star className={clsx('size-5', n <= value && 'fill-white')} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- Misc ---------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} aria-hidden />;
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card-soft flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-5 grid size-16 place-items-center rounded-full bg-brand-soft text-brand">{icon}</div>}
      <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{title}</h2>
      {children && <p className="mt-2 max-w-sm text-[15px] text-mute">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Pill({ children, tone = 'line', className }: { children: ReactNode; tone?: 'line' | 'sun' | 'ink' | 'bad' | 'ok'; className?: string }) {
  const tones = {
    line: 'bg-tile text-ink-3 border-line',
    sun: 'bg-brand-soft text-brand-dark border-transparent',
    ink: 'bg-ink text-white border-ink',
    bad: 'bg-[#fef3f2] text-bad border-[#fecdca]',
    ok: 'bg-ok-soft text-ok border-transparent',
  };
  return <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium', tones[tone], className)}>{children}</span>;
}
