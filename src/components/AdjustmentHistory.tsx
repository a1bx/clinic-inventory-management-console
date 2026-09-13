import React from 'react';
import { History } from 'lucide-react';
import { cn } from '../utils/cn';
import { fullTime, reasonLabels, relativeTime } from '../utils/stock';
import { PendingSyncTag } from './SyncStatus';
import { Button } from './ui/Button';
import type { Adjustment } from '../types/inventory';

interface AdjustmentHistoryProps {
  adjustments: Adjustment[];
  unit: string;
  onRecord?: () => void;
}

export function AdjustmentHistory({ adjustments, unit, onRecord }: AdjustmentHistoryProps) {
  if (adjustments.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <History className="size-4" />
        </span>
        <p className="mt-3 text-sm font-medium">No corrections yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          Counts recorded against this item will appear here with a timestamp, previous quantity,
          updated count, and staff member details.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={onRecord}
          disabled={!onRecord}
        >
          Record manual baseline count
        </Button>
      </div>
    );
  }

  return (
    <ol className="relative space-y-3 pl-6">
      <span aria-hidden="true" className="absolute bottom-4 left-[7px] top-4 w-px bg-hairline" />

      {adjustments.map((adjustment) => (
        <li key={adjustment.id} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              'absolute -left-6 top-5 size-[15px] rounded-full border-4 border-page',
              adjustment.delta === 0
                ? 'bg-muted-foreground'
                : adjustment.delta > 0
                  ? 'bar-ok'
                  : 'bar-out',
            )}
          />

          <div className="surface rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'tabular rounded-full border px-2 py-0.5 text-sm font-semibold',
                  adjustment.delta === 0
                    ? 'hairline bg-muted text-muted-foreground'
                    : adjustment.delta > 0
                      ? 'status-ok'
                      : 'status-out',
                )}
              >
                {adjustment.delta > 0 ? '+' : ''}
                {adjustment.delta}
              </span>
              <span className="text-sm font-medium">{reasonLabels[adjustment.reason]}</span>
              {!adjustment.synced && <PendingSyncTag />}
              <span
                className="ml-auto text-xs text-muted-foreground"
                title={fullTime(adjustment.at)}
              >
                {relativeTime(adjustment.at)}
              </span>
            </div>
            <p className="tabular mt-2 text-xs text-muted-foreground">
              {adjustment.systemQty} → {adjustment.countedQty} {unit}
            </p>
            {adjustment.note && <p className="mt-2 text-sm">{adjustment.note}</p>}
            <p className="mt-2 text-xs text-muted-foreground">
              {adjustment.by} · {fullTime(adjustment.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
