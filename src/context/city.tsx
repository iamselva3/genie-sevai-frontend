import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import type { City } from '../lib/types';

interface CityValue {
  cities: City[];
  city: City | null;
  /** Slug used for API calls; known even before the city list loads. */
  citySlug: string | undefined;
  setCity: (slug: string) => void;
  loading: boolean;
}

const CityContext = createContext<CityValue | null>(null);
const KEY = 'sevai:city';

export function CityProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | undefined>(() => storage.get<string | undefined>(KEY, undefined));
  const { data, isLoading } = useQuery({ queryKey: ['cities'], queryFn: api.cities, staleTime: 10 * 60_000 });
  const cities = useMemo(() => data?.cities ?? [], [data]);

  // Default to the first city, and drop a saved city that is no longer served.
  useEffect(() => {
    if (!cities.length) return;
    if (!slug || !cities.some((c) => c.slug === slug)) {
      setSlug(cities[0].slug);
      storage.set(KEY, cities[0].slug);
    }
  }, [cities, slug]);

  const value = useMemo<CityValue>(
    () => ({
      cities,
      city: cities.find((c) => c.slug === slug) ?? null,
      citySlug: slug,
      setCity: (s) => {
        setSlug(s);
        storage.set(KEY, s);
      },
      loading: isLoading,
    }),
    [cities, slug, isLoading],
  );
  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used inside CityProvider');
  return ctx;
}
