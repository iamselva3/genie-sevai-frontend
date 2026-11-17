import clsx from 'clsx';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { rupees } from '../lib/format';
import { useInView } from '../lib/hooks';
import { categoryIcon } from '../lib/icons';
import type { Category } from '../lib/types';

/** Pauses CSS animations inside the element while it is off-screen or the tab is hidden. */
function usePauseOffscreen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = true;
    const apply = () => el.classList.toggle('is-paused', !visible || document.hidden);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => ((visible = e.isIntersecting), apply())) : null;
    io?.observe(el);
    document.addEventListener('visibilitychange', apply);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', apply);
    };
  }, []);
  return ref;
}

/** A slowly spinning cube whose faces are categories. Drag/hover tilts it; click a face to open it. */
export function HeroCube({ categories, compact = false }: { categories: Category[]; compact?: boolean }) {
  const navigate = useNavigate();
  const scene = usePauseOffscreen<HTMLDivElement>();
  const tilt = useRef<HTMLDivElement>(null);
  const faces = Array.from({ length: 6 }, (_, i) => categories[i] ?? null);

  useEffect(() => {
    const el = scene.current;
    const t = tilt.current;
    if (!el || !t || !window.matchMedia?.('(hover: hover)').matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        t.style.setProperty('--rx', `${(-y * 26).toFixed(1)}deg`);
        t.style.setProperty('--ry', `${(x * 34).toFixed(1)}deg`);
      });
    };
    const leave = () => {
      t.style.setProperty('--rx', '0deg');
      t.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [scene]);

  return (
    <div
      ref={scene}
      className={clsx('cube-scene relative flex h-full flex-col items-center justify-center', compact ? 'cube-sm' : 'min-h-[300px] md:min-h-[360px]')}
      aria-hidden
    >
      <div ref={tilt} className="cube-tilt">
        <div className="cube">
          {faces.map((c, i) => {
            const Icon = categoryIcon(c?.icon);
            return (
              <div
                key={i}
                className="cube-face cursor-pointer"
                data-face={i}
                onClick={() => c && navigate(`/c/${c.slug}`)}
              >
                <Icon className={compact ? 'size-6 md:size-7' : 'size-8 md:size-10'} strokeWidth={1.6} />
                <div>
                  <div className={compact ? 'text-[11px] leading-tight md:text-[13px]' : 'text-[15px] md:text-[18px]'}>{c?.name ?? 'Genie'}</div>
                  {!compact && c?.startingPrice != null && (
                    <div className="mt-1 font-sans text-[11px] font-semibold opacity-70 md:text-[12px]">from {rupees(c.startingPrice)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={clsx('cube-shadow', compact ? 'mt-9 md:mt-11' : 'mt-14 md:mt-20')} />
      {!compact && (
        <>
          <span className="orbit-tag left-[4%] top-[22%] md:top-[14%]" style={{ animationDelay: '-1s' }}>
            ★ 4.8 average rating
          </span>
          <span className="orbit-tag bottom-[22%] right-[2%]" style={{ animationDelay: '-2.5s' }}>
            Pay after the job
          </span>
          <span className="orbit-tag bottom-[6%] left-[8%] hidden sm:inline-flex" style={{ animationDelay: '-4s' }}>
            Verified pros
          </span>
        </>
      )}
    </div>
  );
}

/** Flips through words on a 3D axis. */
export function FlipWords({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (words.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => window.clearInterval(t);
  }, [words.length, interval]);
  return (
    <span className="flip-word" aria-live="off">
      {words.map((w, n) => (
        <span key={w} data-state={n === i ? 'in' : n === (i - 1 + words.length) % words.length ? 'out' : 'next'} aria-hidden={n !== i}>
          {w}
        </span>
      ))}
    </span>
  );
}

/** Three cards stacked in 3D that fan out when scrolled into view. */
export function StackCards({ children }: { children: ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  return (
    <div ref={ref} className={clsx('stack grid gap-4 md:grid-cols-3 md:gap-5', inView && 'is-open')}>
      {children}
    </div>
  );
}

export function Coin({ className }: { className?: string }) {
  const ref = usePauseOffscreen<HTMLDivElement>();
  return (
    <div ref={ref} className={clsx('coin-scene', className)} aria-hidden>
      <div className="coin size-full">
        <div className="border-[3px] border-white bg-sun text-ink">
          <ShieldCheck className="size-1/2" strokeWidth={1.6} />
        </div>
        <div className="border-[3px] border-sun bg-ink text-sun">
          <BadgeCheck className="size-1/2" strokeWidth={1.6} />
        </div>
      </div>
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const ref = usePauseOffscreen<HTMLDivElement>();
  const row = (hidden?: boolean) => (
    <div className="marquee-track" aria-hidden={hidden}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="display flex items-center gap-10 text-3xl font-extrabold uppercase md:text-5xl">
          {item} <span className="inline-block size-3 rotate-45 bg-ink md:size-4" />
        </span>
      ))}
    </div>
  );
  return (
    <div ref={ref} className="marquee">
      {row()}
      {row(true)}
    </div>
  );
}

/** Fades content up when it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={clsx('reveal', inView && 'is-in', className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
