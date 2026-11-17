import {
  AirVent,
  Bug,
  Droplets,
  Hammer,
  PaintRoller,
  Scissors,
  Shirt,
  Sparkles,
  SprayCan,
  WashingMachine,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  scissors: Scissors,
  'spray-can': SprayCan,
  'air-vent': AirVent,
  'washing-machine': WashingMachine,
  zap: Zap,
  droplets: Droplets,
  hammer: Hammer,
  'paint-roller': PaintRoller,
  bug: Bug,
  wrench: Wrench,
  shirt: Shirt,
};

export function categoryIcon(key?: string | null): LucideIcon {
  return (key && ICONS[key]) || Wrench;
}
