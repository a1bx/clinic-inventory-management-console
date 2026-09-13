import React from 'react';
import { cn } from '../utils/cn';
import { stockPercent, stockStatus } from '../utils/stock';
import type { InventoryItem } from '../types/inventory';

const fills = {
  out: 'bar-out',
  low: 'bar-low',
  ok: 'bar-ok',
} as const;

export function StockLevelBar({ item, className }: { item: InventoryItem; className?: string }) {
  const status = stockStatus(item);
  const percent = stockPercent(item);

  return (
    <div className={cn('space-y-1', className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${item.onHand} of a target ${item.targetLevel} ${item.unit}`}
      >
        <div
          className={cn('h-full rounded-full transition-all', fills[status])}
          style={{ width: `${Math.max(percent, status === 'out' ? 0 : 3)}%` }}
        />
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        reorder at {item.reorderPoint} · target {item.targetLevel}
      </p>
    </div>
  );
}
