import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { FilterBar } from '../components/FilterBar';
import { StockSummary } from '../components/StockSummary';
import { InventoryTable } from '../components/InventoryTable';
import { InventoryCards } from '../components/InventoryCards';
import { AdjustStockDialog } from '../components/AdjustStockDialog';
import { useInventory } from '../contexts/InventoryContext';
import { useInventoryFilters } from '../hooks/useInventoryFilters';
import { filterAndSortItems } from '../utils/stock';
import { clinics } from '../data/inventory';
import type { InventoryItem, SortKey } from '../types/inventory';

interface InventoryListProps {
  defaultSort?: SortKey;
}

export function InventoryList({ defaultSort = 'name' }: InventoryListProps) {
  const { items, loading, error, reload, pendingCount, clinicId } = useInventory();
  const { filters, update, toggleCategory, clearAll, isFiltered, search } =
  useInventoryFilters(defaultSort);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  const results = useMemo(() => filterAndSortItems(items, filters), [items, filters]);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.min(filters.page, pageCount);
  const visibleResults = results.slice((page - 1) * pageSize, page * pageSize);
  const clinic = clinics.find((c) => c.id === clinicId);
  const linkSearch = search ? `?${search}` : '';

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {clinic?.shortName ?? 'Clinic'}
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold">Stock on hand</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Search, check and correct what the clinic physically holds. Any filtered view or
          item can be shared by copying the link.
        </p>
      </header>

      <div className="space-y-4">
        <StockSummary
          items={items}
          status={filters.status}
          pendingCount={pendingCount}
          onStatusChange={(status) => update({ status })} />
        

        <FilterBar
          filters={filters}
          resultCount={results.length}
          isFiltered={isFiltered}
          onUpdate={update}
          onToggleCategory={toggleCategory}
          onClearAll={clearAll} />
        

        {loading ?
        <LoadingState /> :
        error ?
        <ErrorState message={error} onRetry={reload} /> :
        results.length === 0 ?
        <EmptyState isFiltered={isFiltered} onClearAll={clearAll} /> :

        <>
            <InventoryTable
            items={visibleResults}
            linkSearch={linkSearch}
            onCorrect={setAdjusting} />
          
            <InventoryCards
            items={visibleResults}
            linkSearch={linkSearch}
            onCorrect={setAdjusting} />
          
          </>
        }
        <Pagination page={page} pageCount={pageCount} onPageChange={(next) => update({ page: next })} />
      </div>

      <AdjustStockDialog
        item={adjusting}
        open={adjusting !== null}
        onOpenChange={(open) => {
          if (!open) setAdjusting(null);
        }} />
      
    </div>);

}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="surface rounded-2xl px-6 py-14 text-center"><p className="font-medium">We couldn’t load stock</p><p className="mt-1 text-sm text-muted-foreground">{message}</p><Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button></div>;
}

function Pagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return <nav className="flex items-center justify-between gap-3 py-4" aria-label="Stock pages"><Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}><ChevronLeft className="size-4" />Previous</Button><span className="text-sm text-muted-foreground" aria-live="polite">Page {page} of {pageCount}</span><Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>Next<ChevronRight className="size-4" /></Button></nav>;
}

function LoadingState() {
  return (
    <div
      className="surface divide-y divide-[color:var(--hairline)] overflow-hidden rounded-2xl"
      aria-busy="true"
      aria-label="Loading stock">
      
      {Array.from({ length: 7 }).map((_, index) =>
      <div key={index} className="flex items-center gap-4 p-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="hidden h-8 w-32 sm:block" />
          <Skeleton className="hidden h-8 w-28 lg:block" />
        </div>
      )}
    </div>);

}

function EmptyState({
  isFiltered,
  onClearAll



}: {isFiltered: boolean;onClearAll: () => void;}) {
  return (
    <div className="surface rounded-2xl px-6 py-16 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <PackageSearch className="size-5" />
      </span>
      <p className="mt-3 font-medium">No items match</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {isFiltered ?
        'Try a different search term, or widen the category and stock-level filters.' :
        'This clinic has no tracked stock yet.'}
      </p>
      {isFiltered &&
      <Button variant="outline" size="sm" className="mt-4" onClick={onClearAll}>
          Clear filters
        </Button>
      }
    </div>);

}
