import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  PackageSearch,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { FilterBar } from '../components/FilterBar';
import { StockSummary } from '../components/StockSummary';
import { InventoryTable } from '../components/InventoryTable';
import { InventoryCards } from '../components/InventoryCards';
import { AdjustStockDialog } from '../components/AdjustStockDialog';
import { AddStockDialog } from '../components/AddStockDialog';
import { useInventory } from '../contexts/InventoryContext';
import { useInventoryFilters } from '../hooks/useInventoryFilters';
import { filterAndSortItems } from '../utils/stock';
import { clinics } from '../data/inventory';
import type { InventoryItem, SortKey } from '../types/inventory';

interface InventoryListProps {
  defaultSort?: SortKey;
}

export function InventoryList({ defaultSort = 'name' }: InventoryListProps) {
  const { items, searchItems, loading, error, reload, pendingCount, hasPendingSync, clinicId } =
    useInventory();
  const { filters, update, toggleCategory, clearAll, isFiltered, search } =
    useInventoryFilters(defaultSort);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [searchResults, setSearchResults] = useState<InventoryItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRetry, setSearchRetry] = useState(0);
  const [addStockOpen, setAddStockOpen] = useState(false);

  useEffect(() => {
    const query = filters.query.trim();
    if (!query) {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    setSearchResults(null);
    setSearchLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchLoading(true);
      setSearchError(null);
      void searchItems(query, controller.signal)
        .then(setSearchResults)
        .catch((err: unknown) => {
          if (!controller.signal.aborted)
            setSearchError(err instanceof Error ? err.message : 'Search failed.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [filters.query, searchItems, searchRetry]);

  const results = useMemo(() => {
    const filtered = filterAndSortItems(searchResults ?? items, filters);
    return filters.pending ? filtered.filter((item) => hasPendingSync(item.id)) : filtered;
  }, [hasPendingSync, items, searchResults, filters]);
  const pageSize = 7;
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.min(filters.page, pageCount);
  const visibleResults = results.slice((page - 1) * pageSize, page * pageSize);
  const clinic = clinics.find((c) => c.id === clinicId);
  const linkSearch = search ? `?${search}` : '';

  const shareView = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Inventory view link copied');
    } catch {
      toast.error('Could not copy the inventory link');
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Item', 'SKU', 'Category', 'Location', 'On hand', 'Unit', 'Status'],
      ...results.map((item) => [
        item.name,
        item.sku,
        item.category,
        item.location,
        String(item.onHand),
        item.unit,
        item.onHand <= 0
          ? 'Out of stock'
          : item.onHand <= item.reorderPoint
            ? 'Low stock'
            : 'In stock',
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'clinic-stock.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Stock list exported');
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-8 lg:py-10">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"></div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Clinic stock on hand
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            A calm, current view of the supplies your care teams rely on. Search, monitor and
            correct physical counts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-slate-300 bg-white"
            onClick={exportCsv}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button size="sm" className="h-10 rounded-xl" onClick={() => setAddStockOpen(true)}>
            <Plus className="size-4" />
            Add stock item
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <StockSummary
          items={items}
          status={filters.status}
          pendingCount={pendingCount}
          pending={filters.pending}
          onStatusChange={(status) => update({ status, pending: false })}
          onPendingChange={(pending) => update({ pending })}
        />

        <FilterBar
          filters={filters}
          resultCount={results.length}
          isFiltered={isFiltered}
          onUpdate={update}
          onToggleCategory={toggleCategory}
          onClearAll={clearAll}
        />

        {loading || searchLoading ? (
          <LoadingState />
        ) : error || searchError ? (
          <ErrorState
            message={error ?? searchError ?? 'Search failed.'}
            onRetry={error ? reload : () => setSearchRetry((value) => value + 1)}
          />
        ) : results.length === 0 ? (
          <EmptyState isFiltered={isFiltered} onClearAll={clearAll} />
        ) : (
          <>
            <InventoryTable
              items={visibleResults}
              linkSearch={linkSearch}
              onCorrect={setAdjusting}
            />

            <InventoryCards
              items={visibleResults}
              linkSearch={linkSearch}
              onCorrect={setAdjusting}
            />
          </>
        )}
        <Pagination
          page={page}
          pageCount={pageCount}
          resultCount={results.length}
          pageSize={pageSize}
          onPageChange={(next) => update({ page: next })}
        />
      </div>

      <AdjustStockDialog
        item={adjusting}
        open={adjusting !== null}
        onOpenChange={(open) => {
          if (!open) setAdjusting(null);
        }}
      />
      <AddStockDialog open={addStockOpen} onOpenChange={setAddStockOpen} />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="surface rounded-2xl px-6 py-14 text-center">
      <p className="font-medium">We couldn’t load stock</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  resultCount,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  resultCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav
      className="surface flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
      aria-label="Stock pages"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="size-4" />
        Previous
      </Button>
      <span className="text-center text-sm text-muted-foreground" aria-live="polite">
        <span className="block">
          Page {page} of {pageCount}
        </span>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

function LoadingState() {
  return (
    <div
      className="surface divide-y divide-[color:var(--hairline)] overflow-hidden rounded-2xl"
      aria-busy="true"
      aria-label="Loading stock"
    >
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="hidden h-8 w-32 sm:block" />
          <Skeleton className="hidden h-8 w-28 lg:block" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isFiltered, onClearAll }: { isFiltered: boolean; onClearAll: () => void }) {
  return (
    <div className="surface rounded-2xl px-6 py-16 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <PackageSearch className="size-5" />
      </span>
      <p className="mt-3 font-medium">No items match</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {isFiltered
          ? 'Try a different search term, or widen the category and stock-level filters.'
          : 'This clinic has no tracked stock yet.'}
      </p>
      {isFiltered && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearAll}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
