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

type Variant = 'ink' | 'sun' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  ink: 'bg-ink text-white hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-sun)] active:translate-x-0 active:translate-y-0 active:shadow-none',
  sun: 'bg-sun text-ink border-[1.5px] border-ink shadow-block hover:-translate-x-px hover:-translate-y-px hover:shadow-block-md active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  outline: 'bg-white text-ink border-[1.5px] border-ink hover:bg-paper',
  ghost: 'bg-transparent text-ink hover:bg-line/70',
  danger: 'bg-bad text-white hover:opacity-90',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-12 px-5 text-[15px] gap-2',
  lg: 'h-14 px-7 text-base gap-2.5',
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
        'inline-flex select-none items-center justify-center rounded-full font-semibold transition-all duration-200 disabled:opacity-45 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0',
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
      className={clsx('grid size-11 place-items-center rounded-full transition-colors hover:bg-line/70', className)}
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
  labelledBy?: string;
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
          'absolute flex max-h-[92dvh] flex-col bg-white outline-none',
          variant === 'center'
            ? 'left-1/2 top-1/2 w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 animate-pop rounded-[26px] border-[1.5px] border-ink shadow-block-lg md:max-w-md'
            : 'sheet inset-x-0 bottom-0 rounded-t-[28px] border-t-[1.5px] border-ink',
          variant === 'side' && 'sheet-side md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-full md:rounded-none md:rounded-l-[28px] md:border-l-[1.5px] md:border-t-0',
          variant === 'side' && widths[size],
          variant === 'sheet' && 'md:left-1/2 md:max-w-xl md:-translate-x-1/2',
        )}
      >
        {variant !== 'center' && <div className="mx-auto mt-2.5 h-1.5 w-12 flex-none rounded-full bg-line md:hidden" aria-hidden />}
        <div className="flex flex-none items-start justify-between gap-4 px-5 pb-3 pt-4 md:px-7 md:pt-6">
          <h2 id={titleId} className="display text-[26px] font-bold leading-tight">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1 border-[1.5px] border-line">
            <X className="size-5" />
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
        {lead && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-mute">{lead}</span>}
        <input
          ref={ref}
          id={fid}
          className={clsx('field', !!lead && 'pl-14')}
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
    <p role="alert" className="rounded-2xl border-[1.5px] border-bad bg-white px-4 py-3 text-sm font-medium text-bad">
      {children}
    </p>
  );
}

/* ---------------- Stepper ---------------- */

export function Stepper({ value, onChange, label, max = 10, size = 'md' }: { value: number; onChange: (n: number) => void; label: string; max?: number; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div className={clsx('inline-flex items-center rounded-full border-[1.5px] border-ink bg-sun shadow-block', h)}>
      <button type="button" aria-label={`Remove one ${label}`} onClick={() => onChange(value - 1)} className={clsx('grid place-items-center rounded-full', size === 'sm' ? 'size-9' : 'size-11')}>
        <Minus className="size-4" strokeWidth={2.5} />
      </button>
      <span className="min-w-6 text-center text-[15px] font-bold tabular-nums" aria-live="polite" aria-label={`${value} in cart`}>
        {value}
      </span>
      <button
        type="button"
        aria-label={`Add one more ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={clsx('grid place-items-center rounded-full disabled:opacity-40', size === 'sm' ? 'size-9' : 'size-11')}
      >
        <Plus className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ---------------- Rating ---------------- */

export function Rating({ value, count, className }: { value: number; count?: string; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[13px] font-semibold', className)}>
      <Star className="size-3.5 fill-ink" aria-hidden />
      <span>{value.toFixed(1)}</span>
      {count && <span className="font-medium text-mute">({count})</span>}
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
            'grid size-12 place-items-center rounded-2xl border-[1.5px] border-ink transition-all duration-200',
            n <= value ? 'bg-sun shadow-block' : 'bg-white',
          )}
        >
          <Star className={clsx('size-5', n <= value && 'fill-ink')} />
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
      {icon && <div className="block-icon mb-5 size-16 rotate-[-6deg]">{icon}</div>}
      <h2 className="display text-3xl font-bold">{title}</h2>
      {children && <p className="mt-2 max-w-sm text-[15px] text-mute">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Pill({ children, tone = 'line', className }: { children: ReactNode; tone?: 'line' | 'sun' | 'ink' | 'bad' | 'ok'; className?: string }) {
  const tones = {
    line: 'bg-paper text-ink border-line-2',
    sun: 'bg-sun text-ink border-ink',
    ink: 'bg-ink text-white border-ink',
    bad: 'bg-white text-bad border-bad',
    ok: 'bg-white text-ok border-ok',
  };
  return <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold', tones[tone], className)}>{children}</span>;
}
