import { useEffect, useState } from 'react';
import type { Platform, ProblemCatalogItem } from '../types/problem';
import { searchProblems } from '../services/problemSearchService';
import { useDebouncedValue } from './useDebouncedValue';

export function useProblemSearch(platform: Platform, query: string) {
  const q = useDebouncedValue(query.trim(), 250);
  const [items, setItems] = useState<ProblemCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let live = true;
    if (q.length < 2) {
      setItems([]);
      setError(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    searchProblems(platform, q)
      .then(r => {
        if (live) setItems(r.items);
      })
      .catch(() => {
        if (live) setError('Problem search is temporarily unavailable. Manual entry still works.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [platform, q]);

  return { items, loading, error, hasQuery: q.length >= 2 };
}
