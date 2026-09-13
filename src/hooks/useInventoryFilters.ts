import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortKey, StatusFilter } from '../types/inventory';
import { sortLabels } from '../utils/stock';

export interface InventoryFilters {
  query: string;
  categories: string[];
  status: StatusFilter;
  sort: SortKey;
  page: number;
}

const statuses: StatusFilter[] = ['all', 'out', 'low', 'ok'];

export function useInventoryFilters(defaultSort: SortKey = 'name') {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<InventoryFilters>(() => {
    const rawSort = params.get('sort') as SortKey | null;
    const rawStatus = params.get('status') as StatusFilter | null;
    return {
      query: params.get('q') ?? '',
      categories: params.get('cat')?.split(',').filter(Boolean) ?? [],
      status: rawStatus && statuses.includes(rawStatus) ? rawStatus : 'all',
      sort: rawSort && rawSort in sortLabels ? rawSort : defaultSort,
      page: Math.max(1, Number(params.get('page') ?? '1') || 1)
    };
  }, [params, defaultSort]);

  const update = useCallback(
    (next: Partial<InventoryFilters>) => {
      const merged = { ...filters, ...next, page: next.page ?? (Object.keys(next).some((key) => key !== 'page') ? 1 : filters.page) };
      const draft = new URLSearchParams();
      if (merged.query) draft.set('q', merged.query);
      if (merged.categories.length) draft.set('cat', merged.categories.join(','));
      if (merged.status !== 'all') draft.set('status', merged.status);
      if (merged.sort !== defaultSort) draft.set('sort', merged.sort);
      if (merged.page > 1) draft.set('page', String(merged.page));
      setParams(draft, { replace: true });
    },
    [filters, setParams, defaultSort]
  );

  const toggleCategory = useCallback(
    (category: string) => {
      const next = filters.categories.includes(category) ?
      filters.categories.filter((c) => c !== category) :
      [...filters.categories, category];
      update({ categories: next });
    },
    [filters.categories, update]
  );

  const clearAll = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  const isFiltered =
  Boolean(filters.query) || filters.categories.length > 0 || filters.status !== 'all';

  return { filters, update, toggleCategory, clearAll, isFiltered, search: params.toString() };
}
