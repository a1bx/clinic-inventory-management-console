import React from 'react';
import { cn } from '../utils/cn';
import { statusLabels } from '../utils/stock';
import type { StockStatus } from '../types/inventory';

const styles: Record<StockStatus, string> = {
  out: 'status-out',
  low: 'status-low',
  ok: 'status-ok'
};

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        styles[status],
        className
      )}>
      
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {statusLabels[status]}
    </span>);

}