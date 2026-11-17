import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { CategoryTile, ServiceTile } from '../components/catalog';
import { Skeleton } from '../components/ui';
import { useCity } from '../context/city';
import { api } from '../lib/api';
import { useDebounced, useDocumentTitle } from '../lib/hooks';

export default function Explore() {
  useDocumentTitle('Explore services');
  const { citySlug, city } = useCity();
  const [text, setText] = useState('');
  const term = useDebounced(text.trim(), 250);
  const cats = useQuery({ queryKey: ['categories', citySlug], queryFn: () => api.categories(citySlug), enabled: !!citySlug, staleTime: 60_000 });
  const results = useQuery({ queryKey: ['search', term, citySlug], queryFn: () => api.search(term, citySlug), enabled: term.length >= 2, staleTime: 60_000 });

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-mute">Explore · {city?.name ?? '…'}</p>
      <h1 className="display mt-3 text-[48px] font-extrabold md:text-[80px]">
        Everything <span className="mark">we do.</span>
      </h1>
      <div className="relative mt-8 max-w-2xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2" aria-hidden />
        <label htmlFor="explore-search" className="sr-only">
          Search services
        </label>
        <input
          id="explore-search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search for a service"
          className="h-14 w-full rounded-full border-[1.5px] border-ink bg-white pl-14 pr-5 text-[16px] font-medium shadow-block outline-none focus:shadow-block-md"
        />
      </div>

      {term.length >= 2 ? (
        <section className="mt-10" aria-live="polite">
          <h2 className="display text-3xl font-bold">Results for “{term}”</h2>
          {results.isLoading ? (
            <div className="mt-5 flex gap-3">
              <Skeleton className="h-[214px] w-[260px]" />
              <Skeleton className="h-[214px] w-[260px]" />
            </div>
          ) : results.data?.services.length ? (
            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 [&>article]:w-auto">
              {results.data.services.map((s) => (
                <ServiceTile key={s.id} service={s} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-mute">No services match that yet. Try “cleaning”, “repair” or “salon”.</p>
          )}
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="all-cats">
        <h2 id="all-cats" className="display text-3xl font-bold md:text-4xl">
          All categories
        </h2>
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-5 lg:gap-x-5">
          {cats.isLoading || !cats.data
            ? Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />)
            : cats.data.categories.map((c) => <CategoryTile key={c.slug} category={c} />)}
        </div>
      </section>
    </div>
  );
}
