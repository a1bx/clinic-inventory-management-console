import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { cn } from '../utils/cn';
import { sortLabels } from '../utils/stock';
import { useInventory } from '../contexts/InventoryContext';
import type { SortKey, StatusFilter } from '../types/inventory';
import type { InventoryFilters } from '../hooks/useInventoryFilters';

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All stock' },
  { value: 'out', label: 'Out of stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'ok', label: 'In stock' },
];

interface FilterBarProps {
  filters: InventoryFilters;
  resultCount: number;
  isFiltered: boolean;
  onUpdate: (next: Partial<InventoryFilters>) => void;
  onToggleCategory: (category: string) => void;
  onClearAll: () => void;
}

export function FilterBar({
  filters,
  resultCount,
  isFiltered,
  onUpdate,
  onToggleCategory,
  onClearAll,
}: FilterBarProps) {
  const { items } = useInventory();
  const categories = Array.from(new Set(items.map((item) => item.category))).sort();
  return (
    <section aria-label="Search and filter stock" className="surface rounded-2xl p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={filters.query}
            onChange={(e) => onUpdate({ query: e.target.value })}
            placeholder="Search by name, code, location or supplier"
            aria-label="Search stock"
            className="h-11 rounded-xl pl-9 text-base lg:text-sm"
          />
        </div>
        <div className="flex gap-3">
          <Select
            value={filters.status}
            onValueChange={(value) => onUpdate({ status: value as StatusFilter })}
          >
            <SelectTrigger
              aria-label="Filter by stock level"
              className="h-11 min-w-[9.5rem] flex-1 rounded-xl text-base lg:flex-none lg:text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.sort}
            onValueChange={(value) => onUpdate({ sort: value as SortKey })}
          >
            <SelectTrigger
              aria-label="Sort stock"
              className="h-11 min-w-[11.5rem] flex-1 rounded-xl text-base lg:flex-none lg:text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {sortLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t hairline pt-3">
        <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 py-0.5">
          {categories.map((category) => {
            const active = filters.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => onToggleCategory(category)}
                aria-pressed={active}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hairline bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="hidden shrink-0 items-center gap-2 border-l hairline pl-3 text-sm text-muted-foreground sm:flex">
          <span className="tabular" aria-live="polite">
            {resultCount} {resultCount === 1 ? 'item' : 'items'}
          </span>
          {isFiltered && (
            <Button variant="ghost" size="xs" onClick={onClearAll}>
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground sm:hidden">
        <span className="tabular" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'item' : 'items'}
        </span>
        {isFiltered && (
          <Button variant="ghost" size="xs" onClick={onClearAll}>
            <X className="size-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </section>
  );
}
