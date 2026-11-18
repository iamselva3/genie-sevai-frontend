/*
 * Hand-built "soft 3D" illustrations for categories and banners.
 * Solid tones only (light face, darker side, deep shadow) - no gradients, no bitmaps.
 */
import type { ReactNode } from 'react';

const B = '#2563EB'; // brand face
const BD = '#1D4ED8'; // side
const BN = '#1E3A8A'; // deep
const BL = '#93C5FD'; // light
const BS = '#DBEAFE'; // soft
const W = '#FFFFFF';
const G1 = '#E5E7EB';
const G2 = '#CBD5E1';
const S = '#334155';

function Art({ children, className, viewBox = '0 0 120 96' }: { children: ReactNode; className?: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} className={className} aria-hidden focusable="false">
      {children}
    </svg>
  );
}

const Shadow = ({ cx = 60, cy = 88, rx = 32 }: { cx?: number; cy?: number; rx?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={4.5} fill="#0F172A" opacity={0.09} />
);

/* ---------------- Category illustrations ---------------- */

function HairDryer() {
  return (
    <>
      <Shadow rx={30} />
      <rect x="50" y="48" width="13" height="34" rx="6" fill={BD} transform="rotate(12 56 65)" />
      <rect x="53" y="58" width="7" height="4" rx="2" fill={BL} transform="rotate(12 56 65)" />
      <rect x="30" y="28" width="52" height="28" rx="14" fill={B} />
      <rect x="40" y="32" width="30" height="4" rx="2" fill={W} opacity={0.45} />
      <rect x="78" y="33" width="16" height="18" rx="4" fill={BN} />
      <circle cx="32" cy="42" r="15" fill={BD} />
      <circle cx="32" cy="42" r="9" fill={BN} />
      <path d="M27 42h10M32 37v10" stroke={BL} strokeWidth="2" strokeLinecap="round" />
      <path d="M99 36h10M101 42h12M99 48h10" stroke={BL} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function Scissors() {
  return (
    <>
      <Shadow rx={34} />
      <rect x="18" y="66" width="84" height="10" rx="4" fill={BL} />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={22 + i * 6} y="74" width="3" height="9" rx="1.5" fill={BL} />
      ))}
      <rect x="18" y="66" width="84" height="4" rx="2" fill={BS} />
      <path d="M58 40 102 22 104 26 61 45Z" fill={G1} stroke={S} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M58 44 102 60 104 56 61 39Z" fill={W} stroke={S} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M40 34 58 42M40 50 58 42" stroke={BD} strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="30" r="9" fill="none" stroke={B} strokeWidth="6" />
      <circle cx="32" cy="54" r="9" fill="none" stroke={B} strokeWidth="6" />
      <circle cx="59" cy="42" r="3.5" fill={S} />
    </>
  );
}

function SprayBottle() {
  return (
    <>
      <Shadow rx={30} />
      <circle cx="28" cy="70" r="7" fill={W} stroke={BL} strokeWidth="2" />
      <circle cx="20" cy="56" r="4.5" fill={W} stroke={BL} strokeWidth="2" />
      <circle cx="33" cy="50" r="3" fill={W} stroke={BL} strokeWidth="2" />
      <rect x="44" y="40" width="34" height="46" rx="9" fill={B} />
      <rect x="66" y="42" width="12" height="42" rx="6" fill={BD} />
      <rect x="49" y="56" width="18" height="18" rx="4" fill={W} />
      <rect x="52" y="61" width="12" height="2.5" rx="1.2" fill={BL} />
      <rect x="52" y="66" width="8" height="2.5" rx="1.2" fill={BL} />
      <rect x="53" y="32" width="16" height="10" rx="2" fill={BD} />
      <rect x="46" y="20" width="32" height="13" rx="5" fill={BN} />
      <rect x="77" y="22" width="9" height="7" rx="2" fill={S} />
      <path d="M58 33c-1 6-4 9-7 11" stroke={BN} strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="93" cy="22" r="2.2" fill={BL} />
      <circle cx="99" cy="18" r="1.8" fill={BL} />
      <circle cx="100" cy="27" r="2" fill={BL} />
      <circle cx="106" cy="23" r="1.6" fill={BL} />
    </>
  );
}

function AirConditioner() {
  return (
    <>
      <Shadow rx={44} cy={86} />
      <rect x="12" y="22" width="96" height="38" rx="10" fill={W} stroke={G2} strokeWidth="1.5" />
      <rect x="12" y="50" width="96" height="10" rx="5" fill={G1} />
      <rect x="20" y="53" width="80" height="2.5" rx="1.2" fill={G2} />
      <rect x="84" y="29" width="16" height="8" rx="2.5" fill={BN} />
      <rect x="87" y="31.5" width="7" height="3" rx="1" fill={BL} />
      <circle cx="22" cy="31" r="2" fill={B} />
      <path d="M28 68c6 4 0 9 6 13M50 68c6 4 0 9 6 13M72 68c6 4 0 9 6 13M94 68c6 4 0 9 6 13" stroke={BL} strokeWidth="3" strokeLinecap="round" fill="none" />
      <g stroke={B} strokeWidth="2" strokeLinecap="round" transform="translate(104 12)">
        <path d="M0-7v14M-6-3.5l12 7M-6 3.5l12-7" />
      </g>
    </>
  );
}

function WashingMachine() {
  return (
    <>
      <Shadow rx={30} />
      <rect x="32" y="14" width="56" height="72" rx="9" fill={W} stroke={G2} strokeWidth="1.5" />
      <rect x="36" y="18" width="48" height="12" rx="4" fill={G1} />
      <rect x="40" y="22" width="14" height="4" rx="2" fill={BL} />
      <circle cx="77" cy="24" r="3.5" fill={B} />
      <circle cx="60" cy="56" r="21" fill={G2} />
      <circle cx="60" cy="56" r="16" fill={B} />
      <path d="M44.5 58a15.5 15.5 0 0 0 31 0c-5 3-10-2-15.5 0s-10.5 3-15.5 0Z" fill={BD} />
      <path d="M50 46a13 13 0 0 1 9-4" stroke={W} strokeWidth="3" strokeLinecap="round" opacity={0.7} fill="none" />
      <rect x="38" y="84" width="8" height="4" rx="1" fill={S} />
      <rect x="74" y="84" width="8" height="4" rx="1" fill={S} />
    </>
  );
}

function BulbAndPlug() {
  return (
    <>
      <Shadow rx={36} />
      <circle cx="50" cy="38" r="27" fill={BS} />
      <circle cx="50" cy="38" r="18" fill={W} stroke={BL} strokeWidth="2" />
      <path d="M42 40l4-6 4 6 4-6 4 6" stroke={B} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M46 44v8M54 44v8" stroke={BL} strokeWidth="2" />
      <rect x="42" y="54" width="16" height="13" rx="3" fill={S} />
      <path d="M42 58h16M42 62h16" stroke={G2} strokeWidth="1.5" />
      <rect x="46" y="66" width="8" height="5" rx="2" fill={S} />
      <path d="M86 74c0 8-10 10-22 8" stroke={BD} strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="78" y="50" width="18" height="24" rx="6" fill={B} />
      <rect x="90" y="52" width="6" height="20" rx="3" fill={BD} />
      <rect x="82" y="42" width="3" height="9" rx="1" fill={S} />
      <rect x="89" y="42" width="3" height="9" rx="1" fill={S} />
      <path d="M22 18l4 4M78 16l-4 4M50 4v5" stroke={B} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function Tap() {
  return (
    <>
      <Shadow rx={30} />
      <rect x="12" y="28" width="14" height="22" rx="4" fill={G2} />
      <rect x="24" y="33" width="54" height="13" rx="6.5" fill={B} />
      <rect x="28" y="35" width="34" height="3" rx="1.5" fill={W} opacity={0.45} />
      <path d="M66 33h10a12 12 0 0 1 12 12v12H76V45h-10Z" fill={BD} />
      <rect x="44" y="22" width="9" height="13" rx="2" fill={BN} />
      <rect x="34" y="16" width="29" height="7" rx="3.5" fill={BN} />
      <path d="M82 62c0 0-7 9-7 13a7 7 0 0 0 14 0c0-4-7-13-7-13Z" fill={B} />
      <path d="M79 74a3 3 0 0 0 3 3" stroke={W} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M68 86h28" stroke={BL} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function HammerPlank() {
  return (
    <>
      <Shadow rx={46} cy={88} />
      <rect x="12" y="62" width="96" height="18" rx="4" fill={BS} />
      <rect x="12" y="74" width="96" height="6" rx="3" fill={BL} />
      <path d="M20 68h22M48 70h30M84 67h18" stroke={BL} strokeWidth="2" strokeLinecap="round" />
      <rect x="82" y="46" width="3.5" height="17" rx="1" fill={S} />
      <rect x="78" y="44" width="12" height="4" rx="1.5" fill={S} />
      <g transform="rotate(-28 50 40)">
        <rect x="45" y="26" width="10" height="50" rx="5" fill={B} />
        <rect x="45" y="56" width="10" height="20" rx="5" fill={BN} />
        <rect x="28" y="16" width="44" height="14" rx="3" fill={S} />
        <rect x="28" y="16" width="44" height="4" rx="2" fill={G2} opacity={0.6} />
        <path d="M72 18c6 0 9 4 9 9" stroke={S} strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
    </>
  );
}

function RollerTray() {
  return (
    <>
      <Shadow rx={40} />
      <path d="M16 70h60l12 14H28Z" fill={G1} />
      <path d="M24 72h46l7 8H31Z" fill={B} />
      <rect x="40" y="14" width="56" height="20" rx="10" fill={B} />
      <ellipse cx="96" cy="24" rx="4.5" ry="10" fill={BD} />
      <path d="M50 18v12M60 18v12M70 18v12M80 18v12" stroke={BL} strokeWidth="2" strokeLinecap="round" opacity={0.8} />
      <path d="M100 24h4v14H70v18" stroke={S} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="65" y="54" width="10" height="24" rx="5" fill={BN} />
    </>
  );
}

function SprayAndBug() {
  return (
    <>
      <Shadow rx={40} />
      <rect x="28" y="34" width="28" height="50" rx="7" fill={B} />
      <rect x="47" y="37" width="9" height="44" rx="4.5" fill={BD} />
      <rect x="32" y="50" width="14" height="20" rx="3" fill={W} />
      <path d="M35 56h8M35 61h6" stroke={BL} strokeWidth="2" strokeLinecap="round" />
      <rect x="32" y="22" width="20" height="13" rx="4" fill={BN} />
      <rect x="50" y="24" width="10" height="6" rx="1.5" fill={S} />
      <circle cx="66" cy="25" r="2" fill={BL} />
      <circle cx="72" cy="21" r="1.6" fill={BL} />
      <circle cx="73" cy="29" r="1.8" fill={BL} />
      <circle cx="79" cy="25" r="1.4" fill={BL} />
      <g transform="translate(88 64) rotate(-18)">
        <path d="M-12-6l-6-5M-12 6l-6 5M0-9l-2-7M0 9l-2 7M12-6l5-5M12 6l5 5" stroke={S} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="0" cy="0" rx="14" ry="10" fill={S} />
        <path d="M0-10V10" stroke={G2} strokeWidth="1.5" />
        <circle cx="16" cy="0" r="6" fill={S} />
      </g>
    </>
  );
}

function WrenchDriver() {
  return (
    <>
      <Shadow rx={34} />
      <g transform="rotate(40 60 48)">
        <rect x="55" y="10" width="10" height="44" rx="2" fill={G2} />
        <rect x="52" y="50" width="16" height="32" rx="7" fill={B} />
        <rect x="62" y="52" width="6" height="28" rx="3" fill={BD} />
      </g>
      <g transform="rotate(-40 60 48)">
        <rect x="55" y="26" width="10" height="56" rx="5" fill={S} />
        <path d="M48 12a12 12 0 0 0 24 0h-7v8h-10v-8Z" fill={S} />
      </g>
    </>
  );
}

function Shirt() {
  return (
    <>
      <Shadow rx={34} />
      <path d="M44 14 26 22 14 40l14 8 6-8v42h52V40l6 8 14-8-12-18-18-8c-2 6-8 10-16 10s-14-4-16-10Z" fill={B} />
      <path d="M86 40v42H74V36Z" fill={BD} />
      <path d="M44 14c2 6 8 10 16 10s14-4 16-10" stroke={W} strokeWidth="3" fill="none" />
    </>
  );
}

const CATEGORY_ART: Record<string, () => JSX.Element> = {
  sparkles: HairDryer,
  scissors: Scissors,
  'spray-can': SprayBottle,
  'air-vent': AirConditioner,
  'washing-machine': WashingMachine,
  zap: BulbAndPlug,
  droplets: Tap,
  hammer: HammerPlank,
  'paint-roller': RollerTray,
  bug: SprayAndBug,
  wrench: WrenchDriver,
  shirt: Shirt,
};

/** Illustration for a category, chosen by its icon key (admins pick the key). */
export function CategoryArt({ icon, className }: { icon?: string | null; className?: string }) {
  const Piece = (icon && CATEGORY_ART[icon]) || WrenchDriver;
  return (
    <Art className={className}>
      <Piece />
    </Art>
  );
}

/* ---------------- Banner illustrations (viewBox 0 0 240 180) ---------------- */

export function BathroomBanner({ className }: { className?: string }) {
  return (
    <Art className={className} viewBox="0 0 240 180">
      <g className="float-slow">
        <ellipse cx="128" cy="168" rx="58" ry="7" fill="#0F172A" opacity={0.12} />
        <rect x="92" y="70" width="70" height="96" rx="18" fill={B} />
        <rect x="138" y="74" width="24" height="88" rx="12" fill={BD} />
        <rect x="102" y="102" width="36" height="38" rx="7" fill={W} />
        <rect x="108" y="112" width="24" height="4" rx="2" fill={BL} />
        <rect x="108" y="121" width="16" height="4" rx="2" fill={BL} />
        <rect x="110" y="52" width="32" height="20" rx="4" fill={BD} />
        <rect x="96" y="28" width="66" height="26" rx="10" fill={BN} />
        <rect x="160" y="32" width="18" height="13" rx="3" fill={S} />
        <path d="M120 54c-2 12-8 18-14 22" stroke={BN} strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
      <circle className="bubble" cx="56" cy="140" r="14" fill={W} opacity={0.9} />
      <circle className="bubble" style={{ animationDelay: '-1.6s' }} cx="40" cy="104" r="9" fill={W} opacity={0.85} />
      <circle className="bubble" style={{ animationDelay: '-3.1s' }} cx="72" cy="88" r="6" fill={W} opacity={0.8} />
      <circle className="bubble" style={{ animationDelay: '-2.2s' }} cx="204" cy="120" r="10" fill={W} opacity={0.85} />
      <circle cx="196" cy="36" r="3.5" fill={W} />
      <circle cx="210" cy="28" r="2.5" fill={W} />
      <circle cx="212" cy="44" r="3" fill={W} />
      <path d="M30 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill={W} />
    </Art>
  );
}

export function AcBanner({ className }: { className?: string }) {
  return (
    <Art className={className} viewBox="0 0 240 180">
      <g className="float-slow">
        <ellipse cx="124" cy="166" rx="86" ry="7" fill="#0F172A" opacity={0.14} />
        <rect x="30" y="44" width="190" height="70" rx="18" fill={W} />
        <rect x="30" y="94" width="190" height="20" rx="10" fill={G1} />
        <rect x="46" y="101" width="158" height="5" rx="2.5" fill={G2} />
        <rect x="176" y="58" width="30" height="15" rx="4" fill={BN} />
        <rect x="181" y="62" width="14" height="6" rx="2" fill={BL} />
        <circle cx="48" cy="60" r="4" fill={B} />
      </g>
      <path className="float-fast" d="M56 128c10 8 0 16 10 24M96 128c10 8 0 16 10 24M136 128c10 8 0 16 10 24M176 128c10 8 0 16 10 24" stroke={W} strokeWidth="5" strokeLinecap="round" fill="none" opacity={0.85} />
      <g stroke={W} strokeWidth="3.5" strokeLinecap="round" transform="translate(40 22)">
        <path d="M0-12v24M-10-6l20 12M-10 6l20-12" />
      </g>
      <g stroke={W} strokeWidth="2.5" strokeLinecap="round" transform="translate(212 24)" opacity={0.8}>
        <path d="M0-8v16M-7-4l14 8M-7 4l14-8" />
      </g>
    </Art>
  );
}

export function GiftBanner({ className }: { className?: string }) {
  return (
    <Art className={className} viewBox="0 0 240 180">
      <g className="float-slow">
        <ellipse cx="124" cy="166" rx="62" ry="7" fill="#000" opacity={0.25} />
        <path d="M70 80h108v76a8 8 0 0 1-8 8H78a8 8 0 0 1-8-8Z" fill={B} />
        <path d="M150 80h28v76a8 8 0 0 1-8 8h-20Z" fill={BD} />
        <rect x="62" y="62" width="124" height="26" rx="6" fill={BL} />
        <rect x="114" y="62" width="20" height="102" fill={W} />
        <path d="M124 62c-14-24-40-22-36-6 3 11 22 8 36 6Zm0 0c14-24 40-22 36-6-3 11-22 8-36 6Z" fill={W} />
      </g>
      <g className="float-fast" transform="translate(178 34) rotate(12)">
        <rect x="-26" y="-14" width="52" height="28" rx="6" fill={W} />
        <circle cx="-26" cy="0" r="5" fill={BN} />
        <circle cx="26" cy="0" r="5" fill={BN} />
        <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill={B}>%</text>
      </g>
      <path d="M36 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill={BL} />
      <circle cx="58" cy="132" r="4" fill={BL} />
    </Art>
  );
}
