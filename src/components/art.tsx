/*
 * Hand-built "soft 3D" illustrations for categories and banners.
 * Solid tones only (light face, darker side, deep shadow) - no gradients, no bitmaps.
 * The app chrome is black & white; the artwork carries the colour (one hue per category).
 */
import type { ReactNode } from 'react';

/** Face, side, deep, light and soft tints of one hue. */
type Pal = { b: string; d: string; n: string; l: string; s: string };

const PAL = {
  rose: { b: '#F0568C', d: '#D63D73', n: '#9C1F4E', l: '#F9A9C6', s: '#FDE3ED' },
  violet: { b: '#7C5CFA', d: '#6342DE', n: '#3D2797', l: '#C2B3FD', s: '#EDE8FF' },
  teal: { b: '#14A39A', d: '#0E877F', n: '#0A5E59', l: '#86DCD3', s: '#D6F4F0' },
  sky: { b: '#2F9BEA', d: '#1D7FC8', n: '#0F4E7D', l: '#9AD2F8', s: '#DDF1FD' },
  indigo: { b: '#4F6AF0', d: '#3B53D1', n: '#26338A', l: '#AEBBFA', s: '#E5E9FE' },
  amber: { b: '#F5A623', d: '#D9890C', n: '#8A5306', l: '#FBD58E', s: '#FEF1D4' },
  cyan: { b: '#0EA5C4', d: '#0B87A1', n: '#075667', l: '#86D9EA', s: '#D7F3F9' },
  orange: { b: '#F26B2C', d: '#D2551B', n: '#8A3411', l: '#F9B591', s: '#FDE6DA' },
  green: { b: '#22A45D', d: '#18884B', n: '#0F5B32', l: '#8FDAAF', s: '#DDF5E7' },
  red: { b: '#E5484D', d: '#C8343A', n: '#8B1E23', l: '#F5A4A7', s: '#FCE4E5' },
  slate: { b: '#4B5563', d: '#374151', n: '#1F2937', l: '#B6BCC6', s: '#E8EAEE' },
} satisfies Record<string, Pal>;

const W = '#FFFFFF';
const G1 = '#E7E7EA';
const G2 = '#CFCFD4';
const S = '#55555E';

function Art({ children, className, viewBox = '0 0 120 96' }: { children: ReactNode; className?: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className={className} aria-hidden focusable="false">
      {children}
    </svg>
  );
}

const Shadow = ({ cx = 60, cy = 88, rx = 32 }: { cx?: number; cy?: number; rx?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={4.5} fill="#000" opacity={0.08} />
);

/* ---------------- Category illustrations ---------------- */

function HairDryer({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={30} />
      <rect x="50" y="48" width="13" height="34" rx="6" fill={p.d} transform="rotate(12 56 65)" />
      <rect x="53" y="58" width="7" height="4" rx="2" fill={p.l} transform="rotate(12 56 65)" />
      <rect x="30" y="28" width="52" height="28" rx="14" fill={p.b} />
      <rect x="40" y="32" width="30" height="4" rx="2" fill={W} opacity={0.45} />
      <rect x="78" y="33" width="16" height="18" rx="4" fill={p.n} />
      <circle cx="32" cy="42" r="15" fill={p.d} />
      <circle cx="32" cy="42" r="9" fill={p.n} />
      <path d="M27 42h10M32 37v10" stroke={p.l} strokeWidth="2" strokeLinecap="round" />
      <path d="M99 36h10M101 42h12M99 48h10" stroke={p.l} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function Scissors({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={34} />
      <rect x="18" y="66" width="84" height="10" rx="4" fill={p.l} />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={22 + i * 6} y="74" width="3" height="9" rx="1.5" fill={p.l} />
      ))}
      <rect x="18" y="66" width="84" height="4" rx="2" fill={p.s} />
      <path d="M58 40 102 22 104 26 61 45Z" fill={G1} stroke={S} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M58 44 102 60 104 56 61 39Z" fill={W} stroke={S} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M40 34 58 42M40 50 58 42" stroke={p.d} strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="30" r="9" fill="none" stroke={p.b} strokeWidth="6" />
      <circle cx="32" cy="54" r="9" fill="none" stroke={p.b} strokeWidth="6" />
      <circle cx="59" cy="42" r="3.5" fill={S} />
    </>
  );
}

function SprayBottle({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={30} />
      <circle cx="28" cy="70" r="7" fill={W} stroke={p.l} strokeWidth="2" />
      <circle cx="20" cy="56" r="4.5" fill={W} stroke={p.l} strokeWidth="2" />
      <circle cx="33" cy="50" r="3" fill={W} stroke={p.l} strokeWidth="2" />
      <rect x="44" y="40" width="34" height="46" rx="9" fill={p.b} />
      <rect x="66" y="42" width="12" height="42" rx="6" fill={p.d} />
      <rect x="49" y="56" width="18" height="18" rx="4" fill={W} />
      <rect x="52" y="61" width="12" height="2.5" rx="1.2" fill={p.l} />
      <rect x="52" y="66" width="8" height="2.5" rx="1.2" fill={p.l} />
      <rect x="53" y="32" width="16" height="10" rx="2" fill={p.d} />
      <rect x="46" y="20" width="32" height="13" rx="5" fill={p.n} />
      <rect x="77" y="22" width="9" height="7" rx="2" fill={S} />
      <path d="M58 33c-1 6-4 9-7 11" stroke={p.n} strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="93" cy="22" r="2.2" fill={p.l} />
      <circle cx="99" cy="18" r="1.8" fill={p.l} />
      <circle cx="100" cy="27" r="2" fill={p.l} />
      <circle cx="106" cy="23" r="1.6" fill={p.l} />
    </>
  );
}

function AirConditioner({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={44} cy={86} />
      <rect x="12" y="22" width="96" height="38" rx="10" fill={W} stroke={G2} strokeWidth="1.5" />
      <rect x="12" y="50" width="96" height="10" rx="5" fill={G1} />
      <rect x="20" y="53" width="80" height="2.5" rx="1.2" fill={G2} />
      <rect x="84" y="29" width="16" height="8" rx="2.5" fill={p.n} />
      <rect x="87" y="31.5" width="7" height="3" rx="1" fill={p.l} />
      <circle cx="22" cy="31" r="2" fill={p.b} />
      <path d="M28 68c6 4 0 9 6 13M50 68c6 4 0 9 6 13M72 68c6 4 0 9 6 13M94 68c6 4 0 9 6 13" stroke={p.l} strokeWidth="3" strokeLinecap="round" fill="none" />
      <g stroke={p.b} strokeWidth="2" strokeLinecap="round" transform="translate(104 12)">
        <path d="M0-7v14M-6-3.5l12 7M-6 3.5l12-7" />
      </g>
    </>
  );
}

function WashingMachine({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={30} />
      <rect x="32" y="14" width="56" height="72" rx="9" fill={W} stroke={G2} strokeWidth="1.5" />
      <rect x="36" y="18" width="48" height="12" rx="4" fill={G1} />
      <rect x="40" y="22" width="14" height="4" rx="2" fill={p.l} />
      <circle cx="77" cy="24" r="3.5" fill={p.b} />
      <circle cx="60" cy="56" r="21" fill={G2} />
      <circle cx="60" cy="56" r="16" fill={p.b} />
      <path d="M44.5 58a15.5 15.5 0 0 0 31 0c-5 3-10-2-15.5 0s-10.5 3-15.5 0Z" fill={p.d} />
      <path d="M50 46a13 13 0 0 1 9-4" stroke={W} strokeWidth="3" strokeLinecap="round" opacity={0.7} fill="none" />
      <rect x="38" y="84" width="8" height="4" rx="1" fill={S} />
      <rect x="74" y="84" width="8" height="4" rx="1" fill={S} />
    </>
  );
}

function BulbAndPlug({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={36} />
      <circle cx="50" cy="38" r="27" fill={p.s} />
      <circle cx="50" cy="38" r="18" fill={W} stroke={p.l} strokeWidth="2" />
      <path d="M42 40l4-6 4 6 4-6 4 6" stroke={p.b} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M46 44v8M54 44v8" stroke={p.l} strokeWidth="2" />
      <rect x="42" y="54" width="16" height="13" rx="3" fill={S} />
      <path d="M42 58h16M42 62h16" stroke={G2} strokeWidth="1.5" />
      <rect x="46" y="66" width="8" height="5" rx="2" fill={S} />
      <path d="M86 74c0 8-10 10-22 8" stroke={p.d} strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="78" y="50" width="18" height="24" rx="6" fill={p.b} />
      <rect x="90" y="52" width="6" height="20" rx="3" fill={p.d} />
      <rect x="82" y="42" width="3" height="9" rx="1" fill={S} />
      <rect x="89" y="42" width="3" height="9" rx="1" fill={S} />
      <path d="M22 18l4 4M78 16l-4 4M50 4v5" stroke={p.b} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function Tap({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={30} />
      <rect x="12" y="28" width="14" height="22" rx="4" fill={G2} />
      <rect x="24" y="33" width="54" height="13" rx="6.5" fill={p.b} />
      <rect x="28" y="35" width="34" height="3" rx="1.5" fill={W} opacity={0.45} />
      <path d="M66 33h10a12 12 0 0 1 12 12v12H76V45h-10Z" fill={p.d} />
      <rect x="44" y="22" width="9" height="13" rx="2" fill={p.n} />
      <rect x="34" y="16" width="29" height="7" rx="3.5" fill={p.n} />
      <path d="M82 62c0 0-7 9-7 13a7 7 0 0 0 14 0c0-4-7-13-7-13Z" fill={p.b} />
      <path d="M79 74a3 3 0 0 0 3 3" stroke={W} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M68 86h28" stroke={p.l} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function HammerPlank({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={46} cy={88} />
      <rect x="12" y="62" width="96" height="18" rx="4" fill={p.s} />
      <rect x="12" y="74" width="96" height="6" rx="3" fill={p.l} />
      <path d="M20 68h22M48 70h30M84 67h18" stroke={p.l} strokeWidth="2" strokeLinecap="round" />
      <rect x="82" y="46" width="3.5" height="17" rx="1" fill={S} />
      <rect x="78" y="44" width="12" height="4" rx="1.5" fill={S} />
      <g transform="rotate(-28 50 40)">
        <rect x="45" y="26" width="10" height="50" rx="5" fill={p.b} />
        <rect x="45" y="56" width="10" height="20" rx="5" fill={p.n} />
        <rect x="28" y="16" width="44" height="14" rx="3" fill={S} />
        <rect x="28" y="16" width="44" height="4" rx="2" fill={G2} opacity={0.6} />
        <path d="M72 18c6 0 9 4 9 9" stroke={S} strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
    </>
  );
}

function RollerTray({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={40} />
      <path d="M16 70h60l12 14H28Z" fill={G1} />
      <path d="M24 72h46l7 8H31Z" fill={p.b} />
      <rect x="40" y="14" width="56" height="20" rx="10" fill={p.b} />
      <ellipse cx="96" cy="24" rx="4.5" ry="10" fill={p.d} />
      <path d="M50 18v12M60 18v12M70 18v12M80 18v12" stroke={p.l} strokeWidth="2" strokeLinecap="round" opacity={0.8} />
      <path d="M100 24h4v14H70v18" stroke={S} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="65" y="54" width="10" height="24" rx="5" fill={p.n} />
    </>
  );
}

function SprayAndBug({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={40} />
      <rect x="28" y="34" width="28" height="50" rx="7" fill={p.b} />
      <rect x="47" y="37" width="9" height="44" rx="4.5" fill={p.d} />
      <rect x="32" y="50" width="14" height="20" rx="3" fill={W} />
      <path d="M35 56h8M35 61h6" stroke={p.l} strokeWidth="2" strokeLinecap="round" />
      <rect x="32" y="22" width="20" height="13" rx="4" fill={p.n} />
      <rect x="50" y="24" width="10" height="6" rx="1.5" fill={S} />
      <circle cx="66" cy="25" r="2" fill={p.l} />
      <circle cx="72" cy="21" r="1.6" fill={p.l} />
      <circle cx="73" cy="29" r="1.8" fill={p.l} />
      <circle cx="79" cy="25" r="1.4" fill={p.l} />
      <g transform="translate(88 64) rotate(-18)">
        <path d="M-12-6l-6-5M-12 6l-6 5M0-9l-2-7M0 9l-2 7M12-6l5-5M12 6l5 5" stroke={S} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="0" cy="0" rx="14" ry="10" fill={S} />
        <path d="M0-10V10" stroke={G2} strokeWidth="1.5" />
        <circle cx="16" cy="0" r="6" fill={S} />
      </g>
    </>
  );
}

function WrenchDriver({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={34} />
      <g transform="rotate(40 60 48)">
        <rect x="55" y="10" width="10" height="44" rx="2" fill={G2} />
        <rect x="52" y="50" width="16" height="32" rx="7" fill={p.b} />
        <rect x="62" y="52" width="6" height="28" rx="3" fill={p.d} />
      </g>
      <g transform="rotate(-40 60 48)">
        <rect x="55" y="26" width="10" height="56" rx="5" fill={S} />
        <path d="M48 12a12 12 0 0 0 24 0h-7v8h-10v-8Z" fill={S} />
      </g>
    </>
  );
}

function Shirt({ p }: { p: Pal }) {
  return (
    <>
      <Shadow rx={34} />
      <path d="M44 14 26 22 14 40l14 8 6-8v42h52V40l6 8 14-8-12-18-18-8c-2 6-8 10-16 10s-14-4-16-10Z" fill={p.b} />
      <path d="M86 40v42H74V36Z" fill={p.d} />
      <path d="M44 14c2 6 8 10 16 10s14-4 16-10" stroke={W} strokeWidth="3" fill="none" />
    </>
  );
}

const CATEGORY_ART: Record<string, [(props: { p: Pal }) => JSX.Element, Pal]> = {
  sparkles: [HairDryer, PAL.rose],
  scissors: [Scissors, PAL.violet],
  'spray-can': [SprayBottle, PAL.teal],
  'air-vent': [AirConditioner, PAL.sky],
  'washing-machine': [WashingMachine, PAL.indigo],
  zap: [BulbAndPlug, PAL.amber],
  droplets: [Tap, PAL.cyan],
  hammer: [HammerPlank, PAL.orange],
  'paint-roller': [RollerTray, PAL.green],
  bug: [SprayAndBug, PAL.red],
  wrench: [WrenchDriver, PAL.slate],
  shirt: [Shirt, PAL.indigo],
};

/** Illustration for a category, chosen by its icon key (admins pick the key). */
export function CategoryArt({ icon, className }: { icon?: string | null; className?: string }) {
  const [Piece, p] = (icon && CATEGORY_ART[icon]) || [WrenchDriver, PAL.slate];
  return (
    <Art className={className}>
      <Piece p={p} />
    </Art>
  );
}

/* ---------------- Banner illustrations (viewBox 0 0 240 180) ----------------
 * They sit on the banner's own background colour, chosen by the team in the admin panel.
 * Note: an element with a CSS animation must not also carry an SVG `transform` attribute
 * (the animation's transform replaces it), so moving pieces are wrapped in a positioned <g>.
 */

export function BathroomBanner({ className }: { className?: string }) {
  const p = PAL.indigo;
  return (
    <Art className={className} viewBox="0 0 240 180">
      <g className="float-slow">
        <ellipse cx="128" cy="168" rx="58" ry="7" fill="#000" opacity={0.1} />
        <rect x="92" y="70" width="70" height="96" rx="18" fill={p.b} />
        <rect x="138" y="74" width="24" height="88" rx="12" fill={p.d} />
        <rect x="102" y="102" width="36" height="38" rx="7" fill={W} />
        <rect x="108" y="112" width="24" height="4" rx="2" fill={p.l} />
        <rect x="108" y="121" width="16" height="4" rx="2" fill={p.l} />
        <rect x="110" y="52" width="32" height="20" rx="4" fill={p.d} />
        <rect x="96" y="28" width="66" height="26" rx="10" fill={p.n} />
        <rect x="160" y="32" width="18" height="13" rx="3" fill={S} />
        <path d="M120 54c-2 12-8 18-14 22" stroke={p.n} strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
      <g fill={W} stroke="#000" strokeOpacity={0.08} strokeWidth="1.5">
        <circle className="bubble" cx="70" cy="146" r="14" />
        <circle className="bubble" style={{ animationDelay: '-1.6s' }} cx="66" cy="112" r="9" />
        <circle className="bubble" style={{ animationDelay: '-3.1s' }} cx="80" cy="92" r="6" />
        <circle className="bubble" style={{ animationDelay: '-2.2s' }} cx="204" cy="120" r="10" />
      </g>
      <circle cx="196" cy="36" r="3.5" fill={W} />
      <circle cx="210" cy="28" r="2.5" fill={W} />
      <circle cx="212" cy="44" r="3" fill={W} />
      <path d="M214 66l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill={PAL.amber.b} />
    </Art>
  );
}

export function AcBanner({ className }: { className?: string }) {
  const p = PAL.sky;
  return (
    <Art className={className} viewBox="0 0 240 180">
      <g className="float-slow">
        <ellipse cx="124" cy="166" rx="86" ry="7" fill="#000" opacity={0.1} />
        <rect x="30" y="44" width="190" height="70" rx="18" fill={W} />
        <rect x="30" y="94" width="190" height="20" rx="10" fill={G1} />
        <rect x="46" y="101" width="158" height="5" rx="2.5" fill={G2} />
        <rect x="176" y="58" width="30" height="15" rx="4" fill={p.n} />
        <rect x="181" y="62" width="14" height="6" rx="2" fill={p.l} />
        <circle cx="48" cy="60" r="4" fill={PAL.green.b} />
      </g>
      <path className="float-fast" d="M56 128c10 8 0 16 10 24M96 128c10 8 0 16 10 24M136 128c10 8 0 16 10 24M176 128c10 8 0 16 10 24" stroke={p.b} strokeWidth="5" strokeLinecap="round" fill="none" />
      <g stroke={p.d} strokeWidth="3.5" strokeLinecap="round" transform="translate(104 24)">
        <path d="M0-12v24M-10-6l20 12M-10 6l20-12" />
      </g>
      <g stroke={W} strokeWidth="2.5" strokeLinecap="round" transform="translate(212 24)">
        <path d="M0-8v16M-7-4l14 8M-7 4l14-8" />
      </g>
    </Art>
  );
}

/**
 * Gift box for offer banners. On dark backgrounds it is white with a yellow ribbon,
 * on light ones violet with a white ribbon. `hole` is the banner colour (the ticket's punched holes).
 */
export function GiftBanner({ className, onDark, hole }: { className?: string; onDark?: boolean; hole: string }) {
  const box = onDark
    ? { face: W, side: '#E6E1FF', lid: '#D8CFFF', lidEdge: '#C2B3FD', ribbon: '#FFD43B', bowEdge: '#E0B000' }
    : { face: PAL.violet.b, side: PAL.violet.d, lid: '#957BFB', lidEdge: PAL.violet.d, ribbon: W, bowEdge: PAL.violet.n };
  return (
    <Art className={className} viewBox="0 0 240 180">
      <g className="float-slow">
        <ellipse cx="124" cy="166" rx="62" ry="7" fill="#000" opacity={0.18} />
        <path d="M70 80h108v76a8 8 0 0 1-8 8H78a8 8 0 0 1-8-8Z" fill={box.face} />
        <path d="M150 80h28v76a8 8 0 0 1-8 8h-20Z" fill={box.side} />
        <rect x="62" y="62" width="124" height="26" rx="6" fill={box.lid} />
        <rect x="62" y="82" width="124" height="6" rx="3" fill={box.lidEdge} />
        <rect x="114" y="62" width="20" height="102" fill={box.ribbon} />
        <path d="M124 62c-14-24-40-22-36-6 3 11 22 8 36 6Zm0 0c14-24 40-22 36-6-3 11-22 8-36 6Z" fill={box.ribbon} stroke={box.bowEdge} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="124" cy="61" r="6" fill={box.ribbon} stroke={box.bowEdge} strokeWidth="2.5" />
      </g>
      <g transform="translate(184 34) rotate(12)">
        <g className="float-fast">
          <rect x="-26" y="-14" width="52" height="28" rx="6" fill={W} />
          <circle cx="-26" cy="0" r="5" fill={hole} />
          <circle cx="26" cy="0" r="5" fill={hole} />
          <path d="M-14-8v16" stroke={G2} strokeWidth="1.5" strokeDasharray="2 2" />
          <text x="5" y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill={PAL.violet.d}>%</text>
        </g>
      </g>
      <path d="M218 92l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill={onDark ? '#FFD43B' : W} />
      <circle cx="66" cy="44" r="4" fill={onDark ? W : PAL.violet.l} opacity={0.8} />
      <circle cx="200" cy="150" r="3" fill={onDark ? W : PAL.violet.l} opacity={0.8} />
    </Art>
  );
}
