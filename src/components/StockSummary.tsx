import React from 'react';
import { AlertTriangle, CloudOff, PackageX, Boxes } from 'lucide-react';
import { cn } from '../utils/cn';
import { stockStatus } from '../utils/stock';
import type { InventoryItem, StatusFilter } from '../types/inventory';

interface StockSummaryProps {
  items: InventoryItem[];
  status: StatusFilter;
  pendingCount: number;
  onStatusChange: (status: StatusFilter) => void;
}

export function StockSummary({ items, status, pendingCount, onStatusChange }: StockSummaryProps) {
  const out = items.filter((i) => stockStatus(i) === 'out').length;
  const low = items.filter((i) => stockStatus(i) === 'low').length;

  const tiles: {
    key: StatusFilter | 'sync';
    label: string;
    value: number;
    hint: string;
    icon: React.ReactNode;
    tone?: 'out' | 'low' | 'sync';
  }[] = [
    {
      key: 'all',
      label: 'Tracked supplies',
      value: items.length,
      hint: 'in this clinic',
      icon: <Boxes className="size-4" />,
    },
    {
      key: 'out',
      label: 'Out of stock',
      value: out,
      hint: 'order today',
      icon: <PackageX className="size-4" />,
      tone: 'out',
    },
    {
      key: 'low',
      label: 'Low stock',
      value: low,
      hint: 'at or below reorder point',
      icon: <AlertTriangle className="size-4" />,
      tone: 'low',
    },
    {
      key: 'sync',
      label: 'Waiting to sync',
      value: pendingCount,
      hint: pendingCount > 0 ? 'saved on this device' : 'everything is up to date',
      icon: <CloudOff className="size-4" />,
      tone: 'sync',
    },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => {
        const selectable = tile.key !== 'sync';
        const active = selectable && status === tile.key;
        const Wrapper = selectable ? 'button' : 'div';
        return (
          <li key={tile.key}>
            <Wrapper
              {...(selectable
                ? {
                    type: 'button' as const,
                    onClick: () => onStatusChange(tile.key as StatusFilter),
                    'aria-pressed': active,
                  }
                : {})}
              className={cn(
                'surface flex w-full flex-col gap-2 rounded-2xl p-4 text-left transition-colors',
                selectable &&
                  'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active && 'ring-2 ring-primary',
              )}
            >
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-lg',
                    tile.tone === 'out' && 'status-out',
                    tile.tone === 'low' && 'status-low',
                    tile.tone === 'sync' &&
                      (pendingCount > 0 ? 'status-low' : 'bg-muted text-muted-foreground'),
                    !tile.tone && 'bg-muted text-muted-foreground',
                  )}
                >
                  {tile.icon}
                </span>
                {tile.label}
              </span>
              <span className="tabular text-3xl font-semibold leading-none">{tile.value}</span>
              <span className="text-xs text-muted-foreground">{tile.hint}</span>
            </Wrapper>
          </li>
        );
      })}
    </ul>
  );
}
